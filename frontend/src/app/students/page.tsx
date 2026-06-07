'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Student, ClassStream } from '@/types';
import Modal from '@/components/Modal';

type FormData = { firstName: string; lastName: string; admissionNo: string; gender: string; dob: string; streamId: string };
const EMPTY: FormData = { firstName: '', lastName: '', admissionNo: '', gender: '', dob: '', streamId: '' };

export default function StudentsPage() {
  // const params = useSearchParams();
  // const filterStream = params.get('stream_id') ?? '';

  const [students, setStudents] = useState<Student[]>([]);
  const [streams, setStreams] = useState<ClassStream[]>([]);
  const [search, setSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [stus, strs] = await Promise.all([
        api.students.list({ stream_id: streamFilter || undefined, search: search || undefined }),
        api.streams.list(),
      ]);
      setStudents(stus);
      setStreams(strs);
    } catch { setError('Failed to load students'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [streamFilter, search]);

  const openCreate = () => { setForm({ ...EMPTY, streamId: streamFilter }); setSelected(null); setModal('create'); };
  const openEdit = (s: Student) => {
    setSelected(s);
    setForm({ firstName: s.firstName, lastName: s.lastName, admissionNo: s.admissionNo, gender: s.gender, dob: s.dob.split('T')[0], streamId: s.streamId });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (modal === 'create') await api.students.create(form);
      else if (selected) await api.students.update(selected.id, form);
      closeModal(); await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? All scores for this student will also be deleted.`)) return;
    try { await api.students.delete(id); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const StreamForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First Name</label>
          <input className="input" placeholder="e.g. Amina" required value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input className="input" placeholder="e.g. Odhiambo" required value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Admission No.</label>
          <input className="input" placeholder="e.g. IKA001" required value={form.admissionNo}
            onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Select…</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date of Birth</label>
          <input type="date" className="input" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </div>
        <div>
          <label className="label">Class Stream</label>
          <select className="input" required value={form.streamId} onChange={(e) => setForm({ ...form, streamId: e.target.value })}>
            <option value="">Select…</option>
            {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : modal === 'create' ? 'Register Student' : 'Save Changes'}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">{students.length} student{students.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Register Student</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search by name or admission no…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-xs" value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)}>
          <option value="">All Streams</option>
          {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-slate-400">Loading students…</p>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No students found.</p>
            <button className="btn-primary" onClick={openCreate}>+ Register First Student</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Adm No.</th>
                <th>Full Name</th>
                <th>Stream</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs text-slate-500">{s.admissionNo}</td>
                  <td>
                    <Link href={`/students/${s.id}`} className="font-semibold text-primary-900 hover:underline">
                      {s.firstName} {s.lastName}
                    </Link>
                  </td>
                  <td><span className="badge-blue">{s.stream?.name ?? '—'}</span></td>
                  <td>{s.gender}</td>
                  <td className="text-slate-500">{new Date(s.dob).toLocaleDateString('en-GB')}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/students/${s.id}`} className="btn-ghost text-xs px-2 py-1">View</Link>
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn-danger text-xs px-2 py-1" onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal !== null} title={modal === 'create' ? 'Register Student' : 'Edit Student'} onClose={closeModal} size="md">
        {StreamForm}
      </Modal>
    </div>
  );
}
