import { useEffect, useRef, useState } from 'react';
import { endWalk, logPoint } from './api';
import { secondsToMilliseconds } from 'date-fns';

type Props = { walkId: number; onEnd: () => void };

const GPS_POINT_THROTTLE_MS = secondsToMilliseconds(5);

function ActiveWalk({ walkId, onEnd }: Props) {
  const [pointCount, setPointCount] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(!navigator.geolocation ? 'GPS not found' : null);
  const [ending, setEnding] = useState(false);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < GPS_POINT_THROTTLE_MS) return;
        lastSentRef.current = now;

        const { latitude, longitude } = position.coords;
        logPoint(walkId, latitude, longitude)
          .then(() => setPointCount((c) => c + 1))
          .catch(() => setGpsError('GPS connection lost'));
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('GPS permission denied');
        } else {
          setGpsError(`GPS error: ${error.message}`);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [walkId]);

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endWalk(walkId);
      onEnd();
    } catch (e) {
      setGpsError(`Could not end walk: (${(e as Error).message})`);
      setEnding(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Walk in progress</h1>
      <p>Points logged: {pointCount}</p>
      {gpsError && <p style={{ color: 'crimson' }}>{gpsError}</p>}
      <button onClick={handleEnd} disabled={ending} style={{ fontSize: 20, padding: '16px 32px' }}>
        {ending ? 'Ending Walk...' : 'End Walk'}
      </button>
    </div>
  );
}

export default ActiveWalk;
