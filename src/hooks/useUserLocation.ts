import { useState } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseUserLocationReturn {
  coordinates: Coordinates | null;
  error: string | null;
  status: 'idle' | 'requesting' | 'success' | 'error' | 'denied';
  requestLocation: () => void;
}

export const useUserLocation = (): UseUserLocationReturn => {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error' | 'denied'>('idle');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }

    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus('success');
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied.');
          setStatus('denied');
        } else {
          setError(`Error getting location: ${err.message}`);
          setStatus('error');
        }
        setCoordinates(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Optionally, you could trigger this automatically on mount, 
  // but manual trigger might be better UX for permissions.
  // useEffect(() => {
  //   requestLocation();
  // }, []);

  return { coordinates, error, status, requestLocation };
};
