// registration routes
const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('participant'));

router.get('/my', registrationController.getMyRegistrations);
router.post('/event/:eventId', registrationController.registerForEvent);
router.post('/merchandise/:eventId', registrationController.purchaseMerchandise);
router.post('/:registrationId/payment-proof', registrationController.uploadPaymentProof);
router.get('/:registrationId', registrationController.getRegistrationDetails);
router.delete('/:registrationId', registrationController.cancelRegistration);

module.exports = router;
