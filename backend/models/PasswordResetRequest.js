// password reset request model (tier b feature)
// handles organizer password reset requests and admin approval

const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminComment: {
    type: String,
    trim: true
  },
  newPassword: String,
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: Date
}, {
  timestamps: true
});

passwordResetRequestSchema.index({ organizer: 1, status: 1 });
passwordResetRequestSchema.index({ status: 1, requestDate: -1 });

const PasswordResetRequest = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

module.exports = PasswordResetRequest;
