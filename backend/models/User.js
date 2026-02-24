// user model for all users in the system
// handles participants (iiit and non-iiit), organizers, and admin

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // common fields for all users
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['participant', 'organizer', 'admin'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // participant-specific fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  participantType: {
    type: String,
    enum: ['iiit', 'non-iiit']
  },
  collegeName: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  // participant preferences - areas of interest
  interests: [{
    type: String,
    trim: true
  }],
  // participant preferences - followed clubs/organizers
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // flag to track if onboarding was completed
  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  // organizer-specific fields
  organizerName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  discordWebhook: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// hash password before saving to database
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const profile = this.toObject();
  delete profile.password;
  return profile;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
