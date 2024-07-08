const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
require("dotenv").config();

// Function to send an email
async function sendEmail(to, subject, text) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_MAIL, // Your email
      pass: process.env.SMPT_PASSWORD, // Your app-specific password
    },
  });

  let mailOptions = {
    from: process.env.SMTP_MAIL, // Your email
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Function to schedule the email
function scheduleEmail(email, startTime, message) {
  // Calculate the time 2 minutes from now
  const currentTime = new Date(startTime);
  const scheduledTime = new Date(currentTime.getTime() - 10 * 60 * 1000); // 2 minutes from now

  // Schedule the email using node-schedule
  schedule.scheduleJob(scheduledTime, () => {
    sendEmail(
      "raghav1010reddy@gmail.com",
      "Scheduled Email",
      "sent message message"
    );
  });

  console.log(`Email scheduled for: ${scheduledTime} to ${email}`);
}

// Example usage
const email = "recipient@example.com";
const message = "This is a scheduled email message.";

module.exports = { scheduleEmail };
