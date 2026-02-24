// event controller
// handles event browsing and details (public-facing)

const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { generateICSFile, generateGoogleCalendarURL, generateOutlookCalendarURL } = require('../utils/calendar');

// browse/search events with filters (public endpoint)
const browseEvents = async (req, res) => {
  try {
    const {
      search, eventType, eligibility,
      startDate, endDate, followedClubsOnly, trending
    } = req.query;

    // build query - only published or ongoing events visible
    let query = { status: { $in: ['published', 'ongoing'] } };

    // fuzzy search on event name, description, organizer names
    if (search) {
      // also search by organizer name
      const matchingOrganizers = await User.find({
        role: 'organizer',
        $or: [
          { organizerName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const organizerIds = matchingOrganizers.map(o => o._id);

      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { eventDescription: { $regex: search, $options: 'i' } },
        { eventTags: { $in: [new RegExp(search, 'i')] } },
        { organizer: { $in: organizerIds } }
      ];
    }

    if (eventType) query.eventType = eventType;
    if (eligibility) query.eligibility = eligibility;

    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    // followed clubs filter
    if (followedClubsOnly === 'true' && req.user) {
      const participant = await User.findById(req.user._id);
      if (participant && participant.followedClubs && participant.followedClubs.length > 0) {
        query.organizer = { $in: participant.followedClubs };
      }
    }

    let events;
    if (trending === 'true') {
      // top 5 trending events by recent registration count
      events = await Event.find(query)
        .populate('organizer', 'organizerName email category description')
        .sort({ trendingScore: -1 })
        .limit(5);
    } else {
      // sort by user preferences if logged in
      events = await Event.find(query)
        .populate('organizer', 'organizerName email category description')
        .sort({ eventStartDate: 1 });

      // if user is logged in, prioritize events matching their interests
      if (req.user && req.user.role === 'participant') {
        const participant = await User.findById(req.user._id);
        if (participant && participant.interests && participant.interests.length > 0) {
          events.sort((a, b) => {
            const aMatch = a.eventTags.some(tag =>
              participant.interests.some(interest =>
                tag.toLowerCase().includes(interest.toLowerCase())
              )
            );
            const bMatch = b.eventTags.some(tag =>
              participant.interests.some(interest =>
                tag.toLowerCase().includes(interest.toLowerCase())
              )
            );
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
        }
      }
    }

    // also return trending events separately
    const trendingEvents = await Event.find({ status: { $in: ['published', 'ongoing'] } })
      .populate('organizer', 'organizerName email category')
      .sort({ trendingScore: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: events.length,
      events,
      trending: trendingEvents
    });
  } catch (error) {
    console.error('browse events error:', error);
    res.status(500).json({ success: false, message: 'failed to browse events', error: error.message });
  }
};

// get event details by id
const getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('organizer', 'organizerName email category description contactEmail');

    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    // check if user has already registered
    let hasRegistered = false;
    let registration = null;
    if (req.user) {
      registration = await Registration.findOne({
        participant: req.user._id,
        event: eventId
      }).populate('team');
      hasRegistered = !!registration;
    }

    res.status(200).json({
      success: true,
      event,
      hasRegistered,
      registration
    });
  } catch (error) {
    console.error('get event details error:', error);
    res.status(500).json({ success: false, message: 'failed to get event details', error: error.message });
  }
};

// export event to calendar (tier c feature)
const exportToCalendar = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { format } = req.query; // 'ics', 'google', or 'outlook'

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'event not found' });
    }

    // check if user is registered
    const registration = await Registration.findOne({
      participant: req.user._id,
      event: eventId
    });
    if (!registration) {
      return res.status(403).json({ success: false, message: 'you must be registered to export this event' });
    }

    if (format === 'google') {
      return res.status(200).json({ success: true, url: generateGoogleCalendarURL(event) });
    }
    if (format === 'outlook') {
      return res.status(200).json({ success: true, url: generateOutlookCalendarURL(event) });
    }

    // default to ics file
    const icsContent = generateICSFile(event, req.user);
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}.ics"`);
    res.status(200).send(icsContent);
  } catch (error) {
    console.error('export to calendar error:', error);
    res.status(500).json({ success: false, message: 'failed to export event', error: error.message });
  }
};

module.exports = {
  browseEvents,
  getEventDetails,
  exportToCalendar
};
