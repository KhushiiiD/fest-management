// database connection configuration
// handles connection to mongodb using mongoose

const mongoose = require('mongoose');

// function to connect to mongodb database
const connectDB = async () => {
  try {
    // attempt to connect to mongodb
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`mongodb connected: ${conn.connection.host}`);
    console.log(`database name: ${conn.connection.name}`);
  } catch (error) {
    // log error and exit if connection fails
    console.error(`error connecting to mongodb: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
