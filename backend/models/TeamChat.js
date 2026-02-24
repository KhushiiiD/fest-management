// team chat model for hackathon team communication (tier b feature)

const mongoose = require('mongoose');

const teamChatSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  sender: {
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
    enum: ['text', 'file', 'link', 'system'],
    default: 'text'
  },
  attachment: {
    fileName: String,
    fileUrl: String,
    fileType: String
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

teamChatSchema.index({ team: 1, createdAt: 1 });

teamChatSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
};

const TeamChat = mongoose.model('TeamChat', teamChatSchema);

module.exports = TeamChat;
