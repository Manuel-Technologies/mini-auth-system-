const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

// Load environment variables
const EMAIL_USER = process.env.EMAIL_USER || "emmanuelchekwubechukwu22@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "iblyfpxtwuivtxer"; // no spaces
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // change for security

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Temporary in-memory storage for OTPs
let otps = {};

// Route: request OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email] = otp;

  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Route: verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  if (otps[email] === otp) {
    delete otps[email]; // remove once used
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ message: "OTP verified", token });
  } else {
    return res.status(400).json({ error: "Invalid OTP" });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Mini Auth Service is running 🚀");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));