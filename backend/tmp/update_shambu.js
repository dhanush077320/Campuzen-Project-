const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

const getCoordinates = (address) => {
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const options = {
            headers: {
                'User-Agent': 'CampuzenTestScript/1.0'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.length > 0) {
                        resolve({ lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            resolve(null);
        });
    });
};

async function updateShambu() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const startingPoint = "Attukal";
        const nextDestination = "Chullimanoor";
        const endPoint = "Anapalam";
        const stops = ["Anad", "Aruvikara"];
        
        console.log('Geocoding starting point...');
        const startingPointCoords = await getCoordinates(startingPoint);
        console.log('Geocoding next destination...');
        const nextDestinationCoords = await getCoordinates(nextDestination);
        console.log('Geocoding end point...');
        const endPointCoords = await getCoordinates(endPoint);
        
        const stopCoords = [];
        for (const stop of stops) {
            console.log(`Geocoding stop: ${stop}...`);
            const coords = await getCoordinates(stop);
            if (coords) stopCoords.push({ ...coords, name: stop });
        }
        
        console.log('Updating user in database...');
        await User.findOneAndUpdate({ username: 'Shambu_123' }, {
            startingPoint,
            nextDestination,
            endPoint,
            stops,
            startingPointCoords,
            nextDestinationCoords,
            endPointCoords,
            stopCoords
        });
        
        console.log('Update successful');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateShambu();
