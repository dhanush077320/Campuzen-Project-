import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Avatar, AppBar, Toolbar,
    IconButton, Switch, FormControlLabel,
    Grid, CircularProgress, Tooltip, Drawer,
    List, ListItemIcon, ListItemText, ListItemButton,
    Divider, Button, Container, Chip
} from '@mui/material';
import {
    AccountCircle, Notifications, ExitToApp,
    Menu as MenuIcon, DirectionsBus, Circle,
    Collections, RateReview, Event
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LinearBusTracker from './LinearBusTracker';

const dark = {
    bg: '#050a14',
    sidebar: '#0a0f1d',
    surface: 'rgba(15, 23, 42, 0.85)',
    surfaceSolid: '#0f172a',
    accent: '#ff3d71', // Dispatch Red
    accentBlue: '#3366ff',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    border: 'rgba(255,255,255,0.1)',
    success: '#00d68f',
    warning: '#ffaa00',
    danger: '#ff3d71',
};

const DriverDashboard = () => {
    const [view, setView] = useState('map'); // 'map', 'gallery', 'feedback', 'profile'
    const [user, setUser] = useState(null);
    const [isDutyOn, setIsDutyOn] = useState(false);
    const [status, setStatus] = useState('Standby');
    const [routeDetails, setRouteDetails] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [feedbackData, setFeedbackData] = useState({ message: '' });
    const navigate = useNavigate();

    const geocodeAddress = async (address) => {
        if (!address) return null;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
                headers: { 'Accept-Language': 'en' }
            });
            if (res.data && res.data.length > 0) {
                return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon), name: address };
            }
        } catch (e) { console.error('Geocode error:', e); }
        return null;
    };

    const fetchRouteGeometry = async (points) => {
        if (!points || points.length < 2) return points;
        try {
            const coordsString = points.map(p => `${p[1]},${p[0]}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
            const response = await axios.get(url);
            if (response.data.routes && response.data.routes[0]) {
                return response.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (error) {
            console.error("Routing error:", error);
        }
        return points; // Fallback to straight lines
    };
    
    const [galleryItems, setGalleryItems] = useState([]);

    const [currentLocation, setCurrentLocation] = useState(null);

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'driver') {
            navigate('/login');
        } else {
            fetchUserProfile(loggedInUser.username);
        }
    }, [navigate]);

    const fetchUserProfile = async (username) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${username}`);
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            const loggedInUser = JSON.parse(localStorage.getItem('user'));
            setUser(loggedInUser);
        }
    };

    useEffect(() => {
        if (view === 'gallery') fetchGallery();
    }, [view]);

    const fetchGallery = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/gallery`);
            setGalleryItems(response.data);
        } catch (error) {
            console.error('Error fetching gallery:', error);
        }
    };

    // Remove Map Initialization - using LinearBusTracker instead
    useEffect(() => {
        // Standard Geocode Hydration for UI and Tracker
        const hydrateCoordinates = async () => {
            if (!user) return;
            
            // If already geocoded in this session, skip
            if (routeDetails && 
                routeDetails.start?.name === user.startingPoint && 
                routeDetails.end?.name === user.endPoint) return;

            let start = user.startingPointCoords;
            let end = user.endPointCoords;
            let stops = user.stopCoords || [];

            if (!start && user.startingPoint) start = await geocodeAddress(user.startingPoint);
            if (!end && user.endPoint) end = await geocodeAddress(user.endPoint);

            if ((!stops || stops.length === 0) && user.stops?.length > 0) {
                const geocoded = await Promise.all(
                    user.stops.filter(s => s && s.trim()).map(async (s) => {
                        const c = await geocodeAddress(s);
                        return c ? { ...c, name: s } : null;
                    })
                );
                stops = geocoded.filter(Boolean);
            }

            setRouteDetails({
                start: start ? { ...start, name: user.startingPoint } : null,
                end: end ? { ...end, name: user.endPoint } : null,
                stops: stops
            });
        };

        hydrateCoordinates();
    }, [user]);




    const activeUserRef = useRef(null);
    useEffect(() => {
        activeUserRef.current = user;
    }, [user]);

    const watchIdRef = useRef(null);

    const startTracking = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        // Snap to current location immediately
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            // Sync immediately so others see the bus online right away
            const currentUser = activeUserRef.current || user;
            if (currentUser && currentUser.username) {
                axios.post(`${import.meta.env.VITE_API_URL}/api/users/update-location`, {
                    username: currentUser.username,
                    latitude,
                    longitude,
                    isOnline: true
                }).catch(err => console.error("Initial sync error:", err));
            }
        }, (err) => console.error("Initial snap error:", err));

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ lat: latitude, lng: longitude });

                // Sync with backend
                const currentUser = activeUserRef.current || user;
                if (currentUser && currentUser.username) {
                    axios.post(`${import.meta.env.VITE_API_URL}/api/users/update-location`, {
                        username: currentUser.username,
                        latitude,
                        longitude,
                        isOnline: true
                    }).catch(err => console.error("Sync error:", err));
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                if (error.code === 1) {
                    alert("Please allow location access to use Duty Mode.");
                } else if (error.code === 2) {
                    console.warn("Location unavailable right now.");
                } else if (error.code === 3) {
                    console.warn("Location request timed out. Retrying...");
                }
            },
            // Increased timeout and maximumAge for better stability on mobile
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        // Mark as offline using the latest user from ref
        const currentUser = activeUserRef.current || user;
        if (currentUser && currentUser.username) {
            axios.post(`${import.meta.env.VITE_API_URL}/api/users/update-location`, {
                username: currentUser.username,
                isOnline: false
            }).catch(err => console.error("Offline sync error:", err));
        }
    };

    useEffect(() => {
        return () => stopTracking();
    }, []);

    const handleDutyChange = (event) => {
        const checked = event.target.checked;
        setIsDutyOn(checked);
        setStatus(checked ? 'Active' : 'Standby');
        
        if (checked) {
            startTracking();
        } else {
            stopTracking();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                senderUsername: user.username,
                senderFullName: user.fullName,
                senderRole: 'Driver',
                category: feedbackData.category,
                message: feedbackData.message
            };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/feedbacks`, payload);
            alert('Feedback submitted successfully!');
            setFeedbackData({ ...feedbackData, message: '' });
            setView('map');
        } catch (error) {
            console.error('Feedback Error:', error);
            alert('Failed to submit feedback. Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const renderOverlayContent = () => {
        if (view === 'map') return null;

        return (
            <Box sx={{ 
                position: 'absolute', 
                top: 80, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 20, 
                bgcolor: 'rgba(5, 10, 20, 0.9)', 
                backdropFilter: 'blur(20px)',
                display: 'flex',
                justifyContent: 'center',
                overflowY: 'auto',
                p: { xs: 2, md: 4 }
            }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: dark.accent, textTransform: 'uppercase' }}>
                            {view} Portal
                        </Typography>
                        <Button onClick={() => setView('map')} sx={{ color: dark.textSecondary, fontWeight: 900 }}>Back to Terminal</Button>
                    </Box>

                    {view === 'gallery' && (
                        <Grid container spacing={3}>
                            {galleryItems.map((item) => (
                                <Grid item xs={12} sm={6} md={4} key={item._id}>
                                    <Paper sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, overflow: 'hidden' }}>
                                        {item.fileType?.startsWith('image/') ? (
                                            <img src={item.fileData} alt={item.eventName} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                        ) : (
                                            <Box sx={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.05)' }}>
                                                <Event sx={{ fontSize: 60, color: dark.accent }} />
                                            </Box>
                                        )}
                                        <Box sx={{ p: 2 }}>
                                            <Typography variant="h6" sx={{ color: dark.text, fontWeight: 700 }}>{item.eventName}</Typography>
                                            <Button variant="outlined" size="small" href={item.fileData} download sx={{ mt: 2, color: dark.accentBlue, borderColor: dark.accentBlue, borderRadius: '8px' }}>Download</Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {view === 'feedback' && (
                        <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, maxWidth: 600, mx: 'auto' }}>
                             <form onSubmit={handleFeedbackSubmit}>
                                <Typography sx={{ color: dark.textSecondary, mb: 2, fontWeight: 700 }}>TO: COLLEGE ADMINISTRATION</Typography>
                                <textarea
                                    placeholder="Enter your message regarding transport or campus issues..."
                                    required
                                    rows={8}
                                    value={feedbackData.message}
                                    onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                                    style={{
                                        width: '100%', backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${dark.border}`, borderRadius: '12px',
                                        color: 'white', padding: '16px', fontFamily: 'inherit',
                                        fontSize: '1rem', outline: 'none', resize: 'none', marginBottom: '20px'
                                    }}
                                />
                                <Button fullWidth variant="contained" type="submit" sx={{ bgcolor: dark.accent, py: 1.5, fontWeight: 900, borderRadius: '12px' }}>SEND FEEDBACK</Button>
                             </form>
                        </Paper>
                    )}

                    {view === 'profile' && (
                        <Paper elevation={24} sx={{ p: 0, borderRadius: '40px', bgcolor: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${dark.border}`, maxWidth: 800, mx: 'auto', overflow: 'hidden', backdropFilter: 'blur(40px)', boxShadow: `0 40px 100px rgba(0,0,0,0.8)` }}>
                             {/* Profile Header Background */}
                             <Box sx={{ height: 140, background: `linear-gradient(45deg, ${dark.accent}, ${dark.accentBlue})`, position: 'relative' }}>
                                <Box sx={{ position: 'absolute', bottom: -70, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                                    <Avatar src={user?.photo} sx={{ width: 140, height: 140, border: '6px solid #0f172a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                                </Box>
                             </Box>

                             <Box sx={{ pt: 10, pb: 6, px: { xs: 3, md: 6 }, textAlign: 'center' }}>
                                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{user?.fullName || 'Active Driver'}</Typography>
                                <Typography variant="h6" sx={{ color: dark.accent, fontWeight: 900, mb: 5, letterSpacing: '3px', textTransform: 'uppercase' }}>DISPATCHER ID: #{user?.username || 'DRIVER_01'}</Typography>
                                
                                <Grid container spacing={3} sx={{ textAlign: 'left' }}>
                                    {[
                                        { label: 'REGISTERED EMAIL', value: user?.email, icon: <Notifications />, color: '#ffd700' },
                                        { label: 'PRIMARY CONTACT', value: user?.phoneNumber, icon: <Notifications />, color: '#00ffcc' },
                                        { label: 'ASSIGNED UNIT', value: `#BUS-${user?.busNumber?.toString().padStart(2, '0')}`, icon: <DirectionsBus />, color: dark.accentBlue },
                                        { label: 'SERVICE ROLE', value: 'CAMPUS LOGISTICS / DRIVER', icon: <AccountCircle />, color: dark.success }
                                    ].map((info, idx) => (
                                        <Grid item xs={12} sm={6} key={idx}>
                                            <Paper elevation={0} sx={{ p: 3, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.05)`, transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)', bgcolor: 'rgba(255,255,255,0.06)' } }}>
                                                <Typography variant="overline" sx={{ color: info.color, fontWeight: 900, letterSpacing: '2px', display: 'block', mb: 1.5, fontSize: '0.75rem' }}>{info.label}</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', wordBreak: 'break-word', letterSpacing: '0.5px' }}>{info.value || 'DATA NOT SYNCED'}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
                                <Typography variant="h6" sx={{ color: dark.accent, fontWeight: 900, mb: 3, textTransform: 'uppercase' }}>Assigned Route Information</Typography>
                                <Grid container spacing={3}>
                                    {[
                                        { label: 'STARTING POINT', value: user?.startingPoint, coords: routeDetails?.start, color: '#4dabf5' },
                                        { label: 'NEXT DESTINATION', value: user?.nextDestination, coords: null, color: '#ff9800' }, // Next dest is dynamic, typically same as a stop or end
                                        { label: 'END POINT', value: user?.endPoint, coords: routeDetails?.end, color: '#f44336' }
                                    ].map((route, idx) => (
                                        <Grid item xs={12} sm={4} key={idx}>
                                            <Paper sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${dark.border}`, minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <Typography variant="caption" sx={{ color: route.color, fontWeight: 900, mb: 0.5 }}>{route.label}</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 800, color: 'white', mb: route.coords ? 0.5 : 0 }}>{route.value || 'N/A'}</Typography>
                                                {route.coords && (
                                                    <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 700, fontStyle: 'italic' }}>
                                                        {route.coords.lat.toFixed(4)}, {route.coords.lng.toFixed(4)}
                                                    </Typography>
                                                )}
                                            </Paper>
                                        </Grid>
                                    ))}
                                    {user?.stops?.length > 0 && (
                                        <Grid item xs={12}>
                                             <Paper sx={{ p: 2, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${dark.border}` }}>
                                                <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 900 }}>PLANNED STOPS</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                                    {user.stops.map((stop, i) => {
                                                        const stopCoords = routeDetails?.stops?.find(s => s.name === stop);
                                                        return (
                                                            <Chip 
                                                                key={i} 
                                                                label={`${stop}${stopCoords ? ` (${stopCoords.lat.toFixed(3)}, ${stopCoords.lng.toFixed(3)})` : ''}`} 
                                                                size="small" 
                                                                sx={{ 
                                                                    bgcolor: 'rgba(124, 77, 255, 0.12)', 
                                                                    color: dark.accent, 
                                                                    fontWeight: 800, 
                                                                    height: 'auto',
                                                                    py: 0.5,
                                                                    px: 1,
                                                                    '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                                                                    border: '1px solid rgba(124, 77, 255, 0.3)' 
                                                                }} 
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}
                                </Grid>
                             </Box>
                        </Paper>
                    )}
                    <Box sx={{ height: 100 }} /> {/* Spacer for bottom bar */}
                </Container>
            </Box>
        );
    };

    const sidebar = (
        <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{
                sx: { width: 300, bgcolor: dark.sidebar, borderRight: `2px solid ${dark.border}`, p: 3, backgroundImage: 'none' }
            }}
        >
            <Box sx={{ mb: 6, mt: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: dark.accent, letterSpacing: '2px' }}>CAMPUZEN</Typography>
                <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 800 }}>DISPATCH CONTROL</Typography>
            </Box>
            
            <List sx={{ px: 0 }}>
                {[
                    { text: 'Map Terminal', icon: <DirectionsBus />, val: 'map' },
                    { text: 'Event Gallery', icon: <Collections />, val: 'gallery' },
                    { text: 'Feedback Portal', icon: <RateReview />, val: 'feedback' },
                    { text: 'Driver Profile', icon: <AccountCircle />, val: 'profile' },
                ].map((item) => (
                    <ListItemButton
                        key={item.text}
                        onClick={() => { setView(item.val); setDrawerOpen(false); }}
                        sx={{
                            borderRadius: '16px', mb: 2, py: 1.5,
                            bgcolor: view === item.val ? 'rgba(255, 61, 113, 0.15)' : 'transparent',
                            color: view === item.val ? dark.accent : dark.textSecondary,
                            border: `1px solid ${view === item.val ? 'rgba(255, 61, 113, 0.3)' : 'transparent'}`,
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', color: dark.text }
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 45 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 900, fontSize: '0.95rem' }} />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ mt: 'auto', p: 0 }}>
                <Divider sx={{ borderColor: dark.border, mb: 3 }} />
                <Button 
                    fullWidth 
                    variant="outlined"
                    onClick={handleLogout} 
                    startIcon={<ExitToApp />} 
                    sx={{ color: dark.danger, borderColor: dark.danger, fontWeight: 900, py: 1.5, borderRadius: '12px', '&:hover': { bgcolor: 'rgba(255, 61, 113, 0.1)' } }}
                >
                    EXIT SYSTEM
                </Button>
            </Box>
        </Drawer>
    );

    return (
        <Box sx={{ 
            height: '100vh', 
            width: '100vw', 
            overflow: 'hidden', 
            position: 'relative', 
            bgcolor: dark.bg,
            fontFamily: "'Inter', sans-serif",
            color: dark.text
        }}>
            {/* Dark Background */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: dark.bg, zIndex: 0 }} />

            {/* Sidebar Component */}
            {sidebar}

            {/* Top Bar (Header) */}
            <AppBar position="absolute" elevation={0} sx={{ background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.85))', backdropFilter: 'blur(15px)', borderBottom: `1px solid ${dark.border}`, zIndex: 10 }}>
                <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: dark.accent, bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            <MenuIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: '1.5px', textTransform: 'uppercase' }}>CAMPUZEN TERMINAL</Typography>
                            <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{status} | UNIT CONTROL</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 4 } }}>
                        <FormControlLabel
                            control={<Switch checked={isDutyOn} onChange={handleDutyChange} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: dark.success }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: dark.success } }} />}
                            label={<Typography sx={{ fontWeight: 900, fontSize: '0.8rem', color: isDutyOn ? dark.success : dark.textSecondary, letterSpacing: '1px' }}>DUTY MODE</Typography>}
                            labelPlacement="start"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Notifications"><IconButton sx={{ color: dark.text, bgcolor: 'rgba(255,255,255,0.05)' }}><Notifications /></IconButton></Tooltip>
                            <Avatar src={user?.photo} sx={{ bgcolor: dark.accent, cursor: 'pointer', border: `2px solid ${dark.border}` }} onClick={() => setView('profile')}><AccountCircle /></Avatar>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {view === 'map' && (
                <Box sx={{ 
                    position: { xs: 'relative', md: 'absolute' }, 
                    top: { xs: 80, md: 100 }, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    overflowY: 'auto', 
                    p: { xs: 2, md: 3 }, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', lg: 'row' },
                    alignItems: { xs: 'center', lg: 'flex-start' },
                    justifyContent: 'center',
                    gap: 4
                }}>
                    <Container maxWidth="lg" sx={{ 
                        position: 'relative', 
                        mx: { xs: 0, lg: 'auto' },
                        mt: { xs: 2, md: 0 }
                    }}>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 900, 
                            mb: 4, 
                            color: '#fff', 
                            textTransform: 'uppercase',
                            fontSize: { xs: '1.5rem', md: '2.125rem' } 
                        }}>
                            Live Itinerary Tracker 
                        </Typography>
                        
                        <Box sx={{ 
                            mb: 4,
                            maxHeight: { xs: 'none', md: '75vh' },
                            overflowY: 'auto',
                            // Custom Scrollbar
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                        }}>
                            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                                <LinearBusTracker 
                                    routeDetails={routeDetails} 
                                    currentLocation={currentLocation}
                                    trackedBus={user}
                                />
                            </Box>
                        </Box>

                        {/* Mobile view info card (Moved inside the flow for mobile) */}
                        {isDutyOn && user && (
                            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
                                {/* Render the sidebar content here for mobile */}
                                <Paper elevation={24} sx={{ 
                                    p: 3, 
                                    borderRadius: '24px', 
                                    bgcolor: 'rgba(15, 23, 42, 0.95)', 
                                    border: `1px solid ${dark.border}`, 
                                    backdropFilter: 'blur(15px)'
                                }}>
                                    <Typography variant="overline" sx={{ color: dark.accent, fontWeight: 900, letterSpacing: '2px' }}>LIVE ITINERARY</Typography>
                                    <Divider sx={{ my: 1.5, borderColor: dark.border }} />
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" sx={{ color: dark.accent, fontWeight: 800, display: 'block' }}>STARTING POINT</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 900, color: dark.text }}>{user.startingPoint || 'NOT SET'}</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 800, display: 'block' }}>NEXT DESTINATION</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 900, color: dark.text }}>{user.nextDestination || 'NOT SET'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: dark.success, fontWeight: 800, display: 'block' }}>END POINT</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 900, color: dark.text }}>{user.endPoint || 'NOT SET'}</Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                        
                        <Box sx={{ height: { xs: 100, md: 200 } }} /> 
                    </Container>
                </Box>
            )}

            {/* Desktop Floating Sidebar - Hidden on search/mobile */}
            {isDutyOn && user && view === 'map' && (
                <Box sx={{ 
                    position: 'absolute', 
                    top: 100, 
                    right: 30, 
                    bottom: 150, 
                    zIndex: 10, 
                    width: 320,
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column'
                }}>
                    <Paper elevation={24} sx={{ 
                        p: 3, 
                        borderRadius: '24px', 
                        bgcolor: 'rgba(15, 23, 42, 0.95)', 
                        border: `1px solid ${dark.border}`, 
                        backdropFilter: 'blur(15px)',
                        flex: 1,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
                    }}>
                        <Typography variant="overline" sx={{ color: dark.accent, fontWeight: 900, letterSpacing: '2px' }}>LIVE ITINERARY</Typography>
                        <Divider sx={{ my: 1.5, borderColor: dark.border }} />
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: dark.accent, fontWeight: 800, display: 'block' }}>STARTING POINT</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: dark.text }}>{user.startingPoint || 'NOT SET'}</Typography>
                            {routeDetails?.start && (
                                <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 700, opacity: 0.8 }}>
                                    COORD: {routeDetails.start.lat.toFixed(4)}, {routeDetails.start.lng.toFixed(4)}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 800, display: 'block' }}>NEXT DESTINATION</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: dark.text }}>{user.nextDestination || 'NOT SET'}</Typography>
                        </Box>

                        {user.stops && user.stops.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 800, display: 'block' }}>PLANNED STOPS</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                    {user.stops.map((stop, i) => {
                                        const stopCoords = routeDetails?.stops?.find(s => s.name === stop);
                                        return (
                                            <Box key={i} sx={{ borderLeft: `2px solid ${dark.border}`, pl: 2, py: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: dark.textSecondary, display: 'flex', alignItems: 'center' }}>
                                                    {stop}
                                                </Typography>
                                                {stopCoords && (
                                                    <Typography variant="caption" sx={{ color: dark.textSecondary, fontSize: '0.65rem', fontStyle: 'italic', display: 'block', opacity: 0.6 }}>
                                                        {stopCoords.lat.toFixed(4)}, {stopCoords.lng.toFixed(4)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}

                        <Box>
                            <Typography variant="caption" sx={{ color: dark.success, fontWeight: 800, display: 'block' }}>END POINT</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: dark.text }}>{user.endPoint || 'NOT SET'}</Typography>
                            {routeDetails?.end && (
                                <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 700, opacity: 0.8 }}>
                                    COORD: {routeDetails.end.lat.toFixed(4)}, {routeDetails.end.lng.toFixed(4)}
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Overlay Content (Gallery, Feedback, Profile) */}
            {renderOverlayContent()}

            {/* Bottom Status Bar */}
            <Box sx={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: 'auto', minWidth: { xs: '90%', sm: 450 } }}>
                <Paper elevation={24} sx={{ px: 8, py: 2.5, borderRadius: '100px', bgcolor: dark.surfaceSolid, border: `1px solid ${dark.border}`, textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.7)', transition: 'all 0.3s ease' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '8px', color: isDutyOn ? dark.success : dark.danger, textShadow: isDutyOn ? `0 0 20px ${dark.success}55` : 'none' }}>
                        SYSTEM {isDutyOn ? 'ONLINE' : 'OFFLINE'}
                    </Typography>
                </Paper>
            </Box>

            <style>
                {`
                    .dispatch-tooltip { background: rgba(15, 23, 42, 0.98) !important; border: 1px solid rgba(255,255,255,0.15) !important; color: white !important; font-weight: 900 !important; font-size: 11px !important; letter-spacing: 1.5px !important; padding: 4px 12px !important; border-radius: 6px !important; box-shadow: 0 10px 15px rgba(0,0,0,0.4) !important; }
                    .dispatch-tooltip::before { border-top-color: rgba(15, 23, 42, 0.98) !important; }
                    .stop-tooltip { background: #000000 !important; border: 1px solid white !important; color: white !important; font-weight: 800 !important; font-size: 10px !important; border-radius: 4px !important; padding: 2px 8px !important; }
                    .stop-label-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; color: #333 !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 3px white, 0 0 3px white, 0 0 5px white !important; letter-spacing: 0.5px !important; white-space: nowrap !important; }
                    .stop-label-tooltip::before { display: none !important; }
                `}
            </style>
        </Box>
    );
};

export default DriverDashboard;
