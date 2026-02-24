// event routes
// defines endpoints for event browsing and details

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, optionalAuth } = require('../middleware/auth');

// browse events (public, but auth optional for personalization)
router.get('/browse', optionalAuth, eventController.browseEvents);

// get event details
router.get('/:eventId', optionalAuth, eventController.getEventDetails);

// export event to calendar (requires auth)
router.get('/:eventId/export-calendar', auth, eventController.exportToCalendar);

module.exports = router;
