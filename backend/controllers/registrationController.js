// registration controller
// handles event registration, merchandise purchase, payment proof upload

const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const User = require('../models/User');
const { generateQRCode } = require('../utils/qrcode');
const { sendRegistrationEmail, sendMerchandiseEmail } = require('../utils/email');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// multer config for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'payment-proofs'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `payment-${req.user._id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('only jpeg, jpg, png, and pdf files are allowed'));
    }
  }
}).single('paymentProof');

// register for a normal/hackathon event
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { formResponses } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    // check if event registration is open (published or ongoing, deadline not passed)
    const now = new Date();
    const isOpen = ['published', 'ongoing'].includes(event.status) && event.registrationDeadline > now;
    if (!isOpen) {
      return res.status(400).json({ success: false, message: 'registration is not open for this event' });
    }

    // check eligibility
    const user = await User.findById(req.user._id);
    if (event.eligibility !== 'all') {
      if (event.eligibility === 'iiit-only' && user.participantType !== 'iiit') {
        return res.status(403).json({ success: false, message: 'this event is only for IIIT students' });
      }
      if (event.eligibility === 'non-iiit-only' && user.participantType !== 'non-iiit') {
        return res.status(403).json({ success: false, message: 'this event is only for non-IIIT students' });
      }
    }

    // check if already registered
    const existing = await Registration.findOne({ participant: req.user._id, event: eventId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'you are already registered for this event' });
    }

    // check registration limit
    const currentCount = await Registration.countDocuments({ event: eventId, status: { $ne: 'cancelled' } });
    if (event.registrationLimit && currentCount >= event.registrationLimit) {
      return res.status(400).json({ success: false, message: 'registration limit reached' });
    }

    // validate required custom form fields
    if (event.customFormFields && event.customFormFields.length > 0) {
      const requiredFields = event.customFormFields.filter(f => f.isRequired);
      for (const field of requiredFields) {
        if (!formResponses || !formResponses[field.fieldName]) {
          return res.status(400).json({
            success: false,
            message: `required field "${field.fieldName}" is missing`
          });
        }
      }
    }

    // create registration
    const ticketId = uuidv4();
    const registration = new Registration({
      ticketId,
      participant: req.user._id,
      event: eventId,
      status: 'confirmed',
      formResponses: formResponses ? new Map(Object.entries(formResponses)) : new Map()
    });

    // handle payment
    if (event.registrationFee && event.registrationFee > 0) {
      registration.paymentStatus = 'pending';
      registration.paymentAmount = event.registrationFee;
      registration.paymentVerificationStatus = 'pending';
    } else {
      registration.paymentStatus = 'not-required';
      registration.paymentAmount = 0;
      registration.paymentVerificationStatus = 'not-required';
    }

    // generate QR code
    const qrData = JSON.stringify({
      ticketId: registration.ticketId,
      eventId: event._id,
      participantId: req.user._id,
      eventName: event.eventName
    });
    registration.qrCode = await generateQRCode(qrData);

    await registration.save();

    // update event trending score
    await event.updateTrendingScore();

    // send confirmation email
    try {
      await sendRegistrationEmail(user, event, registration);
    } catch (emailErr) {
      console.error('failed to send registration email:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'registered successfully',
      registration
    });
  } catch (error) {
    console.error('registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'you are already registered for this event' });
    }
    res.status(500).json({ success: false, message: 'registration failed', error: error.message });
  }
};

// purchase merchandise
const purchaseMerchandise = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { selectedItems, formResponses } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    if (event.eventType !== 'merchandise') {
      return res.status(400).json({ success: false, message: 'this is not a merchandise event' });
    }

    if (!event.canRegister()) {
      return res.status(400).json({ success: false, message: 'merchandise purchase is closed' });
    }

    if (!selectedItems || selectedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'please select at least one item' });
    }

    // calculate total
    let totalAmount = 0;
    const merchandiseDetails = [];
    for (const item of selectedItems) {
      const merch = event.merchandiseDetails.find(m => m.itemName === item.itemName);
      if (!merch) {
        return res.status(400).json({ success: false, message: `item "${item.itemName}" not found` });
      }
      if (merch.availableStock !== undefined && merch.availableStock < item.quantity) {
        return res.status(400).json({ success: false, message: `insufficient stock for "${item.itemName}"` });
      }
      totalAmount += merch.price * item.quantity;
      merchandiseDetails.push({
        itemName: item.itemName,
        size: item.size,
        quantity: item.quantity,
        price: merch.price
      });
    }

    const ticketId = uuidv4();
    const registration = new Registration({
      ticketId,
      participant: req.user._id,
      event: eventId,
      status: 'confirmed',
      paymentStatus: 'pending',
      paymentAmount: totalAmount,
      merchandiseDetails,
      formResponses: formResponses ? new Map(Object.entries(formResponses)) : new Map()
    });

    // generate QR code
    const qrData = JSON.stringify({
      ticketId: registration.ticketId,
      eventId: event._id,
      participantId: req.user._id,
      eventName: event.eventName,
      type: 'merchandise'
    });
    registration.qrCode = await generateQRCode(qrData);

    await registration.save();
    await event.updateTrendingScore();

    const user = await User.findById(req.user._id);
    try {
      await sendMerchandiseEmail(user, event, registration);
    } catch (emailErr) {
      console.error('failed to send merchandise email:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'merchandise purchase registered',
      registration
    });
  } catch (error) {
    console.error('merchandise purchase error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'you already have a purchase for this event' });
    }
    res.status(500).json({ success: false, message: 'purchase failed', error: error.message });
  }
};

// upload payment proof
const uploadPaymentProof = async (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: `upload error: ${err.message}` });
        }
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'please upload a payment proof file' });
      }

      const { registrationId } = req.params;
      const registration = await Registration.findOne({
        _id: registrationId,
        participant: req.user._id
      });

      if (!registration) {
        return res.status(404).json({ success: false, message: 'registration not found' });
      }

      if (registration.paymentStatus === 'not-required') {
        return res.status(400).json({ success: false, message: 'no payment required for this registration' });
      }

      registration.paymentProof = `/uploads/payment-proofs/${req.file.filename}`;
      registration.paymentVerificationStatus = 'pending';
      await registration.save();

      res.status(200).json({
        success: true,
        message: 'payment proof uploaded successfully',
        registration
      });
    } catch (error) {
      console.error('upload payment proof error:', error);
      res.status(500).json({ success: false, message: 'failed to upload payment proof', error: error.message });
    }
  });
};

// get my registrations (participant)
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ participant: req.user._id })
      .populate('event', 'eventName eventType eventStartDate eventEndDate venue status organizer')
      .populate('team')
      .sort({ createdAt: -1 });

    // populate organizer name on events
    await Registration.populate(registrations, {
      path: 'event.organizer',
      select: 'organizerName'
    });

    res.status(200).json({ success: true, registrations });
  } catch (error) {
    console.error('get my registrations error:', error);
    res.status(500).json({ success: false, message: 'failed to get registrations', error: error.message });
  }
};

// get single registration details
const getRegistrationDetails = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findOne({
      _id: registrationId,
      participant: req.user._id
    })
      .populate('event')
      .populate('team');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'registration not found' });
    }

    res.status(200).json({ success: true, registration });
  } catch (error) {
    console.error('get registration details error:', error);
    res.status(500).json({ success: false, message: 'failed to get registration details', error: error.message });
  }
};

// cancel registration
const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findOne({
      _id: registrationId,
      participant: req.user._id
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'registration not found' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'registration is already cancelled' });
    }

    if (registration.attendanceMarked) {
      return res.status(400).json({ success: false, message: 'cannot cancel after attendance has been marked' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // remove from team if applicable
    if (registration.team) {
      const team = await Team.findById(registration.team);
      if (team) {
        await team.removeMember(req.user._id);
      }
    }

    // update trending score
    const event = await Event.findById(registration.event);
    if (event) await event.updateTrendingScore();

    res.status(200).json({
      success: true,
      message: 'registration cancelled successfully'
    });
  } catch (error) {
    console.error('cancel registration error:', error);
    res.status(500).json({ success: false, message: 'failed to cancel registration', error: error.message });
  }
};

module.exports = {
  registerForEvent,
  purchaseMerchandise,
  uploadPaymentProof,
  getMyRegistrations,
  getRegistrationDetails,
  cancelRegistration
};
