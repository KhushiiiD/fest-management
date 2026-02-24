// authentication routes
// defines endpoints for registration, login, and profile

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateParticipantRegistration } = require('../middleware/validation');

// participant registration
router.post('/register', validateParticipantRegistration, authController.registerParticipant);

// login for all users
router.post('/login', authController.login);

// get current user profile (protected)
router.get('/profile', auth, authController.getProfile);

// change password (protected)
router.put('/change-password', auth, authController.changePassword);

// logout (protected)
router.post('/logout', auth, authController.logout);

module.exports = router;
