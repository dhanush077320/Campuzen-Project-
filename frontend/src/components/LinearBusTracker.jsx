import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const LinearBusTracker = ({ routeDetails, currentLocation, boardingStopName }) => {
    if (!routeDetails || !routeDetails.start || !routeDetails.end) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: '#666' }}>
                <Typography>Connecting to live tracking...</Typography>
            </Box>
        );
    }

    const { start, end, stops } = routeDetails;
    const allStops = [start, ...(stops || []), end];
    const totalStops = allStops.length;

    // Calculate bus position vertically (0% to 100%)
    const busProgressPercentage = useMemo(() => {
        if (!currentLocation || totalStops < 2) return 0;
        const busLat = currentLocation.lat;
        const busLng = currentLocation.lng;

        let closestSegmentIndex = 0;
        let minDistanceToSegment = Infinity;
        let fractionOnSegment = 0;

        for (let i = 0; i < totalStops - 1; i++) {
            const p1 = allStops[i];
            const p2 = allStops[i + 1];

            const d1 = getDistanceFromLatLonInKm(busLat, busLng, p1.lat, p1.lng);
            const d2 = getDistanceFromLatLonInKm(busLat, busLng, p2.lat, p2.lng);
            const segmentLength = getDistanceFromLatLonInKm(p1.lat, p1.lng, p2.lat, p2.lng);

            if (d1 + d2 < minDistanceToSegment) {
                minDistanceToSegment = d1 + d2;
                closestSegmentIndex = i;
                
                if (d1 === 0) fractionOnSegment = 0;
                else if (d2 === 0) fractionOnSegment = 1;
                else {
                    fractionOnSegment = d1 / (d1 + d2);
                }
            }
        }

        const segmentProgress = (closestSegmentIndex + fractionOnSegment) / (totalStops - 1);
        return Math.max(0, Math.min(100, (segmentProgress * 100)));
    }, [currentLocation, allStops, totalStops]);

    // UI Configuration to match reference
    const timelineColor = "#000000";
    const stopPointColor = "#ffffff";
    const highlightPointColor = "#000000";
    const highlightBadgeColor = "#e6f4ea"; // Light green
    const highlightBadgeText = "#1e8e3e";  // Darker green
    const busColor = "#2196f3"; // Blue

    return (
        <Box sx={{ width: '100%', py: 4, px: { xs: 2, sm: 6 }, bgcolor: '#ffffff', borderRadius: '24px', position: 'relative' }}>
            <Box sx={{ position: 'relative', ml: 2, height: `${(totalStops - 1) * 80}px` }}>
                <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: '11px',
                    width: '3px', 
                    bgcolor: timelineColor,
                    zIndex: 1
                }} />

                {currentLocation && (
                    <Box sx={{
                        position: 'absolute',
                        left: '12px',
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
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            border: '2px solid white'
                        }}>
                            <DirectionsBusIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box sx={{
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: `6px solid ${busColor}`,
                            mt: -0.5
                        }} />
                    </Box>
                )}

                {allStops.map((stop, i) => {
                    const isBoardingStop = boardingStopName && stop.name.trim().toLowerCase() === boardingStopName.trim().toLowerCase();
                    const topPercentage = (i / (totalStops - 1)) * 100;

                    return (
                        <Box key={i} sx={{
                            position: 'absolute',
                            top: `${topPercentage}%`,
                            left: 0,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            transform: 'translateY(-50%)',
                            zIndex: 2
                        }}>
                             <Box sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: `3px solid ${timelineColor}`,
                                bgcolor: isBoardingStop ? highlightPointColor : stopPointColor,
                                zIndex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }} />

                            <Box sx={{ ml: 4, display: 'flex', flexDirection: 'column' }}>
                                <Typography sx={{ 
                                    fontSize: '15px', 
                                    fontWeight: isBoardingStop ? 700 : 500, 
                                    color: '#333' 
                                }}>
                                    {stop.name}
                                </Typography>
                                
                                {isBoardingStop && (
                                    <Box sx={{
                                        display: 'inline-block',
                                        bgcolor: highlightBadgeColor,
                                        color: highlightBadgeText,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        mt: 0.5,
                                        width: 'fit-content'
                                    }}>
                                        Boarding stop
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default LinearBusTracker;
