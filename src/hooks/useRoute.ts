import { useEffect, useState } from 'react';
import { isValidDate, today } from '../utils/dates';

export type Route =
  | { page: 'today'; date: string }
  | { page: 'meals' }
  | { page: 'history' }
  | { page: 'settings' };

export function parseHash(hash: string): Route {
  const [, page, arg] = hash.replace(/^#/, '').split('/');
  if (page === 'meals' || page === 'history' || page === 'settings') return { page };
  return { page: 'today', date: arg && isValidDate(arg) ? arg : today() };
}

export function go(route: Route) {
  location.hash = route.page === 'today' ? (route.date === today() ? '#/today' : `#/today/${route.date}`) : `#/${route.page}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    // Roll "today" over at midnight / when the app is resumed.
    document.addEventListener('visibilitychange', on);
    return () => {
      window.removeEventListener('hashchange', on);
      document.removeEventListener('visibilitychange', on);
    };
  }, []);
  return route;
}
