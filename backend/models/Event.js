// event model for all events in the fest
// handles normal events and merchandise events

const mongoose = require('mongoose');

// custom form field sub-schema for the form builder
const customFormFieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'email', 'textarea', 'dropdown', 'checkbox', 'file', 'date'],
    required: true
  },
  isRequired: { type: Boolean, default: false },
  options: [String], // for dropdown and checkbox types
  order: { type: Number, default: 0 }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDescription: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['normal', 'merchandise', 'hackathon'],
    required: true
  },
  eligibility: {
    type: String,
    enum: ['all', 'iiit-only', 'non-iiit-only'],
    default: 'all'
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationLimit: {
    type: Number,
    required: true,
    min: 1
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventTags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
    default: 'draft'
  },

  // custom registration form fields for normal events (form builder)
  customFormFields: [customFormFieldSchema],
  formLocked: {
    type: Boolean,
    default: false
  },

  // merchandise-specific fields (array of items)
  merchandiseDetails: [{
    itemName: { type: String, required: true },
    price: { type: Number, default: 0, min: 0 },
    sizes: [String],
    availableStock: { type: Number, min: 0 }
  }],

  // hackathon-specific fields
  hackathonDetails: {
    minTeamSize: { type: Number, min: 1 },
    maxTeamSize: { type: Number, min: 1 }
  },

  // tracking
  currentRegistrations: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalAttendance: { type: Number, default: 0 },

  // trending score based on registrations in last 24 hours
  trendingScore: { type: Number, default: 0 },
  lastTrendingUpdate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// text index for search
eventSchema.index({ eventName: 'text', eventDescription: 'text', eventTags: 'text' });
eventSchema.index({ registrationDeadline: 1, eventStartDate: 1, eventEndDate: 1 });

// virtual: check if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return (
    this.status === 'published' &&
    this.registrationDeadline > now &&
    this.currentRegistrations < this.registrationLimit
  );
});

// check if a participant can register based on eligibility
eventSchema.methods.canRegister = function(participantType) {
  if (this.eligibility === 'all') return true;
  if (this.eligibility === 'iiit-only' && participantType === 'iiit') return true;
  if (this.eligibility === 'non-iiit-only' && participantType === 'non-iiit') return true;
  return false;
};

// update trending score based on recent registrations
eventSchema.methods.updateTrendingScore = async function() {
  const Registration = require('./Registration');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentRegistrations = await Registration.countDocuments({
    event: this._id,
    registrationDate: { $gte: twentyFourHoursAgo }
  });
  this.trendingScore = recentRegistrations;
  this.lastTrendingUpdate = new Date();
  await this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
