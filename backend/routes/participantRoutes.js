// participant routes
const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('participant'));

router.get('/dashboard', participantController.getDashboard);
router.get('/profile', participantController.getProfile);
router.put('/profile', participantController.updateProfile);
router.post('/onboarding', participantController.completeOnboarding);
router.post('/follow/:clubId', participantController.followClub);
router.post('/unfollow/:clubId', participantController.unfollowClub);
router.get('/clubs', participantController.getAllClubs);
router.get('/clubs/:clubId', participantController.getClubDetails);

module.exports = router;
