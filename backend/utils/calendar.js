// calendar utility functions (tier c feature)
// handles generation of .ics files for calendar integration

// generate ics file content for event
const generateICSFile = (event, participant) => {
  // format dates for ics file (YYYYMMDDTHHMMSSZ)
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // create unique id for event
  const uid = `${event._id}@fest-management.com`;
  
  // create ics content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Fest Management//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(event.eventStartDate)}
DTEND:${formatDate(event.eventEndDate)}
SUMMARY:${event.eventName}
DESCRIPTION:${event.eventDescription.replace(/\n/g, '\\n')}
LOCATION:Event Venue
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
  
  return icsContent;
};

// generate google calendar url
const generateGoogleCalendarURL = (event) => {
  // format dates for google calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.eventName,
    details: event.eventDescription,
    dates: `${formatDate(event.eventStartDate)}/${formatDate(event.eventEndDate)}`,
    location: 'Event Venue'
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// generate outlook calendar url
const generateOutlookCalendarURL = (event) => {
  // format dates for outlook (ISO 8601)
  const formatDate = (date) => {
    return new Date(date).toISOString();
  };
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.eventName,
    body: event.eventDescription,
    startdt: formatDate(event.eventStartDate),
    enddt: formatDate(event.eventEndDate),
    location: 'Event Venue'
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

module.exports = {
  generateICSFile,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL
};
