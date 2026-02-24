// attendance controller
// handles qr-based attendance scanning, manual attendance, and reporting

const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { parseQRData } = require('../utils/qrcode');

// scan QR code and mark attendance
const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ success: false, message: 'QR data is required' });
    }

    let parsed;
    try {
      parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'invalid QR code data' });
    }

    const { ticketId, eventId, participantId } = parsed;

    // verify the event belongs to this organizer
    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(403).json({ success: false, message: 'event not found or not authorized' });
    }

    // find the registration
    const registration = await Registration.findOne({
      ticketId,
      event: eventId,
      participant: participantId,
      status: { $ne: 'cancelled' }
    }).populate('participant', 'firstName lastName email participantType collegeName');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'registration not found. ticket may be invalid.' });
    }

    // check if paid events need payment verification
    if (registration.paymentStatus === 'pending' && registration.paymentVerificationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'payment not verified for this registration',
        registration
      });
    }

    // check if already marked
    if (registration.attendanceMarked) {
      return res.status(400).json({
        success: false,
        message: 'attendance already marked',
        participant: registration.participant,
        attendanceTime: registration.attendanceTime
      });
    }

    // mark attendance
    registration.attendanceMarked = true;
    registration.attendanceTime = new Date();
    registration.attendanceMarkedBy = req.user._id;
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'attendance marked successfully',
      participant: registration.participant,
      ticketId: registration.ticketId,
      attendanceTime: registration.attendanceTime
    });
  } catch (error) {
    console.error('scan qr code error:', error);
    res.status(500).json({ success: false, message: 'failed to scan QR code', error: error.message });
  }
};

// manual attendance marking
const manualAttendance = async (req, res) => {
  try {
    const { eventId, participantEmail } = req.body;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(403).json({ success: false, message: 'event not found or not authorized' });
    }

    // find by participant email
    const User = require('../models/User');
    const participant = await User.findOne({ email: participantEmail, role: 'participant' });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'participant not found' });
    }

    const registration = await Registration.findOne({
      participant: participant._id,
      event: eventId,
      status: { $ne: 'cancelled' }
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'participant is not registered for this event' });
    }

    if (registration.attendanceMarked) {
      return res.status(400).json({
        success: false,
        message: 'attendance already marked',
        attendanceTime: registration.attendanceTime
      });
    }

    registration.attendanceMarked = true;
    registration.attendanceTime = new Date();
    registration.attendanceMarkedBy = req.user._id;
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'attendance marked manually',
      participant: {
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email
      },
      attendanceTime: registration.attendanceTime
    });
  } catch (error) {
    console.error('manual attendance error:', error);
    res.status(500).json({ success: false, message: 'failed to mark attendance', error: error.message });
  }
};

// get attendance dashboard for an event
const getAttendanceDashboard = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(403).json({ success: false, message: 'event not found or not authorized' });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: { $ne: 'cancelled' }
    }).populate('participant', 'firstName lastName email participantType collegeName');

    const attended = registrations.filter(r => r.attendanceMarked);
    const notAttended = registrations.filter(r => !r.attendanceMarked);

    res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        eventName: event.eventName,
        eventStartDate: event.eventStartDate,
        eventEndDate: event.eventEndDate
      },
      stats: {
        totalRegistered: registrations.length,
        totalAttended: attended.length,
        totalPending: notAttended.length,
        attendanceRate: registrations.length > 0
          ? Math.round((attended.length / registrations.length) * 100)
          : 0
      },
      attended,
      notAttended
    });
  } catch (error) {
    console.error('attendance dashboard error:', error);
    res.status(500).json({ success: false, message: 'failed to load attendance dashboard', error: error.message });
  }
};

// export attendance as CSV
const exportAttendanceCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizer: req.user._id });
    if (!event) {
      return res.status(403).json({ success: false, message: 'event not found or not authorized' });
    }

    const registrations = await Registration.find({
      event: eventId,
      status: { $ne: 'cancelled' }
    }).populate('participant', 'firstName lastName email participantType collegeName contactNumber');

    let csv = 'Ticket ID,First Name,Last Name,Email,Type,College,Contact,Attendance,Attendance Time\n';

    for (const reg of registrations) {
      const p = reg.participant;
      csv += `${reg.ticketId},${p.firstName},${p.lastName},${p.email},${p.participantType},${p.collegeName || 'N/A'},${p.contactNumber || 'N/A'},${reg.attendanceMarked ? 'Present' : 'Absent'},${reg.attendanceTime ? new Date(reg.attendanceTime).toISOString() : 'N/A'}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}-attendance.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('export attendance csv error:', error);
    res.status(500).json({ success: false, message: 'failed to export attendance', error: error.message });
  }
};

module.exports = {
  scanQRCode,
  manualAttendance,
  getAttendanceDashboard,
  exportAttendanceCSV
};
