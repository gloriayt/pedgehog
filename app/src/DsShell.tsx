import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import heartImg from "./assets/heart.webp";
import happyImg from "./assets/pretzel-happy.webp";

type Props = {
	sprite: string;
	walking?: boolean;
	top?: ReactNode;
	bottom: ReactNode;
	listLayout?: boolean;
};

type Heart = { id: number; top: number; left: number };

function randomAround(center: number, range: number) {
	return center + (Math.random() - 0.5) * range;
}

function DsShell({ sprite, walking, top, bottom, listLayout }: Props) {
	const [hearts, setHearts] = useState<Heart[]>([]);
	const [happy, setHappy] = useState(false);
	const heartIdRef = useRef(0);
	const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

	useEffect(() => {
		const timers = timersRef.current;
		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, []);

	const addTimer = useCallback((fn: () => void, ms: number) => {
		const t = setTimeout(() => {
			timersRef.current.delete(t);
			fn();
		}, ms);
		timersRef.current.add(t);
	}, []);

	const pet = useCallback(() => {
		const id = ++heartIdRef.current;
		const heart: Heart = {
			id,
			top: randomAround(walking ? 60 : 30, 20),
			left: randomAround(walking ? 60 : 45, 20),
		};
		setHearts((h) => [...h, heart]);
		addTimer(() => setHearts((h) => h.filter((x) => x.id !== id)), 1200);

		setHappy(true);
		addTimer(() => setHappy(false), 1500);
	}, [addTimer, walking]);

	return (
		<>
			<div className="ds-console-top">
				<div className="ds-bezel-top">
					<div className="ds-screen-top">
						{top || (
							<>
								{hearts.map((h) => (
									<div
										key={h.id}
										className="ds-heart-react"
										style={{ top: `${h.top}%`, left: `${h.left}%` }}
									>
										<img src={heartImg} alt="" />
									</div>
								))}
								{walking ? (
									<div className="ds-speech">
										<Loader /> On a walk!
									</div>
								) : (
									<div className="ds-title">PRETZEL</div>
								)}
								<img
									className={`ds-sprite${walking ? " ds-sprite-waddle" : ""}`}
									src={happy && !walking ? happyImg : sprite}
									alt="Pretzel"
								/>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="ds-hinge">
				<div className="ds-power">
					<div className="ds-power-led" />
					<div className="ds-power-led" />
				</div>
			</div>

			<div className="ds-console-bottom">
				<div className="ds-bezel-bottom">
					<div
						className={`ds-screen-bottom${listLayout ? " ds-layout-list" : ""}`}
					>
						{bottom}
					</div>
				</div>

				<div className="ds-controls">
					<div className="ds-dpad-wrap">
						<div className="ds-dpad">
							<button
								type="button"
								className="ds-dpad-btn ds-dpad-up"
								aria-label="D-pad up"
								onClick={pet}
							/>
							<button
								type="button"
								className="ds-dpad-btn ds-dpad-down"
								aria-label="D-pad down"
								onClick={pet}
							/>
							<button
								type="button"
								className="ds-dpad-btn ds-dpad-left"
								aria-label="D-pad left"
								onClick={pet}
							/>
							<button
								type="button"
								className="ds-dpad-btn ds-dpad-right"
								aria-label="D-pad right"
								onClick={pet}
							/>
						</div>
					</div>

					<div className="ds-face-btns">
						<button type="button" className="ds-face-btn" onClick={pet}>
							X
						</button>
						<button type="button" className="ds-face-btn" onClick={pet}>
							B
						</button>
						<button type="button" className="ds-face-btn" onClick={pet}>
							Y
						</button>
						<button type="button" className="ds-face-btn" onClick={pet}>
							A
						</button>
					</div>
				</div>
			</div>
		</>
	);
}

export function Loader() {
	return (
		<span className="ds-walk-dots">
			<span className="ds-walk-dot" />
			<span className="ds-walk-dot" />
			<span className="ds-walk-dot" />
		</span>
	);
}

export default DsShell;
