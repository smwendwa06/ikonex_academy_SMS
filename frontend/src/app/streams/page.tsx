'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ClassStream } from '@/types';
import Modal from '@/components/Modal';

type FormData = { name: string; year: string };
const EMPTY: FormData = { name: '', year: new Date().getFullYear().toString() };

export default function StreamsPage() {
  const [streams, setStreams] = useState<ClassStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<ClassStream | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setStreams(await api.streams.list()); }
    catch { setError('Failed to load streams'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('create'); };
  const openEdit = (s: ClassStream) => {
    setSelected(s);
    setForm({ name: s.name, year: String(s.year) });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        await api.streams.create({ name: form.name, year: parseInt(form.year) });
      } else if (selected) {
        await api.streams.update(selected.id, { name: form.name, year: parseInt(form.year) });
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also delete all students and scores in this stream.`)) return;
    try { await api.streams.delete(id); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Streams</h1>
          <p className="page-sub">{streams.length} stream{streams.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Stream</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading streams…</div>
        ) : streams.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No streams yet. Create your first class stream.</p>
            <button className="btn-primary" onClick={openCreate}>+ Create Stream</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Stream Name</th>
                <th>Year</th>
                <th>Students</th>
                <th>Subjects</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {streams.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/streams/${s.id}`} className="font-semibold text-primary-900 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td>{s.year}</td>
                  <td>
                    <span className="badge-blue">{s._count?.students ?? 0} students</span>
                  </td>
                  <td>
                    <span className="badge-gray">{s._count?.streamSubjects ?? 0} subjects</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/streams/${s.id}`} className="btn-ghost text-xs px-2 py-1">
                        View
                      </Link>
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => openEdit(s)}>
                        Edit
                      </button>
                      <button className="btn-danger text-xs px-2 py-1" onClick={() => handleDelete(s.id, s.name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal !== null} title={modal === 'create' ? 'Create Stream' : 'Edit Stream'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="label">Stream Name</label>
            <input className="input" placeholder="e.g. Form 1A" value={form.name} required
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input" type="number" min="2020" max="2099" value={form.year} required
              onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal === 'create' ? 'Create Stream' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
