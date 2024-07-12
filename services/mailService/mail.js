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
function scheduleEmail(email, startTime, url) {
  // Calculate the time 2 minutes from now
  const currentTime = new Date(startTime);

  const scheduledTime = new Date(currentTime.getTime() - 10 * 60 * 1000);
  sendEmail(
    email,
    "You have registered to a contest on chat here",
    `contest will start at ${new Date(
      startTime
    ).toISOString()} we will remind you again before 10minutes of start of contest,
     
    
    join contest at https://codehere-v1.web.app/contest/${url}`
  );
  // Schedule the email using node-schedule
  schedule.scheduleJob(scheduledTime, () => {
    sendEmail(
      email,
      `contest your registered will start with in 10 minutes i.e ${new Date(
        startTime
      ).toISOString()}`,
      `join contest at https://codehere-v1.erb.app/contest/${url}`
    );
  });

  console.log(`Email scheduled for: ${scheduledTime} to ${email}`);
}
module.exports = { scheduleEmail };
