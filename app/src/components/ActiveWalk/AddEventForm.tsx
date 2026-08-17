import type { StressorType } from "@pedgehog/shared";
import { useEffect, useState } from "react";
import type { StressorEvent } from "../../api";
import {
	getStressorTypes,
	logStressorEvent,
	updateStressorEvent,
} from "../../api";

type Props = {
	walkId: number;
	getPosition: () => { lat: number; lng: number } | null;
	editing?: StressorEvent;
	onSave: () => void;
	onCancel: () => void;
};

function AddEventForm({
	walkId,
	getPosition,
	editing,
	onSave,
	onCancel,
}: Props) {
	const [types, setTypes] = useState<StressorType[]>([]);
	const [selectedType, setSelectedType] = useState<number | null>(
		editing?.stressor_type_id ?? null,
	);
	const [intensity, setIntensity] = useState(editing?.intensity ?? 1);
	const [notes, setNotes] = useState(editing?.notes ?? "");

	useEffect(() => {
		getStressorTypes().then((all) => {
			const filtered = all.filter(
				(t) => t.type === "dog_encounter" || t.type === "cat_encounter",
			);
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
			await updateStressorEvent(editing.id, {
				stressor_type_id: selectedType,
				intensity,
				notes: notes || undefined,
			});
		} else {
			const pos = getPosition();
			await logStressorEvent({
				dog_id: 1,
				stressor_type_id: selectedType,
				walk_id: walkId,
				intensity,
				notes: notes || undefined,
				lat: pos?.lat,
				lng: pos?.lng,
			});
		}
		onSave();
	};

	return (
		<div className="ds-confirm-overlay">
			<div className="ds-confirm">
				<div className="ds-log-form">
					<select
						className="ds-select"
						value={selectedType ?? ""}
						onChange={(e) => setSelectedType(Number(e.target.value))}
					>
						{types.map((t) => (
							<option key={t.id} value={t.id}>
								{t.label}
							</option>
						))}
					</select>

					<div className="ds-intensity">
						<div className="ds-stat-lbl">INTENSITY</div>
						<div className="ds-intensity-btns">
							{[1, 2, 3, 4, 5].map((n) => (
								<button
									key={n}
									type="button"
									className={`ds-intensity-btn${intensity === n ? " ds-intensity-active" : ""}`}
									onClick={() => setIntensity(n)}
								>
									{n}
								</button>
							))}
						</div>
					</div>

					<textarea
						className="ds-textarea"
						placeholder="Notes (optional)"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={2}
					/>
				</div>

				<div className="ds-btn-row">
					<button
						type="button"
						className="ds-btn-sm ds-btn-sm-go"
						onClick={handleSave}
					>
						SAVE
					</button>
					<button type="button" className="ds-btn-sm" onClick={onCancel}>
						CANCEL
					</button>
				</div>
			</div>
		</div>
	);
}

export default AddEventForm;
