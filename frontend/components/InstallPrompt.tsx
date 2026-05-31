'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('ndjamcar_install_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
      if (isSafari) {
        setTimeout(() => setShowBanner(true), 3000);
      }
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('ndjamcar_install_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Installer NdjamCar</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isIOS
                ? 'Appuyez sur le bouton partage (↑) puis "Sur l\'écran d\'accueil"'
                : 'Accédez rapidement à NdjamCar depuis votre écran d\'accueil'
              }
            </p>
            {!isIOS && (
              <Button onClick={handleInstall} size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs gap-1.5 h-8">
                <Download className="h-3.5 w-3.5" /> Installer
              </Button>
            )}
          </div>
          <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
