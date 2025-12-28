"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from 'next/link';

// Fix Leaflet default icon issue
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

// Default Center: Telkom University
const CENTER_POS: [number, number] = [-6.9751, 107.6319];

interface Driver {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    latitude: number;
    longitude: number;
}

interface ActiveDriversMapProps {
    drivers: Driver[];
}

function MapBounds({ drivers }: { drivers: Driver[] }) {
    const map = useMap();
    useEffect(() => {
        if (drivers.length > 0) {
            const latLngs = drivers.map(d => [d.latitude, d.longitude] as [number, number]);
            latLngs.push(CENTER_POS); // Include user
            const bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, drivers]);
    return null;
}

export default function ActiveDriversMap({ drivers }: ActiveDriversMapProps) {
    return (
        <MapContainer 
            center={CENTER_POS} 
            zoom={15} 
            className="w-full h-full z-0" 
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Radar Effect */}
            <Marker 
                position={CENTER_POS} 
                icon={L.divIcon({
                    className: 'custom-radar',
                    html: '<div class="radar-pulse"></div>',
                    iconSize: [80, 80],
                    iconAnchor: [40, 40]
                })} 
                zIndexOffset={-10}
            />
            <style jsx global>{`
                .radar-pulse {
                    width: 100%;
                    height: 100%;
                    background-color: rgba(41, 226, 118, 1);
                    border-radius: 50%;
                    animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.5); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>

            {/* User Location */}
            <Marker position={CENTER_POS} icon={iconPerson}>
                <Popup>
                    You are here (Telkom University)
                </Popup>
            </Marker>

            {/* Drivers */}
            {drivers.map(driver => (
                <Marker 
                    key={driver.id} 
                    position={[driver.latitude, driver.longitude]} 
                    icon={iconCourier}
                >
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold text-sm">{driver.name || "Vendor"}</p>
                            <p className="text-xs text-gray-500">Active nearby</p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            <MapBounds drivers={drivers} />
        </MapContainer>
    );
}
