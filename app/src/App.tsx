import { useState } from 'react';
import { startWalk } from './api';
import ActiveWalk from './ActiveWalk';

function App() {
  const [activeWalkId, setActiveWalkId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setPending(true);
    setError(null);

    try {
      const walk = await startWalk(1); // hardcoded dog_id for now
      setActiveWalkId(walk.id);
    } catch {
      setError('Could not start walk — try again');
    } finally {
      setPending(false);
    }
  };

  if (activeWalkId) {
    return <ActiveWalk walkId={activeWalkId} onEnd={() => setActiveWalkId(null)} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Pretzel</h1>
      <button onClick={handleStart} disabled={pending} style={{ fontSize: 20, padding: '16px 32px' }}>
        {pending ? 'Starting…' : 'Start Walk'}
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

export default App;
