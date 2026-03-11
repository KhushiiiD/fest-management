// forum controller
// handles real-time discussion forum (per-event, socket.io backed)

const ForumMessage = require('../models/ForumMessage');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// get messages for an event's forum
const getMessages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await ForumMessage.find({
      event: eventId,
      isDeleted: false
    })
      .populate('author', 'firstName lastName email role organizerName')
      .populate('parentMessage', 'content author')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ForumMessage.countDocuments({
      event: eventId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // oldest first for chat
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('get messages error:', error);
    res.status(500).json({ success: false, message: 'failed to get messages', error: error.message });
  }
};

// post a message to an event's forum
const postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content, parentMessage, messageType } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'message content is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    // only registered participants and event organizer can post
    const isOrganizer = event.organizer.toString() === req.user._id.toString();
    let isRegistered = false;
    if (req.user.role === 'participant') {
      const reg = await Registration.findOne({
        participant: req.user._id,
        event: eventId,
        status: { $ne: 'cancelled' }
      });
      isRegistered = !!reg;
    }

    if (!isOrganizer && !isRegistered && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'you must be registered for this event or be the organizer to post'
      });
    }

    const message = new ForumMessage({
      event: eventId,
      author: req.user._id,
      content: content.trim(),
      messageType: messageType || 'message',
      parentMessage: parentMessage || null
    });

    await message.save();

    // populate for response
    await message.populate('author', 'firstName lastName email role organizerName');
    if (parentMessage) {
      await message.populate('parentMessage', 'content author');
    }

    // emit socket event (handled by socket.io in server.js)
    if (req.io) {
      req.io.to(`forum-${eventId}`).emit('newMessage', message);
    }

    res.status(201).json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('post message error:', error);
    res.status(500).json({ success: false, message: 'failed to post message', error: error.message });
  }
};

// pin/unpin message (organizer only)
const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'message not found' });
    }

    const event = await Event.findById(message.event);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'only the event organizer can pin messages' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    if (req.io) {
      req.io.to(`forum-${message.event}`).emit('messagePinned', {
        messageId: message._id,
        isPinned: message.isPinned
      });
    }

    res.status(200).json({
      success: true,
      message: `message ${message.isPinned ? 'pinned' : 'unpinned'}`,
      forumMessage: message
    });
  } catch (error) {
    console.error('pin message error:', error);
    res.status(500).json({ success: false, message: 'failed to pin message', error: error.message });
  }
};

// delete message (author or organizer)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'message not found' });
    }

    // check authorization
    const event = await Event.findById(message.event);
    const isAuthor = message.author.toString() === req.user._id.toString();
    const isOrganizer = event.organizer.toString() === req.user._id.toString();

    if (!isAuthor && !isOrganizer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.content = '[message deleted]';
    await message.save();

    if (req.io) {
      req.io.to(`forum-${message.event}`).emit('messageDeleted', {
        messageId: message._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'message deleted'
    });
  } catch (error) {
    console.error('delete message error:', error);
    res.status(500).json({ success: false, message: 'failed to delete message', error: error.message });
  }
};

// add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'emoji is required' });
    }

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'message not found' });
    }

    message.addReaction(req.user._id, emoji);
    await message.save();

    if (req.io) {
      req.io.to(`forum-${message.event}`).emit('messageReaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('add reaction error:', error);
    res.status(500).json({ success: false, message: 'failed to add reaction', error: error.message });
  }
};

module.exports = {
  getMessages,
  postMessage,
  pinMessage,
  deleteMessage,
  addReaction
};
