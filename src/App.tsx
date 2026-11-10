import { lazy, Suspense } from 'react';
import { ToastProvider } from './components/Toast';
import { useRoute, type Route } from './hooks/useRoute';
import { Meals } from './pages/Meals';
import { Settings } from './pages/Settings';
import { Today } from './pages/Today';

// Charts library is only loaded when History opens.
const History = lazy(() => import('./pages/History'));

const TABS: { page: Route['page']; label: string; icon: string; href: string }[] = [
  { page: 'today', label: 'Today', icon: '◉', href: '#/today' },
  { page: 'meals', label: 'Meals', icon: '☰', href: '#/meals' },
  { page: 'history', label: 'History', icon: '▤', href: '#/history' },
  { page: 'settings', label: 'Settings', icon: '⚙', href: '#/settings' },
];

export default function App() {
  const route = useRoute();
  return (
    <ToastProvider>
      <main className="mx-auto max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {route.page === 'today' && <Today date={route.date} />}
        {route.page === 'meals' && <Meals />}
        {route.page === 'history' && (
          <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
            <History />
          </Suspense>
        )}
        {route.page === 'settings' && <Settings />}
      </main>
      <nav className="fixed bottom-0 inset-x-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-xl grid grid-cols-4">
          {TABS.map((t) => (
            <a
              key={t.page}
              href={t.href}
              aria-current={route.page === t.page ? 'page' : undefined}
              className={`min-h-14 flex flex-col items-center justify-center text-xs ${route.page === t.page ? 'text-emerald-600 font-semibold' : 'text-zinc-500'}`}
            >
              <span className="text-lg leading-none" aria-hidden>{t.icon}</span>
              {t.label}
            </a>
          ))}
        </div>
      </nav>
    </ToastProvider>
  );
}
