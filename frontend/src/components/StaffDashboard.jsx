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

                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    maxZoom: 19
                }).addTo(map);

                const busIcon = L.divIcon({
                    html: `<div style="background-color: ${dark.accent}; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${dark.accent};">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M18,11H6V6h12V11z M16.5,17c0.83,0,1.5-0.67,1.5-1.5S17.33,14,16.5,14S15,14.67,15,15.5S15.67,17,16.5,17z M7.5,17 c0.83,0,1.5-0.67,1.5-1.5S8.33,14,7.5,14S6,14.67,6,15.5S6.67,17,7.5,17z M4,16c0,0.88,0.39,1.67,1,2.22V20c0,0.55,0.45,1,1,1h1 c0.55,0,1-0.45,1-1v-1h8v1c0,0.55,0.45,1,1,1h1c0.55,0,1-0.45,1-1v-1.78c0.61-0.55,1-1.34,1-2.22V6c0-3.5-3.58-4-8-4s-8,0.5-8,4V16z" />
                            </svg>
                           </div>`,
                    className: 'bus-tracking-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                trackingMarkerRef.current = L.marker([trackedBus.latitude, trackedBus.longitude], { icon: busIcon }).addTo(map);
                trackingMapRef.current = map;

                // Draw Route and Stops if available
                if (trackedBus.startingPointCoords && trackedBus.endPointCoords) {
                    const routeCoords = [
                        [trackedBus.startingPointCoords.lat, trackedBus.startingPointCoords.lng],
                        ...(trackedBus.stopCoords || []).map(s => [s.lat, s.lng]),
                        [trackedBus.endPointCoords.lat, trackedBus.endPointCoords.lng]
                    ];

                    L.polyline(routeCoords, {
                        color: '#000000',
                        weight: 6,
                        opacity: 1,
                        lineJoin: 'round'
                    }).addTo(map);

                    const allPoints = [
                        { ...trackedBus.startingPointCoords, name: trackedBus.startingPoint || 'Start' },
                        ...(trackedBus.stopCoords || []),
                        { ...trackedBus.endPointCoords, name: trackedBus.endPoint || 'End' }
                    ];

                    allPoints.forEach((point) => {
                        const circle = L.circleMarker([point.lat, point.lng], {
                            radius: 8,
                            fillColor: '#ffffff',
                            fillOpacity: 1,
                            color: '#000000',
                            weight: 3
                        }).addTo(map);

                        circle.bindTooltip(`<div style="color: white; font-weight: 900; font-size: 13px; text-shadow: 0 2px 4px black, 0 0 2px black;">${point.name.toUpperCase()}</div>`, {
                            permanent: true,
                            direction: 'right',
                            className: 'stop-label-tooltip',
                            offset: [15, 0]
                        });
                    });
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
                    <Box sx={{ position: 'absolute', top: 35, right: 35, zIndex: 1000, bgcolor: 'rgba(15, 20, 37, 0.95)', p: 3, borderRadius: '20px', border: `1px solid ${dark.border}`, backdropFilter: 'blur(10px)', minWidth: 200 }}>
                        <Typography sx={{ color: dark.accent, fontWeight: 900, mb: 1, letterSpacing: '1px' }}>BUS UNIT #{busNumberInput}</Typography>
                        <Divider sx={{ borderColor: dark.border, mb: 2 }} />
                        <Typography variant="body2" sx={{ color: dark.text, fontWeight: 700, mb: 0.5 }}>Operator: {trackedBus.driverName}</Typography>
                        <Typography variant="caption" sx={{ color: dark.textSecondary, display: 'block' }}>Last Updated: {new Date(trackedBus.lastUpdated).toLocaleTimeString()}</Typography>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        .stop-label-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; color: white !important; font-weight: 900 !important; font-size: 13px !important; text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 2px 4px rgba(0,0,0,0.9) !important; letter-spacing: 0.5px !important; white-space: nowrap !important; }
                        .stop-label-tooltip::before { display: none !important; }
                    `}
                </style>
            </Box>
        </Box>
    );
};

export default StaffDashboard;
