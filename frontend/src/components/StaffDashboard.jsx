import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItemIcon, ListItemText,
    Typography, Container, Paper, Avatar, AppBar, Toolbar,
    IconButton, Menu, MenuItem, Divider, Button, ListItemButton,
    Grid, TextField, FormControl, InputLabel, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import {
    CloudUpload, Dashboard, AdminPanelSettings, ExitToApp,
    AccountCircle, Notifications, RateReview, History, CalendarToday,
    Collections, Event, AccountBalanceWallet, Menu as MenuIcon,
    DirectionsBus, Search
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const drawerWidth = 240;

const dark = {
    bg: '#0a0e1a',
    sidebar: '#0f1425',
    surface: '#151a2e',
    surfaceHover: '#1c2240',
    accent: '#7c4dff',
    accentFaded: 'rgba(124, 77, 255, 0.12)',
    text: '#e8eaed',
    textSecondary: '#9aa0b0',
    border: 'rgba(255,255,255,0.06)',
    danger: '#ff5252',
};

const textFieldDarkSx = {
    '& .MuiOutlinedInput-root': {
        color: dark.text,
        '& fieldset': { borderColor: dark.border },
        '&:hover fieldset': { borderColor: dark.accent },
        '&.Mui-focused fieldset': { borderColor: dark.accent },
    },
    '& .MuiInputLabel-root': { color: dark.textSecondary },
    '& .MuiInputLabel-root.Mui-focused': { color: dark.accent },
};

const selectDarkSx = {
    '& .MuiOutlinedInput-root': {
        color: dark.text,
        '& fieldset': { borderColor: dark.border },
        '&:hover fieldset': { borderColor: dark.accent },
        '&.Mui-focused fieldset': { borderColor: dark.accent },
    },
    '& .MuiInputLabel-root': { color: dark.textSecondary },
    '& .MuiInputLabel-root.Mui-focused': { color: dark.accent },
    '& .MuiSvgIcon-root': { color: dark.textSecondary },
};

const StaffDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    // Attendance view state
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);
    const [salaryRecords, setSalaryRecords] = useState([]);

    // Bus Tracking State
    const [busNumberInput, setBusNumberInput] = useState('');
    const [trackedBus, setTrackedBus] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const trackingMapRef = React.useRef(null);
    const trackingMarkerRef = React.useRef(null);
    const trackingIntervalRef = React.useRef(null);

    // Feedback state
    const [feedbackData, setFeedbackData] = useState({
        category: 'Academic',
        message: ''
    });

    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'staff') {
            navigate('/login');
        } else {
            setUser(loggedInUser);
        }
    }, [navigate]);

    useEffect(() => {
        if (view === 'gallery') {
            fetchGallery();
        }
        if (view === 'salary') {
            fetchSalary();
        }
    }, [view]);

    const fetchGallery = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/gallery`);
            setGalleryItems(response.data);
        } catch (error) {
            console.error('Error fetching gallery:', error);
        }
    };

    const fetchBusLocation = async (busNo) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/bus-location/${busNo}`);
            const data = response.data;
            setTrackedBus(data);
            
            if (trackingMarkerRef.current && trackingMapRef.current) {
                const newPos = [data.latitude, data.longitude];
                trackingMarkerRef.current.setLatLng(newPos);
                trackingMapRef.current.panTo(newPos, { animate: true });
            }
        } catch (error) {
            console.error("Tracking Error:", error);
            alert(error.response?.data?.message || "Bus not found or offline");
            stopBusTracking();
        }
    };

    useEffect(() => {
        const hydrateRoute = async () => {
            if (!trackedBus) {
                setRouteDetails(null);
                return;
            }

            const geocodeAddress = async (address) => {
                if (!address) return null;
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, { headers: { 'Accept-Language': 'en' } });
                    if (res.data && res.data.length > 0) return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon), name: address };
                } catch (e) { console.error('Geocode error:', e); }
                return null;
            };

            let start = trackedBus.startingPointCoords;
            let end = trackedBus.endPointCoords;
            let stops = trackedBus.stopCoords || [];

            if (!start && trackedBus.startingPoint) start = await geocodeAddress(trackedBus.startingPoint);
            if (!end && trackedBus.endPoint) end = await geocodeAddress(trackedBus.endPoint);

            if ((!stops || stops.length === 0) && trackedBus.stops?.length > 0) {
                const geocoded = await Promise.all(
                    trackedBus.stops.filter(s => s && s.trim()).map(async (s) => {
                        const c = await geocodeAddress(s);
                        return c ? { ...c, name: s } : null;
                    })
                );
                stops = geocoded.filter(Boolean);
            }

            setRouteDetails({
                start: start ? { ...start, name: trackedBus.startingPoint || 'Start' } : null,
                end: end ? { ...end, name: trackedBus.endPoint || 'End' } : null,
                stops: stops
            });
        };

        hydrateRoute();
    }, [trackedBus]);

    const startBusTracking = () => {
        if (!busNumberInput) return;
        fetchBusLocation(busNumberInput); // Initial fetch
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = setInterval(() => {
            fetchBusLocation(busNumberInput);
        }, 5000); 
    };

    const stopBusTracking = () => {
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }
        setTrackedBus(null);
        trackingMapRef.current = null;
        trackingMarkerRef.current = null;
    };

    useEffect(() => {
        if (trackedBus && !trackingMapRef.current) {
            const L = window.L;
            setTimeout(() => {
                const container = document.getElementById('tracking-map');
                if (!container || trackingMapRef.current) return;

                const map = L.map(container, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([trackedBus.latitude, trackedBus.longitude], 16);

                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20
                }).addTo(map);

                const busIcon = L.divIcon({
                    html: `<div style="background-color: #3366ff; border: 2px solid white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M18,11H6V6h12V11z M16.5,17c0.83,0,1.5-0.67,1.5-1.5S17.33,14,16.5,14S15,14.67,15,15.5S15.67,17,16.5,17z M7.5,17 c0.83,0,1.5-0.67,1.5-1.5S8.33,14,7.5,14S6,14.67,6,15.5S6.67,17,7.5,17z M4,16c0,0.88,0.39,1.67,1,2.22V20c0,0.55,0.45,1,1,1h1 c0.55,0,1-0.45,1-1v-1h8v1c0,0.55,0.45,1,1,1h1c0.55,0,1-0.45,1-1v-1.78c0.61-0.55,1-1.34,1-2.22V6c0-3.5-3.58-4-8-4s-8,0.5-8,4V16z" />
                            </svg>
                           </div>`,
                    className: 'custom-bus-marker',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                trackingMarkerRef.current = L.marker([trackedBus.latitude, trackedBus.longitude], { icon: busIcon }).addTo(map);
                trackingMapRef.current = map;

                // Draw Route and Stops
                if (routeDetails?.start && routeDetails?.end) {
                    const drawRoute = async () => {
                        const routePoints = [
                            [routeDetails.start.lat, routeDetails.start.lng],
                            ...routeDetails.stops.map(s => [s.lat, s.lng]),
                            [routeDetails.end.lat, routeDetails.end.lng]
                        ];

                        let roadPath = routePoints;
                        try {
                            const coordsString = routePoints.map(p => `${p[1]},${p[0]}`).join(';');
                            const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
                            const response = await axios.get(url);
                            if (response.data.routes && response.data.routes[0]) {
                                roadPath = response.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                            }
                        } catch (e) { console.error('Routing error:', e); }

                        if (!trackingMapRef.current) return;

                        // Clear old route layers
                        trackingMapRef.current.eachLayer((layer) => {
                            if ((layer instanceof window.L.Polyline && !(layer instanceof window.L.Polygon) && !(layer instanceof window.L.CircleMarker)) || layer instanceof window.L.CircleMarker) {
                                trackingMapRef.current.removeLayer(layer);
                            }
                        });


                        const routeLine = window.L.polyline(roadPath, { color: '#000000', weight: 7, opacity: 1, lineJoin: 'round', lineCap: 'round' }).addTo(trackingMapRef.current);
                        trackingMapRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

                        const allPoints = [routeDetails.start, ...routeDetails.stops, routeDetails.end];

                        allPoints.forEach((point) => {
                            const circle = window.L.circleMarker([point.lat, point.lng], {
                                radius: 9, fillColor: '#ffffff', fillOpacity: 1, color: '#000000', weight: 3
                            }).addTo(trackingMapRef.current);
                            circle.bindTooltip(`<div style="color:#222;font-weight:800;font-size:13px;text-shadow:0 0 3px white,0 0 3px white;">${point.name}</div>`, {
                                permanent: true, direction: 'right', className: 'stop-label-tooltip', offset: [15, 0]
                            });
                        });
                    };

                    drawRoute();
                }
            }, 100);
        }
    }, [trackedBus]);

    useEffect(() => {
        return () => stopBusTracking();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fetchAttendance = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/faculty-attendance/${user.username}`, {
                params: dateRange
            });
            setAttendanceRecords(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const fetchSalary = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/salary/staff/${user.username}`);
            setSalaryRecords(response.data);
        } catch (error) {
            console.error('Error fetching salary:', error);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                senderUsername: user.username,
                senderFullName: user.fullName,
                senderRole: 'Staff',
                category: feedbackData.category,
                message: feedbackData.message
            };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/feedbacks`, payload);
            alert('Feedback submitted successfully to College Admin!');
            setFeedbackData({ ...feedbackData, message: '' });
        } catch (error) {
            alert('Failed to submit feedback');
        }
    };

    const renderDashboard = () => (
        <Paper sx={{ p: 5, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: dark.accent, mb: 2 }}>
                Welcome, {user?.fullName || 'Staff Member'}!
            </Typography>
            <Typography variant="body1" sx={{ color: dark.textSecondary }}>
                Staff operations management system is ready.
            </Typography>
        </Paper>
    );

    const renderAttendance = () => {
        const totalDays = attendanceRecords.length;
        const attendedDaysCount = attendanceRecords.reduce((acc, r) => {
            if (r.status === 'Present') return acc + 1;
            if (r.status === 'Half day') return acc + 0.5;
            return acc;
        }, 0);
        const percentage = totalDays > 0 ? ((attendedDaysCount / totalDays) * 100).toFixed(1) : 0;

        return (
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                    Attendance Analytics
                </Typography>

                <Grid container spacing={4} sx={{ mb: 6 }}>
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                            <Grid container spacing={3} alignItems="flex-end">
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="From Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="To Date"
                                        InputLabelProps={{ shrink: true }}
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<History />}
                                        onClick={fetchAttendance}
                                        sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                                    >
                                        View Log
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                {attendanceRecords.length > 0 ? (
                    <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                                     <TableCell>Date</TableCell>
                                    <TableCell>Time</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Logged By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendanceRecords.slice().reverse().map((record) => (
                                    <TableRow key={record._id} sx={{ '& td': { borderColor: dark.border } }}>
                                         <TableCell sx={{ color: dark.text, fontWeight: 600 }}>
                                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </TableCell>
                                        <TableCell sx={{ color: dark.accent, fontWeight: 700 }}>{record.time || '—'}</TableCell>
                                        <TableCell>
                                             <Chip
                                                label={record.status}
                                                sx={{
                                                    bgcolor: record.status === 'Present' ? 'rgba(76, 175, 80, 0.15)' :
                                                             record.status === 'Half day' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                                                    color: record.status === 'Present' ? '#4caf50' :
                                                           record.status === 'Half day' ? '#ff9800' : '#ff5252',
                                                    fontWeight: 800
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: dark.textSecondary }}>System Admin</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Paper sx={{ p: 8, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
                        <Typography sx={{ color: dark.textSecondary }}>No attendance records found for this period.</Typography>
                    </Paper>
                )}
            </Box>
        );
    };

    const renderFeedback = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Feedback Portal
            </Typography>
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ mb: 3, color: dark.text }}>Submit your feedback to College Admin</Typography>
                <form onSubmit={handleFeedbackSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Feedback Category</InputLabel>
                                <Select
                                    label="Feedback Category"
                                    value={feedbackData.category}
                                    onChange={(e) => setFeedbackData({ ...feedbackData, category: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="Academic">Academic Related</MenuItem>
                                    <MenuItem value="Non-Academic">Non-Academic Related</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Your Feedback Message"
                                required
                                multiline
                                rows={6}
                                value={feedbackData.message}
                                onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={12}>
                            <Button
                                variant="contained"
                                type="submit"
                                size="large"
                                startIcon={<RateReview />}
                                sx={{ backgroundColor: dark.accent, px: 4, py: 1.5, borderRadius: '12px', fontWeight: 'bold', '&:hover': { backgroundColor: '#6a3de8' } }}
                            >
                                Submit Feedback
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );

    const renderBusTracking = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Live Bus Tracking
            </Typography>

            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, mb: 4 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Enter Bus Number"
                            placeholder="e.g. 1"
                            value={busNumberInput}
                            onChange={(e) => setBusNumberInput(e.target.value)}
                            sx={textFieldDarkSx}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Search />}
                            onClick={startBusTracking}
                            disabled={!!trackingIntervalRef.current}
                            sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                        >
                            Track Bus
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={stopBusTracking}
                            sx={{ color: dark.danger, borderColor: dark.danger, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)' } }}
                        >
                            Stop
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {trackedBus && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: '32px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, height: '600px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                    <Box id="tracking-map" sx={{ height: '100%', width: '100%', borderRadius: '24px' }} />
                    <Box sx={{ position: 'absolute', top: 25, right: 25, zIndex: 1000, bgcolor: 'rgba(15, 20, 37, 0.95)', p: 2.5, borderRadius: '20px', border: `1px solid ${dark.border}`, backdropFilter: 'blur(10px)', minWidth: 260, maxHeight: '85%', overflowY: 'auto' }}>
                        <Typography sx={{ color: dark.accent, fontWeight: 900, mb: 1, letterSpacing: '1px' }}>BUS UNIT #{busNumberInput}</Typography>
                        <Divider sx={{ borderColor: dark.border, mb: 1.5 }} />
                        <Typography variant="body2" sx={{ color: dark.text, fontWeight: 800 }}>Driver: {trackedBus.driverName}</Typography>
                        <Typography variant="caption" sx={{ color: dark.textSecondary, display: 'block', mb: 1.5 }}>Updated: {new Date(trackedBus.lastUpdated).toLocaleTimeString()}</Typography>
                        
                        <Typography variant="overline" sx={{ color: dark.accentBlue || '#60a5fa', fontWeight: 900, letterSpacing: '1px', display: 'block', mb: 1 }}>Route Details</Typography>
                        
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 800 }}>STARTING POINT</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#fff' }}>{trackedBus.startingPoint}</Typography>
                            {routeDetails?.start && <Typography variant="caption" sx={{ color: dark.textSecondary, fontSize: '0.65rem' }}>{routeDetails.start.lat.toFixed(4)}, {routeDetails.start.lng.toFixed(4)}</Typography>}
                        </Box>

                        {routeDetails?.stops?.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" sx={{ color: dark.textSecondary, fontWeight: 800 }}>PLANNED STOPS</Typography>
                                {routeDetails.stops.map((s, i) => (
                                    <Box key={i} sx={{ mb: 0.5, pl: 1, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, display: 'block' }}>• {s.name}</Typography>
                                        <Typography variant="caption" sx={{ color: dark.textSecondary, fontSize: '0.6rem' }}>{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: dark.success, fontWeight: 800 }}>END POINT</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#fff' }}>{trackedBus.endPoint}</Typography>
                            {routeDetails?.end && <Typography variant="caption" sx={{ color: dark.textSecondary, fontSize: '0.65rem' }}>{routeDetails.end.lat.toFixed(4)}, {routeDetails.end.lng.toFixed(4)}</Typography>}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, bgcolor: dark.success, borderRadius: '50%', boxShadow: `0 0 10px ${dark.success}` }} />
                            <Typography variant="caption" sx={{ color: dark.success, fontWeight: 800 }}>LIVE SIGNAL</Typography>
                        </Box>
                    </Box>
                </Paper>
            )}
        </Box>
    );

    const renderGallery = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Event Gallery
            </Typography>

            {galleryItems.length > 0 ? (
                <Grid container spacing={3}>
                    {galleryItems.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item._id}>
                            <Paper sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, overflow: 'hidden', height: '100%' }}>
                                {item.fileType.startsWith('image/') ? (
                                    <img src={item.fileData} alt={item.eventName} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                ) : (
                                    <Box sx={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: dark.surfaceHover }}>
                                        <Event sx={{ fontSize: 60, color: dark.accent, mb: 2 }} />
                                        <Typography variant="body2" sx={{ color: dark.textSecondary }}>{item.fileName}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="h6" sx={{ color: dark.text, fontWeight: 700 }}>{item.eventName}</Typography>
                                    <Typography variant="caption" sx={{ color: dark.textSecondary }}>{new Date(item.uploadedAt).toLocaleDateString()}</Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            href={item.fileData}
                                            download={item.fileName}
                                            sx={{ color: dark.accent, borderColor: dark.accent, borderRadius: '8px', textTransform: 'none' }}
                                        >
                                            View/Download
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Paper sx={{ p: 10, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
                    <Collections sx={{ fontSize: 60, color: dark.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: dark.textSecondary }}>
                        No events in the gallery yet.
                    </Typography>
                </Paper>
            )}
        </Box>
    );

    const renderSalary = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                My Salary Portal
            </Typography>

            {salaryRecords.length > 0 ? (
                <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                                <TableCell>Payment Date</TableCell>
                                <TableCell align="right">Base Salary</TableCell>
                                <TableCell align="right">Bonus/Incentives</TableCell>
                                <TableCell align="right">Net Payable</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {salaryRecords.map((record) => (
                                <TableRow key={record._id} sx={{ '& td': { borderColor: dark.border } }}>
                                    <TableCell sx={{ color: dark.text, fontWeight: 600 }}>
                                        {new Date(record.date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: dark.text }}>₹{record.baseSalary}</TableCell>
                                    <TableCell align="right" sx={{ color: '#4caf50' }}>+ ₹{record.bonus}</TableCell>
                                    <TableCell align="right" sx={{ color: dark.accent, fontWeight: 800 }}>₹{record.netPayable}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={record.status}
                                            sx={{
                                                bgcolor: record.status === 'Paid' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                                color: record.status === 'Paid' ? '#4caf50' : '#ff9800',
                                                fontWeight: 800
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Paper sx={{ p: 10, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
                    <AccountBalanceWallet sx={{ fontSize: 60, color: dark.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: dark.textSecondary }}>
                        No salary records found yet.
                    </Typography>
                </Paper>
            )}
        </Box>
    );

    const drawer = (
        <>
            <Toolbar sx={{ my: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: dark.accent }}>CampuZen</Typography>
            </Toolbar>
            <Box sx={{ px: 3, py: 2, textAlign: 'center' }}>
                <Avatar
                    src={user?.photo}
                    sx={{
                        width: 80,
                        height: 80,
                        margin: '0 auto 16px',
                        border: `2px solid ${dark.accent}`,
                        boxShadow: `0 0 20px ${dark.accentFaded}`
                    }}
                />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: dark.text }}>
                    {user?.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: dark.textSecondary }}>
                    Staff ID: {user?.username}
                </Typography>
            </Box>
            <Divider sx={{ borderColor: dark.border, my: 2, mx: 2 }} />
            <Box sx={{ overflow: 'auto' }}>
                <List sx={{ px: 2 }}>
                    {[
                        { text: 'Dashboard', icon: <Dashboard />, val: 'dashboard' },
                        { text: 'View Attendance', icon: <CalendarToday />, val: 'attendance' },
                        { text: 'My Salary', icon: <AccountBalanceWallet />, val: 'salary' },
                        { text: 'Event Gallery', icon: <Collections />, val: 'gallery' },
                        { text: 'Bus Tracking', icon: <DirectionsBus />, val: 'tracking' },
                        { text: 'Feedback Portal', icon: <RateReview />, val: 'feedback' },
                    ].map((item) => (
                        <ListItemButton
                            key={item.text}
                            onClick={() => { setView(item.val); setMobileOpen(false); }}
                            sx={{
                                borderRadius: '12px',
                                mb: 1,
                                bgcolor: view === item.val ? dark.accentFaded : 'transparent',
                                color: view === item.val ? dark.accent : dark.textSecondary,
                                '&:hover': { bgcolor: dark.accentFaded, color: dark.accent },
                            }}
                        >
                            <ListItemIcon sx={{ color: view === item.val ? dark.accent : dark.textSecondary, minWidth: '40px' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: view === item.val ? 700 : 500 }} />
                        </ListItemButton>
                    ))}
                </List>
            </Box>
            <Box sx={{ mt: 'auto', p: 2 }}>
                <Button fullWidth onClick={handleLogout} startIcon={<ExitToApp />} sx={{ color: dark.danger, borderRadius: '12px', justifyContent: 'flex-start', px: 2 }}>
                    Logout
                </Button>
            </Box>
        </>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: dark.bg, minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: dark.sidebar, borderRight: `1px solid ${dark.border}` },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: dark.sidebar, borderRight: `1px solid ${dark.border}` },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppBar position="sticky" elevation={0} sx={{ py: 1, bgcolor: dark.sidebar, borderBottom: `1px solid ${dark.border}` }}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { md: 'none' }, color: dark.accent }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ color: dark.text, fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
                            Staff Operations | {user?.fullName}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton sx={{ mr: 2, color: dark.textSecondary }}><Notifications /></IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '12px' }}>
                            <Avatar src={user?.photo} sx={{ bgcolor: dark.accent }}><AdminPanelSettings /></Avatar>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
                    {view === 'dashboard' ? renderDashboard() :
                        view === 'attendance' ? renderAttendance() :
                            view === 'salary' ? renderSalary() :
                                view === 'gallery' ? renderGallery() :
                                    view === 'tracking' ? renderBusTracking() :
                                        renderFeedback()}
                </Container>
                <style>
                    {`
                        .stop-tooltip { background: #000000 !important; border: 1px solid white !important; color: white !important; font-weight: 800 !important; font-size: 10px !important; border-radius: 4px !important; padding: 2px 8px !important; }
                        .stop-label-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; color: #333 !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 3px white, 0 0 3px white, 0 0 5px white !important; letter-spacing: 0.5px !important; white-space: nowrap !important; }
                        .stop-label-tooltip::before { display: none !important; }
                    `}
                </style>
            </Box>
        </Box>
    );
};

export default StaffDashboard;
