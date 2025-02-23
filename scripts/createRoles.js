const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

const roles = [
  {
    name: 'User',
    description: 'Regular user with basic privileges'
  },
  {
    name: 'Admin',
    description: 'Administrator with full access to all features'
  }
];

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connection successful');
  
  try {
    // Önce mevcut rolleri temizle
    await Role.deleteMany({});
    console.log('Existing roles cleared');

    // Yeni rolleri ekle
    const createdRoles = await Role.insertMany(roles);
    console.log('Roles created successfully:', createdRoles);

    // Default User rolünü bul
    const userRole = await Role.findOne({ name: 'User' });
    
    // Mevcut kullanıcıları güncelle
    const User = require('../models/User');
    await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: userRole._id } }
    );
    console.log('Existing users updated with default role');

  } catch (error) {
    console.error('Error creating roles:', error);
  }
  
  mongoose.connection.close();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 