// attendance routes
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('organizer'));

router.post('/scan', attendanceController.scanQRCode);
router.post('/manual', attendanceController.manualAttendance);
router.get('/event/:eventId', attendanceController.getAttendanceDashboard);
router.get('/event/:eventId/export', attendanceController.exportAttendanceCSV);

module.exports = router;
