import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { db } from './db.js';

// Supabase persistence layer.
//
// The existing FloristDatabase keeps all business logic (GST maths, dashboard
// stats, milestone generation, ID allocation) and stays synchronous. This
// module only swaps the *storage* underneath it:
//
//   hydrate()  - load Postgres into the in-memory arrays before a request
//   flush()    - write the in-memory arrays back after a mutating request
//
// That keeps db.ts and routes.ts unchanged while giving real persistence that
// is shared across every serverless instance.

type Collection =
  | 'customers'
  | 'leads'
  | 'projects'
  | 'quotations'
  | 'invoices'
  | 'payments';

// db property -> table name (identical here, but kept explicit).
const COLLECTIONS: Collection[] = [
  'customers',
  'leads',
  'projects',
  'quotations',
  'invoices',
  'payments',
];

// Columns that are date/timestamp typed: empty strings must become NULL.
const DATE_COLUMNS = new Set([
  'event_date',
  'setup_date',
  'dismantling_date',
  'start_date',
  'end_date',
  'next_follow_up_date',
  'last_contacted',
  'invoice_date',
  'due_date',
  'quotation_date',
  'valid_until',
  'payment_date',
  'created_at',
]);

// Columns stored as numeric: PostgREST can hand these back as strings.
const NUMERIC_COLUMNS = new Set([
  'budget',
  'estimated_project_value',
  'probability',
  'lead_score',
  'expected_guests',
  'project_value',
  'current_milestone_index',
  'total_invoiced',
  'total_received',
  'outstanding_balance',
  'total_projects',
  'total_revenue',
  'total_outstanding',
  'subtotal',
  'discount',
  'taxable_amount',
  'tax_rate',
  'cgst_rate',
  'cgst_amount',
  'sgst_rate',
  'sgst_amount',
  'igst_rate',
  'igst_amount',
  'tax_amount',
  'total',
  'amount_paid',
  'balance',
  'amount',
]);

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// Convert an app object to a database row. Only top-level keys are renamed;
// nested objects and arrays are stored verbatim as JSONB so the shapes the
// React code expects survive the round trip.
function toRow(obj: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const column = toSnake(key);
    row[column] = DATE_COLUMNS.has(column) && value === '' ? null : value;
  }
  return row;
}

function fromRow(row: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [column, value] of Object.entries(row)) {
    const key = toCamel(column);
    if (value === null) continue; // absent rather than null, matching optional fields
    obj[key] =
      NUMERIC_COLUMNS.has(column) && typeof value === 'string' ? Number(value) : value;
  }
  return obj;
}

// PostgREST derives one column list for a bulk insert from the union of the
// objects' keys and sends NULL for any key a row is missing, which trips the
// NOT NULL columns that have defaults. Grouping rows by their exact key
// signature keeps every batch uniform, so omitted columns fall back to their
// database defaults instead.
async function upsertRows(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  rows: Record<string, any>[]
): Promise<void> {
  const groups = new Map<string, Record<string, any>[]>();

  for (const row of rows) {
    const signature = Object.keys(row).sort().join(',');
    const group = groups.get(signature);
    if (group) group.push(row);
    else groups.set(signature, [row]);
  }

  for (const group of groups.values()) {
    const { error } = await supabase.from(table).upsert(group);
    if (error) throw error;
  }
}

let seeded = false;

/** Push the in-memory seed fixtures into Postgres the first time the app runs. */
async function seedIfEmpty(): Promise<void> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;

  // Order matters: customers first, then rows that reference them.
  for (const name of COLLECTIONS) {
    const rows = (db[name] as any[]).map(toRow);
    if (!rows.length) continue;
    await upsertRows(supabase, name, rows);
  }

  const { error: settingsError } = await supabase
    .from('business_settings')
    .upsert({ id: 1, settings: db.settings, updated_at: new Date().toISOString() });
  if (settingsError) throw settingsError;
}

/** Load Postgres into the in-memory arrays. */
export async function hydrate(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();

  if (!seeded) {
    await seedIfEmpty();
    seeded = true;
  }

  for (const name of COLLECTIONS) {
    // Postgres returns rows unordered. The IDs are sequential per entity
    // ("LD-2026-00421", "PRJ-2026-089"), so ordering by id reproduces the
    // stable insertion order the in-memory arrays used to guarantee.
    const { data, error } = await supabase
      .from(name)
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    (db as any)[name] = (data ?? []).map(fromRow);
  }

  // Never re-issue an ID that is already stored (would overwrite that row).
  db.syncCountersFromData();

  const { data: settingsRow } = await supabase
    .from('business_settings')
    .select('settings')
    .eq('id', 1)
    .maybeSingle();
  if (settingsRow?.settings) {
    db.settings = { ...db.settings, ...settingsRow.settings };
  }
}

/** Write the in-memory arrays back to Postgres, including deletions. */
export async function flush(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();

  for (const name of COLLECTIONS) {
    const items = (db as any)[name] as any[];
    const keepIds = items.map((item) => item.id);

    if (items.length) {
      await upsertRows(supabase, name, items.map(toRow));
    }

    // Remove rows that no longer exist in memory (handles DELETE routes).
    const { data: existing, error: listError } = await supabase.from(name).select('id');
    if (listError) throw listError;

    const stale = (existing ?? [])
      .map((r: any) => r.id)
      .filter((id: string) => !keepIds.includes(id));

    if (stale.length) {
      const { error } = await supabase.from(name).delete().in('id', stale);
      if (error) throw error;
    }
  }

  const { error } = await supabase
    .from('business_settings')
    .upsert({ id: 1, settings: db.settings, updated_at: new Date().toISOString() });
  if (error) throw error;
}
