'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Stats { streams: number; students: number; subjects: number; scores: number }

const quickLinks = [
  { href: '/streams',   label: 'Add Stream',   icon: '🏛', color: 'bg-blue-50   text-blue-700'   },
  { href: '/students',  label: 'Register Student', icon: '👤', color: 'bg-green-50  text-green-700'  },
  { href: '/subjects',     label: 'Manage Subjects',  icon: '📚', color: 'bg-purple-50 text-purple-700' },
  { href: '/scores',       label: 'Enter Scores',     icon: '✏️', color: 'bg-amber-50  text-amber-700'  },
  { href: '/results',      label: 'View Results',     icon: '📊', color: 'bg-rose-50   text-rose-700'   },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ streams: 0, students: 0, subjects: 0, scores: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [streams, students, subjects, scores] = await Promise.all([
          api.streams.list(),
          api.students.list(),
          api.subjects.list(),
          api.scores.list(),
        ]);
        setStats({
          streams: streams.length,
          students: students.length,
          subjects: subjects.length,
          scores: scores.length,
        });
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Class Streams', value: stats.streams,  icon: '🏛', bg: 'bg-blue-50',   fg: 'text-blue-600'   },
    { label: 'Students',      value: stats.students, icon: '👥', bg: 'bg-green-50',  fg: 'text-green-600'  },
    { label: 'Subjects',      value: stats.subjects, icon: '📚', bg: 'bg-purple-50', fg: 'text-purple-600' },
    { label: 'Score Records', value: stats.scores,   icon: '✏️', bg: 'bg-amber-50',  fg: 'text-amber-600'  },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to Ikonex Academy Student Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon, bg, fg }) => (
          <div key={label} className="card p-5">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
              {icon}
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 rounded animate-pulse mb-1" />
            ) : (
              <p className={`text-3xl font-bold ${fg}`}>{value}</p>
            )}
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickLinks.map(({ href, label, icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity text-center`}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">System Info</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Assessment Mode', value: 'Exam (70) + CAT (30)' },
              { label: 'Grading System', value: 'KCSE (A to E)' },
              { label: 'Academic Year', value: new Date().getFullYear().toString() },
              { label: 'Max Score', value: '100 per subject' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
