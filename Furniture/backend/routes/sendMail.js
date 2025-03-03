const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tulasirammadaka403@gmail.com',  // Replace with your Gmail
    pass: 'dvpvftoqhhfpsdnw'      // Replace with App Password
  }
});
// katarikishore1234
// Define email options
const mailOptions = {
  from: 'tulasirammadaka403@gmail.com',
  to: 'enoshreddyvarala@gmail.com',  // Replace with recipient email
  subject: 'Automated Email',
  text: 'Hello! This is an automatically sent email from Node.js.'
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
