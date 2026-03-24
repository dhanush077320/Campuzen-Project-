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

    // 1. The "Track Progress" Logic
    const busProgressPercentage = useMemo(() => {
        const loc = currentLocation;
        if (!loc || !loc.lat || !loc.lng || isNaN(loc.lat) || isNaN(loc.lng)) return null;
        if (totalStops < 2 || !hasEnds) return null;

        // Total Distance of the route (Start to End)
        const totalRouteDistance = getDistanceFromLatLonInKm(startStop.lat, startStop.lng, endStop.lat, endStop.lng);
        // Distance from Start to Current
        const distanceFromStart = getDistanceFromLatLonInKm(startStop.lat, startStop.lng, loc.lat, loc.lng);

        if (totalRouteDistance === 0) return 0;
        
        // Output: A percentage (Progress %)
        const percentage = (distanceFromStart / totalRouteDistance) * 100;
        return Math.max(0, Math.min(100, percentage));
    }, [currentLocation, totalStops, hasEnds, startStop, endStop]);

    // 2. The "Geofence" Logic (Auto-Fill Stops & Index-Based Completion)
    const stopsStatus = useMemo(() => {
        // Find nearest stop for Index-Based Completion
        const nearestIdx = nearestStopInfo ? nearestStopInfo.index : -1;

        return allStops.map((stop, idx) => {
            const stopProgressPct = (idx / (totalStops - 1)) * 100;
            
            // "Fill-Behind" Rule: Automatically mark all stops before Current Stop index as completed
            let isReached = false;
            
            if (idx <= nearestIdx && nearestIdx !== -1) {
                isReached = true;
            } else if (busProgressPercentage !== null && busProgressPercentage >= stopProgressPct) {
                isReached = true;
            } else if (currentLocation?.lat != null && stop.lat != null) {
                const dist = getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, stop.lat, stop.lng);
                if (dist < 0.1) isReached = true; 
            }
            
            return { ...stop, isReached };
        });
    }, [allStops, busProgressPercentage, currentLocation, totalStops, nearestStopInfo]);

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

