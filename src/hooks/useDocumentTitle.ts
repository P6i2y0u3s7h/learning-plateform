import { useEffect } from 'react';
import { APP_CONFIG } from '../constants/app';

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    if (title) {
      document.title = `${title} — ${APP_CONFIG.name}`;
    } else {
      document.title = `${APP_CONFIG.name} — ${APP_CONFIG.tagline}`;
    }
  }, [title]);
}
