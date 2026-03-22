const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    studentUsername: { type: String, required: true },
    department: { type: String, required: true },
    batch: { type: String, required: true },
    class: { type: String, required: true },
    semester: { type: String, required: true },
    subjects: [{ type: String, required: true }],
}, { timestamps: true });

// Ensure a student can have only one enrollment (for simplicity, or unique per sem if needed)
// For now, let's keep it simple: one enrollment record per student.
EnrollmentSchema.index({ studentUsername: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
