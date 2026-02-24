// participant controller
// handles participant-specific features: profile, dashboard, clubs, preferences

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// get participant dashboard
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followedClubs', 'organizerName category');

    // upcoming registered events
    const registrations = await Registration.find({
      participant: req.user._id,
      status: { $ne: 'cancelled' }
    }).populate({
      path: 'event',
      populate: { path: 'organizer', select: 'organizerName category' }
    }).sort({ createdAt: -1 });

    const now = new Date();
    const upcomingEvents = registrations
      .filter(r => r.event && new Date(r.event.eventStartDate) > now)
      .map(r => ({
        registration: r,
        event: r.event
      }));

    const pastEvents = registrations
      .filter(r => r.event && new Date(r.event.eventEndDate) < now)
      .map(r => ({
        registration: r,
        event: r.event
      }));

    // recommended events based on interests
    let recommendedEvents = [];
    if (user.interests && user.interests.length > 0) {
      recommendedEvents = await Event.find({
        status: { $in: ['published', 'ongoing'] },
        eventStartDate: { $gte: now },
        eventTags: { $in: user.interests.map(i => new RegExp(i, 'i')) }
      })
        .populate('organizer', 'organizerName category')
        .limit(5);
    }

    // trending events
    const trendingEvents = await Event.find({
      status: { $in: ['published', 'ongoing'] }
    })
      .populate('organizer', 'organizerName category')
      .sort({ trendingScore: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
      upcomingEvents,
      pastEvents,
      recommendedEvents,
      trendingEvents,
      followedClubs: user.followedClubs,
      totalRegistrations: registrations.length
    });
  } catch (error) {
    console.error('participant dashboard error:', error);
    res.status(500).json({ success: false, message: 'failed to load dashboard', error: error.message });
  }
};

// get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('followedClubs', 'organizerName category');
    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('get profile error:', error);
    res.status(500).json({ success: false, message: 'failed to get profile', error: error.message });
  }
};

// update profile (editable fields only)
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, collegeName, interests } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    // only allow editing these fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (contactNumber) user.contactNumber = contactNumber;
    if (collegeName && user.participantType === 'non-iiit') {
      user.collegeName = collegeName;
    }
    if (interests) user.interests = interests;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'profile updated',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('update profile error:', error);
    res.status(500).json({ success: false, message: 'failed to update profile', error: error.message });
  }
};

// complete onboarding (set interests+preferences after first login)
const completeOnboarding = async (req, res) => {
  try {
    const { interests, followedClubs } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    if (interests && Array.isArray(interests)) {
      user.interests = interests;
    }
    if (followedClubs && Array.isArray(followedClubs)) {
      // verify these are valid organizer IDs
      const validOrganizers = await User.find({
        _id: { $in: followedClubs },
        role: 'organizer',
        isActive: true
      });
      user.followedClubs = validOrganizers.map(o => o._id);
    }

    user.onboardingCompleted = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'onboarding completed',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('complete onboarding error:', error);
    res.status(500).json({ success: false, message: 'failed to complete onboarding', error: error.message });
  }
};

// follow a club (organizer)
const followClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await User.findOne({ _id: clubId, role: 'organizer', isActive: true });
    if (!club) {
      return res.status(404).json({ success: false, message: 'club not found' });
    }

    const user = await User.findById(req.user._id);
    if (user.followedClubs.includes(clubId)) {
      return res.status(400).json({ success: false, message: 'already following this club' });
    }

    user.followedClubs.push(clubId);
    await user.save();

    res.status(200).json({
      success: true,
      message: `now following ${club.organizerName}`
    });
  } catch (error) {
    console.error('follow club error:', error);
    res.status(500).json({ success: false, message: 'failed to follow club', error: error.message });
  }
};

// unfollow a club
const unfollowClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    const user = await User.findById(req.user._id);
    user.followedClubs = user.followedClubs.filter(c => c.toString() !== clubId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'unfollowed club'
    });
  } catch (error) {
    console.error('unfollow club error:', error);
    res.status(500).json({ success: false, message: 'failed to unfollow club', error: error.message });
  }
};

// get all clubs (organizers) with optional search
const getAllClubs = async (req, res) => {
  try {
    const { search, category } = req.query;

    let query = { role: 'organizer', isActive: true };
    if (search) {
      query.$or = [
        { organizerName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const clubs = await User.find(query)
      .select('organizerName category description contactEmail email');

    // get event counts for each club
    const clubsWithCounts = await Promise.all(
      clubs.map(async (club) => {
        const eventCount = await Event.countDocuments({
          organizer: club._id,
          status: { $in: ['published', 'ongoing'] }
        });
        return {
          ...club.toObject(),
          eventCount
        };
      })
    );

    // check which clubs user follows
    let followedClubIds = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      followedClubIds = user.followedClubs.map(c => c.toString());
    }

    const result = clubsWithCounts.map(club => ({
      ...club,
      isFollowing: followedClubIds.includes(club._id.toString())
    }));

    res.status(200).json({ success: true, clubs: result });
  } catch (error) {
    console.error('get all clubs error:', error);
    res.status(500).json({ success: false, message: 'failed to get clubs', error: error.message });
  }
};

// get club details with their events
const getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await User.findOne({ _id: clubId, role: 'organizer' })
      .select('organizerName category description contactEmail email');

    if (!club) {
      return res.status(404).json({ success: false, message: 'club not found' });
    }

    const events = await Event.find({
      organizer: clubId,
      status: { $in: ['published', 'ongoing', 'completed'] }
    }).sort({ eventStartDate: -1 });

    let isFollowing = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      isFollowing = user.followedClubs.some(c => c.toString() === clubId);
    }

    res.status(200).json({
      success: true,
      club,
      events,
      isFollowing
    });
  } catch (error) {
    console.error('get club details error:', error);
    res.status(500).json({ success: false, message: 'failed to get club details', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  completeOnboarding,
  followClub,
  unfollowClub,
  getAllClubs,
  getClubDetails
};
