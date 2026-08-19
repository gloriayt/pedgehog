import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import boneImg from "../assets/bone.webp";
import heartImg from "../assets/heart.webp";
import happyImg from "../assets/pretzel-happy.webp";
import { randomAround } from "../helpers";
import Loader from "./Loader";

export type ShellActions = {
	throwBone: () => void;
	scavengeParty: () => void;
};

type Props = {
	sprite: string;
	walking?: boolean;
	top?: ReactNode;
	bottom: ReactNode | ((actions: ShellActions) => ReactNode);
	listLayout?: boolean;
	onButtonPress?: () => void;
};

type Heart = { id: number; top: number; left: number };
type Reaction = "happy" | "woah" | null;

const DIRECTIONS = [
	"left", "right", "top", "bottom",
	"top-left", "top-right", "bottom-left", "bottom-right",
] as const;
type Bone = { id: number; direction: (typeof DIRECTIONS)[number] };
type Drumstick = { id: number; left: number; delay: number };

function DsShell({ sprite, walking, top, bottom, listLayout, onButtonPress }: Props) {
	const [hearts, setHearts] = useState<Heart[]>([]);
	const [bones, setBones] = useState<Bone[]>([]);
	const [drumsticks, setDrumsticks] = useState<Drumstick[]>([]);
	const [frenzy, setFrenzy] = useState(false);
	const [reaction, setReaction] = useState<Reaction>(null);
	const heartIdRef = useRef(0);
	const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

	useEffect(() => {
		const timers = timersRef.current;
		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, []);

	const [blinking, setBlinking] = useState(false);

	useEffect(() => {
		if (walking) return;
		const blink = () => {
			setBlinking(true);
			setTimeout(() => setBlinking(false), 100);
		};
		const schedule = (): ReturnType<typeof setTimeout> =>
			setTimeout(() => {
				blink();
				timerId = schedule();
			}, 4000 + Math.random() * 2000);
		let timerId = schedule();
		return () => clearTimeout(timerId);
	}, [walking]);

	const addTimer = useCallback((fn: () => void, ms: number) => {
		const t = setTimeout(() => {
			timersRef.current.delete(t);
			fn();
		}, ms);
		timersRef.current.add(t);
	}, []);

	const throwBone = useCallback(() => {
		const id = ++heartIdRef.current;
		const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
		setBones((b) => [...b, { id, direction }]);
		addTimer(() => setBones((b) => b.filter((x) => x.id !== id)), 1500);
		setReaction("woah");
		addTimer(() => setReaction(null), 1500);
	}, [addTimer]);

	const scavengeParty = useCallback(() => {
		const sticks = Array.from({ length: 12 }, (_, i) => ({
			id: ++heartIdRef.current + i,
			left: Math.random() * 90 + 5,
			delay: Math.random() * 0.6,
		}));
		setDrumsticks(sticks);
		setFrenzy(true);
		addTimer(() => setDrumsticks([]), 2000);
		addTimer(() => setFrenzy(false), 1500);
	}, [addTimer]);

	const pet = useCallback(() => {
		const id = ++heartIdRef.current;
		const heart: Heart = {
			id,
			top: randomAround(walking ? 60 : 30, 20),
			left: randomAround(walking ? 60 : 45, 20),
		};
		setHearts((h) => [...h, heart]);
		addTimer(() => setHearts((h) => h.filter((x) => x.id !== id)), 1200);

		setReaction("happy");
		addTimer(() => setReaction(null), 1500);

		if (Math.random() < 0.1) throwBone();

		onButtonPress?.();
	}, [addTimer, walking, onButtonPress, throwBone]);

	const actions: ShellActions = { throwBone, scavengeParty };
	const bottomContent = typeof bottom === "function" ? bottom(actions) : bottom;

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
								{bones.map((b) => (
									<div
										key={b.id}
										className={`ds-bone-throw ds-bone-${b.direction}`}
									>
										<img src={boneImg} alt="" />
									</div>
								))}
								{drumsticks.map((d) => (
									<div
										key={d.id}
										className="ds-drumstick"
										style={{ left: `${d.left}%`, animationDelay: `${d.delay}s` }}
									>
										🍗
									</div>
								))}
								{walking ? (
									<div className="ds-speech">
										<Loader /> On a walk!
									</div>
								) : (
									<div className="ds-title">PRETZEL</div>
								)}
								<div style={{ position: "relative" }}>
									{reaction === "woah" && <div className="ds-woah">‼️</div>}
									<img
										className={`ds-sprite${walking ? " ds-sprite-waddle" : ""}${frenzy ? " ds-sprite-frenzy" : ""}`}
										src={(reaction === "happy" || blinking) && !walking ? happyImg : sprite}
										alt="Pretzel"
										onClick={pet}
										style={{ cursor: "pointer" }}
									/>
								</div>
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
					<div className={`ds-screen-bottom${listLayout ? " ds-layout-list" : ""}`}>
						{bottomContent}
					</div>
				</div>

				<div className="ds-controls">
					<div className="ds-dpad-wrap">
						<div className="ds-dpad">
							<button type="button" className="ds-dpad-btn ds-dpad-up" aria-label="D-pad up" onClick={pet} />
							<button type="button" className="ds-dpad-btn ds-dpad-down" aria-label="D-pad down" onClick={pet} />
							<button type="button" className="ds-dpad-btn ds-dpad-left" aria-label="D-pad left" onClick={pet} />
							<button type="button" className="ds-dpad-btn ds-dpad-right" aria-label="D-pad right" onClick={pet} />
						</div>
					</div>

					<div className="ds-face-btns">
						<button type="button" className="ds-face-btn" onClick={pet}>X</button>
						<button type="button" className="ds-face-btn" onClick={pet}>B</button>
						<button type="button" className="ds-face-btn" onClick={pet}>Y</button>
						<button type="button" className="ds-face-btn" onClick={pet}>A</button>
					</div>
				</div>
			</div>
		</>
	);
}

export default DsShell;
