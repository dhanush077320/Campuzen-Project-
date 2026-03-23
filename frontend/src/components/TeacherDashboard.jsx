import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItemIcon, ListItemText,
    Typography, Container, Paper, Avatar, AppBar, Toolbar,
    IconButton, Menu, MenuItem, Divider,
    Button, ListItemButton, Grid, TextField, FormControl, InputLabel, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Switch, Chip, Checkbox
} from '@mui/material';
import {
    CloudUpload, Search, History, CalendarToday, Collections, Event,
    Dashboard, ExitToApp, Notifications, AccountCircle, RateReview, Menu as MenuIcon,
    DirectionsBus
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const drawerWidth = 240;

// Dark theme palette
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
    success: '#4caf50'
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

const TeacherDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [filters, setFilters] = useState({ departments: [], batches: [], classes: [], semesters: [] });
    const [searchParams, setSearchParams] = useState({
        department: '',
        batch: '',
        semester: '',
        class: '',
        date: new Date().toISOString().split('T')[0],
        hour: '',
        subject: ''
    });
    const [students, setStudents] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]); // Array of { username, fullName, status }
    const [marksList, setMarksList] = useState([]); // Array of { studentUsername, studentFullName, marks }

    // Attendance view state (for the teacher's own attendance)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [ownAttendanceRecords, setOwnAttendanceRecords] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);

    const navigate = useNavigate();

    // Feedback state
    const [feedbackData, setFeedbackData] = useState({
        category: 'Academic',
        message: ''
    });

    // Bus Tracking State
    const [busNumberInput, setBusNumberInput] = useState('');
    const [trackedBus, setTrackedBus] = useState(null);
    const trackingMapRef = React.useRef(null);
    const trackingMarkerRef = React.useRef(null);
    const trackingIntervalRef = React.useRef(null);

    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'teacher') {
            navigate('/login');
        } else {
            // Fetch fresh user data from backend to ensure subjects are loaded
            const fetchProfile = async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${loggedInUser.username}`);
                    const freshUser = { ...loggedInUser, ...response.data };
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser)); // Update storage too
                } catch (error) {
                    console.error("Failed to fetch fresh user profile", error);
                    setUser(loggedInUser);
                }
            };
            fetchProfile();
        }
        fetchFilters();
    }, [navigate]);

    const fetchFilters = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/filters`);
            setFilters(response.data);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const handleSearchStudents = async () => {
        if (!searchParams.department || !searchParams.batch || !searchParams.semester || !searchParams.class) {
            alert('Please select all filters to search students');
            return;
        }
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/search`, { params: searchParams });
            setStudents(response.data);

            if (view === 'upload') {
                // Initialize attendance list with all 'Absent' by default
                setAttendanceList(response.data.map(s => ({
                    studentUsername: s.username,
                    studentFullName: s.fullName,
                    status: 'Absent'
                })));
            } else if (view === 'marks') {
                // Initialize marks list with 0
                setMarksList(response.data.map(s => ({
                    studentUsername: s.username,
                    studentFullName: s.fullName,
                    marks: ''
                })));
            }
        } catch (error) {
            console.error('Error searching students:', error);
        }
    };

    const handleStatusChange = (index, status) => {
        const updatedList = [...attendanceList];
        updatedList[index].status = status;
        setAttendanceList(updatedList);
    };

    const handleAttendanceSubmit = async () => {
        if (!searchParams.hour || !searchParams.subject) {
            alert('Please select hour and type subject name');
            return;
        }
        try {
            const records = attendanceList.map(item => ({
                ...item,
                teacherUsername: user.username,
                department: searchParams.department,
                batch: searchParams.batch,
                semester: searchParams.semester,
                class: searchParams.class,
                date: searchParams.date,
                hour: parseInt(searchParams.hour),
                subject: searchParams.subject
            }));
            await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance`, { attendanceRecords: records });
            alert('Attendance uploaded successfully!');
            setStudents([]);
            setAttendanceList([]);
        } catch (error) {
            console.error('Error submitting attendance:', error);
            alert('Failed to upload attendance');
        }
    };

    const fetchOwnAttendance = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/faculty-attendance/${user.username}`, {
                params: dateRange
            });
            setOwnAttendanceRecords(response.data);
        } catch (error) {
            console.error('Error fetching own attendance:', error);
        }
    };

    const fetchGallery = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/gallery`);
            setGalleryItems(response.data);
        } catch (error) {
            console.error('Error fetching gallery:', error);
        }
    };

    useEffect(() => {
        if (view === 'gallery') {
            fetchGallery();
        }
    }, [view]);

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
                        weight: 4,
                        opacity: 0.8,
                        lineJoin: 'round'
                    }).addTo(map);

                    const allPoints = [
                        { ...trackedBus.startingPointCoords, name: trackedBus.startingPoint || 'Start' },
                        ...(trackedBus.stopCoords || []),
                        { ...trackedBus.endPointCoords, name: trackedBus.endPoint || 'End' }
                    ];

                    allPoints.forEach((point) => {
                        const circle = L.circleMarker([point.lat, point.lng], {
                            radius: 6,
                            fillColor: '#ffffff',
                            fillOpacity: 1,
                            color: '#000000',
                            weight: 2
                        }).addTo(map);

                        circle.bindTooltip(point.name, {
                            permanent: false,
                            direction: 'top',
                            className: 'stop-tooltip'
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

    const handleMarksChange = (index, value) => {
        const updatedList = [...marksList];
        updatedList[index].marks = value;
        setMarksList(updatedList);
    };

    const handleMarksSubmit = async () => {
        if (!searchParams.subject) {
            alert('Please type subject name');
            return;
        }
        try {
            const records = marksList.map(item => ({
                ...item,
                teacherUsername: user.username,
                department: searchParams.department,
                batch: searchParams.batch,
                semester: searchParams.semester,
                class: searchParams.class,
                subject: searchParams.subject
            }));
            await axios.post(`${import.meta.env.VITE_API_URL}/api/internal-marks`, { marksRecords: records });
            alert('Marks uploaded successfully!');
            setStudents([]);
            setMarksList([]);
        } catch (error) {
            console.error('Error submitting marks:', error);
            alert('Failed to upload marks');
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                senderUsername: user.username,
                senderFullName: user.fullName,
                senderRole: 'Teacher',
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
                Welcome, {user?.fullName || 'Teacher'}!
            </Typography>
            <Typography variant="body1" sx={{ color: dark.textSecondary }}>
                Teacher management system is ready.
            </Typography>
        </Paper>
    );

    const renderOwnAttendance = () => {
        const totalDays = ownAttendanceRecords.length;
        const attendedDaysCount = ownAttendanceRecords.reduce((acc, r) => {
            if (r.status === 'Present') return acc + 1;
            if (r.status === 'Half day') return acc + 0.5;
            return acc;
        }, 0);
        const percentage = totalDays > 0 ? ((attendedDaysCount / totalDays) * 100).toFixed(1) : 0;

        return (
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                    My Attendance Analytics
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
                                        onClick={fetchOwnAttendance}
                                        sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                                    >
                                        View Log
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>

                {ownAttendanceRecords.length > 0 ? (
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
                                {ownAttendanceRecords.slice().reverse().map((record) => (
                                    <TableRow key={record._id} sx={{ '& td': { borderColor: dark.border } }}>
                                        <TableCell sx={{ color: dark.text, fontWeight: 600 }}>
                                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </TableCell>
                                        <TableCell sx={{ color: dark.accent, fontWeight: 700 }}>{record.time || '—'}</TableCell>
                                        <TableCell>                                             <Chip
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

    const renderUploadAttendance = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Upload Attendance
            </Typography>
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={searchParams.department}
                                label="Course"
                                onChange={(e) => setSearchParams({ ...searchParams, department: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={searchParams.batch}
                                label="Department"
                                onChange={(e) => setSearchParams({ ...searchParams, batch: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.batches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Semester</InputLabel>
                            <Select
                                value={searchParams.semester}
                                label="Semester"
                                onChange={(e) => setSearchParams({ ...searchParams, semester: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.semesters.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Batch</InputLabel>
                            <Select
                                value={searchParams.class}
                                label="Batch"
                                onChange={(e) => setSearchParams({ ...searchParams, class: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.classes.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Subject Name</InputLabel>
                            <Select
                                label="Subject Name"
                                value={searchParams.subject}
                                onChange={(e) => setSearchParams({ ...searchParams, subject: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {(user?.subject ? user.subject.split(',').map(s => s.trim()) : []).map(sub => (
                                    <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Date"
                            InputLabelProps={{ shrink: true }}
                            value={searchParams.date}
                            onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                            sx={textFieldDarkSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Hour</InputLabel>
                            <Select
                                value={searchParams.hour}
                                label="Hour"
                                onChange={(e) => setSearchParams({ ...searchParams, hour: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map(h => <MenuItem key={h} value={h}>Hour {h}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Search />}
                            onClick={handleSearchStudents}
                            sx={{
                                color: dark.accent,
                                borderColor: dark.accent,
                                height: '56px',
                                borderRadius: '12px',
                                '&:hover': { borderColor: '#6a3de8', bgcolor: dark.accentFaded }
                            }}
                        >
                            Search Students
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {students.length > 0 && (
                <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderColor: dark.border } }}>
                                <TableCell sx={{ color: dark.textSecondary, fontWeight: 700 }}>Roll No / ID</TableCell>
                                <TableCell sx={{ color: dark.textSecondary, fontWeight: 700 }}>Student Name</TableCell>
                                <TableCell sx={{ color: dark.textSecondary, fontWeight: 700, textAlign: 'center' }}>Status (Present / Absent)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student, idx) => (
                                <TableRow key={student.username} sx={{ '& td': { borderColor: dark.border } }}>
                                    <TableCell sx={{ color: dark.text }}>{student.username}</TableCell>
                                    <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{student.fullName}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Checkbox
                                                checked={attendanceList[idx]?.status === 'Present'}
                                                onChange={(e) => handleStatusChange(idx, e.target.checked ? 'Present' : 'Absent')}
                                                sx={{
                                                    color: dark.textSecondary,
                                                    '&.Mui-checked': { color: dark.success },
                                                }}
                                            />
                                            {attendanceList[idx]?.status === 'Present' && (
                                                <Typography sx={{ 
                                                    color: dark.success, 
                                                    variant: 'caption', 
                                                    fontWeight: 700 
                                                }}>
                                                    PRESENT
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={handleAttendanceSubmit}
                            sx={{
                                bgcolor: dark.accent,
                                px: 4, py: 1.5,
                                borderRadius: '12px',
                                fontWeight: 800,
                                '&:hover': { bgcolor: '#6a3de8' }
                            }}
                        >
                            Submit Attendance
                        </Button>
                    </Box>
                </TableContainer>
            )}
        </Box>
    );

    const renderUploadMarks = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Upload Internal Marks
            </Typography>
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={searchParams.department}
                                label="Course"
                                onChange={(e) => setSearchParams({ ...searchParams, department: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={searchParams.batch}
                                label="Department"
                                onChange={(e) => setSearchParams({ ...searchParams, batch: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.batches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Semester</InputLabel>
                            <Select
                                value={searchParams.semester}
                                label="Semester"
                                onChange={(e) => setSearchParams({ ...searchParams, semester: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.semesters.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Batch</InputLabel>
                            <Select
                                value={searchParams.class}
                                label="Batch"
                                onChange={(e) => setSearchParams({ ...searchParams, class: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {filters.classes.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Subject Name</InputLabel>
                            <Select
                                value={searchParams.subject}
                                label="Subject Name"
                                onChange={(e) => setSearchParams({ ...searchParams, subject: e.target.value })}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                {user?.subject ? user.subject.split(',').map(s => <MenuItem key={s.trim()} value={s.trim()}>{s.trim()}</MenuItem>) : <MenuItem value="">No Subjects</MenuItem>}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Search />}
                            onClick={handleSearchStudents}
                            sx={{
                                color: dark.accent,
                                borderColor: dark.accent,
                                height: '56px',
                                borderRadius: '12px',
                                '&:hover': { borderColor: '#6a3de8', bgcolor: dark.accentFaded }
                            }}
                        >
                            Search Students
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {students.length > 0 && (
                <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderColor: dark.border } }}>
                                <TableCell sx={{ color: dark.textSecondary, fontWeight: 700 }}>Roll No / ID</TableCell>
                                <TableCell sx={{ color: dark.textSecondary, fontWeight: 700 }}>Student Name</TableCell>
                                <TableCell sx={{ color: dark.textSecondary, fontWeight: 700, textAlign: 'center' }}>Internal Marks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student, idx) => (
                                <TableRow key={student.username} sx={{ '& td': { borderColor: dark.border } }}>
                                    <TableCell sx={{ color: dark.text }}>{student.username}</TableCell>
                                    <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{student.fullName}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={marksList[idx]?.marks || ''}
                                            onChange={(e) => handleMarksChange(idx, e.target.value)}
                                            sx={{
                                                width: '100px',
                                                ...textFieldDarkSx
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={handleMarksSubmit}
                            sx={{
                                bgcolor: dark.accent,
                                px: 4, py: 1.5,
                                borderRadius: '12px',
                                fontWeight: 800,
                                '&:hover': { bgcolor: '#6a3de8' }
                            }}
                        >
                            Submit Marks
                        </Button>
                    </Box>
                </TableContainer>
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
                    Teacher ID: {user?.username}
                </Typography>
            </Box>
            <Divider sx={{ borderColor: dark.border, my: 2, mx: 2 }} />
            <Box sx={{ overflow: 'auto' }}>
                <List sx={{ px: 2 }}>
                    {[
                        { text: 'Dashboard', icon: <Dashboard />, val: 'dashboard' },
                        { text: 'View Attendance', icon: <CalendarToday />, val: 'attendance' },
                        { text: 'Upload Attendance', icon: <CloudUpload />, val: 'upload' },
                        { text: 'Upload Marks', icon: <RateReview />, val: 'marks' },
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
                            Teacher Portal | {user?.fullName}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton sx={{ mr: 2, color: dark.textSecondary }}><Notifications /></IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '12px' }}>
                            <Avatar src={user?.photo} sx={{ bgcolor: dark.accent }}><AccountCircle /></Avatar>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="lg" sx={{ mt: 4, pb: 4, flexGrow: 1, overflowX: 'hidden' }}>
                    {view === 'dashboard' ? renderDashboard() :
                        view === 'attendance' ? renderOwnAttendance() :
                            view === 'upload' ? renderUploadAttendance() :
                                view === 'marks' ? renderUploadMarks() :
                                    view === 'gallery' ? renderGallery() :
                                        view === 'tracking' ? renderBusTracking() :
                                            renderFeedback()}
                </Container>
                <style>
                    {`
                        .stop-tooltip { background: #000000 !important; border: 1px solid white !important; color: white !important; font-weight: 800 !important; font-size: 10px !important; border-radius: 4px !important; padding: 2px 8px !important; }
                    `}
                </style>
            </Box>
        </Box>
    );
};

export default TeacherDashboard;
