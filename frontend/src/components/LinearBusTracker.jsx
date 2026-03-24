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

    // Calculate bus progress (0–100%) using Haversine
    const busProgressPercentage = useMemo(() => {
        const loc = currentLocation;
        if (!loc || !loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return null;
        if (totalStops < 2) return null;

        const busLat = loc.lat;
        const busLng = loc.lng;

        // Mode 1: All stops have coords (Precise segment-based)
        if (hasAllCoords) {
            let closestSegmentIndex = 0;
            let minSum = Infinity;
            let frac = 0;

            for (let i = 0; i < totalStops - 1; i++) {
                const p1 = allStops[i];
                const p2 = allStops[i + 1];
                const d1 = getDistanceFromLatLonInKm(busLat, busLng, p1.lat, p1.lng);
                const d2 = getDistanceFromLatLonInKm(busLat, busLng, p2.lat, p2.lng);
                if (d1 + d2 < minSum) {
                    minSum = d1 + d2;
                    closestSegmentIndex = i;
                    frac = d1 === 0 ? 0 : d2 === 0 ? 1 : d1 / (d1 + d2);
                }
            }
            const progress = (closestSegmentIndex + frac) / (totalStops - 1);
            return Math.max(0, Math.min(100, progress * 100));
        }

        // Mode 2: At least Start and End have coords (Linear interpolation fallback)
        if (hasEnds) {
            const dStart = getDistanceFromLatLonInKm(busLat, busLng, startStop.lat, startStop.lng);
            const dEnd = getDistanceFromLatLonInKm(busLat, busLng, endStop.lat, endStop.lng);
            const totalPath = dStart + dEnd;
            if (totalPath === 0) return 0;
            const progress = dStart / totalPath;
            return Math.max(0, Math.min(100, progress * 100));
        }

        return null;
    }, [currentLocation, allStops, totalStops, hasAllCoords, hasEnds]);

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

    // Height per stop segment (increase spacing for readability)
    const STOP_SPACING = 90;
    const timelineHeight = (totalStops - 1) * STOP_SPACING;

    // Colors
    const timelineColor = '#000000';
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
            // Let container grow naturally — parent must NOT have overflow:hidden
        }}>
            {/* Live coordinates and status badge */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00d68f', boxShadow: '0 0 8px #00d68f' }} />
                    <Typography variant="caption" sx={{ color: '#555', fontWeight: 700 }}>
                        Bus GPS: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                    </Typography>
                    {!hasAllCoords && !hasEnds && (
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                            (Locating route...)
                        </Typography>
                    )}
                </Box>
                
                {nearestStopInfo && nearestStopInfo.distance < 0.3 && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#e3f2fd', color: '#1976d2', px: 1.5, py: 0.5, borderRadius: '20px', width: 'fit-content', mt: 1 }}>
                        <DirectionsBusIcon sx={{ fontSize: 16, mr: 1 }} />
                        <Typography sx={{ fontSize: '12px', fontWeight: 800 }}>
                            Bus at: {allStops[nearestStopInfo.index]?.name}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Timeline */}
            <Box sx={{ position: 'relative', ml: 2, height: `${timelineHeight}px` }}>

                {/* Vertical black track line */}
                <Box sx={{
                    position: 'absolute',
                    top: 12,
                    bottom: 12,
                    left: '11px',
                    width: '3px',
                    bgcolor: timelineColor,
                    zIndex: 1
                }} />

                {/* Bus icon — only when we have a valid interpolated position */}
                {busProgressPercentage !== null && (
                    <Box sx={{
                        position: 'absolute',
                        left: '12px',
                        top: `${busProgressPercentage}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        transition: 'top 2s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <Box sx={{
                            bgcolor: busColor,
                            color: 'white',
                            borderRadius: '50%',
                            width: 34,
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 16px ${busColor}88`,
                            border: '3px solid white'
                        }}>
                            <DirectionsBusIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box sx={{
                            width: 0, height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: `6px solid ${busColor}`,
                            mt: -0.3
                        }} />
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

                    const isNearest = nearestStopInfo && nearestStopInfo.index === i && nearestStopInfo.distance < 0.3;

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
                                zIndex: 2
                            }}
                        >
                            {/* Stop circle */}
                            <Box sx={{
                                width: isNearest ? 28 : 24,
                                height: isNearest ? 28 : 24,
                                borderRadius: '50%',
                                border: `3px solid ${isNearest ? busColor : timelineColor}`,
                                bgcolor: isBoardingStop ? boardingBg : stopBg,
                                boxShadow: isNearest ? `0 0 12px ${busColor}88` : 'none',
                                zIndex: 3,
                                flexShrink: 0,
                                transition: 'all 0.3s ease'
                            }} />

                            {/* Label */}
                            <Box sx={{ ml: 4 }}>
                                <Typography sx={{
                                    fontSize: '14px',
                                    fontWeight: (isBoardingStop || isFirst || isLast) ? 800 : 500,
                                    color: '#222',
                                    lineHeight: 1.3
                                }}>
                                    {stop.name}
                                    {isFirst && (
                                        <Typography component="span" sx={{ fontSize: '11px', color: '#888', ml: 1, fontWeight: 500 }}>
                                            (Start)
                                        </Typography>
                                    )}
                                    {isLast && (
                                        <Typography component="span" sx={{ fontSize: '11px', color: '#888', ml: 1, fontWeight: 500 }}>
                                            (End)
                                        </Typography>
                                    )}
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

            {/* Bottom padding so last stop isn't clipped */}
            <Box sx={{ height: 24 }} />
        </Box>
    );
};

export default LinearBusTracker;
