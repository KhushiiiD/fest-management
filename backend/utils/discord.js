// discord webhook utility
// handles posting notifications to discord webhooks

const https = require('https');
const { URL } = require('url');

// send message to discord webhook
const sendDiscordNotification = async (webhookUrl, message) => {
  if (!webhookUrl) {
    console.log('no discord webhook configured');
    return;
  }
  
  try {
    // parse webhook url
    const url = new URL(webhookUrl);
    
    // prepare message payload
    const payload = JSON.stringify({
      content: message.content,
      embeds: message.embeds || []
    });
    
    // make https request to discord
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('discord notification sent successfully');
            resolve(true);
          } else {
            console.error('discord webhook error:', res.statusCode, data);
            reject(new Error(`discord webhook returned status ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('error sending discord notification:', error);
        reject(error);
      });
      
      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error('error sending discord notification:', error);
    throw error;
  }
};

// send new event notification to discord
const sendNewEventNotification = async (webhookUrl, event, organizerName) => {
  const message = {
    content: '🎉 new event published!',
    embeds: [{
      title: event.eventName,
      description: event.eventDescription,
      color: 3447003, // blue color
      fields: [
        {
          name: 'organizer',
          value: organizerName,
          inline: true
        },
        {
          name: 'type',
          value: event.eventType,
          inline: true
        },
        {
          name: 'registration deadline',
          value: new Date(event.registrationDeadline).toLocaleDateString(),
          inline: true
        },
        {
          name: 'event start',
          value: new Date(event.eventStartDate).toLocaleDateString(),
          inline: true
        },
        {
          name: 'registration fee',
          value: `₹${event.registrationFee}`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    }]
  };
  
  await sendDiscordNotification(webhookUrl, message);
};

module.exports = {
  sendDiscordNotification,
  sendNewEventNotification
};
