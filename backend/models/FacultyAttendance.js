const mongoose = require('mongoose');

const FacultyAttendanceSchema = new mongoose.Schema({
    username: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, required: true, enum: ['teacher', 'staff'] },
    date: { type: Date, required: true },
    status: { type: String, required: true, enum: ['Present', 'Absent', 'Half day'] },
    time: { type: String } // Storing punch-in time (e.g., "09:30 AM")
}, { timestamps: true });

// Add index for faster queries
FacultyAttendanceSchema.index({ username: 1, date: 1 });

module.exports = mongoose.model('FacultyAttendance', FacultyAttendanceSchema);
