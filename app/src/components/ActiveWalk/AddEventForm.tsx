import type { EventType, EventTypes } from "@pedgehog/shared";
import { useEffect, useState } from "react";
import type { AppEvent } from "../../api";
import { getEventTypes, logEvent, updateEvent } from "../../api";

type Props = {
	walkId: number;
	getPosition: () => { lat: number; lng: number } | null;
	editing?: AppEvent;
	onSave: (eventType: string) => void;
	onCancel: () => void;
};

function AddEventForm({
	walkId,
	getPosition,
	editing,
	onSave,
	onCancel,
}: Props) {
	const [types, setTypes] = useState<EventType[]>([]);
	const [selectedType, setSelectedType] = useState<number | null>(
		editing?.event_type_id ?? null,
	);
	const [intensity, setIntensity] = useState(editing?.intensity ?? 0);
	const [notes, setNotes] = useState(editing?.notes ?? "");

	useEffect(() => {
		getEventTypes().then((all) => {
			const orderedEvents: EventTypes[] = [
				"dog_encounter",
				"cat_encounter",
				"bird_encounter",
				"compliment",
				"scavenge",
			];

			const filtered = orderedEvents
				.map((type) => all.find((t) => t.type === type))
				.filter((t): t is EventType => t != null);
			setTypes(filtered);

			const defaultId =
				filtered.find((t) => t.type === "dog_encounter")?.id ??
				filtered[0]?.id ??
				null;
			setSelectedType((prev) => prev ?? defaultId);
		});
	}, []);

	const handleSave = async () => {
		if (!selectedType) return;
		if (editing) {
			await updateEvent(editing.id, {
				event_type_id: selectedType,
				intensity,
				notes: notes || undefined,
			});
		} else {
			const pos = getPosition();
			await logEvent({
				dog_id: 1,
				event_type_id: selectedType,
				walk_id: walkId,
				intensity,
				notes: notes || undefined,
				lat: pos?.lat,
				lng: pos?.lng,
			});
		}
		const savedType = types.find((t) => t.id === selectedType)?.type ?? "";
		onSave(savedType);
	};

	return (
		<div className="confirm-overlay">
			<div className="confirm">
				<div className="log-form">
					<select
						className="select"
						value={selectedType ?? ""}
						onChange={(e) => setSelectedType(Number(e.target.value))}
					>
						{types.map((t) => (
							<option key={t.id} value={t.id}>
								{t.label}
							</option>
						))}
					</select>

					{types.find((t) => t.id === selectedType)?.category !==
						"log_only" && (
						<div className="intensity">
							<div className="stat-lbl">INTENSITY</div>
							<div className="intensity-btns">
								{[0, 1, 2, 3, 4, 5].map((n) => (
									<button
										key={n}
										type="button"
										className={`intensity-btn${intensity === n ? " intensity-active" : ""}`}
										onClick={() => setIntensity(n)}
									>
										{n}
									</button>
								))}
							</div>
						</div>
					)}

					<textarea
						className="textarea"
						placeholder="Notes (optional)"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={2}
					/>
				</div>

				<div className="btn-row">
					<button
						type="button"
						className="btn-sm btn-sm-go"
						onClick={handleSave}
					>
						SAVE
					</button>
					<button type="button" className="btn-sm" onClick={onCancel}>
						CANCEL
					</button>
				</div>
			</div>
		</div>
	);
}

export default AddEventForm;
