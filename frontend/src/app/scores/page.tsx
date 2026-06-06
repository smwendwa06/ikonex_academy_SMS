'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClassStream, Subject, Student, Score } from '@/types';

interface ScoreEntry { examScore: string; catScore: string; existingId?: string }

export default function ScoresPage() {
  const [streams, setStreams] = useState<ClassStream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [existing, setExisting] = useState<Score[]>([]);

  const [streamId, setStreamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [entries, setEntries] = useState<Record<string, ScoreEntry>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load streams
  useEffect(() => { api.streams.list().then(setStreams); }, []);

  // Load subjects for selected stream
  useEffect(() => {
    if (!streamId) { setSubjects([]); setSubjectId(''); setStudents([]); return; }
    api.streams.subjects(streamId).then(setSubjects);
    api.students.list({ stream_id: streamId }).then(setStudents);
  }, [streamId]);

  // Load existing scores when selection changes
  useEffect(() => {
    if (!streamId || !subjectId || !term || !year) { setExisting([]); setEntries({}); return; }
    setLoading(true);
    api.scores.list({ subjectId, term, year }).then((scores) => {
      const studentIds = new Set(students.map((s) => s.id));
      const filtered = scores.filter((sc) => studentIds.has(sc.studentId));
      setExisting(filtered);

      // Pre-fill entries with existing scores
      const init: Record<string, ScoreEntry> = {};
      students.forEach((st) => {
        const existing = filtered.find((sc) => sc.studentId === st.id);
        init[st.id] = {
          examScore: existing ? String(existing.examScore) : '',
          catScore: existing ? String(existing.catScore) : '',
          existingId: existing?.id,
        };
      });
      setEntries(init);
    }).finally(() => setLoading(false));
  }, [streamId, subjectId, term, year, students]);

  const setEntry = (studentId: string, field: 'examScore' | 'catScore', val: string) => {
    setEntries((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: val } }));
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError('');
    const toSave = students.filter((st) => entries[st.id]?.examScore !== '' || entries[st.id]?.catScore !== '');
    try {
      await Promise.all(
        toSave.map((st) => {
          const e = entries[st.id];
          return api.scores.upsert({
            studentId: st.id, subjectId,
            examScore: parseFloat(e.examScore || '0'),
            catScore: parseFloat(e.catScore || '0'),
            term, year,
          });
        })
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scores');
    } finally { setSaving(false); }
  };

  const canSave = streamId && subjectId && students.length > 0;
  const hasExisting = existing.length > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Score Entry</h1>
          <p className="page-sub">Record examination and continuous assessment scores</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Class Stream</label>
            <select className="input" value={streamId} onChange={(e) => { setStreamId(e.target.value); setSubjectId(''); }}>
              <option value="">Select stream…</option>
              {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!streamId}>
              <option value="">Select subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Term</label>
            <select className="input" value={term} onChange={(e) => setTerm(parseInt(e.target.value))}>
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" className="input" min={2020} max={2099} value={year}
              onChange={(e) => setYear(parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Score Entry Table */}
      {!streamId || !subjectId ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400">Select a stream and subject above to begin entering scores.</p>
        </div>
      ) : loading ? (
        <div className="card p-12 text-center text-slate-400">Loading…</div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No students in this stream.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                {subjects.find((s) => s.id === subjectId)?.name} — {streams.find((s) => s.id === streamId)?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasExisting ? `${existing.length} existing scores — editing will overwrite` : 'No existing scores — entering fresh'} · Exam max: 70 · CAT max: 30
              </p>
            </div>
            {saved && <span className="badge-green text-sm px-3 py-1">✓ Saved successfully</span>}
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Adm No.</th>
                <th>Student Name</th>
                <th className="text-center">Exam Score (0–70)</th>
                <th className="text-center">CAT Score (0–30)</th>
                <th className="text-center">Total</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => {
                const e = entries[st.id] ?? { examScore: '', catScore: '' };
                const exam = parseFloat(e.examScore) || 0;
                const cat = parseFloat(e.catScore) || 0;
                const total = exam + cat;
                const hasScore = e.examScore !== '' || e.catScore !== '';
                return (
                  <tr key={st.id}>
                    <td className="font-mono text-xs text-slate-500">{st.admissionNo}</td>
                    <td className="font-medium">{st.firstName} {st.lastName}</td>
                    <td className="text-center">
                      <input type="number" min={0} max={70} step={0.5} placeholder="0–70"
                        className="input text-center w-24 mx-auto"
                        value={e.examScore}
                        onChange={(ev) => setEntry(st.id, 'examScore', ev.target.value)} />
                    </td>
                    <td className="text-center">
                      <input type="number" min={0} max={30} step={0.5} placeholder="0–30"
                        className="input text-center w-24 mx-auto"
                        value={e.catScore}
                        onChange={(ev) => setEntry(st.id, 'catScore', ev.target.value)} />
                    </td>
                    <td className="text-center font-semibold">
                      {hasScore ? total.toFixed(1) : '—'}
                    </td>
                    <td className="text-center">
                      {e.existingId
                        ? <span className="badge-yellow">Existing</span>
                        : hasScore
                          ? <span className="badge-blue">New</span>
                          : <span className="badge-gray">Empty</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="ml-auto flex gap-3">
              <button className="btn-secondary" onClick={() => {
                const reset: Record<string, ScoreEntry> = {};
                students.forEach((st) => { reset[st.id] = { examScore: '', catScore: '' }; });
                setEntries(reset);
              }}>Clear All</button>
              <button className="btn-primary" disabled={!canSave || saving} onClick={handleSave}>
                {saving ? 'Saving…' : `Save Scores (${students.length} students)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
