const mongoose = require('mongoose');

const InternalMarksSchema = new mongoose.Schema({
    studentUsername: { type: String, required: true },
    studentFullName: { type: String, required: true },
    teacherUsername: { type: String, required: true },
    department: { type: String, required: true },
    batch: { type: String, required: true },
    semester: { type: String, required: true },
    class: { type: String, required: true },
    subject: { type: String, required: true },
    marks: { type: Number, required: true }
}, { timestamps: true });

// Add index for faster queries
InternalMarksSchema.index({ studentUsername: 1, subject: 1 });

module.exports = mongoose.model('InternalMarks', InternalMarksSchema);
