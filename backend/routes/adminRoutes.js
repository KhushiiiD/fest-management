// admin routes
// defines endpoints for admin-specific features

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

// all routes require authentication and admin role
router.use(auth);
router.use(authorize('admin'));

// dashboard
router.get('/dashboard', adminController.getDashboard);

// organizer management
router.post('/organizers', adminController.createOrganizer);
router.get('/organizers', adminController.getAllOrganizers);
router.post('/organizers/:organizerId/deactivate', adminController.deactivateOrganizer);
router.post('/organizers/:organizerId/reactivate', adminController.reactivateOrganizer);
router.delete('/organizers/:organizerId', adminController.deleteOrganizer);

// password reset requests (tier b feature)
router.get('/password-reset-requests', adminController.getPasswordResetRequests);
router.post('/password-reset-requests/:requestId/approve', adminController.approvePasswordReset);
router.post('/password-reset-requests/:requestId/reject', adminController.rejectPasswordReset);

module.exports = router;
