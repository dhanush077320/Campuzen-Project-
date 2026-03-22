const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    studentUsername: { type: String, required: true },
    studentFullName: { type: String, required: true },
    teacherUsername: { type: String, required: true },
    department: { type: String, required: true },
    batch: { type: String, required: true },
    semester: { type: String, required: true },
    class: { type: String, required: true },
    date: { type: Date, required: true },
    hour: { type: Number, required: true, min: 1, max: 7 },
    subject: { type: String, required: true },
    status: { type: String, required: true, enum: ['Present', 'Absent'] }
}, { timestamps: true });

// Add index for faster queries
AttendanceSchema.index({ studentUsername: 1, date: 1, hour: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
