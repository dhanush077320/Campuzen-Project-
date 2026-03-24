import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, List, ListItemIcon, ListItemText,
    Typography, Container, Paper, TextField, Button, Grid,
    MenuItem, Select, FormControl, InputLabel, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, AppBar, Toolbar, Avatar, Menu, ListItemButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import {
    AppRegistration, RateReview, Delete, CalendarToday, Save,
    Collections, CloudUpload, Event, Dashboard, People,
    SupervisorAccount, Badge, AccountCircle, ExitToApp,
    Person as PersonIcon, Add as AddIcon, School, Notifications,
    AccountBalanceWallet, Paid, Mail, FilterList, Search,
    Edit, Block, RestoreFromTrash, Menu as MenuIcon, DirectionsBus
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

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

const CollegeDashboard = () => {
    const [view, setView] = useState('overview');
    const [users, setUsers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        password: '',
        email: '',
        phoneNumber: '',
        role: 'student'
    });

    const [enrollData, setEnrollData] = useState({
        studentUsername: '',
        department: '',
        batch: '',
        class: '',
        semester: '',
        subjects: ''
    });

    const [facultyRole, setFacultyRole] = useState('all');
    const [facultyUsers, setFacultyUsers] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceMarks, setAttendanceMarks] = useState({});
    const [galleryItems, setGalleryItems] = useState([]);
    const [galleryForm, setGalleryForm] = useState({
        eventName: '',
        file: null,
        fileName: '',
        fileType: '',
        fileData: ''
    });
    const [salaryForm, setSalaryForm] = useState({
        staffUsername: '',
        baseSalary: '',
        bonus: '',
        netPayable: 0,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
    });

    const [notificationForm, setNotificationForm] = useState({
        role: 'student',
        department: '',
        batch: '',
        class: '',
        semester: '',
        subject: '',
        message: ''
    });
    const [enrollmentFilters, setEnrollmentFilters] = useState({
        departments: [],
        batches: [],
        classes: [],
        semesters: []
    });
    const [filteredUsersCount, setFilteredUsersCount] = useState(0);
    const [allPayments, setAllPayments] = useState([]);
    const [paymentForm, setPaymentForm] = useState({
        subject: '',
        description: '',
        amount: '',
        parentUsername: '',
        department: '',
        batch: '',
        class: '',
        semester: ''
    });
    const [matchingParents, setMatchingParents] = useState([]);
    const [enrolledStudentUsernames, setEnrolledStudentUsernames] = useState([]);
    const [teacherData, setTeacherData] = useState({ department: '', subject: '' });
    const [allEnrollments, setAllEnrollments] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [qrScannerActive, setQrScannerActive] = useState(false);
    const [qrScanner, setQrScanner] = useState(null);
    const [scanMessage, setScanMessage] = useState({ text: '', type: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const [driverData, setDriverData] = useState({
        startingPoint: '',
        nextDestination: '',
        endPoint: '',
        stops: []
    });

    const handleAddStop = () => {
        setDriverData({ ...driverData, stops: [...driverData.stops, ''] });
    };

    const handleStopChange = (index, value) => {
        const newStops = [...driverData.stops];
        newStops[index] = value;
        setDriverData({ ...driverData, stops: newStops });
    };

    const handleRemoveStop = (index) => {
        const newStops = driverData.stops.filter((_, i) => i !== index);
        setDriverData({ ...driverData, stops: newStops });
    };

    const getCoordinates = async (address) => {
        if (!address) return null;
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
            if (response.data && response.data.length > 0) {
                return {
                    lat: parseFloat(response.data[0].lat),
                    lng: parseFloat(response.data[0].lon)
                };
            }
        } catch (error) {
            console.error("Geocoding error for:", address, error);
        }
        return null;
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navigate = useNavigate();

    useEffect(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (!loggedInUser || loggedInUser.role !== 'college') {
            navigate('/login');
        } else {
            setUser(loggedInUser);
        }
        fetchUsers();
        fetchFeedbacks();
        fetchEnrolledStudents();
        fetchAllEnrollments();

        return () => {
            if (qrScanner) {
                qrScanner.stop().catch(err => console.error(err));
            }
        };
    }, [navigate]);

    const startScanner = () => {
        if (qrScannerActive) return;
        setQrScannerActive(true); // Ensure container is visible
        
        // Give time for the "reader" div to mount/become visible
        setTimeout(() => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                setQrScanner(html5QrCode);
                html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        handleQrScanSuccess(decodedText);
                    },
                    () => {} 
                ).then(() => {
                    setScanMessage({ text: 'Scanner active. Show ID card QR.', type: 'info' });
                }).catch((err) => {
                    console.error("Scanner start error:", err);
                    setScanMessage({ text: "Failed to start camera. Ensure permissions.", type: "error" });
                    setQrScannerActive(false);
                });
            } catch (err) {
                console.error("Scanner init error:", err);
                setScanMessage({ text: "Scanner initialization failed.", type: "error" });
                setQrScannerActive(false);
            }
        }, 300);
    };

    const stopScanner = () => {
        if (qrScanner) {
            qrScanner.stop().then(() => {
                setQrScannerActive(false);
                setQrScanner(null);
                setScanMessage({ text: '', type: '' });
            }).catch(err => console.error("Scanner stop error", err));
        }
    };

    const handleQrScanSuccess = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.type !== 'attendance_auth') {
                setScanMessage({ text: "Invalid QR code format", type: "error" });
                return;
            }

            // Find user in global users list to get correct role and fullName
            const scannedUser = users.find(u => u.username === data.user);
            if (!scannedUser) {
                setScanMessage({ text: "User not found in database", type: "error" });
                return;
            }
            // Mark attendance in backend
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/faculty-attendance/scan`, {
                username: scannedUser.username,
                fullName: scannedUser.fullName,
                role: scannedUser.role
            });

            setScanMessage({ text: `Attendance marked for ${scannedUser.fullName} (${scannedUser.role}) at ${response.data.attendance.time} - Status: ${response.data.attendance.status}`, type: 'success' });
            
            // Auto-refresh the current view's list
            fetchFacultyForAttendance(facultyRole); 
        } catch (err) {
            console.error("QR Processing Error:", err);
            const msg = err.response?.data?.message || "Error marking attendance. Unknown User or Network Error.";
            setScanMessage({ text: msg, type: "error" });
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchEnrolledStudents = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/search`);
            setEnrolledStudentUsernames(response.data.map(stu => stu.username));
        } catch (error) {
            console.error('Error fetching enrolled students:', error);
        }
    };

    const fetchAllEnrollments = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/search`);
            const enrollmentDetails = [];
            for (const stu of response.data) {
                try {
                    const enrollRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/student/${stu.username}`);
                    enrollmentDetails.push(enrollRes.data);
                } catch (e) { /* skip */ }
            }
            setAllEnrollments(enrollmentDetails);
        } catch (error) {
            console.error('Error fetching all enrollments:', error);
        }
    };

    const fetchFeedbacks = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedbacks`);
            setFeedbacks(response.data);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/feedbacks/${id}`);
            alert('Feedback deleted successfully');
            fetchFeedbacks();
        } catch (error) {
            alert('Failed to delete feedback');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleToggleBlock = async (u) => {
        try {
            const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/${u._id}/toggle-block`);
            alert(response.data.message);
            fetchUsers();
        } catch (error) {
            console.error('Toggle block error:', error);
            alert('Failed to toggle block status');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`);
            alert("User deleted successfully");
            fetchUsers();
        } catch (error) {
            console.error('Delete user error:', error);
            alert("Failed to delete user");
        }
    };

    const handleOpenEdit = (u) => {
        setEditingUser({ ...u });
        setIsEditDialogOpen(true);
    };

    const handleCloseEdit = () => {
        setIsEditDialogOpen(false);
        setEditingUser(null);
    };

    const handleSaveEdit = async () => {
        try {
            const payload = { ...editingUser };
            
            if (editingUser.role === 'driver') {
                // Geocode itinerary if it's a driver
                payload.startingPointCoords = await getCoordinates(editingUser.startingPoint);
                payload.nextDestinationCoords = await getCoordinates(editingUser.nextDestination);
                payload.endPointCoords = await getCoordinates(editingUser.endPoint);
                
                const stopCoords = [];
                if (editingUser.stops && Array.isArray(editingUser.stops)) {
                    for (const stop of editingUser.stops) {
                        if (stop && stop.trim()) {
                            const coords = await getCoordinates(stop);
                            if (coords) stopCoords.push({ ...coords, name: stop });
                        }
                    }
                }
                payload.stopCoords = stopCoords;
            }

            await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/${editingUser._id}`, payload);
            alert("User updated successfully");
            handleCloseEdit();
            fetchUsers();
        } catch (error) {
            console.error('Update user error:', error);
            alert("Failed to update user");
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, photo: reader.result });
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.photo) {
            alert('Please upload a photo before creating the user.');
            return;
        }
        try {
            const payload = { ...formData };
            if (formData.role === 'teacher') {
                payload.department = teacherData.department;
                payload.subject = teacherData.subject;
            }
            if (formData.role === 'driver') {
                const nextBusRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/next-bus-number`);
                payload.busNumber = nextBusRes.data.nextBusNumber;
                payload.startingPoint = driverData.startingPoint;
                payload.nextDestination = driverData.nextDestination;
                payload.endPoint = driverData.endPoint;
                payload.stops = driverData.stops;

                // Geocode itinerary
                payload.startingPointCoords = await getCoordinates(driverData.startingPoint);
                payload.nextDestinationCoords = await getCoordinates(driverData.nextDestination);
                payload.endPointCoords = await getCoordinates(driverData.endPoint);
                
                const stopCoords = [];
                for (const stop of driverData.stops) {
                    const coords = await getCoordinates(stop);
                    if (coords) stopCoords.push({ ...coords, name: stop });
                }
                payload.stopCoords = stopCoords;
            }
            await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, payload);
            
            if (formData.role === 'student') {
                const subjectsArray = enrollData.subjects.split(',').map(s => s.trim()).filter(s => s !== '');
                const payload = { 
                    studentUsername: formData.username,
                    department: enrollData.department,
                    batch: enrollData.batch,
                    class: enrollData.class,
                    semester: enrollData.semester,
                    subjects: subjectsArray 
                };
                await axios.post(`${import.meta.env.VITE_API_URL}/api/enrollments`, payload);
                fetchEnrolledStudents();
            }

            alert(formData.role === 'student' ? 'Student created and enrolled successfully!' : 'User created successfully!');
            
            setFormData({
                fullName: '',
                username: '',
                password: '',
                email: '',
                phoneNumber: '',
                role: 'student',
                photo: ''
            });
            setPhotoPreview(null);
            setEnrollData({
                studentUsername: '',
                department: '',
                batch: '',
                class: '',
                semester: '',
                subjects: ''
            });
            setTeacherData({ department: '', subject: '' });
            setDriverData({
                startingPoint: '',
                nextDestination: '',
                endPoint: '',
                stops: []
            });

            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create user or enroll student');
        }
    };



    const fetchFacultyForAttendance = async (role) => {
        try {
            // 1. Fetch users for the role
            const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/role/${role}`);
            const users = usersRes.data;

            // 2. Fetch attendance for the role/date
            const attendanceRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/faculty-attendance/role/${role}`, {
                params: { date: attendanceDate }
            });
            const attendanceMap = {};
            const timeMap = {};
            attendanceRes.data.forEach(rec => {
                attendanceMap[rec.username] = rec.status;
                timeMap[rec.username] = rec.time;
            });

            // 3. Merge attendance into facultyUsers list
            const mergedUsers = users.map(u => ({
                ...u,
                status: attendanceMap[u.username] || 'Absent',
                time: timeMap[u.username] || null
            }));

            setFacultyUsers(mergedUsers);

            // 4. Update attendanceMarks state for manual controls
            const marks = {};
            mergedUsers.forEach(u => {
                marks[u.username] = u.status;
            });
            setAttendanceMarks(marks);

        } catch (error) {
            console.error('Error fetching faculty attendance:', error);
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
        if (view === 'upload-attendance') {
            fetchFacultyForAttendance(facultyRole);
        }
        if (view === 'manage-gallery') {
            fetchGallery();
        }
        if (view === 'payroll') {
            fetchFacultyForAttendance('staff'); 
        }
        if (view === 'notifications' || view === 'payments') {
            fetchEnrollmentFilters();
        }
        if (view === 'payments') {
            fetchAllPayments();
        }
    }, [view, facultyRole, attendanceDate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGalleryForm({
                    ...galleryForm,
                    file: file,
                    fileName: file.name,
                    fileType: file.type,
                    fileData: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchEnrollmentFilters = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/filters`);
            setEnrollmentFilters(response.data);
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    const handleSearchRecipients = async () => {
        if (notificationForm.role === 'student' || notificationForm.role === 'parent') {
            try {
                const { department, batch, semester, class: className } = notificationForm;
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/search`, {
                    params: { department, batch, semester, class: className }
                });
                setFilteredUsersCount(response.data.length);
                alert(`Search complete! Found ${response.data.length} potential recipients.`);
            } catch (error) {
                alert('Search failed');
            }
        } else {
            const count = users.filter(u => u.role === notificationForm.role).length;
            setFilteredUsersCount(count);
            alert(`Found ${count} ${notificationForm.role} members.`);
        }
    };

    const handleSendNotification = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/send-email`, notificationForm);
            alert(response.data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send notification');
        }
    };

    const handleGallerySubmit = async (e) => {
        e.preventDefault();
        if (!galleryForm.eventName || !galleryForm.fileData) {
            alert('Please provide event name and select a file');
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/gallery`, {
                eventName: galleryForm.eventName,
                fileName: galleryForm.fileName,
                fileType: galleryForm.fileType,
                fileData: galleryForm.fileData
            });
            alert('Gallery item posted successfully');
            setGalleryForm({ eventName: '', file: null, fileName: '', fileType: '', fileData: '' });
            fetchGallery();
        } catch (error) {
            alert('Failed to post gallery item');
        }
    };

    const handleDeleteGalleryItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/gallery/${id}`);
            alert('Deleted successfully');
            fetchGallery();
        } catch (error) {
            alert('Failed to delete item');
        }
    };

    useEffect(() => {
        const base = parseFloat(salaryForm.baseSalary) || 0;
        const bonus = parseFloat(salaryForm.bonus) || 0;
        setSalaryForm(prev => ({ ...prev, netPayable: base + bonus }));
    }, [salaryForm.baseSalary, salaryForm.bonus]);

    const handleSalarySubmit = async (e) => {
        e.preventDefault();
        try {
            const staff = facultyUsers.find(u => u.username === salaryForm.staffUsername);
            await axios.post(`${import.meta.env.VITE_API_URL}/api/salary`, {
                ...salaryForm,
                staffFullName: staff?.fullName || ''
            });
            alert('Salary details updated successfully');
            setSalaryForm({
                staffUsername: '',
                baseSalary: '',
                bonus: '',
                netPayable: 0,
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            alert('Failed to update salary details');
        }
    };

    const fetchAllPayments = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/all`);
            setAllPayments(response.data);
            // Default matching parents to all parents initially
            setMatchingParents(users.filter(u => u.role === 'parent'));
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handleSearchMatchingParents = async () => {
        try {
            const { department, batch, semester, class: className } = paymentForm;
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/enrollments/search`, {
                params: { department, batch, semester, class: className }
            });
            const studentUsernames = response.data.map(s => s.username);

            // Filter global users to get parents who have these usernames
            const filteredParents = users.filter(u => u.role === 'parent' && studentUsernames.includes(u.username));
            setMatchingParents(filteredParents);

            if (filteredParents.length === 0) {
                alert('No parents found for these criteria');
            } else {
                alert(`Found ${filteredParents.length} matching parents`);
            }
        } catch (error) {
            console.error('Search Parents Error:', error);
            alert('Failed to search parents');
        }
    };

    const handlePaymentRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/request`, {
                ...paymentForm,
                collegeUsername: user.username
            });
            alert('Payment request sent successfully');
            setPaymentForm({
                subject: '', description: '', amount: '', parentUsername: '',
                department: '', batch: '', class: '', semester: ''
            });
            fetchAllPayments();
        } catch (error) {
            alert('Failed to send payment request');
        }
    };

    const renderPayments = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Payment Management
            </Typography>
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, color: dark.text }}>Send Payment Request</Typography>
                <form onSubmit={handlePaymentRequestSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Course</InputLabel>
                                <Select
                                    value={paymentForm.department}
                                    label="Course"
                                    onChange={(e) => setPaymentForm({ ...paymentForm, department: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="">Select Course</MenuItem>
                                    {enrollmentFilters.departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={paymentForm.batch}
                                    label="Department"
                                    onChange={(e) => setPaymentForm({ ...paymentForm, batch: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="">Select Department</MenuItem>
                                    {enrollmentFilters.batches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Batch</InputLabel>
                                <Select
                                    value={paymentForm.class}
                                    label="Batch"
                                    onChange={(e) => setPaymentForm({ ...paymentForm, class: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="">Select Batch</MenuItem>
                                    {enrollmentFilters.classes.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Semester</InputLabel>
                                <Select
                                    value={paymentForm.semester}
                                    label="Semester"
                                    onChange={(e) => setPaymentForm({ ...paymentForm, semester: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="">Select Semester</MenuItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <MenuItem key={s} value={`Semester ${s}`}>Semester {s}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<Search />}
                                onClick={handleSearchMatchingParents}
                                sx={{ color: dark.accent, borderColor: dark.accent, height: '100%', py: 1.5, borderRadius: '12px', fontWeight: 800 }}
                            >
                                Filter Parents
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Subject"
                                required
                                value={paymentForm.subject}
                                onChange={(e) => setPaymentForm({ ...paymentForm, subject: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Target Parent</InputLabel>
                                <Select
                                    value={paymentForm.parentUsername}
                                    label="Target Parent"
                                    required
                                    onChange={(e) => setPaymentForm({ ...paymentForm, parentUsername: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    {matchingParents.map(u => (
                                        <MenuItem key={u.username} value={u.username}>{u.fullName} (@{u.username})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Amount"
                                required
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={2}
                                value={paymentForm.description}
                                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={12}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                startIcon={<Paid />}
                                sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                            >
                                Request Payment
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <Typography variant="h6" sx={{ mb: 3, color: dark.text }}>Payment History</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                            <TableCell>Parent</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell align="center">Amount</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allPayments.map((p) => (
                            <TableRow key={p._id} sx={{ '& td': { borderColor: dark.border } }}>
                                <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{p.parentUsername}</TableCell>
                                <TableCell sx={{ color: dark.text }}>{p.subject}</TableCell>
                                <TableCell align="center" sx={{ color: dark.text, fontWeight: 700 }}>₹{p.amount}</TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={p.status}
                                        sx={{
                                            bgcolor: p.status === 'Paid' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                            color: p.status === 'Paid' ? dark.success : '#ff9800',
                                            fontWeight: 800
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center" sx={{ color: dark.textSecondary }}>
                                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderPayrollManagement = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Payroll Management
            </Typography>
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <form onSubmit={handleSalarySubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Select Staff</InputLabel>
                                <Select
                                    value={salaryForm.staffUsername}
                                    label="Select Staff"
                                    required
                                    onChange={(e) => setSalaryForm({ ...salaryForm, staffUsername: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    {users.filter(u => u.role === 'staff').map(u => (
                                        <MenuItem key={u.username} value={u.username}>{u.fullName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Payment Date"
                                InputLabelProps={{ shrink: true }}
                                value={salaryForm.date}
                                onChange={(e) => setSalaryForm({ ...salaryForm, date: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Base Salary"
                                required
                                value={salaryForm.baseSalary}
                                onChange={(e) => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Bonus/Incentives"
                                value={salaryForm.bonus}
                                onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                label="Net Payable"
                                value={salaryForm.netPayable}
                                disabled
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Payment Status</InputLabel>
                                <Select
                                    value={salaryForm.status}
                                    label="Payment Status"
                                    onChange={(e) => setSalaryForm({ ...salaryForm, status: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="Paid">Paid</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                startIcon={<Paid />}
                                sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' }, height: '100%' }}
                            >
                                Submit Salary
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );

    const renderManageGallery = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Manage Event Gallery
            </Typography>

            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <form onSubmit={handleGallerySubmit}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                fullWidth
                                label="Event Name"
                                required
                                value={galleryForm.eventName}
                                onChange={(e) => setGalleryForm({ ...galleryForm, eventName: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Button
                                component="label"
                                fullWidth
                                variant="outlined"
                                startIcon={<CloudUpload />}
                                sx={{
                                    py: 1.5,
                                    borderRadius: '12px',
                                    color: dark.textSecondary,
                                    borderColor: dark.border,
                                    textTransform: 'none',
                                    '&:hover': { borderColor: dark.accent, color: dark.text }
                                }}
                            >
                                {galleryForm.fileName || "Upload Image/Document"}
                                <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                            >
                                Post
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <Grid container spacing={3}>
                {galleryItems.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item._id}>
                        <Paper sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, overflow: 'hidden', height: '100%', position: 'relative' }}>
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
                                <IconButton
                                    onClick={() => handleDeleteGalleryItem(item._id)}
                                    sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.5)', color: dark.danger, '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    // Removed manual attendance functions as per scan-only requirement

    const renderUploadAttendance = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Upload Faculty Attendance
            </Typography>
            {/* NEW: Smart QR Scanner Section */}
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: dark.text, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Badge sx={{ color: dark.accent }} /> Smart QR Attendance Scanner
                </Typography>
                
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    {!qrScannerActive ? (
                        <Button
                            variant="contained"
                            startIcon={<PersonIcon />}
                            onClick={startScanner}
                            sx={{ bgcolor: dark.accent, borderRadius: '12px', px: 4 }}
                        >
                            Open Camera Scanner
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            onClick={stopScanner}
                            sx={{ color: dark.danger, borderColor: dark.danger, borderRadius: '12px', px: 4 }}
                        >
                            Stop Scanner
                        </Button>
                    )}
                </Box>

                <Box sx={{ 
                    mb: 3, 
                    mx: 'auto', 
                    maxWidth: '400px', 
                    minHeight: qrScannerActive ? '300px' : '0',
                    display: qrScannerActive ? 'block' : 'none', 
                    overflow: 'hidden', 
                    borderRadius: '16px', 
                    border: `2px solid ${dark.accent}`,
                    position: 'relative',
                    bgcolor: '#000',
                    boxShadow: `0 0 20px ${dark.accentFaded}`,
                    transition: 'all 0.3s ease'
                }}>
                    <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                    {qrScannerActive && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            pointerEvents: 'none',
                            border: `2px solid ${dark.accent}`,
                            borderRadius: '16px',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                                '0%': { boxShadow: `inset 0 0 10px ${dark.accent}` },
                                '50%': { boxShadow: `inset 0 0 40px ${dark.accent}` },
                                '100%': { boxShadow: `inset 0 0 10px ${dark.accent}` },
                            }
                        }} />
                    )}
                </Box>

                {scanMessage.text && (
                    <Chip 
                        label={scanMessage.text} 
                        color={scanMessage.type === 'success' ? 'success' : scanMessage.type === 'error' ? 'error' : 'info'}
                        sx={{ fontWeight: 700, px: 2 }}
                    />
                )}
            </Paper>

            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, color: dark.text }}>Daily Attendance Records</Typography>
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth sx={selectDarkSx}>
                            <InputLabel>Select Role</InputLabel>
                            <Select
                                value={facultyRole}
                                label="Select Role"
                                onChange={(e) => setFacultyRole(e.target.value)}
                                MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                            >
                                <MenuItem value="all">All Faculty</MenuItem>
                                <MenuItem value="teacher">Teacher</MenuItem>
                                <MenuItem value="staff">Staff</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            type="date"
                            label="View Records for Date"
                            InputLabelProps={{ shrink: true }}
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            sx={textFieldDarkSx}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { borderColor: dark.border, color: dark.textSecondary, fontWeight: 700 } }}>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell align="center">Time</TableCell>
                            <TableCell align="center">Attendance Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {facultyUsers.map((u) => (
                            <TableRow key={u.username} sx={{ '& td': { borderColor: dark.border } }}>
                                <TableCell sx={{ color: dark.text, fontWeight: 600 }}>{u.fullName}</TableCell>
                                <TableCell sx={{ color: dark.textSecondary }}>@{u.username}</TableCell>
                                <TableCell align="center" sx={{ color: dark.accent, fontWeight: 700 }}>{u.time || '—'}</TableCell>
                                 <TableCell align="center">
                                    <Chip 
                                        label={u.status || 'Absent'}
                                        sx={{
                                            bgcolor: u.status === 'Present' ? 'rgba(76, 175, 80, 0.15)' : 
                                                     u.status === 'Half day' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 82, 82, 0.15)',
                                            color: u.status === 'Present' ? '#4caf50' : 
                                                   u.status === 'Half day' ? '#ff9800' : '#ff5252',
                                            fontWeight: 800
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderOverview = () => (
        <Grid container spacing={4}>
            <Grid size={12}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                    Dashboard Overview
                </Typography>
            </Grid>
            {[
                { title: 'Total Students', count: users.filter(u => u.role === 'student').length, icon: <School />, color: '#4dabf5' },
                { title: 'Total Teachers', count: users.filter(u => u.role === 'teacher').length, icon: <SupervisorAccount />, color: '#ff9800' },
                { title: 'Total Staff', count: users.filter(u => u.role === 'staff').length, icon: <Badge />, color: '#4caf50' },
                { title: 'Total Drivers', count: users.filter(u => u.role === 'driver').length, icon: <DirectionsBus />, color: '#7c4dff' },
                { title: 'Total Parents', count: users.filter(u => u.role === 'parent').length, icon: <PersonIcon />, color: '#ff5252' },
            ].map((stat, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                    <Paper sx={{ p: 3, borderRadius: '16px', textAlign: 'center', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                        <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, mx: 'auto', mb: 2 }}>{stat.icon}</Avatar>
                        <Typography variant="h6" sx={{ color: dark.text }}>{stat.title}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: dark.text }}>{stat.count}</Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );

    const renderNotifications = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Email Notifications
            </Typography>
            <Paper sx={{ p: 4, borderRadius: '24px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none', mb: 4 }}>
                <form onSubmit={handleSendNotification}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Recipient Role</InputLabel>
                                <Select
                                    value={notificationForm.role}
                                    label="Recipient Role"
                                    onChange={(e) => setNotificationForm({ ...notificationForm, role: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="student">Students</MenuItem>
                                    <MenuItem value="parent">Parents</MenuItem>
                                    <MenuItem value="teacher">Teachers</MenuItem>
                                    <MenuItem value="staff">Staff</MenuItem>
                                    <MenuItem value="driver">Drivers</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {(notificationForm.role === 'student' || notificationForm.role === 'parent') && (
                            <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth sx={selectDarkSx}>
                                        <InputLabel>Course</InputLabel>
                                        <Select
                                            value={notificationForm.department}
                                            label="Course"
                                            onChange={(e) => setNotificationForm({ ...notificationForm, department: e.target.value })}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                        >
                                            <MenuItem value="">All Courses</MenuItem>
                                            {enrollmentFilters.departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControl fullWidth sx={selectDarkSx}>
                                        <InputLabel>Department</InputLabel>
                                        <Select
                                            value={notificationForm.batch}
                                            label="Department"
                                            onChange={(e) => setNotificationForm({ ...notificationForm, batch: e.target.value })}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                        >
                                            <MenuItem value="">All Departments</MenuItem>
                                            {enrollmentFilters.batches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControl fullWidth sx={selectDarkSx}>
                                        <InputLabel>Semester</InputLabel>
                                        <Select
                                            value={notificationForm.semester}
                                            label="Semester"
                                            onChange={(e) => setNotificationForm({ ...notificationForm, semester: e.target.value })}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                        >
                                            <MenuItem value="">All Semesters</MenuItem>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <MenuItem key={s} value={`Semester ${s}`}>Semester {s}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <FormControl fullWidth sx={selectDarkSx}>
                                        <InputLabel>Batch</InputLabel>
                                        <Select
                                            value={notificationForm.class}
                                            label="Batch"
                                            onChange={(e) => setNotificationForm({ ...notificationForm, class: e.target.value })}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                        >
                                            <MenuItem value="">All Batches</MenuItem>
                                            {enrollmentFilters.classes.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={12}>
                                    <Button variant="outlined" startIcon={<Search />} onClick={handleSearchRecipients} sx={{ color: dark.accent, borderColor: dark.accent }}>
                                        Search matching users
                                    </Button>
                                </Grid>
                            </>
                        )}

                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Subject"
                                required
                                value={notificationForm.subject}
                                onChange={(e) => setNotificationForm({ ...notificationForm, subject: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="Notification Message"
                                required
                                value={notificationForm.message}
                                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </Grid>
                        <Grid size={12}>
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                startIcon={<Mail />}
                                sx={{ bgcolor: dark.accent, py: 1.5, borderRadius: '12px', fontWeight: 800, '&:hover': { bgcolor: '#6a3de8' } }}
                            >
                                Send Notifications
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );

    const renderManageUsers = () => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                Manage Users
            </Typography>
            <Paper sx={{ p: 4, mb: 4, borderRadius: '16px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ mb: 3, color: dark.text }}>Add New User</Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Full Name" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} sx={textFieldDarkSx} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Username" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} sx={textFieldDarkSx} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} sx={textFieldDarkSx} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} sx={textFieldDarkSx} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Phone Number" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} sx={textFieldDarkSx} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<CloudUpload />}
                                    sx={{ color: dark.accent, borderColor: dark.accent, textTransform: 'none', py: 1.5, flex: 1 }}
                                >
                                    Upload Photo *
                                    <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                                </Button>
                                {photoPreview && (
                                    <Avatar src={photoPreview} sx={{ width: 48, height: 48, border: `2px solid ${dark.accent}` }} />
                                )}
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth sx={selectDarkSx}>
                                <InputLabel>Role</InputLabel>
                                <Select label="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                >
                                    <MenuItem value="student">Student</MenuItem>
                                    <MenuItem value="teacher">Teacher</MenuItem>
                                    <MenuItem value="staff">Staff</MenuItem>
                                    <MenuItem value="driver">Driver</MenuItem>
                                    <MenuItem value="parent">Parent</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {formData.role === 'student' && (
                            <>
                                <Grid size={12}>
                                    <Divider sx={{ borderColor: dark.border, my: 2 }} />
                                    <Typography variant="h6" sx={{ color: dark.text }}>Course Enrollment Details</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Course (e.g. B.Tech, BSC)"
                                        required
                                        value={enrollData.department}
                                        onChange={(e) => setEnrollData({ ...enrollData, department: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Department (e.g. Computer Science)"
                                        required
                                        value={enrollData.batch}
                                        onChange={(e) => setEnrollData({ ...enrollData, batch: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth sx={selectDarkSx}>
                                        <InputLabel>Semester</InputLabel>
                                        <Select
                                            label="Semester"
                                            value={enrollData.semester}
                                            onChange={(e) => setEnrollData({ ...enrollData, semester: e.target.value })}
                                            MenuProps={{ PaperProps: { sx: { bgcolor: dark.surface, color: dark.text, border: `1px solid ${dark.border}` } } }}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                                <MenuItem key={num} value={`Semester ${num}`}>Semester {num}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Batch (e.g. A, B, C)"
                                        required
                                        value={enrollData.class}
                                        onChange={(e) => setEnrollData({ ...enrollData, class: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Subjects (Separate by comma, e.g. Math, Physics)"
                                        required
                                        multiline
                                        rows={2}
                                        value={enrollData.subjects}
                                        onChange={(e) => setEnrollData({ ...enrollData, subjects: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                            </>
                        )}

                        {formData.role === 'teacher' && (
                            <>
                                <Grid size={12}>
                                    <Divider sx={{ borderColor: dark.border, my: 2 }} />
                                    <Typography variant="h6" sx={{ color: dark.text }}>Teacher Details</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Department"
                                        required
                                        value={teacherData.department}
                                        onChange={(e) => setTeacherData({ ...teacherData, department: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Subject (e.g. Maths, Physics)"
                                        required
                                        helperText="Separate multiple subjects with commas"
                                        value={teacherData.subject}
                                        onChange={(e) => setTeacherData({ ...teacherData, subject: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                            </>
                        )}

                        {formData.role === 'driver' && (
                            <>
                                <Grid size={12}>
                                    <Divider sx={{ borderColor: dark.border, my: 2 }} />
                                    <Typography variant="h6" sx={{ color: dark.text }}>Driver Itinerary Details</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Starting Point"
                                        required
                                        value={driverData.startingPoint}
                                        onChange={(e) => setDriverData({ ...driverData, startingPoint: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Next Destination"
                                        required
                                        value={driverData.nextDestination}
                                        onChange={(e) => setDriverData({ ...driverData, nextDestination: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12 }}>
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography sx={{ color: dark.textSecondary, fontWeight: 700 }}>Additional Destinations (Stops)</Typography>
                                            <Button 
                                                size="small" 
                                                startIcon={<AddIcon />} 
                                                onClick={handleAddStop}
                                                sx={{ color: dark.accent, fontWeight: 700 }}
                                            >
                                                Add Stop
                                            </Button>
                                        </Box>
                                        <Grid container spacing={2}>
                                            {driverData.stops.map((stop, index) => (
                                                <Grid size={{ xs: 12, sm: 6 }} key={index}>
                                                    <TextField
                                                        fullWidth
                                                        label={`Stop ${index + 1}`}
                                                        value={stop}
                                                        onChange={(e) => handleStopChange(index, e.target.value)}
                                                        sx={textFieldDarkSx}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <IconButton size="small" onClick={() => handleRemoveStop(index)} sx={{ color: dark.danger }}>
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            )
                                                        }}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="End Point"
                                        required
                                        value={driverData.endPoint}
                                        onChange={(e) => setDriverData({ ...driverData, endPoint: e.target.value })}
                                        sx={textFieldDarkSx}
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid size={12}>
                            <Button variant="contained" type="submit" startIcon={<AddIcon />} sx={{ backgroundColor: dark.accent, px: 4, py: 1.5, borderRadius: '10px', '&:hover': { backgroundColor: '#6a3de8' } }}>
                                Create User
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

        </Box>
    );

    const getEnrollmentForStudent = (username) => {
        return allEnrollments.find(e => e.studentUsername === username);
    };

    const generateIDCard = async (student) => {
        const enrollment = getEnrollmentForStudent(student.username);
        // Portrait ID card
        const cardW = 80;
        const cardH = 130;
        const doc = new jsPDF({ unit: 'mm', format: [cardW, cardH] });
        const cx = cardW / 2;

        // ─── White background ───
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, cardW, cardH, 'F');

        // ─── Top diagonal accent stripes ───
        // Blue stripe
        doc.setFillColor(41, 128, 205);
        doc.triangle(cardW - 35, 0, cardW, 0, cardW, 25, 'F');
        // Orange stripe (thinner accent)
        doc.setFillColor(230, 126, 34);
        doc.triangle(cardW - 20, 0, cardW, 0, cardW, 15, 'F');

        // ─── CampuZen badge (top-right) ───
        doc.setFillColor(255, 255, 255);
        doc.circle(cardW - 12, 12, 8, 'F');
        doc.setFontSize(4);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 205);
        doc.text('CAMPUZEN', cardW - 12, 13, { align: 'center' });

        // ─── Photo (Rounded Square Frame) ───
        const photoSize = 32;
        const photoY = 30;
        const radius = 3;
        
        // Frame/Border
        doc.setDrawColor(41, 128, 205);
        doc.setLineWidth(1);
        doc.roundedRect(cx - (photoSize / 2), photoY, photoSize, photoSize, radius, radius, 'D');

        if (student.photo) {
            try {
                const format = student.photo.includes('image/png') ? 'PNG' : 'JPEG';
                // Add photo inside the frame (slight inset)
                doc.addImage(student.photo, format, cx - (photoSize / 2) + 1, photoY + 1, photoSize - 2, photoSize - 2);
            } catch (e) {
                console.error('Photo addition failed:', e);
                doc.setFillColor(240, 240, 240);
                doc.roundedRect(cx - (photoSize / 2) + 1, photoY + 1, photoSize - 2, photoSize - 2, 2, 2, 'F');
                doc.setFontSize(6);
                doc.setTextColor(150, 150, 150);
                doc.text('IMAGE ERR', cx, photoY + (photoSize / 2), { align: 'center' });
            }
        } else {
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(cx - (photoSize / 2) + 1, photoY + 1, photoSize - 2, photoSize - 2, 2, 2, 'F');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('PHOTO', cx, photoY + (photoSize / 2), { align: 'center' });
        }

        // ─── Student Name (large, centered) ───
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(student.fullName.toUpperCase(), cx, 72, { align: 'center' });

        // ─── "ROLE" subtitle/role ───
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 205);
        doc.text(`ROLE: ${student.role.toUpperCase()}`, cx, 77, { align: 'center' });

        // ─── QR Code (unique per student) ───
        try {
            // Using student._id and username ensures uniqueness for future attendance
            const qrData = JSON.stringify({ 
                uid: student._id, 
                user: student.username, 
                type: 'attendance_auth' 
            });
            const qrDataUrl = await QRCode.toDataURL(qrData, { 
                width: 200, 
                margin: 1, 
                color: { dark: '#1e1e1e', light: '#ffffff' } 
            });
            doc.addImage(qrDataUrl, 'PNG', cx - 9, 80, 18, 18);
        } catch (e) {
            console.error('QR generation failed:', e);
        }

        // ─── Detail fields ───
        let y = 102;
        const leftMargin = 12;

        const fields = [
            { label: 'ID NUMBER:', value: student.username },
            { label: student.role === 'student' ? 'COURSE:' : 'DEPT:', value: student.role === 'student' ? enrollment?.department : student.department || 'N/A' },
            { label: student.role === 'student' ? 'DEPT:' : 'SUBJECT:', value: student.role === 'student' ? enrollment?.batch : student.subject || 'N/A' },
            { label: 'PHONE:', value: student.phoneNumber || 'N/A' },
        ];

        fields.forEach(({ label, value }) => {
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(110, 110, 110);
            doc.text(label, leftMargin, y);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(41, 128, 205);
            doc.text(String(value), 35, y);
            y += 4.5;
        });

        // ─── Footer ───
        doc.setFillColor(15, 20, 37); // Dark theme matching sidebar
        doc.rect(0, cardH - 10, cardW, 10, 'F');
        
        // Footer accent line
        doc.setFillColor(230, 126, 34);
        doc.rect(0, cardH - 10, cardW, 1.2, 'F');

        doc.save(`ID_Card_${student.username}.pdf`);
    };

    const renderUserRecords = (role, title) => (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: dark.accent }}>
                {title}
            </Typography>
            <TableContainer component={Paper} sx={{ borderRadius: '16px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { borderColor: dark.border } }}>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary, width: '50px' }}>Photo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Phone</TableCell>
                            {(role === 'student' || role === 'teacher' || (role === 'staff' && false)) && (
                                <>
                                    <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>{role === 'student' ? 'Course' : 'Department'}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>{role === 'student' ? 'Department' : 'Subject'}</TableCell>
                                </>
                            )}
                            {role === 'driver' && (
                                <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Bus Number</TableCell>
                            )}
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.filter(u => u.role === role).map((u) => {
                            const enrollment = role === 'student' ? getEnrollmentForStudent(u.username) : null;
                            return (
                                <TableRow key={u._id} sx={{ '& td': { borderColor: dark.border } }}>
                                    <TableCell>
                                        <Avatar src={u.photo} sx={{ width: 32, height: 32, bgcolor: dark.accentFaded }}>
                                            {!u.photo && <AccountCircle sx={{ fontSize: 20 }} />}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell sx={{ color: dark.text }}>{u.fullName}</TableCell>
                                    <TableCell sx={{ color: dark.text }}>{u.username}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize', color: dark.text }}>{u.role}</TableCell>
                                    <TableCell sx={{ color: dark.text }}>{u.email}</TableCell>
                                    <TableCell sx={{ color: dark.text }}>{u.phoneNumber}</TableCell>
                                    {(role === 'student' || role === 'teacher' || (role === 'staff' && false)) && (
                                        <>
                                            <TableCell sx={{ color: dark.text }}>
                                                {role === 'student' ? enrollment?.department : u.department || '—'}
                                            </TableCell>
                                            <TableCell sx={{ color: dark.text }}>
                                                {role === 'student' ? enrollment?.batch : u.subject || '—'}
                                            </TableCell>
                                        </>
                                    )}
                                    {role === 'driver' && (
                                        <TableCell sx={{ color: dark.accent, fontWeight: 700 }}>{u.busNumber || '—'}</TableCell>
                                    )}
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Print ID Card">
                                                <IconButton size="small" onClick={() => generateIDCard(u)} sx={{ color: dark.accent }}>
                                                    <Badge fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit User">
                                                <IconButton size="small" onClick={() => handleOpenEdit(u)} sx={{ color: dark.textSecondary }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={u.isBlocked ? "Unblock User" : "Block User"}>
                                                <IconButton size="small" onClick={() => handleToggleBlock(u)} sx={{ color: u.isBlocked ? dark.success : dark.danger }}>
                                                    {u.isBlocked ? <RestoreFromTrash fontSize="small" /> : <Block fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete User">
                                                <IconButton size="small" onClick={() => handleDeleteUser(u._id)} sx={{ color: dark.danger }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );



    const renderFeedbacks = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: dark.accent }}>
                    User Feedbacks
                </Typography>
                <Button variant="outlined" startIcon={<RateReview />} onClick={fetchFeedbacks} sx={{ color: dark.accent, borderColor: dark.accent }}>
                    Refresh
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: '16px', bgcolor: dark.surface, border: `1px solid ${dark.border}`, boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { borderColor: dark.border } }}>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Sender</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Message</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: dark.textSecondary }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {feedbacks.map((f) => (
                            <TableRow key={f._id} sx={{ '& td': { borderColor: dark.border } }}>
                                <TableCell sx={{ color: dark.text }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.senderFullName}</Typography>
                                        <Typography variant="caption" sx={{ color: dark.textSecondary }}>@{f.senderUsername}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={f.senderRole} size="small" sx={{ bgcolor: dark.accentFaded, color: dark.accent, fontWeight: 700 }} />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={f.category}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            color: f.category === 'Academic' ? '#4dabf5' : '#ff9800',
                                            borderColor: f.category === 'Academic' ? '#4dabf5' : '#ff9800'
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ color: dark.text, maxWidth: '300px' }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{f.message}</Typography>
                                </TableCell>
                                <TableCell sx={{ color: dark.text }}>
                                    {new Date(f.timestamp).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleDeleteFeedback(f._id)} sx={{ color: dark.danger }}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderEditUserDialog = () => (
        <Dialog open={isEditDialogOpen} onClose={handleCloseEdit} PaperProps={{ sx: { bgcolor: dark.surface, color: dark.text, borderRadius: '24px', minWidth: '400px' } }}>
            <DialogTitle sx={{ fontWeight: 800, color: dark.accent }}>Edit User Details</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={editingUser?.photo || ''}
                            sx={{ width: 100, height: 100, bgcolor: dark.accentFaded }}
                        >
                            {!editingUser?.photo && <AccountCircle sx={{ fontSize: 60 }} />}
                        </Avatar>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUpload />}
                            sx={{ color: dark.accent, borderColor: dark.accent }}
                        >
                            Upload Photo
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    if (file.size > 500000) {
                                        alert('Image must be less than 500KB');
                                        return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setEditingUser({ ...editingUser, photo: reader.result });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            />
                        </Button>
                    </Box>
                    <TextField
                        fullWidth
                        label="Full Name"
                        value={editingUser?.fullName || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                        sx={textFieldDarkSx}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        value={editingUser?.email || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        sx={textFieldDarkSx}
                    />
                    <TextField
                        fullWidth
                        label="Phone Number"
                        value={editingUser?.phoneNumber || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                        sx={textFieldDarkSx}
                    />
                    {editingUser?.role === 'student' && (
                        <>
                            <TextField
                                fullWidth
                                label="Course"
                                value={editingUser?.department || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                            <TextField
                                fullWidth
                                label="Department"
                                value={editingUser?.subject || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, subject: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </>
                    )}
                    {editingUser?.role === 'teacher' && (
                        <>
                            <TextField
                                fullWidth
                                label="Department"
                                value={editingUser?.department || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                            <TextField
                                fullWidth
                                label="Subjects (comma separated)"
                                value={editingUser?.subject || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, subject: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </>
                    )}
                    {editingUser?.role === 'driver' && (
                        <>
                            <Divider sx={{ borderColor: dark.border, my: 1 }} />
                            <Typography sx={{ color: dark.text, fontWeight: 700 }}>Itinerary Details</Typography>
                            <TextField
                                fullWidth
                                label="Starting Point"
                                value={editingUser?.startingPoint || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, startingPoint: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                            <TextField
                                fullWidth
                                label="Next Destination"
                                value={editingUser?.nextDestination || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, nextDestination: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: dark.textSecondary }}>Stops</Typography>
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => setEditingUser({...editingUser, stops: [...(editingUser.stops || []), '']})}>
                                        Add Stop
                                    </Button>
                                </Box>
                                <Grid container spacing={2}>
                                    {(editingUser.stops || []).map((stop, idx) => (
                                        <Grid item xs={12} key={idx}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label={`Stop ${idx + 1}`}
                                                value={stop}
                                                onChange={(e) => {
                                                    const newStops = [...editingUser.stops];
                                                    newStops[idx] = e.target.value;
                                                    setEditingUser({ ...editingUser, stops: newStops });
                                                }}
                                                sx={textFieldDarkSx}
                                                InputProps={{
                                                    endAdornment: (
                                                        <IconButton size="small" onClick={() => {
                                                            const newStops = editingUser.stops.filter((_, i) => i !== idx);
                                                            setEditingUser({ ...editingUser, stops: newStops });
                                                        }} sx={{ color: dark.danger }}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    )
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                            <TextField
                                fullWidth
                                label="End Point"
                                value={editingUser?.endPoint || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, endPoint: e.target.value })}
                                sx={textFieldDarkSx}
                            />
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleCloseEdit} sx={{ color: dark.textSecondary }}>Cancel</Button>
                <Button onClick={handleSaveEdit} variant="contained" sx={{ bgcolor: dark.accent, '&:hover': { bgcolor: dark.accent }, borderRadius: '12px', px: 4 }}>Save Changes</Button>
            </DialogActions>
        </Dialog>
    );

    const drawer = (
        <>
            <Toolbar sx={{ my: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: dark.accent }}>CampuZen</Typography>
            </Toolbar>
            <Box sx={{ overflow: 'auto' }}>
                <List sx={{ px: 2 }}>
                    {[
                        { text: 'Overview', icon: <Dashboard />, val: 'overview' },
                        { text: 'Manage Users', icon: <People />, val: 'manage' },
                        { text: 'Student Records', icon: <School />, val: 'student-records' },
                        { text: 'Teacher Records', icon: <SupervisorAccount />, val: 'teacher-records' },
                        { text: 'Parent Records', icon: <PersonIcon />, val: 'parent-records' },
                        { text: 'Staff Records', icon: <Badge />, val: 'staff-records' },
                        { text: 'Driver Records', icon: <DirectionsBus />, val: 'driver-records' },
                        { text: 'Upload Attendance', icon: <CalendarToday />, val: 'upload-attendance' },
                        { text: 'Manage Gallery', icon: <Collections />, val: 'manage-gallery' },
                        { text: 'Payroll Management', icon: <AccountBalanceWallet />, val: 'payroll' },
                        { text: 'Payments', icon: <Paid />, val: 'payments' },
                        { text: 'Send Notifications', icon: <Mail />, val: 'notifications' },
                        { text: 'Feedbacks', icon: <RateReview />, val: 'feedbacks' },
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
                            <ListItemIcon sx={{ color: view === item.val ? dark.accent : dark.textSecondary }}>{item.icon}</ListItemIcon>
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
                        <Box sx={{ flexGrow: 1 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: '12px' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: dark.text, display: { xs: 'none', sm: 'block' } }}>
                                {user?.fullName || 'College Admin'}
                            </Typography>
                            <Avatar sx={{ bgcolor: dark.accent }}><AccountCircle /></Avatar>
                        </Box>
                    </Toolbar>
                </AppBar>
                <Container maxWidth="lg" sx={{ mt: 4, pb: 4, flexGrow: 1, overflowX: 'hidden' }}>
                    {view === 'overview' ? renderOverview() :
                        view === 'manage' ? renderManageUsers() :
                            view === 'student-records' ? renderUserRecords('student', 'Student Records') :
                            view === 'teacher-records' ? renderUserRecords('teacher', 'Teacher Records') :
                            view === 'parent-records' ? renderUserRecords('parent', 'Parent Records') :
                            view === 'staff-records' ? renderUserRecords('staff', 'Staff Records') :
                            view === 'driver-records' ? renderUserRecords('driver', 'Driver Records') :
                                view === 'upload-attendance' ? renderUploadAttendance() :
                                    view === 'manage-gallery' ? renderManageGallery() :
                                        view === 'payroll' ? renderPayrollManagement() :
                                            view === 'payments' ? renderPayments() :
                                                view === 'notifications' ? renderNotifications() :
                                                    renderFeedbacks()}
                    {renderEditUserDialog()}
                </Container>
            </Box>
        </Box>
    );
};

export default CollegeDashboard;
