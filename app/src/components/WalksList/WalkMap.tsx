import { format } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
	MapContainer,
	Marker,
	Polyline,
	TileLayer,
	Tooltip,
} from "react-leaflet";
import type { StressorEvent } from "../../api";

type Props = {
	walkId: number;
	positions: [number, number][];
	events: StressorEvent[];
};

function WalkMap({ walkId, positions, events }: Props) {
	return (
		<div className="ds-map-container">
			<MapContainer
				key={walkId}
				bounds={positions}
				style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
			>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					attribution="&copy; OSM"
				/>
				<Polyline positions={positions} color="#0F6E56" weight={3} />
				{events
					.filter(
						(e): e is StressorEvent & { lat: number; lng: number } =>
							e.lat != null && e.lng != null,
					)
					.map((e) => (
						<Marker
							key={e.id}
							position={[e.lat, e.lng]}
							icon={L.divIcon({
								html: e.type === "cat_encounter" ? "🐈" : "🐕",
								className: "ds-emoji-marker",
								iconSize: [20, 20],
								iconAnchor: [10, 10],
							})}
						>
							<Tooltip>
								<div>
									{e.label}
									{e.intensity ? ` (${e.intensity}/5)` : ""}
								</div>
								<div style={{ fontSize: 10, opacity: 0.7 }}>
									{format(new Date(e.occurred_at), "h:mm a")}
								</div>
								{e.notes && (
									<div style={{ fontSize: 10, opacity: 0.7 }}>{e.notes}</div>
								)}
							</Tooltip>
						</Marker>
					))}
			</MapContainer>
		</div>
	);
}

export default WalkMap;
