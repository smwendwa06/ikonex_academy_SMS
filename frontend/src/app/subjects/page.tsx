'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Subject } from '@/types';
import Modal from '@/components/Modal';

type FormData = { name: string; code: string };
const EMPTY: FormData = { name: '', code: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { setSubjects(await api.subjects.list()); }
    catch { setError('Failed to load subjects'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setSelected(null); setModal('create'); };
  const openEdit = (s: Subject) => { setSelected(s); setForm({ name: s.name, code: s.code }); setModal('edit'); };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (modal === 'create') await api.subjects.create(form);
      else if (selected) await api.subjects.update(selected.id, form);
      closeModal(); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? All scores for this subject will also be deleted.`)) return;
    try { await api.subjects.delete(id); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-sub">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Subject</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-slate-400">Loading subjects…</p>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No subjects yet.</p>
            <button className="btn-primary" onClick={openCreate}>+ Create First Subject</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Streams</th>
                <th>Total Scores</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-slate-900">{s.name}</td>
                  <td><code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">{s.code}</code></td>
                  <td><span className="badge-blue">{s._count?.streamSubjects ?? 0} streams</span></td>
                  <td><span className="badge-gray">{s._count?.scores ?? 0} entries</span></td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn-danger text-xs px-2 py-1" onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal !== null} title={modal === 'create' ? 'Create Subject' : 'Edit Subject'} onClose={closeModal} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="label">Subject Name</label>
            <input className="input" placeholder="e.g. Mathematics" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Subject Code</label>
            <input className="input" placeholder="e.g. MATH" required value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal === 'create' ? 'Create Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
