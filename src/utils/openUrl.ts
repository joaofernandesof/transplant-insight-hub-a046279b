import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Abre uma URL de forma segura:
 * - No nativo (Capacitor): usa o in-app browser (não abre Chrome)
 * - Na web: usa window.open normalmente
 */
export async function openUrl(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Intercepta TODOS os window.open para usar in-app browser no Capacitor.
 * Chame uma vez no boot do app (main.tsx).
 */
export function patchWindowOpenForNative() {
  if (!Capacitor.isNativePlatform()) return;

  const originalOpen = window.open.bind(window);

  window.open = function (url?: string | URL, target?: string, features?: string): Window | null {
    if (url) {
      const urlStr = url.toString();
      // Links tel:, mailto:, sms: devem abrir nativamente
      if (/^(tel:|mailto:|sms:|intent:)/.test(urlStr)) {
        return originalOpen(url, target, features);
      }
      // URLs externas (http/https) abrem no in-app browser
      if (/^https?:\/\//.test(urlStr)) {
        Browser.open({ url: urlStr, presentationStyle: 'fullscreen' }).catch(console.error);
        return null;
      }
    }
    return originalOpen(url, target, features);
  } as typeof window.open;
}
