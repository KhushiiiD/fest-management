// admin controller
// handles admin-specific features like managing organizers and password resets

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { sendOrganizerCredentials, sendPasswordResetEmail } = require('../utils/email');
const crypto = require('crypto');

// generate random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString('hex');
};

// get admin dashboard statistics
const getDashboard = async (req, res) => {
  try {
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const activeOrganizers = await User.countDocuments({ role: 'organizer', isActive: true });
    const inactiveOrganizers = await User.countDocuments({ role: 'organizer', isActive: false });
    const totalParticipants = await User.countDocuments({ role: 'participant' });
    const totalEvents = await Event.countDocuments();
    const pendingPasswordResets = await PasswordResetRequest.countDocuments({ status: 'pending' });
    const totalPasswordResets = await PasswordResetRequest.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalOrganizers,
        activeOrganizers,
        inactiveOrganizers,
        totalParticipants,
        totalEvents,
        pendingPasswordResets,
        totalPasswordResets
      }
    });
  } catch (error) {
    console.error('get admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'failed to get dashboard data', error: error.message });
  }
};

// create new organizer account (admin creates, no self-registration)
const createOrganizer = async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail } = req.body;

    if (!organizerName || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'organizer name and contact email are required'
      });
    }

    // check if email already exists
    const existingUser = await User.findOne({ email: contactEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'email already in use'
      });
    }

    // generate random password
    const password = generatePassword();

    // create organizer account
    const organizer = await User.create({
      email: contactEmail.toLowerCase(),
      password,
      role: 'organizer',
      organizerName,
      category: category || '',
      description: description || '',
      contactEmail: contactEmail.toLowerCase(),
      isActive: true
    });

    // try to send credentials email
    try {
      await sendOrganizerCredentials(contactEmail, organizerName, password);
    } catch (emailError) {
      console.error('error sending credentials email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'organizer account created successfully',
      organizer: {
        id: organizer._id,
        email: organizer.email,
        organizerName: organizer.organizerName,
        category: organizer.category,
        description: organizer.description,
        temporaryPassword: password
      }
    });
  } catch (error) {
    console.error('create organizer error:', error);
    res.status(500).json({ success: false, message: 'failed to create organizer account', error: error.message });
  }
};

// get all organizers
const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: 'organizer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: organizers.length, organizers });
  } catch (error) {
    console.error('get all organizers error:', error);
    res.status(500).json({ success: false, message: 'failed to get organizers', error: error.message });
  }
};

// deactivate organizer account
const deactivateOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ success: false, message: 'organizer not found' });
    }
    organizer.isActive = false;
    await organizer.save();
    res.status(200).json({ success: true, message: 'organizer account deactivated' });
  } catch (error) {
    console.error('deactivate organizer error:', error);
    res.status(500).json({ success: false, message: 'failed to deactivate organizer', error: error.message });
  }
};

// reactivate organizer account
const reactivateOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ success: false, message: 'organizer not found' });
    }
    organizer.isActive = true;
    await organizer.save();
    res.status(200).json({ success: true, message: 'organizer account reactivated' });
  } catch (error) {
    console.error('reactivate organizer error:', error);
    res.status(500).json({ success: false, message: 'failed to reactivate organizer', error: error.message });
  }
};

// delete organizer account permanently
const deleteOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({ success: false, message: 'organizer not found' });
    }
    await User.findByIdAndDelete(organizerId);
    res.status(200).json({ success: true, message: 'organizer account deleted permanently' });
  } catch (error) {
    console.error('delete organizer error:', error);
    res.status(500).json({ success: false, message: 'failed to delete organizer', error: error.message });
  }
};

// get all password reset requests (tier b feature)
const getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const requests = await PasswordResetRequest.find(query)
      .populate('organizer', 'organizerName email contactEmail')
      .populate('processedBy', 'email')
      .sort({ requestDate: -1 });

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    console.error('get password reset requests error:', error);
    res.status(500).json({ success: false, message: 'failed to get password reset requests', error: error.message });
  }
};

// approve password reset request (tier b feature)
const approvePasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminComment } = req.body;
    const adminId = req.user._id;

    const request = await PasswordResetRequest.findById(requestId)
      .populate('organizer', 'organizerName email');

    if (!request) {
      return res.status(404).json({ success: false, message: 'password reset request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'request has already been processed' });
    }

    // generate new password
    const newPassword = generatePassword();

    // update organizer password
    const organizer = await User.findById(request.organizer._id);
    organizer.password = newPassword;
    await organizer.save();

    // update request
    request.status = 'approved';
    request.processedBy = adminId;
    request.processedDate = new Date();
    request.adminComment = adminComment || '';
    request.newPassword = newPassword;
    await request.save();

    // send email
    try {
      await sendPasswordResetEmail(organizer.email, organizer.organizerName, newPassword);
    } catch (emailError) {
      console.error('error sending password reset email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'password reset approved and new password sent',
      newPassword
    });
  } catch (error) {
    console.error('approve password reset error:', error);
    res.status(500).json({ success: false, message: 'failed to approve password reset', error: error.message });
  }
};

// reject password reset request (tier b feature)
const rejectPasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminComment } = req.body;
    const adminId = req.user._id;

    const request = await PasswordResetRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'password reset request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'request has already been processed' });
    }

    request.status = 'rejected';
    request.processedBy = adminId;
    request.processedDate = new Date();
    request.adminComment = adminComment || '';
    await request.save();

    res.status(200).json({ success: true, message: 'password reset request rejected' });
  } catch (error) {
    console.error('reject password reset error:', error);
    res.status(500).json({ success: false, message: 'failed to reject password reset', error: error.message });
  }
};

module.exports = {
  getDashboard,
  createOrganizer,
  getAllOrganizers,
  deactivateOrganizer,
  reactivateOrganizer,
  deleteOrganizer,
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset
};
