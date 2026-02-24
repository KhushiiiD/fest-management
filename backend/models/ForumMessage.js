// forum message model for event discussions (tier b feature)

const mongoose = require('mongoose');

const forumMessageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['message', 'announcement', 'question'],
    default: 'message'
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage'
  },
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true }
  }]
}, {
  timestamps: true
});

forumMessageSchema.index({ event: 1, createdAt: -1 });
forumMessageSchema.index({ parentMessage: 1, createdAt: 1 });

forumMessageSchema.methods.addReaction = async function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString() && r.emoji === emoji
  );
  if (existingReaction) {
    this.reactions = this.reactions.filter(
      r => !(r.user.toString() === userId.toString() && r.emoji === emoji)
    );
  } else {
    this.reactions.push({ user: userId, emoji });
  }
  await this.save();
};

const ForumMessage = mongoose.model('ForumMessage', forumMessageSchema);

module.exports = ForumMessage;
