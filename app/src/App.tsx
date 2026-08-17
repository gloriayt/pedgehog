import { useState } from "react";
import ActiveWalk from "./ActiveWalk";
import { startWalk } from "./api";
import boneImg from "./assets/bone.webp";
import idleImg from "./assets/pretzel-idle.webp";
import DsShell from "./DsShell";
import WalksList from "./WalksList";

function App() {
	const [activeWalkId, setActiveWalkId] = useState<number | null>(null);
	const [showWalks, setShowWalks] = useState(false);
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

	if (showWalks) {
		return <WalksList onBack={() => setShowWalks(false)} />;
	}

	return (
		<DsShell
			sprite={idleImg}
			bottom={
				<>
					<div className="ds-speech">
						Ready for walkies!
						<img className="ds-icon ds-icon-xs" src={boneImg} alt="" />
					</div>
					<div className="ds-btn-row">
						<button
							type="button"
							className="ds-btn ds-btn-go"
							onClick={handleStart}
							disabled={pending}
						>
							{pending ? "WAIT..." : "START"}
						</button>
						<button
							type="button"
							className="ds-btn ds-btn-secondary"
							onClick={() => setShowWalks(true)}
						>
							WALKS
						</button>
					</div>

					{error && <div className="ds-error">{error}</div>}
				</>
			}
		/>
	);
}

export default App;
