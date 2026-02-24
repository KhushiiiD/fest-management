// validation middleware
const validator = require('validator');

const validateIIITEmail = (email) => {
  const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
  return iiitDomains.some(domain => email.toLowerCase().endsWith(domain));
};

const validateParticipantRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, participantType, collegeName } = req.body;

  if (!email || !password || !firstName || !lastName || !participantType) {
    return res.status(400).json({
      success: false,
      message: 'email, password, firstName, lastName, and participantType are required'
    });
  }
  if (!['iiit', 'non-iiit'].includes(participantType)) {
    return res.status(400).json({
      success: false,
      message: 'participantType must be "iiit" or "non-iiit"'
    });
  }
  if (participantType === 'iiit' && !validateIIITEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'IIIT students must use an IIIT email address'
    });
  }
  if (participantType === 'non-iiit' && !collegeName) {
    return res.status(400).json({
      success: false,
      message: 'college name is required for non-IIIT participants'
    });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'invalid email format' });
  }
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'password must be at least 6 characters long'
    });
  }
  next();
};

const validateEventCreation = (req, res, next) => {
  const { eventName, eventDescription, eventType } = req.body;

  if (!eventName || !eventDescription || !eventType) {
    return res.status(400).json({
      success: false,
      message: 'eventName, eventDescription, and eventType are required'
    });
  }

  if (!['normal', 'merchandise', 'hackathon'].includes(eventType)) {
    return res.status(400).json({
      success: false,
      message: 'eventType must be normal, merchandise, or hackathon'
    });
  }

  next();
};

module.exports = { validateIIITEmail, validateParticipantRegistration, validateEventCreation };
