'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Car, MapPin, Wifi, WifiOff, Navigation, Loader2, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Status = 'idle' | 'requesting' | 'active' | 'error' | 'denied';

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [sendCount, setSendCount] = useState(0);
  const [lastSent, setLastSent] = useState<string>('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  const speedRef = useRef<number>(0);
  const headingRef = useRef<number>(0);

  useEffect(() => {
    fetch(`${API_URL}/api/tracking/gps/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 0, longitude: 0 }),
    }).then(r => {
      if (r.status === 404) setTokenValid(false);
      else setTokenValid(true);
    }).catch(() => setTokenValid(false));
  }, [token]);

  const sendPosition = async () => {
    if (!latRef.current || !lngRef.current) return;
    try {
      const res = await fetch(`${API_URL}/api/tracking/gps/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: latRef.current,
          longitude: lngRef.current,
          speed: speedRef.current,
          heading: headingRef.current,
        }),
      });
      if (res.ok) {
        setSendCount(prev => prev + 1);
        setLastSent(new Date().toLocaleTimeString('fr-FR'));
      }
    } catch {}
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('La géolocalisation n\'est pas supportée par ce navigateur');
      return;
    }

    setStatus('requesting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed: spd, heading: hdg } = position.coords;
        latRef.current = latitude;
        lngRef.current = longitude;
        speedRef.current = spd ? Math.round(spd * 3.6) : 0;
        headingRef.current = hdg || 0;
        setLat(latitude);
        setLng(longitude);
        setSpeed(speedRef.current);
        setHeading(headingRef.current);
        setStatus('active');
      },
      (err) => {
        if (err.code === 1) {
          setStatus('denied');
          setError('Accès GPS refusé. Autorisez la localisation dans les paramètres.');
        } else {
          setStatus('error');
          setError('Impossible d\'obtenir la position GPS');
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    sendPosition();
    intervalRef.current = setInterval(sendPosition, 10000);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500">Ce lien de suivi GPS n&apos;est pas valide ou a expiré.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">NdjamCar GPS</h1>
            <p className="text-blue-100 text-xs">Suivi de position en temps réel</p>
          </div>
          <div className="ml-auto">
            {status === 'active' ? (
              <div className="flex items-center gap-1.5 bg-green-500 px-3 py-1 rounded-full text-xs font-medium">
                <Wifi className="h-3 w-3" /> Actif
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                <WifiOff className="h-3 w-3" /> Inactif
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {status === 'idle' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <Navigation className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Activer le suivi GPS</h2>
            <p className="text-sm text-gray-500 mb-6">
              Votre position sera envoyée automatiquement toutes les 10 secondes pour permettre le suivi du véhicule.
            </p>
            <button
              onClick={startTracking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              Démarrer le suivi
            </button>
          </div>
        )}

        {status === 'requesting' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 font-medium">Activation du GPS...</p>
            <p className="text-xs text-gray-400 mt-2">Autorisez l&apos;accès à votre position</p>
          </div>
        )}

        {(status === 'error' || status === 'denied') && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Erreur GPS</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={startTracking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {status === 'active' && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700">GPS actif</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Latitude</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{lat?.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Longitude</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{lng?.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Vitesse</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{speed} km/h</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Direction</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{heading}°</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Transmission</span>
                <span className="text-xs text-gray-400">toutes les 10s</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-blue-600">{sendCount}</p>
                  <p className="text-[10px] text-gray-400">positions envoyées</p>
                </div>
                {lastSent && (
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-600">{lastSent}</p>
                    <p className="text-[10px] text-gray-400">dernier envoi</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={stopTracking}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              Arrêter le suivi
            </button>
          </>
        )}

        <p className="text-center text-[10px] text-gray-300 mt-8">NdjamCar · Suivi GPS sécurisé</p>
      </div>
    </div>
  );
}
