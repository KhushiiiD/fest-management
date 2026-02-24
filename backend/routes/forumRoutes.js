// forum routes
const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

router.get('/:eventId/messages', forumController.getMessages);
router.post('/:eventId/messages', forumController.postMessage);
router.post('/messages/:messageId/pin', authorize('organizer', 'admin'), forumController.pinMessage);
router.delete('/messages/:messageId', forumController.deleteMessage);
router.post('/messages/:messageId/react', forumController.addReaction);

module.exports = router;
