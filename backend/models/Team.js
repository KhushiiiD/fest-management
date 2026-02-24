// team model for hackathon team registrations (tier a feature)

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  inviteCode: {
    type: String,
    default: () => uuidv4().substring(0, 8).toUpperCase(),
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxTeamSize: {
    type: Number,
    required: true,
    min: 2
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined'],
      default: 'invited'
    },
    joinedAt: Date
  }],
  status: {
    type: String,
    enum: ['forming', 'complete', 'incomplete', 'registered'],
    default: 'forming'
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  }
}, {
  timestamps: true
});

teamSchema.index({ event: 1 });

// current accepted members count (including leader)
teamSchema.virtual('currentSize').get(function() {
  return this.members.filter(m => m.status === 'accepted').length + 1;
});

teamSchema.methods.isFull = function() {
  const acceptedMembers = this.members.filter(m => m.status === 'accepted').length;
  return (acceptedMembers + 1) >= this.maxTeamSize;
};

teamSchema.methods.isComplete = function() {
  const acceptedMembers = this.members.filter(m => m.status === 'accepted').length;
  return (acceptedMembers + 1) === this.maxTeamSize;
};

teamSchema.methods.addMember = async function(userId) {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) throw new Error('user already in team');
  if (this.isFull()) throw new Error('team is already full');
  this.members.push({ user: userId, status: 'invited' });
  await this.save();
};

teamSchema.methods.acceptInvite = async function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) throw new Error('invitation not found');
  if (member.status === 'accepted') throw new Error('already accepted');
  member.status = 'accepted';
  member.joinedAt = new Date();
  if (this.isComplete()) this.status = 'complete';
  await this.save();
};

teamSchema.methods.rejectInvite = async function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) throw new Error('invitation not found');
  member.status = 'declined';
  await this.save();
};

teamSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  if (this.status === 'complete') this.status = 'forming';
  await this.save();
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
