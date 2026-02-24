// organizer routes
const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const { auth, authorize } = require('../middleware/auth');
const { validateEventCreation } = require('../middleware/validation');

router.use(auth);
router.use(authorize('organizer'));

router.get('/dashboard', organizerController.getDashboard);
router.get('/profile', organizerController.getProfile);
router.put('/profile', organizerController.updateProfile);
router.post('/password-reset-request', organizerController.requestPasswordReset);

// event management
router.get('/events', organizerController.getMyEvents);
router.post('/events', validateEventCreation, organizerController.createEvent);
router.put('/events/:eventId', organizerController.updateEvent);
router.post('/events/:eventId/publish', organizerController.publishEvent);
router.post('/events/:eventId/status', organizerController.updateEventStatus);
router.get('/events/:eventId', organizerController.getEventWithParticipants);
router.get('/events/:eventId/export-csv', organizerController.exportParticipantsCSV);

// payment management
router.get('/pending-payments', organizerController.getPendingPayments);
router.post('/payments/:registrationId/approve', organizerController.approvePayment);
router.post('/payments/:registrationId/reject', organizerController.rejectPayment);

module.exports = router;
