import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import polyline from "@mapbox/polyline";

// Fix Leaflet default icon issue in Next.js
const iconPerson = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/666/666201.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const iconCourier = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png",
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45]
});

// Mock Coordinates (Bandung - Telkom University Area)
const START_POS: [number, number] = [-6.9751, 107.6319]; // Telkom University
const END_POS: [number, number] = [-6.9720, 107.6300];   // Nearby Location

// Helper to interpolate between two points
function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
}

// Helper to calculate total distance of the route
function calculateRouteDistance(coords: [number, number][]) {
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        dist += L.latLng(coords[i]).distanceTo(L.latLng(coords[i + 1]));
    }
    return dist;
}

function CourierMarker({ route, onArrival }: { route: [number, number][], onArrival?: () => void }) {
    const [position, setPosition] = useState(route[0]);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const hasArrivedRef = useRef(false);
    
    // We want a constant speed, say 20 meters per second (72 km/h) roughly simulation speed
    // Or fixed duration. Let's stick to fixed duration for demo: 30s.
    const DURATION = 30000; 

    // Store route length to normalize progress
    // But for simplicity, we can just treat the route as a single timeline 0->1
    
    const onArrivalRef = useRef(onArrival);
    useEffect(() => { onArrivalRef.current = onArrival; }, [onArrival]);

    useEffect(() => {
        if (route.length < 2) return;

        // Reset if route changes significantly (optional)
        startTimeRef.current = null;
        hasArrivedRef.current = false;

        // Pre-calculate distances for smooth segments
        // Segment lengths
        const segmentDistances: number[] = [];
        let totalDist = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const d = L.latLng(route[i]).distanceTo(L.latLng(route[i + 1]));
            segmentDistances.push(d);
            totalDist += d;
        }

        const animate = (time: number) => {
            if (startTimeRef.current === null) startTimeRef.current = time;
            const timeElapsed = time - startTimeRef.current;
            const globalProgress = Math.min(timeElapsed / DURATION, 1); // 0 to 1

            // Find which segment we are in based on globalProgress
            const currentDist = globalProgress * totalDist;
            
            let coveredDist = 0;
            let currentSegmentIndex = 0;
            let segmentProgress = 0;

            for (let i = 0; i < segmentDistances.length; i++) {
                if (coveredDist + segmentDistances[i] >= currentDist) {
                    currentSegmentIndex = i;
                    // Progress within this specific segment
                    const distInSegment = currentDist - coveredDist;
                    segmentProgress = distInSegment / segmentDistances[i];
                    break;
                }
                coveredDist += segmentDistances[i];
            }

            // If we reached the end of loop/distance
            if (globalProgress >= 1) {
                setPosition(route[route.length - 1]);
                console.log("Animation completed. Triggering arrival.");
            } else {
                const p1 = route[currentSegmentIndex];
                const p2 = route[currentSegmentIndex + 1];
                // Safety check
                if (p1 && p2) {
                     const newLat = lerp(p1[0], p2[0], segmentProgress);
                     const newLng = lerp(p1[1], p2[1], segmentProgress);
                     setPosition([newLat, newLng]);
                }
            }

            if (globalProgress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                 if (!hasArrivedRef.current) {
                    hasArrivedRef.current = true;
                    console.log("Calling onArrival callback...");
                    if (onArrivalRef.current) onArrivalRef.current();
                }
            }
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [route]);

    return (
        <Marker position={position} icon={iconCourier}>
            <Popup>
                🛵 Your food is on the way!
            </Popup>
        </Marker>
    );
}

// Component to handle map view bounds
function MapBounds({ coords }: { coords: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, coords]);
    return null;
}

interface MapOrdersProps {
    vendorName?: string;
    buyerName?: string;
    vendorLocation?: [number, number];
    buyerLocation?: [number, number];
    onArrival?: () => void;
}

export default function MapOrders({ 
    vendorName = "Vendor", 
    buyerName = "You", 
    vendorLocation,
    buyerLocation,
    onArrival 
}: MapOrdersProps) {
    const vendorPos = vendorLocation || START_POS;
    const buyerPos = buyerLocation || END_POS;
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([vendorPos, buyerPos]);
    const [isRouting, setIsRouting] = useState(true);

    useEffect(() => {
        async function fetchRoute() {
            try {
                // OSRM Public API
                const url = `https://router.project-osrm.org/route/v1/driving/${vendorPos[1]},${vendorPos[0]};${buyerPos[1]},${buyerPos[0]}?overview=full&geometries=polyline`;
                const res = await fetch(url);
                const data = await res.json();
                
                if (data.routes && data.routes[0]) {
                    const decoded = polyline.decode(data.routes[0].geometry) as [number, number][];
                    setRouteCoords(decoded);
                }
            } catch (error) {
                console.error("Failed to fetch route:", error);
                // Fallback to straight line is already set in initial state
            } finally {
                setIsRouting(false);
            }
        }
        
        fetchRoute();
    }, [vendorPos, buyerPos]);

    return (
        <MapContainer 
            center={vendorPos} 
            zoom={13} 
            className="w-full h-full z-0" 
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Courier (Moving along route) */}
            {!isRouting && <CourierMarker route={routeCoords} onArrival={onArrival} />}

            {/* Buyer (End) */}
            <Marker position={buyerPos} icon={iconPerson}>
                <Popup>
                    🏠 {buyerName} (Delivery Location)
                </Popup>
            </Marker>

            {/* Route Line (Real path) */}
            <Polyline positions={routeCoords} color="blue" weight={4} opacity={0.6} dashArray="10, 10" />
            
            <MapBounds coords={routeCoords} />
        </MapContainer>
    );
}
