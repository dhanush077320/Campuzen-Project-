import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItemIcon, ListItemText,
    Typography, Container, Paper, Avatar, AppBar, Toolbar,
    IconButton, Menu, MenuItem, Divider, Button, ListItemButton,
    Card, CardContent, Grid, TextField, FormControl, InputLabel, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress
} from '@mui/material';
import {
    Book, CalendarToday, School, Layers, RateReview, History,
    Collections, Event, Dashboard, ExitToApp, Notifications, Menu as MenuIcon
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
    success: '#4caf50',
    warning: '#ff9800'
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

const StudentDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(false);

    // Attendance view state
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    // Feedback state
    const [feedbackData, setFeedbackData] = useState({
        category: 'Academic',
        message: ''
    });

    const [internalMarks, setInternalMarks] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);

    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navigate = useNavigate();

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'student') {
            navigate('/login');
        } else {
            setUser(loggedInUser);
            fetchEnrollment(loggedInUser.username);
        }
    }, [navigate]);

    useEffect(() => {
        if (view === 'marks') {
            fetchInternalMarks();
        }
        if (view === 'gallery') {
            fetchGallery();
        }
    }, [view]);

    const fetchEnrollment = async (username) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/enrollments/student/${username}`);
            setEnrollment(response.data);
        } catch (error) {
            console.error('No enrollment found or error fetching:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/attendance/student/${user.username}`, {
                params: dateRange
            });
            setAttendanceRecords(response.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fetchInternalMarks = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`http://localhost:5000/api/internal-marks/student/${user.username}`);
            setInternalMarks(response.data);
        } catch (error) {
            console.error('Error fetching internal marks:', error);
        }
    };

    const fetchGallery = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/gallery');
            setGalleryItems(response.data);
        } catch (error) {
            console.error('Error fetching gallery:', error);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                senderUsername: user.username,
                senderFullName: user.fullName,
                senderRole: 'Student',
                category: feedbackData.category,
                message: feedbackData.message
            };
            await axios.post('http://localhost:5000/api/feedbacks', payload);
            alert('Feedback submitted successfully to College Admin!');
            setFeedbackData({ ...feedbackData, message: '' });
        } catch (error) {
            alert('Failed to submit feedback');
        }
    };

    const renderDashboard = () => (
        <Paper sx={{ p: 5, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: dark.accent, mb: 2 }}>
                Welcome, {user?.fullName || 'Student'}!
            </Typography>
        </Paper>
    );

    const renderCourses = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                My Enrolled Courses
            </Typography>

            {enrollment ? (
                <Grid container spacing={3}>
                    <Grid size={12}>
                        <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                                <Avatar sx={{ bgcolor: dark.accent, width: 64, height: 64 }}>
                                    <School fontSize="large" />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: dark.text }}>
                                        {enrollment.department}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: dark.textSecondary }}>
                                        {enrollment.batch} | Batch {enrollment.class} | {enrollment.semester}
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ borderColor: dark.border, mb: 4 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: dark.text }}>
                                Registered Subjects
                            </Typography>
                            <Grid container spacing={2}>
                                {enrollment.subjects.map((sub, idx) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                                        <Card sx={{ bgcolor: dark.bg, border: `1px solid ${dark.border}`, borderRadius: '16px', boxShadow: 'none' }}>
                                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Layers sx={{ color: dark.accent }} />
                                                <Typography sx={{ color: dark.text, fontWeight: 600 }}>{sub}</Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            ) : (
                <Paper sx={{ p: 10, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
                    <Book sx={{ fontSize: 60, color: dark.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: dark.textSecondary }}>
                        You are not enrolled in any courses yet.
                    </Typography>
                </Paper>
            )}
        </Box>
    );

    const renderAttendance = () => {
        // Group attendance records by date
        const grouped = attendanceRecords.reduce((acc, curr) => {
            const d = new Date(curr.date).toLocaleDateString();
            if (!acc[d]) acc[d] = {};
            acc[d][curr.hour] = curr;
            return acc;
        }, {});

        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

        // Calculate Subject-wise percentage
        const subjectStats = enrollment?.subjects.reduce((acc, sub) => {
            const subjectRecords = attendanceRecords.filter(r => r.subject.trim().toLowerCase() === sub.trim().toLowerCase());
            const total = subjectRecords.length;
            const attended = subjectRecords.filter(r => r.status === 'Present').length;
            const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;
            acc[sub] = { total, attended, percentage };
            return acc;
        }, {}) || {};

        return (
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                    Attendance History
                </Typography>

                <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                    <Grid container spacing={3} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="subtitle2" sx={{ color: dark.textSecondary, mb: 1 }}>Course</Typography>
                            <Typography sx={{ color: dark.text, fontWeight: 700 }}>{enrollment?.department || 'N/A'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="subtitle2" sx={{ color: dark.textSecondary, mb: 1 }}>Department</Typography>
                            <Typography sx={{ color: dark.text, fontWeight: 700 }}>{enrollment?.batch || 'N/A'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="subtitle2" sx={{ color: dark.textSecondary, mb: 1 }}>Semester</Typography>
                            <Typography sx={{ color: dark.text, fontWeight: 700 }}>{enrollment?.semester || 'N/A'}</Typography>
                        </Grid>
                    </Grid>
                    <Divider sx={{ borderColor: dark.border, mb: 3 }} />
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
                                View Attendance
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {attendanceRecords.length > 0 && (
                    <>
                        {/* Subject-wise Percentage Table */}
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: dark.text, mt: 4 }}>
                            Subject-wise Attendance Analysis
                        </Typography>
                        <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 6 }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                                        <TableCell>Subject Name</TableCell>
                                        <TableCell align="center">Total Classes</TableCell>
                                        <TableCell align="center">Classes Attended</TableCell>
                                        <TableCell align="center">Percentage</TableCell>
                                        <TableCell sx={{ minWidth: '150px' }}>Progress</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(subjectStats).map(([sub, stats]) => (
                                        <TableRow key={sub} sx={{ '& td': { borderColor: dark.border } }}>
                                            <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{sub}</TableCell>
                                            <TableCell align="center" sx={{ color: dark.text }}>{stats.total}</TableCell>
                                            <TableCell align="center" sx={{ color: dark.text }}>{stats.attended}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${stats.percentage}%`}
                                                    sx={{
                                                        bgcolor: stats.percentage >= 75 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                                                        color: stats.percentage >= 75 ? dark.success : dark.danger,
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ width: '100%', mr: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={parseFloat(stats.percentage)}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 5,
                                                            bgcolor: dark.bg,
                                                            '& .MuiLinearProgress-bar': {
                                                                bgcolor: stats.percentage >= 75 ? dark.success : (stats.percentage >= 50 ? dark.warning : dark.danger)
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: dark.text }}>
                            Daily Hourly Log
                        </Typography>
                        <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                                        <TableCell>Date</TableCell>
                                        {[1, 2, 3, 4, 5, 6, 7].map(h => <TableCell key={h} align="center">Hour {h}</TableCell>)}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedDates.map(dateStr => (
                                        <TableRow key={dateStr} sx={{ '& td': { borderColor: dark.border } }}>
                                            <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{dateStr}</TableCell>
                                            {[1, 2, 3, 4, 5, 6, 7].map(h => {
                                                const rec = grouped[dateStr][h];
                                                return (
                                                    <TableCell key={h} align="center">
                                                        {rec ? (
                                                            <Box>
                                                                <Chip
                                                                    label={rec.status === 'Present' ? 'P' : 'A'}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor: rec.status === 'Present' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                                                                        color: rec.status === 'Present' ? dark.success : dark.danger,
                                                                        fontWeight: 800,
                                                                        width: '32px'
                                                                    }}
                                                                />
                                                                <Typography variant="caption" display="block" sx={{ color: dark.textSecondary, mt: 0.5, fontSize: '0.65rem' }}>
                                                                    {rec.subject}
                                                                </Typography>
                                                            </Box>
                                                        ) : '-'}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {attendanceRecords.length === 0 && (
                    <Paper sx={{ p: 10, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" sx={{ color: dark.textSecondary }}>
                            No attendance records found for the selected range.
                        </Typography>
                    </Paper>
                )}
            </Box>
        );
    };

    const renderInternalMarks = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                My Internal Marks
            </Typography>

            {internalMarks.length > 0 ? (
                <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                                <TableCell>Subject</TableCell>
                                <TableCell align="center">Internal Marks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {internalMarks.map((record) => (
                                <TableRow key={record._id} sx={{ '& td': { borderColor: dark.border } }}>
                                    <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{record.subject}</TableCell>
                                    <TableCell align="center" sx={{ color: dark.text, fontSize: '1.2rem', fontWeight: 800 }}>{record.marks}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Paper sx={{ p: 10, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
                    <School sx={{ fontSize: 60, color: dark.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: dark.textSecondary }}>
                        No internal marks have been uploaded yet.
                    </Typography>
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
                            <FormControl fullWidth sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: dark.text,
                                    '& fieldset': { borderColor: dark.border },
                                    '&:hover fieldset': { borderColor: dark.accent },
                                    '&.Mui-focused fieldset': { borderColor: dark.accent },
                                },
                                '& .MuiInputLabel-root': { color: dark.textSecondary },
                                '& .MuiInputLabel-root.Mui-focused': { color: dark.accent },
                                '& .MuiSvgIcon-root': { color: dark.textSecondary },
                            }}>
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
                    Student ID: {user?.username}
                </Typography>
            </Box>
            <Divider sx={{ borderColor: dark.border, my: 2, mx: 2 }} />
            <Box sx={{ overflow: 'auto' }}>
                <List sx={{ px: 2 }}>
                    {[
                        { text: 'Dashboard', icon: <Dashboard />, val: 'dashboard' },
                        { text: 'My Courses', icon: <Book />, val: 'courses' },
                        { text: 'Attendance', icon: <CalendarToday />, val: 'attendance' },
                        { text: 'Internal Marks', icon: <School />, val: 'marks' },
                        { text: 'Event Gallery', icon: <Collections />, val: 'gallery' },
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
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: view === item.val ? 800 : 500 }} />
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
                            {view === 'dashboard' ? `Welcome back, ${user?.fullName || 'Student'}!` : view === 'attendance' ? 'Attendance History' : 'Student Portal'}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton sx={{ mr: 2, color: dark.textSecondary }}>
                            <Notifications />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '12px' }}>
                            <Avatar src={user?.photo} sx={{ bgcolor: dark.accent }} />
                            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: dark.text }}>{user?.fullName || 'Student'}</Typography>
                                <Typography variant="caption" sx={{ color: dark.textSecondary }}>Student ID: {user?.username}</Typography>
                            </Box>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="lg" sx={{ mt: 4, pb: 4, flexGrow: 1, overflowX: 'hidden' }}>
                    {view === 'dashboard' ? renderDashboard() :
                        view === 'courses' ? renderCourses() :
                            view === 'attendance' ? renderAttendance() :
                                view === 'marks' ? renderInternalMarks() :
                                    view === 'gallery' ? renderGallery() :
                                        renderFeedback()}
                </Container>
            </Box>
        </Box>
    );
};

export default StudentDashboard;
