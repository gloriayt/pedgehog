import { useState } from "react";
import ActiveWalk from "./ActiveWalk";
import { startWalk } from "./api";
import pawImg from "./assets/icon-paw.webp";
import idleImg from "./assets/pretzel-idle.webp";
import DsShell from "./DsShell";

function App() {
	const [activeWalkId, setActiveWalkId] = useState<number | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleStart = async () => {
		setPending(true);
		setError(null);

		try {
			const walk = await startWalk(1);
			setActiveWalkId(walk.id);
		} catch {
			setError("Could not start walk");
		} finally {
			setPending(false);
		}
	};

	if (activeWalkId) {
		return (
			<ActiveWalk walkId={activeWalkId} onEnd={() => setActiveWalkId(null)} />
		);
	}

	return (
		<DsShell
			sprite={idleImg}
			bottom={
				<>
					<div className="ds-speech">Ready for walkies!</div>
					<button
						type="button"
						className="ds-btn ds-btn-go"
						onClick={handleStart}
						disabled={pending}
					>
						<img className="ds-icon ds-icon-xs" src={pawImg} alt="" />
						{pending ? "WAIT..." : "START"}
					</button>

					{error && <div className="ds-error">{error}</div>}
				</>
			}
		/>
	);
}

export default App;
