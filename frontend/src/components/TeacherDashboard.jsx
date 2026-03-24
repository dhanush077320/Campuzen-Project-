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
import LinearBusTracker from './LinearBusTracker';


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

    const [busNumberInput, setBusNumberInput] = useState('');
    const [trackedBus, setTrackedBus] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
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
            setTrackedBus(response.data);
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
    };


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

    const renderBusTracking = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Live Bus Tracking
            </Typography>

            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, mb: 4 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Enter Bus Number"
                            placeholder="e.g. 1"
                            value={busNumberInput}
                            onChange={(e) => setBusNumberInput(e.target.value)}
                            sx={textFieldDarkSx}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
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
                    <Grid size={{ xs: 12, sm: 3 }}>
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
                <Paper elevation={0} sx={{ p: 4, borderRadius: '32px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, minHeight: '600px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                            <Typography sx={{ color: dark.accent, fontWeight: 900, mb: 1, letterSpacing: '1px' }}>BUS UNIT #{busNumberInput}</Typography>
                            <Typography variant="body2" sx={{ color: dark.text, fontWeight: 800 }}>Operator: {trackedBus.driverName}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', mb: 0.5 }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: dark.success, borderRadius: '50%', boxShadow: `0 0 10px ${dark.success}` }} />
                                <Typography variant="caption" sx={{ color: dark.success, fontWeight: 800 }}>LIVE SIGNAL</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: dark.textSecondary, display: 'block' }}>Updated: {new Date(trackedBus.lastUpdated).toLocaleTimeString()}</Typography>
                        </Box>
                    </Box>

                    <LinearBusTracker 
                        routeDetails={routeDetails} 
                        currentLocation={{lat: trackedBus.latitude, lng: trackedBus.longitude}} 
                    />
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
                        .stop-label-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; color: #333 !important; font-weight: 800 !important; font-size: 13px !important; text-shadow: 0 0 3px white, 0 0 3px white, 0 0 5px white !important; letter-spacing: 0.5px !important; white-space: nowrap !important; }
                        .stop-label-tooltip::before { display: none !important; }
                    `}
                </style>
            </Box>
        </Box>
    );
};

export default TeacherDashboard;
