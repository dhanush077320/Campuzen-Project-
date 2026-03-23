const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    senderUsername: { type: String, required: true },
    senderFullName: { type: String, required: true },
    senderRole: { type: String, required: true },
    category: { type: String, required: true, enum: ['Academic', 'Non-Academic', 'Transport'] },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
