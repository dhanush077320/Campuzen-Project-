const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const adminExists = await User.findOne({ username: 'admin' });
        if (adminExists) {
            console.log("Admin user already exists.");
        } else {
            const admin = new User({
                fullName: 'College Administrator',
                username: 'admin',
                password: 'adminpassword', // In production, use hashed passwords
                email: 'admin@college.edu',
                phoneNumber: '1234567890',
                role: 'college'
            });

            await admin.save();
            console.log("College Admin created successfully!");
            console.log("Username: admin");
            console.log("Password: adminpassword");
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
