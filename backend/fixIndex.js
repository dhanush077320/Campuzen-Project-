// One-time script to drop the old unique index on 'username' alone
// and let Mongoose create the new compound {username, role} index.
// Run with: node fixIndex.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const collection = mongoose.connection.collection('users');

        // List existing indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        // Drop the old username_1 unique index if it exists
        const oldIndex = indexes.find(i => i.name === 'username_1');
        if (oldIndex) {
            await collection.dropIndex('username_1');
            console.log('✅ Dropped old "username_1" unique index.');
        } else {
            console.log('No "username_1" index found (already removed).');
        }

        // Now load the model so Mongoose creates the new compound index
        require('./models/User');
        await mongoose.connection.syncIndexes();
        console.log('✅ New compound {username, role} index created.');

        const newIndexes = await collection.indexes();
        console.log('Updated indexes:', newIndexes.map(i => i.name));

        await mongoose.connection.close();
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixIndex();
