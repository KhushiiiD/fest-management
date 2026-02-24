// email utility functions
// handles sending emails using nodemailer

const nodemailer = require('nodemailer');

// check if email is properly configured
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  return (
    user &&
    pass &&
    user !== 'your_email@gmail.com' &&
    pass !== 'your_email_app_password' &&
    user.includes('@')
  );
};

// create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// send registration confirmation email
const sendRegistrationEmail = async (userEmail, userName, ticketId, eventName, qrCodeData) => {
  if (!isEmailConfigured()) return;
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `registration confirmed - ${eventName}`,
      html: `
        <h2>registration successful</h2>
        <p>dear ${userName},</p>
        <p>your registration for <strong>${eventName}</strong> has been confirmed.</p>
        <p><strong>ticket id:</strong> ${ticketId}</p>
        <p>please keep this email for your records. you will need to present your ticket at the event.</p>
        <br>
        <p>see you at the event!</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('registration email sent to:', userEmail);
  } catch (error) {
    console.error('error sending registration email:', error);
    throw error;
  }
};

// send merchandise purchase confirmation email
const sendMerchandiseEmail = async (userEmail, userName, ticketId, itemName, details) => {
  if (!isEmailConfigured()) return;
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `purchase confirmed - ${itemName}`,
      html: `
        <h2>purchase successful</h2>
        <p>dear ${userName},</p>
        <p>your purchase of <strong>${itemName}</strong> has been confirmed.</p>
        <p><strong>ticket id:</strong> ${ticketId}</p>
        <p><strong>details:</strong> size: ${details.size}, color: ${details.color}, quantity: ${details.quantity}</p>
        <p>please present this ticket when collecting your merchandise.</p>
        <br>
        <p>thank you for your purchase!</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('merchandise email sent to:', userEmail);
  } catch (error) {
    console.error('error sending merchandise email:', error);
    throw error;
  }
};

// send organizer credentials email
const sendOrganizerCredentials = async (email, organizerName, password) => {
  if (!isEmailConfigured()) return;
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'your organizer account credentials',
      html: `
        <h2>organizer account created</h2>
        <p>hello ${organizerName},</p>
        <p>your organizer account has been created for the fest management system.</p>
        <p><strong>email:</strong> ${email}</p>
        <p><strong>temporary password:</strong> ${password}</p>
        <p>please login and change your password as soon as possible.</p>
        <br>
        <p>welcome to the team!</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('credentials email sent to:', email);
  } catch (error) {
    console.error('error sending credentials email:', error);
    throw error;
  }
};

// send password reset email
const sendPasswordResetEmail = async (email, organizerName, newPassword) => {
  if (!isEmailConfigured()) return;
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'password reset successful',
      html: `
        <h2>password has been reset</h2>
        <p>hello ${organizerName},</p>
        <p>your password has been reset by the administrator.</p>
        <p><strong>new temporary password:</strong> ${newPassword}</p>
        <p>please login and change your password immediately.</p>
        <br>
        <p>if you did not request this reset, please contact the administrator.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('password reset email sent to:', email);
  } catch (error) {
    console.error('error sending password reset email:', error);
    throw error;
  }
};

// send team invitation email
const sendTeamInviteEmail = async (userEmail, userName, teamName, eventName, inviteCode) => {
  if (!isEmailConfigured()) return;
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `team invitation - ${eventName}`,
      html: `
        <h2>you have been invited to join a team</h2>
        <p>dear ${userName},</p>
        <p>you have been invited to join team <strong>${teamName}</strong> for <strong>${eventName}</strong>.</p>
        <p><strong>invite code:</strong> ${inviteCode}</p>
        <p>please login to your account to accept or decline this invitation.</p>
        <br>
        <p>good luck!</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('team invite email sent to:', userEmail);
  } catch (error) {
    console.error('error sending team invite email:', error);
    throw error;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendMerchandiseEmail,
  sendOrganizerCredentials,
  sendPasswordResetEmail,
  sendTeamInviteEmail
};
