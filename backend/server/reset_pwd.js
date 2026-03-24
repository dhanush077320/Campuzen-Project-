const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/campuzen').then(async () => {
  const User = require('./models/User');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);
  await User.updateMany({username: {$in: ['Gowri_123', 'Jipin_123', 'Anurag_123']}}, {password: hash});
  console.log('Reset done');
  process.exit(0);
}).catch(console.error);
