// team controller
// handles team creation, invitations, and management for hackathon events

const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { sendTeamInviteEmail } = require('../utils/email');

// create team for a hackathon event
const createTeam = async (req, res) => {
  try {
    const { eventId, teamName } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    if (event.eventType !== 'hackathon') {
      return res.status(400).json({ success: false, message: 'teams are only for hackathon events' });
    }

    if (!event.canRegister()) {
      return res.status(400).json({ success: false, message: 'registration is not open for this event' });
    }

    // check if user is already in a team for this event
    const existingTeam = await Team.findOne({
      event: eventId,
      'members.user': req.user._id,
      'members.status': 'accepted',
      status: { $ne: 'disbanded' }
    });

    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'you are already in a team for this event' });
    }

    const maxSize = event.hackathonDetails ? event.hackathonDetails.maxTeamSize : 4;
    const minSize = event.hackathonDetails ? event.hackathonDetails.minTeamSize : 1;

    const team = new Team({
      teamName,
      event: eventId,
      teamLeader: req.user._id,
      maxTeamSize: maxSize,
      members: [{
        user: req.user._id,
        role: 'leader',
        status: 'accepted',
        joinedAt: new Date()
      }]
    });

    await team.save();

    res.status(201).json({
      success: true,
      message: 'team created',
      team
    });
  } catch (error) {
    console.error('create team error:', error);
    res.status(500).json({ success: false, message: 'failed to create team', error: error.message });
  }
};

// invite member to team (by email)
const inviteMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'team not found' });
    }

    if (team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'only team leader can invite members' });
    }

    if (team.isFull()) {
      return res.status(400).json({ success: false, message: 'team is full' });
    }

    // find the user by email
    const invitee = await User.findOne({ email, role: 'participant' });
    if (!invitee) {
      return res.status(404).json({ success: false, message: 'user not found with that email' });
    }

    // check if already a member
    const existingMember = team.members.find(m => m.user.toString() === invitee._id.toString());
    if (existingMember) {
      return res.status(400).json({ success: false, message: `user already ${existingMember.status} in this team` });
    }

    // check if user is in another team for this event
    const otherTeam = await Team.findOne({
      event: team.event,
      'members.user': invitee._id,
      'members.status': 'accepted',
      status: { $ne: 'disbanded' },
      _id: { $ne: teamId }
    });

    if (otherTeam) {
      return res.status(400).json({ success: false, message: 'user is already in another team for this event' });
    }

    team.members.push({
      user: invitee._id,
      role: 'member',
      status: 'invited'
    });
    await team.save();

    // send invite email
    const event = await Event.findById(team.event);
    const leader = await User.findById(req.user._id);
    try {
      await sendTeamInviteEmail(invitee, leader, team, event);
    } catch (emailErr) {
      console.error('failed to send invite email:', emailErr);
    }

    res.status(200).json({
      success: true,
      message: `invitation sent to ${email}`,
      team
    });
  } catch (error) {
    console.error('invite member error:', error);
    res.status(500).json({ success: false, message: 'failed to invite member', error: error.message });
  }
};

// join team by invite code
const joinByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const team = await Team.findOne({ inviteCode, status: 'forming' });
    if (!team) {
      return res.status(404).json({ success: false, message: 'invalid invite code or team not accepting members' });
    }

    if (team.isFull()) {
      return res.status(400).json({ success: false, message: 'team is full' });
    }

    // check if already a member
    const alreadyMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'you are already in this team' });
    }

    // check if in another team for this event
    const otherTeam = await Team.findOne({
      event: team.event,
      'members.user': req.user._id,
      'members.status': 'accepted',
      status: { $ne: 'disbanded' },
      _id: { $ne: team._id }
    });

    if (otherTeam) {
      return res.status(400).json({ success: false, message: 'you are already in a team for this event' });
    }

    team.members.push({
      user: req.user._id,
      role: 'member',
      status: 'accepted',
      joinedAt: new Date()
    });
    await team.save();

    res.status(200).json({
      success: true,
      message: `joined team "${team.teamName}"`,
      team
    });
  } catch (error) {
    console.error('join by invite code error:', error);
    res.status(500).json({ success: false, message: 'failed to join team', error: error.message });
  }
};

// respond to team invitation (accept/reject)
const respondToInvite = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { response } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(response)) {
      return res.status(400).json({ success: false, message: 'response must be "accept" or "reject"' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'team not found' });
    }

    if (response === 'accept') {
      // check if user is in another team
      const otherTeam = await Team.findOne({
        event: team.event,
        'members.user': req.user._id,
        'members.status': 'accepted',
        status: { $ne: 'disbanded' },
        _id: { $ne: teamId }
      });

      if (otherTeam) {
        return res.status(400).json({ success: false, message: 'you are already in a team for this event' });
      }

      await team.acceptInvite(req.user._id);
    } else {
      await team.rejectInvite(req.user._id);
    }

    res.status(200).json({
      success: true,
      message: `invitation ${response}ed`,
      team
    });
  } catch (error) {
    console.error('respond to invite error:', error);
    res.status(500).json({ success: false, message: 'failed to respond to invite', error: error.message });
  }
};

// register team for hackathon (leader only, after team is complete)
const registerTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { formResponses } = req.body;

    const team = await Team.findById(teamId).populate('event');
    if (!team) {
      return res.status(404).json({ success: false, message: 'team not found' });
    }

    if (team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'only team leader can register the team' });
    }

    // check min team size
    const minSize = team.event.hackathonDetails ? team.event.hackathonDetails.minTeamSize : 1;
    const acceptedMembers = team.members.filter(m => m.status === 'accepted');
    if (acceptedMembers.length < minSize) {
      return res.status(400).json({
        success: false,
        message: `team must have at least ${minSize} members`
      });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ success: false, message: 'team is already registered' });
    }

    // create registrations for all accepted members
    const { generateQRCode } = require('../utils/qrcode');
    const { v4: uuidv4 } = require('uuid');

    for (const member of acceptedMembers) {
      const existing = await Registration.findOne({
        participant: member.user,
        event: team.event._id
      });
      if (existing) continue;

      const ticketId = uuidv4();
      const registration = new Registration({
        ticketId,
        participant: member.user,
        event: team.event._id,
        status: 'registered',
        team: team._id,
        formResponses: formResponses ? new Map(Object.entries(formResponses)) : new Map()
      });

      if (team.event.registrationFee && team.event.registrationFee > 0) {
        registration.paymentStatus = 'pending';
        registration.paymentAmount = team.event.registrationFee;
      } else {
        registration.paymentStatus = 'not_required';
      }

      const qrData = JSON.stringify({
        ticketId,
        eventId: team.event._id,
        participantId: member.user,
        teamId: team._id,
        eventName: team.event.eventName
      });
      registration.qrCode = await generateQRCode(qrData);

      await registration.save();
    }

    team.status = 'registered';
    await team.save();

    // update trending score
    await team.event.updateTrendingScore();

    res.status(200).json({
      success: true,
      message: 'team registered successfully',
      team
    });
  } catch (error) {
    console.error('register team error:', error);
    res.status(500).json({ success: false, message: 'failed to register team', error: error.message });
  }
};

// get team details
const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('event', 'eventName eventType eventStartDate eventEndDate hackathonDetails')
      .populate('teamLeader', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');

    if (!team) {
      return res.status(404).json({ success: false, message: 'team not found' });
    }

    // only allow members to view team details
    const isMember = team.members.some(m =>
      m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember && req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'not authorized to view this team' });
    }

    res.status(200).json({ success: true, team });
  } catch (error) {
    console.error('get team details error:', error);
    res.status(500).json({ success: false, message: 'failed to get team details', error: error.message });
  }
};

// get my teams
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id,
      status: { $ne: 'disbanded' }
    })
      .populate('event', 'eventName eventType eventStartDate eventEndDate')
      .populate('teamLeader', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // separate into pending invites and active teams
    const activeTeams = [];
    const pendingInvites = [];

    for (const team of teams) {
      const myMembership = team.members.find(m => m.user._id.toString() === req.user._id.toString());
      if (myMembership && myMembership.status === 'invited') {
        pendingInvites.push(team);
      } else if (myMembership && myMembership.status === 'accepted') {
        activeTeams.push(team);
      }
    }

    res.status(200).json({
      success: true,
      activeTeams,
      pendingInvites
    });
  } catch (error) {
    console.error('get my teams error:', error);
    res.status(500).json({ success: false, message: 'failed to get teams', error: error.message });
  }
};

// leave team
const leaveTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'team not found' });
    }

    if (team.teamLeader.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'team leader cannot leave. disband the team or transfer leadership first.'
      });
    }

    if (team.status === 'registered') {
      return res.status(400).json({
        success: false,
        message: 'cannot leave a registered team. contact the organizer.'
      });
    }

    await team.removeMember(req.user._id);

    res.status(200).json({
      success: true,
      message: 'left team successfully'
    });
  } catch (error) {
    console.error('leave team error:', error);
    res.status(500).json({ success: false, message: 'failed to leave team', error: error.message });
  }
};

// remove member (leader only)
const removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'team not found' });
    }

    if (team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'only team leader can remove members' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'cannot remove yourself' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ success: false, message: 'cannot remove members from a registered team' });
    }

    await team.removeMember(userId);

    res.status(200).json({
      success: true,
      message: 'member removed'
    });
  } catch (error) {
    console.error('remove member error:', error);
    res.status(500).json({ success: false, message: 'failed to remove member', error: error.message });
  }
};

module.exports = {
  createTeam,
  inviteMember,
  joinByInviteCode,
  respondToInvite,
  registerTeam,
  getTeamDetails,
  getMyTeams,
  leaveTeam,
  removeMember
};
