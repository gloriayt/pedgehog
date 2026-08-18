import { useRef, useState } from "react";
import { startWalk } from "./api";
import boneImg from "./assets/bone.webp";
import idleImg from "./assets/pretzel-idle.webp";
import ActiveWalk from "./components/ActiveWalk/ActiveWalk";
import DsShell, { type DsShellHandle } from "./components/DsShell";
import ErrorBanner from "./components/Error";
import WalksList from "./components/WalksList/WalksList";

function App() {
	const [activeWalkId, setActiveWalkId] = useState<number | null>(null);
	const [showWalks, setShowWalks] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const shellRef = useRef<DsShellHandle>(null);

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
			ref={shellRef}
			sprite={idleImg}
			bottom={
				<>
					<div className="ds-speech">
						Ready for walkies!
						<img
							className="ds-icon ds-icon-xs"
							src={boneImg}
							alt=""
							onClick={() => shellRef.current?.throwBone()}
							style={{
								cursor: "pointer",
								WebkitTapHighlightColor: "transparent",
							}}
						/>
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

					{error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
				</>
			}
		/>
	);
}

export default App;
