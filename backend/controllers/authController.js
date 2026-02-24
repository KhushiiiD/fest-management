// authentication controller
// handles participant registration, login, and profile retrieval

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validateIIITEmail } = require('../middleware/validation');

// register a new participant (iiit or non-iiit only)
// organizers cannot self-register - they are created by admin
const registerParticipant = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password,
      participantType, collegeName, contactNumber
    } = req.body;

    // validate required fields
    if (!firstName || !lastName || !email || !password || !participantType) {
      return res.status(400).json({
        success: false,
        message: 'first name, last name, email, password, and participant type are required'
      });
    }

    // iiit participants must use iiit email domain
    if (participantType === 'iiit') {
      if (!validateIIITEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'iiit participants must use an @iiit.ac.in email address'
        });
      }
    }

    // non-iiit must provide college name
    if (participantType === 'non-iiit' && !collegeName) {
      return res.status(400).json({
        success: false,
        message: 'college/organization name is required for non-iiit participants'
      });
    }

    // password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'password must be at least 6 characters long'
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'user with this email already exists'
      });
    }

    // create participant
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: 'participant',
      firstName,
      lastName,
      participantType,
      collegeName: collegeName || (participantType === 'iiit' ? 'IIIT Hyderabad' : ''),
      contactNumber: contactNumber || '',
      isActive: true
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'registration successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('registration error:', error);
    res.status(500).json({
      success: false,
      message: 'registration failed',
      error: error.message
    });
  }
};

// login for all users (participant, organizer, admin)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'account is deactivated, contact admin'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'invalid email or password'
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'login successful',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({
      success: false,
      message: 'login failed',
      error: error.message
    });
  }
};

// get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'failed to get profile',
      error: error.message
    });
  }
};

// change password for any logged-in user
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'new password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user._id);
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'password changed successfully'
    });
  } catch (error) {
    console.error('change password error:', error);
    res.status(500).json({
      success: false,
      message: 'failed to change password',
      error: error.message
    });
  }
};

// logout (client-side token removal - endpoint for consistency)
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'logout successful'
  });
};

module.exports = {
  registerParticipant,
  login,
  getProfile,
  changePassword,
  logout
};
