import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Button } from '@mui/material';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Bus Icon
const busIcon = L.divIcon({
    html: `<div style="background-color: #ff3d71; width: 30px; height: 30px; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; border: 3px solid white; box-shadow: 0 0 15px rgba(255, 61, 113, 0.5);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18 11V7c0-1.66-1.34-3-3-3H9C7.34 4 6 5.34 6 7v4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h1.24c.4-.58.91-1 1.51-1s1.11.42 1.51 1h5.48c.4-.58.91-1 1.51-1s1.11.42 1.51 1H20c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-2zM9 6h6v2H9V6zm10 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-14-1c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zM18 13H6v-2h12v2z"/>
            </svg>
          </div>`,
    className: 'custom-bus-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Component to auto-center map when location updates
const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo([coords.lat, coords.lng], 15, { animate: true });
        }
    }, [coords, map]);
    return null;
};

const MapView = ({ routeDetails, currentLocation, trackedBus }) => {
    // Determine initial center
    const initialCenter = useMemo(() => {
        if (currentLocation?.lat) return [currentLocation.lat, currentLocation.lng];
        if (routeDetails?.start?.lat) return [routeDetails.start.lat, routeDetails.start.lng];
        return [8.5241, 76.9366]; // Default Trivandrum coords
    }, [currentLocation, routeDetails]);

    return (
        <Box sx={{ 
            height: { xs: '55vh', md: '70vh' }, 
            width: '100%', 
            borderRadius: '24px', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 1
        }}>
            <MapContainer 
                center={initialCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                {/* High Detail "Google-like" Voyager Tiles */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />



                {/* Live Bus Marker */}
                {currentLocation?.lat && (
                    <Marker 
                        position={[currentLocation.lat, currentLocation.lng]} 
                        icon={busIcon}
                        zIndexOffset={1000}
                    >
                        <Popup>
                            <Box sx={{ textAlign: 'center', minWidth: 160 }}>
                                <Typography sx={{ fontWeight: 900, color: '#ff3d71', mb: 0.5 }}>LIVE POSITION</Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}>Bus #{trackedBus?.busNumber}</Typography>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    onClick={() => {
                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${currentLocation.lat},${currentLocation.lng}`;
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                    sx={{ 
                                        borderRadius: '8px', 
                                        textTransform: 'none', 
                                        fontWeight: 800,
                                        bgcolor: '#4285F4',
                                        '&:hover': { bgcolor: '#3367d6' },
                                        boxShadow: '0 4px 10px rgba(66, 133, 244, 0.4)',
                                        width: '100%'
                                    }}
                                >
                                    Navigate
                                </Button>
                            </Box>
                        </Popup>
                    </Marker>
                )}

                <RecenterMap coords={currentLocation} />
            </MapContainer>
        </Box>
    );
};

export default MapView;
