// team routes
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);
router.use(authorize('participant'));

router.post('/', teamController.createTeam);
router.post('/join', teamController.joinByInviteCode);
router.get('/my', teamController.getMyTeams);
router.get('/:teamId', teamController.getTeamDetails);
router.post('/:teamId/invite', teamController.inviteMember);
router.post('/:teamId/respond', teamController.respondToInvite);
router.post('/:teamId/register', teamController.registerTeam);
router.post('/:teamId/leave', teamController.leaveTeam);
router.delete('/:teamId/members/:userId', teamController.removeMember);

module.exports = router;
