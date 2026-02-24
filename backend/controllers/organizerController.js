// organizer controller
// handles organizer-specific features: dashboard, event mgmt, payment approval, profile

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { sendDiscordNotification, sendNewEventNotification } = require('../utils/discord');

// get organizer dashboard
const getDashboard = async (req, res) => {
  try {
    const organizerId = req.user._id;

    // get all events by this organizer
    const events = await Event.find({ organizer: organizerId })
      .sort({ eventStartDate: -1 });

    const now = new Date();
    const ongoingEvents = events.filter(e => e.status === 'ongoing' ||
      (e.status === 'published' && new Date(e.eventStartDate) <= now && new Date(e.eventEndDate) >= now));
    const upcomingEvents = events.filter(e =>
      (e.status === 'published' || e.status === 'draft') && new Date(e.eventStartDate) > now);
    const pastEvents = events.filter(e =>
      e.status === 'completed' || e.status === 'closed');

    // stats
    const totalRegistrations = await Registration.countDocuments({
      event: { $in: events.map(e => e._id) },
      status: { $ne: 'cancelled' }
    });
    const pendingPayments = await Registration.countDocuments({
      event: { $in: events.map(e => e._id) },
      paymentVerificationStatus: 'pending'
    });

    res.status(200).json({
      success: true,
      organizer: req.user.getPublicProfile(),
      stats: {
        totalEvents: events.length,
        ongoingEvents: ongoingEvents.length,
        upcomingEvents: upcomingEvents.length,
        pastEvents: pastEvents.length,
        totalRegistrations,
        pendingPayments
      },
      events: {
        ongoing: ongoingEvents,
        upcoming: upcomingEvents,
        past: pastEvents,
        draft: events.filter(e => e.status === 'draft')
      }
    });
  } catch (error) {
    console.error('organizer dashboard error:', error);
    res.status(500).json({ success: false, message: 'failed to load dashboard', error: error.message });
  }
};

// create event
const createEvent = async (req, res) => {
  try {
    const {
      eventName, eventDescription, eventType, eligibility,
      eventStartDate, eventEndDate, registrationStartDate, registrationEndDate,
      venue, registrationLimit, registrationFee,
      customFormFields, eventTags,
      merchandiseDetails, hackathonDetails
    } = req.body;

    // validation
    if (!eventName || !eventDescription || !eventType) {
      return res.status(400).json({ success: false, message: 'eventName, eventDescription, and eventType are required' });
    }

    const event = new Event({
      eventName,
      eventDescription,
      eventType: eventType || 'normal',
      eligibility: eligibility || 'all',
      eventStartDate,
      eventEndDate,
      registrationStartDate,
      registrationEndDate,
      registrationDeadline: registrationEndDate,
      venue,
      registrationLimit,
      registrationFee: registrationFee || 0,
      organizer: req.user._id,
      customFormFields: customFormFields || [],
      eventTags: eventTags || [],
      status: 'draft'
    });

    if (eventType === 'merchandise' && merchandiseDetails) {
      event.merchandiseDetails = merchandiseDetails;
    }

    if (eventType === 'hackathon' && hackathonDetails) {
      event.hackathonDetails = hackathonDetails;
    }

    await event.save();

    res.status(201).json({
      success: true,
      message: 'event created as draft',
      event
    });
  } catch (error) {
    console.error('create event error:', error);
    res.status(500).json({ success: false, message: 'failed to create event', error: error.message });
  }
};

// update event (with editing rules based on status)
const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    // editing rules based on status
    if (event.status === 'draft') {
      // everything editable in draft
      const allowedFields = [
        'eventName', 'eventDescription', 'eventType', 'eligibility',
        'eventStartDate', 'eventEndDate', 'registrationStartDate', 'registrationEndDate',
        'venue', 'registrationLimit', 'registrationFee',
        'customFormFields', 'eventTags', 'merchandiseDetails', 'hackathonDetails'
      ];
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          event[field] = updates[field];
        }
      }
    } else if (event.status === 'published') {
      // once published: can edit dates, venue, limit, tags, description
      // cannot change: eventType, customFormFields (if formLocked), eligibility
      const editableAfterPublish = [
        'eventDescription', 'eventStartDate', 'eventEndDate',
        'registrationEndDate', 'venue', 'registrationLimit', 'eventTags'
      ];
      for (const field of editableAfterPublish) {
        if (updates[field] !== undefined) {
          event[field] = updates[field];
        }
      }

      // custom form fields can only be edited if form is not locked and no registrations
      if (updates.customFormFields && !event.formLocked) {
        const regCount = await Registration.countDocuments({ event: eventId, status: { $ne: 'cancelled' } });
        if (regCount === 0) {
          event.customFormFields = updates.customFormFields;
        } else {
          return res.status(400).json({
            success: false,
            message: 'cannot modify form fields after participants have registered'
          });
        }
      }
    } else if (event.status === 'ongoing') {
      // very limited editing during event
      if (updates.eventEndDate) event.eventEndDate = updates.eventEndDate;
      if (updates.venue) event.venue = updates.venue;
    } else {
      return res.status(400).json({
        success: false,
        message: 'cannot edit a completed or closed event'
      });
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'event updated',
      event
    });
  } catch (error) {
    console.error('update event error:', error);
    res.status(500).json({ success: false, message: 'failed to update event', error: error.message });
  }
};

// publish event (draft -> published)
const publishEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'only draft events can be published' });
    }

    // validate required fields before publishing
    if (!event.eventStartDate || !event.eventEndDate) {
      return res.status(400).json({ success: false, message: 'event start and end dates are required' });
    }

    event.status = 'published';
    event.formLocked = true;
    await event.save();

    // send discord notification if organizer has webhook configured
    const organizer = await User.findById(req.user._id);
    if (organizer.discordWebhook) {
      try {
        await sendNewEventNotification(organizer.discordWebhook, event);
      } catch (discordErr) {
        console.error('discord notification failed:', discordErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'event published successfully',
      event
    });
  } catch (error) {
    console.error('publish event error:', error);
    res.status(500).json({ success: false, message: 'failed to publish event', error: error.message });
  }
};

// change event status (ongoing, completed, closed)
const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    const validTransitions = {
      'published': ['ongoing', 'closed'],
      'ongoing': ['completed', 'closed'],
      'completed': ['closed']
    };

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    const allowed = validTransitions[event.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `cannot transition from ${event.status} to ${status}`
      });
    }

    event.status = status;
    await event.save();

    res.status(200).json({
      success: true,
      message: `event status changed to ${status}`,
      event
    });
  } catch (error) {
    console.error('update event status error:', error);
    res.status(500).json({ success: false, message: 'failed to update event status', error: error.message });
  }
};

// get organizer's events list
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('get my events error:', error);
    res.status(500).json({ success: false, message: 'failed to get events', error: error.message });
  }
};

// get event with its participants
const getEventWithParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: { $ne: 'cancelled' }
    })
      .populate('participant', 'firstName lastName email participantType collegeName contactNumber')
      .populate('team')
      .sort({ createdAt: -1 });

    const stats = {
      total: registrations.length,
      attended: registrations.filter(r => r.attendanceMarked).length,
      paymentPending: registrations.filter(r => r.paymentVerificationStatus === 'pending').length,
      paymentApproved: registrations.filter(r => r.paymentVerificationStatus === 'approved').length,
      paymentRejected: registrations.filter(r => r.paymentVerificationStatus === 'rejected').length
    };

    res.status(200).json({
      success: true,
      event,
      registrations,
      stats
    });
  } catch (error) {
    console.error('get event participants error:', error);
    res.status(500).json({ success: false, message: 'failed to get event participants', error: error.message });
  }
};

// approve payment
const approvePayment = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .populate('event');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'registration not found' });
    }

    // verify this organizer owns the event
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'not authorized' });
    }

    if (!registration.paymentProof) {
      return res.status(400).json({ success: false, message: 'no payment proof uploaded' });
    }

    registration.paymentVerificationStatus = 'approved';
    registration.paymentStatus = 'paid';
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'payment approved',
      registration
    });
  } catch (error) {
    console.error('approve payment error:', error);
    res.status(500).json({ success: false, message: 'failed to approve payment', error: error.message });
  }
};

// reject payment
const rejectPayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    const registration = await Registration.findById(registrationId)
      .populate('event');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'registration not found' });
    }

    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'not authorized' });
    }

    registration.paymentVerificationStatus = 'rejected';
    registration.paymentStatus = 'pending'; // reset so they can re-upload
    registration.paymentProof = null;
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'payment rejected',
      registration
    });
  } catch (error) {
    console.error('reject payment error:', error);
    res.status(500).json({ success: false, message: 'failed to reject payment', error: error.message });
  }
};

// get pending payments for organizer's events
const getPendingPayments = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id });
    const eventIds = events.map(e => e._id);

    const pendingPayments = await Registration.find({
      event: { $in: eventIds },
      paymentVerificationStatus: 'pending',
      paymentProof: { $ne: null }
    })
      .populate('participant', 'firstName lastName email participantType collegeName')
      .populate('event', 'eventName eventType')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, pendingPayments });
  } catch (error) {
    console.error('get pending payments error:', error);
    res.status(500).json({ success: false, message: 'failed to get pending payments', error: error.message });
  }
};

// get organizer profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('get organizer profile error:', error);
    res.status(500).json({ success: false, message: 'failed to get profile', error: error.message });
  }
};

// update organizer profile
const updateProfile = async (req, res) => {
  try {
    const { organizerName, description, contactEmail, discordWebhook } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    if (organizerName) user.organizerName = organizerName;
    if (description !== undefined) user.description = description;
    if (contactEmail) user.contactEmail = contactEmail;
    if (discordWebhook !== undefined) user.discordWebhook = discordWebhook;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'profile updated',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('update organizer profile error:', error);
    res.status(500).json({ success: false, message: 'failed to update profile', error: error.message });
  }
};

// request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'please provide a reason for the password reset' });
    }

    // check if there's already a pending request
    const existing = await PasswordResetRequest.findOne({
      organizer: req.user._id,
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'you already have a pending password reset request' });
    }

    const resetRequest = new PasswordResetRequest({
      organizer: req.user._id,
      reason
    });
    await resetRequest.save();

    res.status(201).json({
      success: true,
      message: 'password reset request submitted'
    });
  } catch (error) {
    console.error('password reset request error:', error);
    res.status(500).json({ success: false, message: 'failed to submit request', error: error.message });
  }
};

// export participants as CSV
const exportParticipantsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: { $ne: 'cancelled' }
    }).populate('participant', 'firstName lastName email participantType collegeName contactNumber');

    // build CSV
    let csv = 'Ticket ID,First Name,Last Name,Email,Participant Type,College,Contact,Status,Payment Status,Attendance\n';

    for (const reg of registrations) {
      const p = reg.participant;
      csv += `${reg.ticketId},${p.firstName},${p.lastName},${p.email},${p.participantType},${p.collegeName || 'N/A'},${p.contactNumber || 'N/A'},${reg.status},${reg.paymentStatus},${reg.attendanceMarked ? 'Yes' : 'No'}\n`;
    }

    // add form responses as additional columns
    if (event.customFormFields && event.customFormFields.length > 0) {
      const headers = event.customFormFields.map(f => f.fieldName).join(',');
      csv = csv.replace('\n', ',' + headers + '\n');

      const lines = csv.split('\n');
      for (let i = 1; i < lines.length - 1; i++) {
        const reg = registrations[i - 1];
        const formData = event.customFormFields.map(f => {
          const val = reg.formResponses ? reg.formResponses.get(f.fieldName) : '';
          return `"${(val || '').toString().replace(/"/g, '""')}"`;
        }).join(',');
        lines[i] += ',' + formData;
      }
      csv = lines.join('\n');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}-participants.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('export csv error:', error);
    res.status(500).json({ success: false, message: 'failed to export participants', error: error.message });
  }
};

module.exports = {
  getDashboard,
  createEvent,
  updateEvent,
  publishEvent,
  updateEventStatus,
  getMyEvents,
  getEventWithParticipants,
  approvePayment,
  rejectPayment,
  getPendingPayments,
  getProfile,
  updateProfile,
  requestPasswordReset,
  exportParticipantsCSV
};
