'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ClassStream, Student, StudentResult, ClassResult } from '@/types';

function GradeBadge({ grade }: { grade: string }) {
  const cls = grade.startsWith('A') ? 'badge-green' : grade.startsWith('B') ? 'badge-blue' : grade.startsWith('C') ? 'badge-yellow' : 'badge-red';
  return <span className={cls}>{grade}</span>;
}

export default function ResultsPage() {
  const [mode, setMode] = useState<'student' | 'class'>('class');
  const [streams, setStreams] = useState<ClassStream[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [streamId, setStreamId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [classResult, setClassResult] = useState<ClassResult | null>(null);
  const [studentResult, setStudentResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.streams.list().then(setStreams); }, []);
  useEffect(() => {
    if (!streamId) { setStudents([]); setStudentId(''); return; }
    api.students.list({ stream_id: streamId }).then(setStudents);
  }, [streamId]);

  const loadResults = async () => {
    setLoading(true); setError(''); setClassResult(null); setStudentResult(null);
    try {
      if (mode === 'class' && streamId) {
        setClassResult(await api.results.stream(streamId, term, year));
      } else if (mode === 'student' && studentId) {
        setStudentResult(await api.results.student(studentId, term, year));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally { setLoading(false); }
  };

  const classPdfUrl = streamId ? api.reports.streamPdf(streamId, term, year) : '#';
  const studentPdfUrl = studentId ? api.reports.studentPdf(studentId, term, year) : '#';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Results</h1>
          <p className="page-sub">View individual or class performance with grades and rankings</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-5 mb-6">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button className={mode === 'class' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode('class')}>
            📊 Class Results
          </button>
          <button className={mode === 'student' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode('student')}>
            👤 Individual Student
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Stream</label>
            <select className="input" value={streamId} onChange={(e) => { setStreamId(e.target.value); setStudentId(''); }}>
              <option value="">Select stream…</option>
              {streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {mode === 'student' && (
            <div>
              <label className="label">Student</label>
              <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!streamId}>
                <option value="">Select student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </div>
          )}
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

        <div className="flex gap-3 mt-4">
          <button className="btn-primary" onClick={loadResults} disabled={loading || !streamId || (mode === 'student' && !studentId)}>
            {loading ? 'Loading…' : 'View Results'}
          </button>
          {classResult && (
            <a href={classPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              📄 Download Class PDF
            </a>
          )}
          {studentResult && (
            <a href={studentPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              📄 Download Report Card
            </a>
          )}
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {/* Class Results */}
      {classResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: String(classResult.totalStudents) },
              { label: 'Term', value: `Term ${classResult.term}` },
              { label: 'Year', value: String(classResult.year) },
            ].map(({ label, value }) => (
              <div key={label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-primary-900">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Rankings table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Class Rankings — {classResult.stream.name}</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="text-center">Pos.</th>
                  <th>Adm No.</th>
                  <th>Student Name</th>
                  <th className="text-center">Total Marks</th>
                  <th className="text-center">Average</th>
                  <th className="text-center">Grade</th>
                  <th className="text-center">Mean Pts</th>
                </tr>
              </thead>
              <tbody>
                {classResult.results.map((r) => (
                  <tr key={r.student.id} className={r.position <= 3 ? 'bg-amber-50/50' : ''}>
                    <td className="text-center font-bold">
                      {r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : r.position === 3 ? '🥉' : `#${r.position}`}
                    </td>
                    <td className="font-mono text-xs text-slate-500">{r.student.admissionNo}</td>
                    <td>
                      <Link href={`/students/${r.student.id}`} className="font-medium text-primary-900 hover:underline">
                        {r.student.firstName} {r.student.lastName}
                      </Link>
                    </td>
                    <td className="text-center font-semibold">{r.totalMarks.toFixed(1)}</td>
                    <td className="text-center">{r.average.toFixed(2)}%</td>
                    <td className="text-center"><GradeBadge grade={r.grade} /></td>
                    <td className="text-center">{r.meanPoints.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subject performance */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Subject Performance Summary</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th className="text-center">Candidates</th>
                  <th className="text-center">Average</th>
                  <th className="text-center">Highest</th>
                  <th className="text-center">Lowest</th>
                </tr>
              </thead>
              <tbody>
                {classResult.subjectPerformance.map((sp) => (
                  <tr key={sp.subject.id}>
                    <td className="font-medium">{sp.subject.name}</td>
                    <td className="text-center">{sp.candidatesCount}</td>
                    <td className="text-center">{sp.average.toFixed(2)}%</td>
                    <td className="text-center text-green-700 font-medium">{sp.highest.toFixed(1)}</td>
                    <td className="text-center text-red-600 font-medium">{sp.lowest.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual Student Results */}
      {studentResult && (
        <div className="space-y-6">
          {/* Student header */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{studentResult.student.firstName} {studentResult.student.lastName}</h2>
                <p className="text-slate-500 text-sm">{studentResult.student.admissionNo} · {studentResult.student.stream.name} · Term {studentResult.term}, {studentResult.year}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-900">#{studentResult.classPosition}</p>
                <p className="text-xs text-slate-500">of {studentResult.totalStudents} students</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Total Marks', value: studentResult.totalMarks.toFixed(1) },
                { label: 'Average', value: `${studentResult.average.toFixed(2)}%` },
                { label: 'Mean Grade', value: studentResult.grade },
                { label: 'Mean Points', value: studentResult.meanPoints.toFixed(2) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-bold text-lg text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subject scores */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Subject Scores</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th className="text-center">Exam /70</th>
                  <th className="text-center">CAT /30</th>
                  <th className="text-center">Total /100</th>
                  <th className="text-center">Grade</th>
                  <th className="text-center">Points</th>
                  <th className="text-center">Position</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {studentResult.scores.map((sc) => (
                  <tr key={sc.subject.id}>
                    <td className="font-medium">{sc.subject.name}</td>
                    <td className="text-center">{sc.examScore.toFixed(1)}</td>
                    <td className="text-center">{sc.catScore.toFixed(1)}</td>
                    <td className="text-center font-semibold">{sc.total.toFixed(1)}</td>
                    <td className="text-center"><GradeBadge grade={sc.grade} /></td>
                    <td className="text-center">{sc.points}</td>
                    <td className="text-center text-slate-500 text-xs">{sc.subjectPosition}/{sc.outOf}</td>
                    <td className="text-slate-500 text-sm">{sc.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!classResult && !studentResult && !loading && (
        <div className="card p-12 text-center">
          <p className="text-slate-400">Select a stream{mode === 'student' ? ' and student' : ''}, then click &ldquo;View Results&rdquo;.</p>
        </div>
      )}
    </div>
  );
}
