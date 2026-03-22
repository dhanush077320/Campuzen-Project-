const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    parentUsername: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash on Delivery', 'UPI'] },
    paymentDate: { type: Date },
    transactionId: { type: String },
    collegeUsername: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
