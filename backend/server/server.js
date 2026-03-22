const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Feedback = require('../models/Feedback');
const Attendance = require('../models/Attendance');
const FacultyAttendance = require('../models/FacultyAttendance');
const InternalMarks = require('../models/InternalMarks');
const Gallery = require('../models/Gallery');
const Salary = require('../models/Salary');
const Payment = require('../models/Payment');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Authentication Routes ---

// Real Login Route
app.post('/login/:role', async (req, res) => {
    const { role } = req.params;
    const { id, password } = req.body; // 'id' from frontend maps to 'username'

    try {
        const user = await User.findOne({ username: id, role });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials or role" });
        }

        // Simplistic password check (In production, use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked. Please contact administrator." });
        }

        return res.status(200).json({
            message: "Login successful",
            user: {
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                photo: user.photo
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

// --- User Management Routes ---

// Create User
app.post('/api/users', async (req, res) => {
    const { fullName, username, password, email, phoneNumber, role, photo, department, subject } = req.body;

    try {
        const existingUser = await User.findOne({ username, role });
        if (existingUser) {
            return res.status(400).json({ message: "A user with this username and role already exists" });
        }

        const newUser = new User({
            fullName,
            username,
            password,
            email,
            phoneNumber,
            role,
            photo,
            department,
            subject
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Failed to create user" });
    }
});

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// Update User
app.patch('/api/users/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        res.json(updatedUser);
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
});

// Toggle Block User
app.patch('/api/users/:id/toggle-block', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
    } catch (error) {
        console.error("Toggle Block Error:", error);
        res.status(500).json({ message: "Failed to toggle block status" });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
});

// Get users by role
app.get('/api/users/role/:role', async (req, res) => {
    const { role } = req.params;
    try {
        const query = role === 'all' ? { role: { $in: ['teacher', 'staff'] } } : { role };
        const users = await User.find(query).select('username fullName photo role');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// Get user by username
app.get('/api/users/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
});

// --- Attendance & Enrollment Search Routes ---

// Get unique filters from enrollments (for dropdowns)
app.get('/api/enrollments/filters', async (req, res) => {
    try {
        const departments = await Enrollment.distinct('department');
        const batches = await Enrollment.distinct('batch');
        const classes = await Enrollment.distinct('class');
        const semesters = await Enrollment.distinct('semester');
        res.status(200).json({ departments, batches, classes, semesters });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch filters" });
    }
});

// Search students for attendance marking
app.get('/api/enrollments/search', async (req, res) => {
    const { department, batch, semester, class: className } = req.query;
    try {
        const query = {};
        if (department) query.department = department;
        if (batch) query.batch = batch;
        if (semester) query.semester = semester;
        if (className) query.class = className;

        const enrollments = await Enrollment.find(query);
        const studentUsernames = enrollments.map(e => e.studentUsername);

        // Fetch full names from User model
        const students = await User.find({ username: { $in: studentUsernames }, role: 'student' }).select('username fullName');
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: "Failed to search students" });
    }
});

// Save multiple attendance records
app.post('/api/attendance', async (req, res) => {
    const { attendanceRecords } = req.body;
    // attendanceRecords is an array of { studentUsername, studentFullName, teacherUsername, department, batch, semester, class, date, hour, subject, status }

    try {
        // Use bulkWrite or simple loop for now
        for (const record of attendanceRecords) {
            await Attendance.findOneAndUpdate(
                { studentUsername: record.studentUsername, date: new Date(record.date), hour: record.hour },
                record,
                { upsert: true }
            );
        }
        res.status(200).json({ message: "Attendance saved successfully" });
    } catch (error) {
        console.error("Attendance Save Error:", error);
        res.status(500).json({ message: "Failed to save attendance" });
    }
});

// Get attendance for a student with date range
app.get('/api/attendance/student/:username', async (req, res) => {
    const { username } = req.params;
    const { startDate, endDate } = req.query;

    try {
        const query = { studentUsername: username };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const records = await Attendance.find(query).sort({ date: 1, hour: 1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch student attendance" });
    }
});

// Save multiple faculty attendance records
app.post('/api/faculty-attendance', async (req, res) => {
    const { attendanceRecords } = req.body;
    try {
        for (const record of attendanceRecords) {
            await FacultyAttendance.findOneAndUpdate(
                { username: record.username, date: new Date(record.date) },
                record,
                { upsert: true }
            );
        }
        res.status(200).json({ message: "Attendance saved successfully" });
    } catch (error) {
        console.error("Faculty Attendance Save Error:", error);
        res.status(500).json({ message: "Failed to save attendance" });
    }
});

// NEW: Mark faculty attendance via QR scan
app.post('/api/faculty-attendance/scan', async (req, res) => {
    const { username, fullName, role } = req.body;
    // Current date at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    // Current time string (e.g., "10:45 AM")
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Status: Before 9:00 AM -> Present, 9:00 AM to 2:00 PM -> Half day, After 2:00 PM -> Absent
    const hours = now.getHours();
    let status = 'Absent';
    if (hours < 9) {
        status = 'Present';
    } else if (hours < 14) {
        status = 'Half day';
    } else {
        status = 'Absent';
    }

    try {
        // 1 day only 1 time - check if record already exists
        const existing = await FacultyAttendance.findOne({ username, date: today });
        if (existing) {
            return res.status(400).json({ message: "Attendance already marked for today" });
        }

        const attendance = new FacultyAttendance({
            username, 
            fullName, 
            role, 
            date: today, 
            status: status,
            time: currentTime 
        });
        await attendance.save();

        res.status(200).json({ message: `Attendance marked as ${status}`, attendance });
    } catch (error) {
        console.error("QR Scan Attendance Error:", error);
        const detailedMsg = error.errors ? Object.values(error.errors).map(e => e.message).join(', ') : error.message;
        res.status(500).json({ message: `Failed to mark attendance: ${detailedMsg}` });
    }
});

// Get attendance for a faculty/staff member with date range
app.get('/api/faculty-attendance/:username', async (req, res) => {
    const { username } = req.params;
    const { startDate, endDate } = req.query;

    try {
        const query = { username };
        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        const records = await FacultyAttendance.find(query).sort({ date: 1 });
        res.status(200).json(records);
    } catch (error) {
        console.error("Fetch Faculty Attendance Error:", error);
        res.status(500).json({ message: "Failed to fetch faculty attendance" });
    }
});

// NEW: Get all attendance records for a role on a specific date
app.get('/api/faculty-attendance/role/:role', async (req, res) => {
    const { role } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ message: "Date is required" });

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    try {
        const query = { date: searchDate };
        if (role !== 'all') {
            query.role = role;
        } else {
            query.role = { $in: ['teacher', 'staff'] };
        }
        const records = await FacultyAttendance.find(query);
        res.status(200).json(records);
    } catch (error) {
        console.error("Fetch Role Attendance Error:", error);
        res.status(500).json({ message: "Failed to fetch role attendance" });
    }
});

// --- Feedback Routes ---

// Submit Feedback
app.post('/api/feedbacks', async (req, res) => {
    const { senderUsername, senderFullName, senderRole, category, message } = req.body;

    try {
        const newFeedback = new Feedback({
            senderUsername,
            senderFullName,
            senderRole,
            category,
            message
        });
        await newFeedback.save();
        res.status(201).json({ message: "Feedback submitted successfully", feedback: newFeedback });
    } catch (error) {
        console.error("Feedback Submission Error:", error);
        res.status(500).json({ message: "Failed to submit feedback" });
    }
});

// Get All Feedbacks (for Admin)
app.get('/api/feedbacks', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ timestamp: -1 });
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch feedbacks" });
    }
});

// Delete Feedback
app.delete('/api/feedbacks/:id', async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete feedback" });
    }
});

// Create or Update Enrollment
app.post('/api/enrollments', async (req, res) => {
    const { studentUsername, department, batch, class: className, semester, subjects } = req.body;

    try {
        const enrollment = await Enrollment.findOneAndUpdate(
            { studentUsername },
            { department, batch, class: className, semester, subjects },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: "Enrollment successful", enrollment });
    } catch (error) {
        console.error("Enrollment Error:", error);
        res.status(500).json({ message: "Failed to enroll student" });
    }
});

// --- Internal Marks Routes ---

// Save multiple internal marks records
app.post('/api/internal-marks', async (req, res) => {
    const { marksRecords } = req.body;
    try {
        for (const record of marksRecords) {
            await InternalMarks.findOneAndUpdate(
                { studentUsername: record.studentUsername, subject: record.subject },
                record,
                { upsert: true }
            );
        }
        res.status(200).json({ message: "Marks saved successfully" });
    } catch (error) {
        console.error("Marks Save Error:", error);
        res.status(500).json({ message: "Failed to save marks" });
    }
});

// Get internal marks for a student
app.get('/api/internal-marks/student/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const records = await InternalMarks.find({ studentUsername: username });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch marks" });
    }
});

// Get Enrollment for a student
app.get('/api/enrollments/student/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const enrollment = await Enrollment.findOne({ studentUsername: username });
        if (!enrollment) {
            return res.status(404).json({ message: "No enrollment found for this student" });
        }
        res.status(200).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch enrollment" });
    }
});

// --- Gallery Routes ---

// Post new event gallery item
app.post('/api/gallery', async (req, res) => {
    try {
        const { eventName, fileName, fileType, fileData } = req.body;
        const newGalleryItem = new Gallery({
            eventName,
            fileName,
            fileType,
            fileData
        });
        await newGalleryItem.save();
        res.status(201).json({ message: "Gallery item posted successfully" });
    } catch (error) {
        console.error("Gallery Post Error:", error);
        res.status(500).json({ message: "Failed to post gallery item" });
    }
});

// Get all gallery items
app.get('/api/gallery', async (req, res) => {
    try {
        const items = await Gallery.find().sort({ uploadedAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error("Gallery Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch gallery items" });
    }
});

// Delete gallery item
app.delete('/api/gallery/:id', async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Gallery item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete gallery item" });
    }
});

// --- Salary/Payroll Routes ---

// Save or Update Salary
app.post('/api/salary', async (req, res) => {
    const { staffUsername, staffFullName, baseSalary, bonus, netPayable, status, date } = req.body;
    try {
        const salary = await Salary.findOneAndUpdate(
            { staffUsername, date: new Date(date) },
            { staffFullName, baseSalary, bonus, netPayable, status },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: "Salary details saved successfully", salary });
    } catch (error) {
        console.error("Salary Save Error:", error);
        res.status(500).json({ message: "Failed to save salary details" });
    }
});

// Get salary for a specific staff member
app.get('/api/salary/staff/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const records = await Salary.find({ staffUsername: username }).sort({ date: -1 });
        res.status(200).json(records);
    } catch (error) {
        console.error("Salary Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch salary details" });
    }
});

// --- Notification Routes ---

// API to send emails
app.post('/api/notifications/send-email', async (req, res) => {
    const { role, department, batch, semester, class: className, subject, message } = req.body;

    try {
        let recipientEmails = [];

        if (role === 'student' || role === 'parent') {
            const query = {};
            if (department) query.department = department;
            if (batch) query.batch = batch;
            if (semester) query.semester = semester;
            if (className) query.class = className;

            const enrollments = await Enrollment.find(query);
            const usernames = enrollments.map(e => e.studentUsername);

            const users = await User.find({ username: { $in: usernames }, role: role }).select('email');
            recipientEmails = users.map(u => u.email).filter(e => !!e);
        } else if (role === 'teacher' || role === 'staff') {
            const users = await User.find({ role }).select('email');
            recipientEmails = users.map(u => u.email).filter(e => !!e);
        }

        if (recipientEmails.length === 0) {
            return res.status(404).json({ message: "No recipients found with matching criteria" });
        }

        // Prepare email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmails.join(','),
            subject: subject || "College Notification",
            text: message
        };

        // Send Email (only if credentials exist, otherwise log)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: `Email sent successfully to ${recipientEmails.length} recipients` });
        } else {
            console.log("--- MOCK EMAIL SEND ---");
            console.log("Recipients:", recipientEmails);
            console.log("Subject:", mailOptions.subject);
            console.log("Message:", message);
            res.status(200).json({
                message: "Email credentials not found. Notification logged to server console.",
                mockRecipients: recipientEmails
            });
        }
    } catch (error) {
        console.error("Email Error:", error);
        res.status(500).json({ message: "Failed to send notification" });
    }
});

// --- Payment Routes ---

// Create Payment Request (Admin)
app.post('/api/payments/request', async (req, res) => {
    const { subject, description, amount, parentUsername, collegeUsername } = req.body;
    try {
        const newPayment = new Payment({
            subject,
            description,
            amount,
            parentUsername,
            collegeUsername,
            status: 'Pending'
        });
        await newPayment.save();
        res.status(201).json({ message: "Payment request sent successfully", payment: newPayment });
    } catch (error) {
        console.error("Payment Request Error:", error);
        res.status(500).json({ message: "Failed to send payment request" });
    }
});

// Get Payments for Parent
app.get('/api/payments/parent/:username', async (req, res) => {
    try {
        const payments = await Payment.find({ parentUsername: req.params.username }).sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch payments" });
    }
});

// Process Payment (Parent)
app.post('/api/payments/pay/:id', async (req, res) => {
    const { paymentMethod, paymentDate, transactionId } = req.body;
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Paid',
                paymentMethod,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                transactionId
            },
            { new: true }
        );
        res.status(200).json({ message: "Payment processed successfully", payment });
    } catch (error) {
        console.error("Payment Process Error:", error);
        res.status(500).json({ message: "Failed to process payment" });
    }
});

// Get All Payments (Admin)
app.get('/api/payments/all', async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch all payments" });
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));