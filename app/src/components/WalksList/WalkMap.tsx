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
import type { AppEvent } from "../../api";
import { eventEmoji } from "../../helpers";

export type Route = {
	positions: [number, number][];
	colour: string;
};

export const ROUTE_COLOURS = [
	"#0F6E56",
	"#4888c8",
	"#d87888",
	"#e8a840",
	"#8b6f4e",
	"#7ab8d0",
	"#9b59b6",
	"#e74c3c",
	"#2ecc71",
	"#f39c12",
	"#1abc9c",
	"#e67e22",
	"#3498db",
	"#c0392b",
	"#27ae60",
];

type Props = {
	mapKey: string | number;
	routes: Route[];
	events: AppEvent[];
};

function WalkMap({ mapKey, routes, events }: Props) {
	const allPositions = routes.flatMap((r) => r.positions);
	if (allPositions.length === 0) return null;

	return (
		<div className="ds-map-container">
			<MapContainer key={mapKey} bounds={allPositions}>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					attribution="&copy; OSM"
				/>
				{routes.map((r, i) => (
					<Polyline
						key={i}
						positions={r.positions}
						color={r.colour}
						weight={3}
					/>
				))}
				{events
					.filter(
						(e): e is AppEvent & { lat: number; lng: number } =>
							e.lat != null && e.lng != null,
					)
					.map((e) => (
						<Marker
							key={e.id}
							position={[e.lat, e.lng]}
							icon={L.divIcon({
								html: eventEmoji(e.type),
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
