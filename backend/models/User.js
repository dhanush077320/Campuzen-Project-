const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    role: { type: String, required: true, enum: ['student', 'teacher', 'college', 'parent', 'staff'] },
    department: { type: String },
    subject: { type: String },
    photo: { type: String },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

// Allow same username for different roles (e.g., student "Jipin_123" and parent "Jipin_123")
// but prevent duplicate username within the same role
UserSchema.index({ username: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
