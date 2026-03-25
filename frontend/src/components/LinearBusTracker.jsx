import React, { useMemo } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
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
    console.log("LinearBusTracker Recv Location:", currentLocation);
    // Build allStops — prefer geocoded routeDetails, fallback to raw stop names
    const allStops = useMemo(() => {
        const result = [];

        // 1. Start Point
        const startName = trackedBus?.startingPoint;
        const startGeo = routeDetails?.start;
        if (startGeo || startName) {
            result.push(startGeo || { name: startName, lat: null, lng: null });
        }

        // 2. Intermediate Stops - ENSURE WE GET ALL OF THEM
        // We use the names from trackedBus.stops as the master list
        const stopNames = trackedBus?.stops || [];
        const geocodedStops = routeDetails?.stops || [];

        stopNames.forEach(name => {
            if (!name || !name.trim()) return;
            // Check if we have geocoded data for this stop name
            const geo = geocodedStops.find(s => s.name?.trim().toLowerCase() === name.trim().toLowerCase());
            result.push(geo || { name: name, lat: null, lng: null });
        });

        // 3. End Point
        const endName = trackedBus?.endPoint;
        const endGeo = routeDetails?.end;
        if (endGeo || endName) {
            result.push(endGeo || { name: endName, lat: null, lng: null });
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

    // Stationary Check (10m in 2 minutes)
    const [isStationaryAtStart, setIsStationaryAtStart] = React.useState(false);
    const lastPosRef = React.useRef(currentLocation);
    const lastMoveTimeRef = React.useRef(Date.now());

    React.useEffect(() => {
        if (!currentLocation || !currentLocation.lat) return;
        
        // Check distance moved from last recorded point
        const distMoved = lastPosRef.current 
            ? getDistanceFromLatLonInKm(lastPosRef.current.lat, lastPosRef.current.lng, currentLocation.lat, currentLocation.lng)
            : 0;

        if (!lastPosRef.current || distMoved > 0.01) { // 10 meters
            lastPosRef.current = currentLocation;
            lastMoveTimeRef.current = Date.now();
            setIsStationaryAtStart(false);
        } else {
            const elapsedMins = (Date.now() - lastMoveTimeRef.current) / 60000;
            // "System Ready" check: within 100m of start and stationary for 2 mins
            const isNearStart = startStop?.lat && getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, startStop.lat, startStop.lng) < 0.1;
            if (elapsedMins >= 2 && isNearStart) {
                setIsStationaryAtStart(true);
            }
        }
    }, [currentLocation, startStop]);

    // 1. IMPROVED: Segment-Aware Track Progress Logic
    const busProgressPercentage = useMemo(() => {
        const loc = currentLocation;
        if (!loc || !loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return null;
        if (totalStops < 2 || stopsWithCoords.length < 2) return null;

        // Find nearest stop among those WITH coordinates
        let minStopDist = Infinity;
        let nearestInCoordsIdx = -1;

        stopsWithCoords.forEach((stop, idx) => {
            const d = getDistanceFromLatLonInKm(loc.lat, loc.lng, stop.lat, stop.lng);
            if (d < minStopDist) {
                minStopDist = d;
                nearestInCoordsIdx = idx;
            }
        });

        if (nearestInCoordsIdx === -1) return null;

        const currentStop = stopsWithCoords[nearestInCoordsIdx];
        const prevStop = stopsWithCoords[nearestInCoordsIdx - 1];
        const nextStop = stopsWithCoords[nearestInCoordsIdx + 1];

        // Original indices in the main allStops array (for Global UI %)
        const currentGlobalIdx = allStops.findIndex(s => s === currentStop);
        
        let segmentStartGlobalIdx = -1;
        let segmentRatio = 0;

        if (nearestInCoordsIdx === 0) {
            // At first geocoded stop
            segmentStartGlobalIdx = currentGlobalIdx;
            if (nextStop) {
                const nextGlobalIdx = allStops.findIndex(s => s === nextStop);
                const dSeg = getDistanceFromLatLonInKm(currentStop.lat, currentStop.lng, nextStop.lat, nextStop.lng);
                const dFromStart = getDistanceFromLatLonInKm(loc.lat, loc.lng, currentStop.lat, currentStop.lng);
                segmentRatio = dSeg > 0 ? (dFromStart / dSeg) * (nextGlobalIdx - currentGlobalIdx) : 0;
            }
        } else if (nearestInCoordsIdx === stopsWithCoords.length - 1) {
            // At last geocoded stop
            const prevGlobalIdx = allStops.findIndex(s => s === prevStop);
            segmentStartGlobalIdx = prevGlobalIdx;
            const dSeg = getDistanceFromLatLonInKm(prevStop.lat, prevStop.lng, currentStop.lat, currentStop.lng);
            const dFromPrev = getDistanceFromLatLonInKm(loc.lat, loc.lng, prevStop.lat, prevStop.lng);
            segmentRatio = dSeg > 0 ? (dFromPrev / dSeg) * (currentGlobalIdx - prevGlobalIdx) : (currentGlobalIdx - prevGlobalIdx);
        } else {
            // General case
            const dPrev = getDistanceFromLatLonInKm(loc.lat, loc.lng, prevStop.lat, prevStop.lng);
            const dNext = getDistanceFromLatLonInKm(loc.lat, loc.lng, nextStop.lat, nextStop.lng);
            
            if (dNext < dPrev) {
                segmentStartGlobalIdx = currentGlobalIdx;
                const nextGlobalIdx = allStops.findIndex(s => s === nextStop);
                const dSeg = getDistanceFromLatLonInKm(currentStop.lat, currentStop.lng, nextStop.lat, nextStop.lng);
                const dFromStart = getDistanceFromLatLonInKm(loc.lat, loc.lng, currentStop.lat, currentStop.lng);
                segmentRatio = dSeg > 0 ? (dFromStart / dSeg) * (nextGlobalIdx - currentGlobalIdx) : 0;
            } else {
                const prevGlobalIdx = allStops.findIndex(s => s === prevStop);
                segmentStartGlobalIdx = prevGlobalIdx;
                const dSeg = getDistanceFromLatLonInKm(prevStop.lat, prevStop.lng, currentStop.lat, currentStop.lng);
                const dFromStart = getDistanceFromLatLonInKm(loc.lat, loc.lng, prevStop.lat, prevStop.lng);
                segmentRatio = dSeg > 0 ? (dFromStart / dSeg) * (currentGlobalIdx - prevGlobalIdx) : 0;
            }
        }

        const calculatedProgress = (segmentStartGlobalIdx + segmentRatio) / (totalStops - 1) * 100;
        
        // AUTO-FILL BYPASS: If we have a nearest stop, don't let the progress line be behind it.
        // This ensures that if the driver starts GPS late, the line is instantly shaded up to the current stop.
        const nearestIdx = nearestStopInfo?.index || 0;
        const nearestStopProgress = (nearestIdx / (totalStops - 1)) * 100;

        return Math.max(0, Math.min(100, Math.max(calculatedProgress, nearestStopProgress)));
    }, [currentLocation, totalStops, allStops, stopsWithCoords, nearestStopInfo]);

    // Persistent Reached Indices (Sticky Status)
    const [reachedIndices, setReachedIndices] = React.useState(new Set());

    React.useEffect(() => {
        if (nearestStopInfo && nearestStopInfo.index !== -1) {
            setReachedIndices(prev => {
                const next = new Set(prev);
                // Mark everything up to the nearest index as reached
                for (let i = 0; i <= nearestStopInfo.index; i++) {
                    next.add(i);
                }
                return next;
            });
        }
    }, [nearestStopInfo]);

    // 2. The "Geofence" Logic (Auto-Fill Stops & Index-Based Completion)
    const stopsStatus = useMemo(() => {
        // Find nearest stop for Index-Based Completion
        const nearestIdx = nearestStopInfo ? nearestStopInfo.index : -1;

        return allStops.map((stop, idx) => {
            const stopProgressPct = (idx / (totalStops - 1)) * 100;
            
            // "Fill-Behind" Rule: Automatically mark all stops BEFORE nearest index as reached
            // Now backed by persistent "reachedIndices" state
            let isReached = reachedIndices.has(idx);
            
            if (!isReached) {
                if (nearestIdx !== -1 && idx < nearestIdx) {
                    isReached = true;
                } else if (busProgressPercentage !== null && busProgressPercentage >= stopProgressPct) {
                    isReached = true;
                } else if (currentLocation?.lat != null && stop.lat != null) {
                    const dist = getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, stop.lat, stop.lng);
                    if (dist < 0.1) isReached = true; 
                }
            }
            
            return { ...stop, isReached };
        });
    }, [allStops, busProgressPercentage, currentLocation, totalStops, nearestStopInfo, reachedIndices]);

    // Active Target: The index of the next stop the bus is looking for
    const targetStopIndex = useMemo(() => {
        return stopsStatus.findIndex(s => !s.isReached);
    }, [stopsStatus]);

    // "Out of Bounds" Logic: Check if the bus has already passed the student's stop
    const hasPassedUserStop = useMemo(() => {
        if (!boardingStopName || nearestStopInfo === null) return false;
        const boardingIdx = allStops.findIndex(s => s.name?.trim().toLowerCase() === boardingStopName.trim().toLowerCase());
        if (boardingIdx === -1) return false;
        
        // If the nearest stop index is greater than boarding index, bus has passed it
        return nearestStopInfo.index > boardingIdx;
    }, [boardingStopName, nearestStopInfo, allStops]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    const STOP_SPACING = isMobile ? 80 : 100; 
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
            boxShadow: '0 15px 50px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.08)',
        }}>
            {/* Live coordinates and status badge */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: currentLocation?.lat ? '#00d68f' : '#666', boxShadow: currentLocation?.lat ? '0 0 8px #00d68f' : 'none' }} />
                    <Typography variant="caption" sx={{ color: '#555', fontWeight: 700 }}>
                        Bus GPS: {currentLocation?.lat != null ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Searching...'}
                        {` (Stops with GPS: ${stopsWithCoords.length}/${totalStops})`}
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

                {isStationaryAtStart && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#fff9c4', color: '#fbc02d', px: 1.5, py: 0.5, borderRadius: '20px', width: 'fit-content', mt: 1, border: '1px solid #fbc02d' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 900 }}>
                            System Ready: Bus at Starting Point
                        </Typography>
                    </Box>
                )}

                {hasPassedUserStop && (
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#ffebee', color: '#d32f2f', px: 1.5, py: 0.8, borderRadius: '12px', width: 'fit-content', mt: 1, border: '1px solid #d32f2f', boxShadow: '0 2px 4px rgba(211, 47, 47, 0.2)' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 900 }}>
                            NOTICE: Bus has already passed your location
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
                {stopsStatus.map((stop, i) => {
                    const isBoardingStop =
                        boardingStopName &&
                        stop.name &&
                        stop.name.trim().toLowerCase() === boardingStopName.trim().toLowerCase();
                    
                    const topPct = (i / (totalStops - 1)) * 100;
                    const isFirst = i === 0;
                    const isLast = i === totalStops - 1;

                    // A stop is "Reached" (Blue Filled) if isReached is true
                    const isReached = stop.isReached;
                    // Current target is the first unreached stop
                    const isTarget = targetStopIndex === i;

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
                                width: isTarget ? 32 : 24,
                                height: isTarget ? 32 : 24,
                                borderRadius: '50%',
                                border: `4px solid ${isReached ? traceColor : (isTarget ? traceColor : '#000000')}`,
                                bgcolor: isReached ? traceColor : (isBoardingStop ? boardingBg : stopBg),
                                boxShadow: isTarget ? `0 0 15px ${traceColor}` : 'none',
                                zIndex: 4,
                                flexShrink: 0,
                                transition: 'all 0.4s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {isReached && (
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ffffff' }} />
                                )}
                            </Box>

                            {/* Label */}
                            <Box sx={{ ml: 4 }}>
                                <Typography sx={{
                                    fontSize: isTarget ? '16px' : '15px',
                                    fontWeight: (isBoardingStop || isFirst || isLast || isTarget) ? 900 : 500,
                                    color: isReached ? traceColor : (isTarget ? traceColor : '#222'),
                                    lineHeight: 1.3,
                                    transition: 'all 0.4s ease'
                                }}>
                                    {stop.name}
                                    {isFirst && <Typography component="span" sx={{ fontSize: '11px', color: '#888', ml: 1 }}>(Start)</Typography>}
                                    {isLast && <Typography component="span" sx={{ fontSize: '11px', color: '#888', ml: 1 }}>(End)</Typography>}
                                    {isTarget && (
                                        <Typography component="span" sx={{ fontSize: '12px', color: traceColor, ml: 1, fontWeight: 900, textTransform: 'uppercase' }}>
                                            • NEXT DESTINATION
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

            {/* Bottom padding */}
            <Box sx={{ height: 40 }} />
        </Box>
    );
};

export default LinearBusTracker;

