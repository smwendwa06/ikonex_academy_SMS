'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/',          label: 'Dashboard',  icon: '⊞' },
  { href: '/streams',   label: 'Streams',    icon: '🏛' },
  { href: '/students',  label: 'Students',   icon: '👥' },
  { href: '/subjects',  label: 'Subjects',   icon: '📚' },
  { href: '/scores',    label: 'Scores',     icon: '✏️' },
  { href: '/results',   label: 'Results',    icon: '📊' },
];

export default function Sidebar() {
  const path = usePathname();
  const active = (href: string) =>
    href === '/' ? path === '/' : path.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-primary-900 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            I
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Ikonex Academy</p>
            <p className="text-white/50 text-xs">Student Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active(href)
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">© 2024 Ikonex Systems</p>
      </div>
    </aside>
  );
}
