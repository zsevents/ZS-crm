import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, MapPin, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { Expo, ExpoStatus } from '../types';
import { api } from '../lib/api';
import { formatDate, formatINR } from '../lib/formatters';
import { ConfirmDialog, FieldDef, RecordEditModal } from './RecordDialogs';

const SOURCES = ['GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'WEBSITE', 'WHATSAPP', 'REFERRAL', 'OTHER'];
const STATUSES: ExpoStatus[] = ['DISCOVERED', 'INTERESTED', 'REGISTERED', 'ATTENDED', 'SKIPPED'];

const EXPO_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Expo name', required: true, full: true },
  { key: 'organiser', label: 'Organiser' },
  { key: 'city', label: 'City' },
  { key: 'startDate', label: 'Starts', type: 'date' },
  { key: 'endDate', label: 'Ends', type: 'date' },
  { key: 'venue', label: 'Venue', full: true },
  { key: 'source', label: 'Found on', type: 'select', required: true, options: SOURCES },
  { key: 'status', label: 'Status', type: 'select', required: true, options: STATUSES },
  { key: 'sourceUrl', label: 'Link (Google result, Instagram post, website)', type: 'text', full: true },
  { key: 'contactName', label: 'Contact person' },
  { key: 'contactPhone', label: 'Contact phone', type: 'tel' },
  { key: 'contactEmail', label: 'Contact email', type: 'email' },
  { key: 'boothCost', label: 'Booth / stall cost (₹)', type: 'number' },
  { key: 'leadsCollected', label: 'Leads collected', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const STATUS_STYLE: Record<ExpoStatus, string> = {
  DISCOVERED: 'bg-slate-100 text-slate-700',
  INTERESTED: 'bg-amber-50 text-amber-800',
  REGISTERED: 'bg-[#E3EADF] text-[#2F4A3A]',
  ATTENDED: 'bg-[#3F5B4A] text-white',
  SKIPPED: 'bg-slate-100 text-slate-400 line-through',
};

const safeLink = (url?: string) => (url && /^https?:\/\//i.test(url.trim()) ? url.trim() : null);
const label = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ');

export const ExposView: React.FC = () => {
  const [expos, setExpos] = useState<Expo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | ExpoStatus>('ALL');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ expo: Partial<Expo> | null } | null>(null);
  const [deleting, setDeleting] = useState<Expo | null>(null);

  const setStatus = async (expo: Expo, status: ExpoStatus) => {
    await api.updateExpo(expo.id, { status });
    await load();
  };

  const load = async () => {
    try {
      setExpos(await api.getExpos());
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load expos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = expos.filter((e) => (e.endDate || e.startDate || '') >= today && e.status !== 'SKIPPED').length;
  const registered = expos.filter((e) => e.status === 'REGISTERED').length;
  const attended = expos.filter((e) => e.status === 'ATTENDED').length;
  const leadsTotal = expos.reduce((s, e) => s + (Number(e.leadsCollected) || 0), 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expos.filter(
      (e) =>
        (filter === 'ALL' || e.status === filter) &&
        (!q || [e.name, e.organiser, e.city, e.venue, e.source].some((v) => (v || '').toLowerCase().includes(q)))
    );
  }, [expos, filter, query]);

  const save = async (values: Record<string, unknown>) => {
    if (editing?.expo?.id) await api.updateExpo(editing.expo.id, values as Partial<Expo>);
    else await api.createExpo(values as Partial<Expo>);
    await load();
  };

  return (
    <div className="space-y-6 pb-16 text-slate-900">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Expos & fairs</h1>
          <p className="text-sm text-slate-600 mt-1">
            Wedding and event expos you've found on Google, Instagram and elsewhere, and how each one went.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing({ expo: { source: 'GOOGLE', status: 'DISCOVERED' } })}
            className="px-4 py-2.5 rounded-xl glass-btn-primary text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" /> Add expo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { k: 'Upcoming', v: upcoming },
          { k: 'Registered', v: registered },
          { k: 'Attended', v: attended },
          { k: 'Leads from expos', v: leadsTotal },
        ].map((x) => (
          <div key={x.k} className="glass-subcard p-4">
            <p className="text-xs font-semibold text-slate-500">{x.k}</p>
            <p className="text-2xl font-black text-slate-950 mt-1">{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['ALL', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                filter === s ? 'bg-[#3F5B4A] text-white' : 'glass-btn-secondary text-slate-700'
              }`}
            >
              {s === 'ALL' ? 'All' : label(s)}
            </button>
          ))}
        </div>
        <label className="relative sm:ml-auto sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, city, organiser"
            className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs outline-none"
          />
        </label>
      </div>

      {loadError && <p className="text-sm text-red-700 font-semibold">{loadError}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading expos…</p>
      ) : visible.length === 0 ? (
        <div className="glass-subcard p-8 text-center">
          <p className="text-sm font-bold text-slate-900">{expos.length === 0 ? 'Track your first expo' : 'No expos match'}</p>
          <p className="text-xs text-slate-500 mt-1">
            {expos.length === 0
              ? 'Add expos you spot on Google, Instagram or from referrals, with dates, contacts and booth costs.'
              : 'Try another filter or search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((e) => {
            const link = safeLink(e.sourceUrl);
            return (
              <article key={e.id} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-950 leading-snug">{e.name}</h2>
                    {e.organiser && <p className="text-xs text-slate-500 mt-0.5 truncate">by {e.organiser}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[e.status] || STATUS_STYLE.DISCOVERED}`}>
                    {label(e.status)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  {(e.startDate || e.endDate) && (
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(e.startDate)}
                      {e.endDate && e.endDate !== e.startDate ? ` – ${formatDate(e.endDate)}` : ''}
                    </p>
                  )}
                  {(e.venue || e.city) && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{[e.venue, e.city].filter(Boolean).join(', ')}</span>
                    </p>
                  )}
                  {(e.contactName || e.contactPhone) && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {e.contactName}
                      {e.contactPhone && (
                        <a href={`tel:${e.contactPhone.replace(/[^\d+]/g, '')}`} className="text-[#3F5B4A] font-semibold">
                          {e.contactPhone}
                        </a>
                      )}
                    </p>
                  )}
                  {e.leadsCollected ? (
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 shrink-0" /> {e.leadsCollected} leads collected
                    </p>
                  ) : null}
                </div>

                {e.notes && <p className="text-xs text-slate-700 bg-white/60 rounded-xl px-3 py-2">{e.notes}</p>}

                <div className="mt-auto pt-3 border-t border-slate-200/70 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Found on {label(e.source)}</span>
                  {e.boothCost ? <span className="text-[11px] font-semibold text-slate-500">· Booth {formatINR(e.boothCost)}</span> : null}
                  <span className="ml-auto flex items-center gap-1">
                    {e.status === 'DISCOVERED' && (
                      <>
                        <button
                          onClick={() => setStatus(e, 'INTERESTED')}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-[#2F4A3A] hover:bg-white/70 cursor-pointer"
                        >
                          Interested
                        </button>
                        <button
                          onClick={() => setStatus(e, 'SKIPPED')}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-white/70 cursor-pointer"
                        >
                          Skip
                        </button>
                      </>
                    )}
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open link"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/70"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      aria-label="Edit"
                      onClick={() => setEditing({ expo: e })}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/70 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      aria-label="Delete"
                      onClick={() => setDeleting(e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-white/70 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <RecordEditModal
          title={editing.expo?.id ? `Edit expo · ${editing.expo.name}` : 'Add expo'}
          fields={EXPO_FIELDS}
          initial={(editing.expo || {}) as Record<string, unknown>}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this expo?"
          message={`${deleting.name} will be removed for good.`}
          onConfirm={async () => {
            await api.deleteExpo(deleting.id);
            await load();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
};
