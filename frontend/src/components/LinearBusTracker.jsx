import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const LinearBusTracker = ({ routeDetails, currentLocation, boardingStopName, trackedBus }) => {
    // Build allStops — prefer geocoded routeDetails, fallback to raw stop names
    const allStops = useMemo(() => {
        const result = [];

        if (routeDetails?.start) {
            result.push(routeDetails.start);
        } else if (trackedBus?.startingPoint) {
            result.push({ name: trackedBus.startingPoint, lat: null, lng: null });
        }

        if (routeDetails?.stops?.length > 0) {
            routeDetails.stops.forEach(s => result.push(s));
        } else if (trackedBus?.stops?.length > 0) {
            trackedBus.stops.filter(s => s && s.trim()).forEach(s =>
                result.push({ name: s, lat: null, lng: null })
            );
        }

        if (routeDetails?.end) {
            result.push(routeDetails.end);
        } else if (trackedBus?.endPoint) {
            result.push({ name: trackedBus.endPoint, lat: null, lng: null });
        }

        return result;
    }, [routeDetails, trackedBus]);

    const totalStops = allStops.length;

    // Check if ALL stops have real coordinates for distance interpolation
    const stopsWithCoords = useMemo(() =>
        allStops.filter(s => s.lat != null && s.lng != null),
        [allStops]
    );
    const hasAllCoords = stopsWithCoords.length === totalStops && totalStops >= 2;
    const startStop = allStops[0];
    const endStop = allStops[totalStops - 1];
    const hasEnds = startStop?.lat != null && endStop?.lat != null;

    // Detect which stop is currently "active" or nearest
    const nearestStopInfo = useMemo(() => {
        const loc = currentLocation;
        if (!loc || !loc.lat || !loc.lng || totalStops < 1) return null;

        let minStopDist = Infinity;
        let bestIdx = -1;
        
        allStops.forEach((stop, idx) => {
            if (stop.lat != null && stop.lng != null) {
                const d = getDistanceFromLatLonInKm(loc.lat, loc.lng, stop.lat, stop.lng);
                if (d < minStopDist) {
                    minStopDist = d;
                    bestIdx = idx;
                }
            }
        });

        return { index: bestIdx, distance: minStopDist };
    }, [currentLocation, allStops]);

    // 2. Geofence Logic (Stop Detection)
    // Identify which stops are completed based on distance (Threshold: 0.05 km / 50 meters)
    const stopStates = useMemo(() => {
        const loc = currentLocation;
        if (!loc || !loc.lat || !loc.lng) return allStops.map(() => false);

        // We'll consider a stop completed if the bus has been within 50m of it
        // Or, for the UI "trace" effect, if the bus has progressed past its percentage
        return allStops.map((stop, idx) => {
            if (stop.lat == null || stop.lng == null) return false;
            const dist = getDistanceFromLatLonInKm(loc.lat, loc.lng, stop.lat, stop.lng);
            return dist < 0.05; // 50 meters threshold
        });
    }, [currentLocation, allStops]);

    // 1. Mapping Logic (GPS to UI Pixels)
    const busProgressPercentage = useMemo(() => {
        const loc = currentLocation;
        if (!loc || !loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return null;
        if (totalStops < 2) return null;

        if (hasEnds) {
            const dStart = getDistanceFromLatLonInKm(loc.lat, loc.lng, startStop.lat, startStop.lng);
            const dEnd = getDistanceFromLatLonInKm(loc.lat, loc.lng, endStop.lat, endStop.lng);
            
            // User Formula: (Distance Traveled / Total Route Distance) * 100
            // We use (dStart / (dStart + dEnd)) as a projection to handle GPS jitter
            const totalProjected = dStart + dEnd;
            if (totalProjected === 0) return 0;
            const progress = (dStart / totalProjected) * 100;
            return Math.max(0, Math.min(100, progress));
        }

        return null;
    }, [currentLocation, allStops, totalStops, hasEnds, startStop, endStop]);

    // All hooks done — safe to do early return now
    if (totalStops < 2) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: '#9aa0b0' }}>
                <DirectionsBusIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                <Typography sx={{ fontWeight: 600 }}>Connecting to live tracking...</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>Waiting for route data from driver</Typography>
            </Box>
        );
    }

    const STOP_SPACING = 100; // Increased spacing for better clarity
    const timelineHeight = (totalStops - 1) * STOP_SPACING;

    // Colors
    const timelineBaseColor = '#e0e0e0'; // Base White/Gray line
    const traceColor = '#2196f3'; // Blue shaded line
    const stopBg = '#ffffff';
    const boardingBg = '#000000';
    const badgeBg = '#e6f4ea';
    const badgeText = '#1e8e3e';
    const busColor = '#2196f3';

    return (
        <Box sx={{
            width: '100%',
            py: 4,
            px: { xs: 2, sm: 6 },
            bgcolor: '#ffffff',
            borderRadius: '24px',
        }}>
            {/* Live coordinates and status badge */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: currentLocation?.lat ? '#00d68f' : '#666', boxShadow: currentLocation?.lat ? '0 0 8px #00d68f' : 'none' }} />
                    <Typography variant="caption" sx={{ color: '#555', fontWeight: 700 }}>
                        Bus GPS: {currentLocation?.lat != null ? `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : 'Searching...'}
                    </Typography>
                </Box>
                
                {nearestStopInfo && nearestStopInfo.distance < 0.3 && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#e3f2fd', color: '#1976d2', px: 1.5, py: 0.5, borderRadius: '20px', width: 'fit-content', mt: 1 }}>
                        <DirectionsBusIcon sx={{ fontSize: 16, mr: 1 }} />
                        <Typography sx={{ fontSize: '12px', fontWeight: 800 }}>
                            Nearest: {allStops[nearestStopInfo.index]?.name} ({Math.round(nearestStopInfo.distance * 1000)}m)
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Timeline */}
            <Box sx={{ position: 'relative', ml: 2, height: `${timelineHeight}px` }}>

                {/* 3. The "Railway Trace" Logic — Base Background Line */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '11px',
                    width: '4px',
                    bgcolor: timelineBaseColor,
                    zIndex: 1,
                    borderRadius: '2px'
                }} />

                {/* 3. The "Railway Trace" Logic — Shaded Blue Progress Line */}
                {busProgressPercentage !== null && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: '11px',
                        width: '4px',
                        height: `${busProgressPercentage}%`,
                        bgcolor: traceColor,
                        zIndex: 2,
                        borderRadius: '2px',
                        transition: 'height 1.5s ease-in-out',
                        boxShadow: `0 0 8px ${traceColor}88`
                    }} />
                )}

                {/* Bus icon */}
                {busProgressPercentage !== null && (
                    <Box sx={{
                        position: 'absolute',
                        left: '13px',
                        top: `${busProgressPercentage}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        transition: 'top 1.5s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <Box sx={{
                            bgcolor: busColor,
                            color: 'white',
                            borderRadius: '50%',
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 16px ${busColor}88`,
                            border: '3px solid white'
                        }}>
                            <DirectionsBusIcon sx={{ fontSize: 20 }} />
                        </Box>
                    </Box>
                )}

                {/* Stops */}
                {allStops.map((stop, i) => {
                    const isBoardingStop =
                        boardingStopName &&
                        stop.name &&
                        stop.name.trim().toLowerCase() === boardingStopName.trim().toLowerCase();
                    const topPct = (i / (totalStops - 1)) * 100;
                    const isFirst = i === 0;
                    const isLast = i === totalStops - 1;

                    // A stop is "visited" if the bus has progressed past its percentage or is within 50m
                    const isCompleted = stopStates[i] || (busProgressPercentage !== null && busProgressPercentage >= topPct - 1);
                    const isCurrent = nearestStopInfo && nearestStopInfo.index === i && nearestStopInfo.distance < 0.05;

                    return (
                        <Box
                            key={i}
                            sx={{
                                position: 'absolute',
                                top: `${topPct}%`,
                                left: 0,
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                transform: 'translateY(-50%)',
                                zIndex: 3
                            }}
                        >
                            {/* Stop circle with detection highlight */}
                            <Box sx={{
                                width: isCurrent ? 30 : 24,
                                height: isCurrent ? 30 : 24,
                                borderRadius: '50%',
                                border: `4px solid ${isCompleted || isCurrent ? traceColor : '#000000'}`,
                                bgcolor: isBoardingStop ? boardingBg : stopBg,
                                boxShadow: isCurrent ? `0 0 15px ${traceColor}` : 'none',
                                zIndex: 4,
                                flexShrink: 0,
                                transition: 'all 0.4s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {isCompleted && !isCurrent && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: traceColor }} />
                                )}
                            </Box>

                            {/* Label */}
                            <Box sx={{ ml: 4 }}>
                                <Typography sx={{
                                    fontSize: '15px',
                                    fontWeight: (isBoardingStop || isFirst || isLast || isCurrent) ? 800 : 500,
                                    color: isCompleted ? traceColor : '#222',
                                    lineHeight: 1.3,
                                    transition: 'color 0.4s ease'
                                }}>
                                    {stop.name}
                                    {isFirst && <Typography component="span" sx={{ fontSize: '11px', color: '#888', ml: 1 }}>(Start)</Typography>}
                                    {isLast && <Typography component="span" sx={{ fontSize: '11px', color: '#888', ml: 1 }}>(End)</Typography>}
                                </Typography>

                                {isBoardingStop && (
                                    <Box sx={{
                                        display: 'inline-block',
                                        bgcolor: badgeBg,
                                        color: badgeText,
                                        px: 1.5,
                                        py: 0.3,
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        mt: 0.4
                                    }}>
                                        Your boarding stop
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Bottom padding */}
            <Box sx={{ height: 40 }} />
        </Box>
    );
};

export default LinearBusTracker;

