const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
    staffUsername: { type: String, required: true },
    staffFullName: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    netPayable: { type: Number, required: true },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Salary', SalarySchema);
