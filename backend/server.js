// main server file for fest management system
// this file initializes express app, connects to database, and sets up routes

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { initializeAdmin } = require('./scripts/initAdmin');
const http = require('http');
const socketIO = require('socket.io');

// load environment variables from .env file
dotenv.config();

// create express application
const app = express();
const server = http.createServer(app);

// initialize socket.io for real-time features
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// make io accessible to routes
app.set('io', io);

// middleware setup
// cors - allows frontend to communicate with backend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// parse json request bodies
app.use(express.json());

// parse url-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// make io accessible in req object for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// connect to mongodb database
connectDB();

// initialize admin account if not exists
initializeAdmin();

// import route handlers
const authRoutes = require('./routes/authRoutes');
const participantRoutes = require('./routes/participantRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const forumRoutes = require('./routes/forumRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const teamRoutes = require('./routes/teamRoutes');

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teams', teamRoutes);

// health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'fest management api is running',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// handle 404 - route not found
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'route not found' 
  });
});

// global error handler
app.use((err, req, res, next) => {
  console.error('error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'internal server error'
  });
});

// socket.io connection handler for real-time features
io.on('connection', (socket) => {
  console.log('new client connected:', socket.id);
  
  // join forum room for event discussions
  socket.on('join-forum', (eventId) => {
    socket.join(`forum-${eventId}`);
    console.log(`socket ${socket.id} joined forum-${eventId}`);
  });
  
  // join team chat room for hackathon teams
  socket.on('join-team-chat', (teamId) => {
    socket.join(`team-${teamId}`);
    console.log(`socket ${socket.id} joined team-${teamId}`);
  });
  
  // handle disconnect
  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id);
  });
});

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
  console.log(`environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
