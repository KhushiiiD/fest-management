// registration model for event registrations
// tracks participant registrations, payments, and tickets

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const registrationSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'rejected', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'not-required'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    required: true
  },

  // payment proof for merchandise (tier a feature)
  paymentProof: {
    type: String // file path to uploaded image
  },
  paymentVerificationStatus: {
    type: String,
    enum: ['not-required', 'pending', 'approved', 'rejected'],
    default: 'not-required'
  },
  paymentVerifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentVerificationDate: Date,

  // custom form responses for normal events
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // merchandise-specific fields
  merchandiseDetails: {
    size: String,
    color: String,
    quantity: { type: Number, default: 1 }
  },

  // qr code for ticket (generated after payment confirmation)
  qrCode: String,

  // attendance tracking (tier a feature)
  attended: { type: Boolean, default: false },
  attendanceMarkedAt: Date,
  attendanceMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // team reference for hackathon events
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },

  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// prevent duplicate registrations
registrationSchema.index({ participant: 1, event: 1 }, { unique: true });
registrationSchema.index({ status: 1, paymentStatus: 1 });

// generate qr code data
registrationSchema.methods.getQRData = function() {
  return JSON.stringify({
    ticketId: this.ticketId,
    participantId: this.participant,
    eventId: this.event,
    registrationDate: this.registrationDate
  });
};

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
