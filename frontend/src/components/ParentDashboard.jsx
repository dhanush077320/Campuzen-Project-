import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItemIcon, ListItemText,
    Typography, Container, Paper, Avatar, AppBar, Toolbar,
    IconButton, Menu, MenuItem, Divider, Button, ListItemButton,
    Grid, TextField, FormControl, InputLabel, Select,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress,
    Card, CardContent
} from '@mui/material';
import {
    Dashboard, History, ExitToApp, AccountCircle,
    Notifications, Assessment, RateReview, Book, School, Layers, CalendarToday, Collections, Event, Paid, Receipt, Menu as MenuIcon,
    DirectionsBus, Search
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import MapView from './MapView';

const drawerWidth = 240;

const dark = {
    bg: '#020508',
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

const ParentDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(false);

    const [busNumberInput, setBusNumberInput] = useState('');
    const [trackedBus, setTrackedBus] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const trackingIntervalRef = React.useRef(null);

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
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [paymentProcessData, setPaymentProcessData] = useState({
        method: 'UPI',
        date: new Date().toISOString().split('T')[0],
        upiId: '',
        transactionId: ''
    });

    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'parent') {
            navigate('/login');
        } else {
            setUser(loggedInUser);
            fetchChildEnrollment(loggedInUser.username);
        }
    }, [navigate]);

    useEffect(() => {
        if (view === 'performance') {
            fetchInternalMarks();
        }
        if (view === 'gallery') {
            fetchGallery();
        }
        if (view === 'payments') {
            fetchPayments();
        }
    }, [view]);

    const fetchChildEnrollment = async (username) => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/student/${username}`);
            setEnrollment(response.data);
        } catch (error) {
            console.error('No child enrollment found or error fetching:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/student/${user.username}`, {
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
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/internal-marks/student/${user.username}`);
            setInternalMarks(response.data);
        } catch (error) {
            console.error('Error fetching internal marks:', error);
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

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                senderUsername: user.username,
                senderFullName: user.fullName,
                senderRole: 'Parent',
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
                Welcome, {user?.fullName || 'Parent'}!
            </Typography>
            <Typography variant="body1" sx={{ color: dark.textSecondary }}>
                You can track your child's academic progress and attendance from here.
            </Typography>
        </Paper>
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
                        <TableContainer component={Paper} sx={{ 
                            borderRadius: '24px', 
                            bgcolor: dark.surface, 
                            border: `1px solid ${dark.border}`, 
                            boxShadow: 'none', 
                            mb: 6,
                            overflowX: 'auto'
                        }}>
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
                        <TableContainer component={Paper} sx={{ 
                            borderRadius: '24px', 
                            bgcolor: dark.surface, 
                            border: `1px solid ${dark.border}`, 
                            boxShadow: 'none',
                            overflowX: 'auto'
                        }}>
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

    const renderPerformance = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Performance
            </Typography>

            {internalMarks.length > 0 ? (
                <TableContainer component={Paper} sx={{ 
                    borderRadius: '24px', 
                    bgcolor: dark.surface, 
                    border: `1px solid ${dark.border}`, 
                    boxShadow: 'none',
                    overflowX: 'auto'
                }}>
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
                    <Assessment sx={{ fontSize: 60, color: dark.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ color: dark.textSecondary }}>
                        No internal marks have been uploaded for your child yet.
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

    const fetchPayments = async () => {
        if (!user) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/parent/${user.username}`);
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                paymentMethod: paymentProcessData.method,
                paymentDate: paymentProcessData.date,
                transactionId: paymentProcessData.method === 'UPI' ? `UPI_${Date.now()}` : 'CASH'
            };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/pay/${selectedPayment._id}`, payload);
            alert('Payment submitted successfully!');
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            alert('Failed to process payment');
        }
    };

    const downloadReceipt = async (payment) => {
        try {
            let studentName = 'N/A';
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/role/student`);
                const studentUser = response.data.find(u => u.username === payment.parentUsername);
                if (studentUser) {
                    studentName = studentUser.fullName;
                }
            } catch (err) {
                console.error("Could not fetch student name for receipt", err);
            }

            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(124, 77, 255); // dark.accent
            doc.text('CampuZen - Payment Receipt', 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Receipt ID: ${payment._id}`, 20, 40);
            doc.text(`Date: ${new Date(payment.paymentDate || Date.now()).toLocaleDateString()}`, 20, 50);

            doc.line(20, 55, 190, 55);

            // Details
            doc.text('Student Details:', 20, 70);
            doc.text(`Student Name: ${studentName}`, 30, 80);
            doc.text(`Student Username: ${payment.parentUsername}`, 30, 90);

            doc.text('Payment Details:', 20, 110);

            autoTable(doc, {
                startY: 115,
                head: [['Description', 'Amount']],
                body: [
                    [payment.subject, `INR ${payment.amount}`],
                    ['Method', payment.paymentMethod],
                    ['Transaction ID', payment.transactionId || 'N/A']
                ],
                theme: 'striped',
                headStyles: { fillColor: [124, 77, 255] }
            });

            const finalY = (doc.lastAutoTable?.finalY || 150) + 20;
            doc.setFontSize(14);
            doc.text(`Total Amount Paid: INR ${payment.amount}`, 20, finalY);

            doc.setFontSize(10);
            doc.text('Generated by Campuzen Dashboard', 105, 280, { align: 'center' });

            doc.save(`Receipt_${payment._id}.pdf`);
        } catch (error) {
            console.error('Error generating receipt:', error);
            alert('Could not generate receipt: ' + error.message);
        }
    };

    const renderPayments = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Payments
            </Typography>

            {selectedPayment ? (
                <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                    <Button onClick={() => setSelectedPayment(null)} sx={{ mb: 2, color: dark.accent }}>← Back to list</Button>
                    <Typography variant="h6" sx={{ mb: 1, color: dark.text }}>Finalize Payment for: {selectedPayment.subject}</Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: dark.textSecondary }}>Amount to pay: ₹{selectedPayment.amount}</Typography>

                    <form onSubmit={handleProcessPayment}>
                        <Grid container spacing={3}>
                            <Grid size={12}>
                                <FormControl fullWidth sx={selectDarkSx}>
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                        value={paymentProcessData.method}
                                        label="Payment Method"
                                        onChange={(e) => setPaymentProcessData({ ...paymentProcessData, method: e.target.value })}
                                        MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                    >
                                        <MenuItem value="UPI">UPI Payment</MenuItem>
                                        <MenuItem value="Cash on Delivery">Cash on Delivery</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {paymentProcessData.method === 'UPI' ? (
                                <Grid size={12} sx={{ textAlign: 'center', py: 2 }}>
                                    <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block', borderRadius: '12px' }}>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=college@upi&pn=Campuzen&am=${selectedPayment.amount}`}
                                            alt="UPI QR Code"
                                        />
                                    </Box>
                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: dark.textSecondary }}>Scan QR to pay ₹{selectedPayment.amount}</Typography>
                                </Grid>
                            ) : (
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Planned Payment Date"
                                        required
                                        InputLabelProps={{ shrink: true }}
                                        value={paymentProcessData.date}
                                        onChange={(e) => setPaymentProcessData({ ...paymentProcessData, date: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                            )}

                            <Grid size={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                                >
                                    Confirm Payment
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {payments.map((p) => (
                        <Grid size={{ xs: 12, md: 6 }} key={p._id}>
                            <Paper sx={{ p: 3, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: dark.text, fontWeight: 700 }}>{p.subject}</Typography>
                                        <Typography variant="body2" sx={{ color: dark.textSecondary }}>{p.description}</Typography>
                                    </Box>
                                    <Chip
                                        label={p.status}
                                        sx={{
                                            bgcolor: p.status === 'Paid' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                            color: p.status === 'Paid' ? dark.success : '#ff9800',
                                            fontWeight: 800
                                        }}
                                    />
                                </Box>
                                <Typography variant="h5" sx={{ color: dark.accent, fontWeight: 800, mb: 3 }}>₹{p.amount}</Typography>
                                {p.status === 'Pending' ? (
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<Paid />}
                                        onClick={() => setSelectedPayment(p)}
                                        sx={{ bgcolor: dark.accent, borderRadius: '12px' }}
                                    >
                                        Pay Now
                                    </Button>
                                ) : (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<Receipt />}
                                        onClick={() => downloadReceipt(p)}
                                        sx={{ color: dark.accent, borderColor: dark.accent, borderRadius: '12px' }}
                                    >
                                        Download Receipt
                                    </Button>
                                )}
                            </Paper>
                        </Grid>
                    ))}
                    {payments.length === 0 && (
                        <Grid size={12}>
                            <Paper sx={{ p: 10, textAlign: 'center', bgcolor: dark.surface, borderRadius: '24px', border: `1px solid ${dark.border}` }}>
                                <Typography sx={{ color: dark.textSecondary }}>No payment requests found.</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )
            }
        </Box >
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
                <Paper elevation={0} sx={{ 
                    p: 4, 
                    borderRadius: '32px', 
                    bgcolor: dark.surface, 
                    border: `1px solid ${dark.border}`, 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    mb: 8,
                    // Custom Scrollbar
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
                }}>
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

                    <MapView 
                        routeDetails={routeDetails} 
                        currentLocation={{lat: trackedBus.latitude, lng: trackedBus.longitude}} 
                        trackedBus={trackedBus}
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
                    Parent ID: {user?.username}
                </Typography>
            </Box>
            <Divider sx={{ borderColor: dark.border, my: 2, mx: 2 }} />
            <Box sx={{ overflow: 'auto' }}>
                <List sx={{ px: 2 }}>
                    {[
                        { text: 'Dashboard', icon: <Dashboard />, val: 'dashboard' },
                        { text: 'Attendance', icon: <History />, val: 'attendance' },
                        { text: 'Performance', icon: <Assessment />, val: 'performance' },
                        { text: 'Event Gallery', icon: <Collections />, val: 'gallery' },
                        { text: 'Payments', icon: <Paid />, val: 'payments' },
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
                            <ListItemIcon sx={{ minWidth: '40px', color: view === item.val ? dark.accent : dark.textSecondary }}>{item.icon}</ListItemIcon>
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
                            Parent Portal | {user?.fullName}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton sx={{ mr: 2, color: dark.textSecondary }}>
                            <Notifications />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '12px' }}>
                            <Avatar src={user?.photo} sx={{ bgcolor: dark.accent }}><AccountCircle /></Avatar>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="lg" sx={{ mt: 4, pb: 4, flexGrow: 1, overflowX: 'hidden' }}>
                    {view === 'dashboard' ? renderDashboard() :
                        view === 'attendance' ? renderAttendance() :
                            view === 'performance' ? renderPerformance() :
                                view === 'gallery' ? renderGallery() :
                                    view === 'payments' ? renderPayments() :
                                        view === 'tracking' ? renderBusTracking() :
                                            view === 'feedback' ? renderFeedback() : (
                                            <Paper sx={{ p: 5, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', textAlign: 'center' }}>
                                                <Typography variant="h4" sx={{ fontWeight: 800, color: dark.accent, mb: 2 }}>
                                                    {view.charAt(0).toUpperCase() + view.slice(1)}
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: dark.textSecondary }}>
                                                    Feature coming soon.
                                                </Typography>
                                            </Paper>
                                        )}
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

export default ParentDashboard;
