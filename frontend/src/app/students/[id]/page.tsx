'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Student, Score } from '@/types';

function gradeBadge(grade: string) {
  if (grade.startsWith('A')) return 'badge-green';
  if (grade.startsWith('B')) return 'badge-blue';
  if (grade.startsWith('C')) return 'badge-yellow';
  return 'badge-red';
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.students.get(id)
      .then(setStudent)
      .catch(() => setError('Student not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadScores = async () => {
    setScoresLoading(true);
    try { setScores(await api.students.scores(id, term, year)); }
    catch { setScores([]); }
    finally { setScoresLoading(false); }
  };
  useEffect(() => { loadScores(); }, [id, term, year]);

  const totalMarks = scores.reduce((s, sc) => s + sc.examScore + sc.catScore, 0);
  const average = scores.length > 0 ? totalMarks / scores.length : 0;
  const pdfUrl = api.reports.studentPdf(id, term, year);

  if (loading) return <p className="p-12 text-center text-slate-400">Loading…</p>;
  if (!student) return <p className="p-12 text-center text-red-500">{error}</p>;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/students" className="hover:text-primary-900">Students</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">{student.firstName} {student.lastName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Card */}
        <div className="card p-6">
          <div className="w-16 h-16 rounded-full bg-primary-900 flex items-center justify-center text-white text-2xl font-bold mb-4">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{student.firstName} {student.lastName}</h1>
          <p className="text-sm text-slate-500 mt-0.5 mb-4">{student.stream?.name}</p>

          <div className="space-y-2 text-sm">
            {[
              { label: 'Admission No.', value: student.admissionNo },
              { label: 'Gender', value: student.gender },
              { label: 'Date of Birth', value: new Date(student.dob).toLocaleDateString('en-GB') },
              { label: 'Class Stream', value: student.stream?.name ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-slate-50 py-1.5 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>

          <Link href="/students" className="btn-secondary w-full mt-4 justify-center">← Back to Students</Link>
        </div>

        {/* Score Summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Term / Year selector */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Term</label>
                <select className="input w-28" value={term} onChange={(e) => setTerm(parseInt(e.target.value))}>
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Year</label>
                <input type="number" className="input w-24" min={2020} max={2099} value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))} />
              </div>
              {scores.length > 0 && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary ml-auto text-xs">
                  📄 Download Report Card
                </a>
              )}
            </div>
          </div>

          {/* Summary stats */}
          {scores.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Marks', value: totalMarks.toFixed(1) },
                { label: 'Average', value: `${average.toFixed(2)}%` },
                { label: 'Subjects', value: String(scores.length) },
              ].map(({ label, value }) => (
                <div key={label} className="card p-4 text-center">
                  <p className="text-2xl font-bold text-primary-900">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Scores table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">
                Scores — Term {term}, {year}
              </h2>
            </div>
            {scoresLoading ? (
              <p className="p-8 text-center text-slate-400">Loading scores…</p>
            ) : scores.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 mb-3">No scores recorded for this term.</p>
                <Link href={`/scores?studentId=${id}&term=${term}&year=${year}`} className="btn-primary text-sm">
                  + Enter Scores
                </Link>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th className="text-center">Exam /70</th>
                    <th className="text-center">CAT /30</th>
                    <th className="text-center">Total /100</th>
                    <th className="text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((sc) => {
                    const total = sc.examScore + sc.catScore;
                    return (
                      <tr key={sc.id}>
                        <td className="font-medium">{sc.subject?.name}</td>
                        <td className="text-center">{sc.examScore.toFixed(1)}</td>
                        <td className="text-center">{sc.catScore.toFixed(1)}</td>
                        <td className="text-center font-semibold">{total.toFixed(1)}</td>
                        <td className="text-center">
                          <span className={gradeBadge(total >= 75 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : 'D')}>
                            {total >= 75 ? 'A' : total >= 70 ? 'A-' : total >= 65 ? 'B+' : total >= 60 ? 'B' : total >= 55 ? 'B-' : total >= 50 ? 'C+' : total >= 45 ? 'C' : total >= 40 ? 'C-' : 'D'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-semibold">
                    <td>Total / Average</td>
                    <td className="text-center">{scores.reduce((a, s) => a + s.examScore, 0).toFixed(1)}</td>
                    <td className="text-center">{scores.reduce((a, s) => a + s.catScore, 0).toFixed(1)}</td>
                    <td className="text-center">{totalMarks.toFixed(1)}</td>
                    <td className="text-center">{average.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
