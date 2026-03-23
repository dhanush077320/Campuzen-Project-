const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const UserSchema = new mongoose.Schema({
    username: String,
    role: String,
    startingPoint: String,
    endPoint: String,
    nextDestination: String,
    stops: [String],
    startingPointCoords: { lat: Number, lng: Number },
    stopCoords: [{ lat: Number, lng: Number, name: String }]
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ username: 'Shambu_123' });
        console.log('User found:', JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
