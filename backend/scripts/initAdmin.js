// admin initialization script
// creates the first admin user if not exists

const User = require('../models/User');

// initialize admin account
const initializeAdmin = async () => {
  try {
    // check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('admin account already exists');
      return;
    }
    
    // create admin account
    const admin = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@fest.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword123',
      role: 'admin',
      isActive: true
    });
    
    console.log('admin account created successfully');
    console.log('admin email:', admin.email);
  } catch (error) {
    console.error('error initializing admin:', error);
  }
};

module.exports = { initializeAdmin };
