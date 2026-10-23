import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
  full?: boolean; // spans both columns
}

const toInputValue = (field: FieldDef, value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (field.type === 'date') return String(value).slice(0, 10);
  return String(value);
};

/** One edit form for any record: pass the fields to show and what to do on save. */
export function RecordEditModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, toInputValue(f, initial[f.key])]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.type === 'number') {
        if (v !== '') out[f.key] = Number(v);
      } else {
        out[f.key] = v;
      }
    }
    try {
      await onSave(out);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900 font-medium outline-none';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-slate-950/40 flex items-end sm:items-center justify-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] glass-modal rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden text-slate-900"
      >
        <div className="px-5 py-4 border-b border-white/60 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-slate-500 hover:text-slate-900 glass-btn-secondary cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <label key={f.key} className={`block text-xs ${f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                <span className="block font-bold text-slate-700 mb-1">
                  {f.label}
                  {f.required && <span className="text-[#C0674A]"> *</span>}
                </span>
                {f.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    required={f.required}
                    value={values[f.key]}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    className={`${inputClass} resize-y`}
                  />
                ) : f.type === 'select' ? (
                  <select
                    required={f.required}
                    value={values[f.key]}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    className={inputClass}
                  >
                    {!f.required && <option value="">—</option>}
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    required={f.required}
                    value={values[f.key]}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    className={inputClass}
                  />
                )}
              </label>
            ))}
          </div>

          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold text-slate-800 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl glass-btn-primary text-white text-xs font-bold cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Asks before anything is deleted for good. */
export function ConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not delete. Try again.');
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] bg-slate-950/40 flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm glass-modal rounded-3xl p-5 space-y-3 text-slate-900">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
        {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold text-slate-800 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
