'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ClassStreamDetail, Subject } from '@/types';
import Modal from '@/components/Modal';

export default function StreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [stream, setStream] = useState<ClassStreamDetail | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectModal, setSubjectModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [s, subs] = await Promise.all([api.streams.get(id), api.subjects.list()]);
      setStream(s);
      setAllSubjects(subs);
    } catch { setError('Failed to load stream'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const assignedIds = new Set(stream?.streamSubjects.map((ss) => ss.subject.id) ?? []);
  const unassigned = allSubjects.filter((s) => !assignedIds.has(s.id));

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setSaving(true);
    try {
      await api.streams.assignSubject(id, selectedSubjectId);
      setSubjectModal(false);
      setSelectedSubjectId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign subject');
    } finally { setSaving(false); }
  };

  const handleRemoveSubject = async (subjectId: string, name: string) => {
    if (!confirm(`Remove "${name}" from this stream?`)) return;
    try { await api.streams.removeSubject(id, subjectId); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading…</div>;
  if (!stream) return <div className="p-12 text-center text-red-500">{error || 'Stream not found'}</div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/streams" className="hover:text-primary-900">Streams</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{stream.name}</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{stream.name}</h1>
          <p className="page-sub">Academic Year {stream.year} · {stream._count?.students ?? 0} students</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/students/new?stream=${id}`} className="btn-primary">+ Add Student</Link>
          <button className="btn-secondary" onClick={() => router.push('/streams')}>← Back</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Students ({stream.students.length})</h2>
            <Link href={`/students?stream_id=${id}`} className="text-xs text-primary-900 hover:underline">
              View all →
            </Link>
          </div>
          {stream.students.length === 0 ? (
            <p className="p-8 text-center text-slate-400">No students enrolled yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Adm No.</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stream.students.map((st) => (
                  <tr key={st.id}>
                    <td className="font-mono text-xs text-slate-500">{st.admissionNo}</td>
                    <td className="font-medium">{st.firstName} {st.lastName}</td>
                    <td><span className="badge-gray">{st.gender}</span></td>
                    <td>
                      <Link href={`/students/${st.id}`} className="text-xs text-primary-900 hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Subjects */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Subjects ({stream.streamSubjects.length})</h2>
            {unassigned.length > 0 && (
              <button onClick={() => setSubjectModal(true)} className="text-xs text-primary-900 hover:underline font-medium">
                + Assign
              </button>
            )}
          </div>
          {stream.streamSubjects.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No subjects assigned.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stream.streamSubjects.map(({ subject }) => (
                <li key={subject.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{subject.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{subject.code}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveSubject(subject.id, subject.name)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Assign Subject Modal */}
      <Modal open={subjectModal} title="Assign Subject to Stream" onClose={() => setSubjectModal(false)} size="sm">
        <form onSubmit={handleAssignSubject} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div>
            <label className="label">Select Subject</label>
            <select className="input" value={selectedSubjectId} required onChange={(e) => setSelectedSubjectId(e.target.value)}>
              <option value="">-- Choose a subject --</option>
              {unassigned.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setSubjectModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Assigning…' : 'Assign Subject'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
