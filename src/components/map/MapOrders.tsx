"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

// Mock Coordinates (Jakarta Area)
// Monas (Start) -> Bundaran HI (End) roughly
const START_POS: [number, number] = [-6.175392, 106.827153]; // Monas
const END_POS: [number, number] = [-6.194957, 106.823077];   // Bundaran HI

// Helper to interpolate between two points
function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
}

function CourierMarker({ start, end }: { start: [number, number], end: [number, number] }) {
    const [position, setPosition] = useState(start);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const DURATION = 30000; // 30 seconds

    useEffect(() => {
        const animate = (time: number) => {
            if (startTimeRef.current === null) startTimeRef.current = time;
            const timeElapsed = time - startTimeRef.current;
            const progress = Math.min(timeElapsed / DURATION, 1);

            const newLat = lerp(start[0], end[0], progress);
            const newLng = lerp(start[1], end[1], progress);
            
            setPosition([newLat, newLng]);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [start, end]);

    return (
        <Marker position={position} icon={iconCourier}>
            <Popup>
                🛵 Your food is on the way!
            </Popup>
        </Marker>
    );
}

// Component to handle map view bounds
function MapBounds({ start, end }: { start: [number, number], end: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLngBounds([start, end]);
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [map, start, end]);
    return null;
}

interface MapOrdersProps {
    vendorName?: string;
    buyerName?: string;
}

export default function MapOrders({ vendorName = "Vendor", buyerName = "You" }: MapOrdersProps) {
    // In a real app, you would pass these as props or fetch them
    const vendorPos = START_POS;
    const buyerPos = END_POS;

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
            
            {/* Courier (Start) -> Moving */}
            <CourierMarker start={vendorPos} end={buyerPos} />

            {/* Buyer (End) */}
            <Marker position={buyerPos} icon={iconPerson}>
                <Popup>
                    🏠 {buyerName} (Delivery Location)
                </Popup>
            </Marker>

            {/* Route Line */}
            <Polyline positions={[vendorPos, buyerPos]} color="blue" weight={4} opacity={0.6} dashArray="10, 10" />
            
            <MapBounds start={vendorPos} end={buyerPos} />
        </MapContainer>
    );
}
