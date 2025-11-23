const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const EMAIL_USER = process.env.EMAIL_USER || "emmanuelchekwubechukwu22@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "iblyfpxtwuivtxer";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// In-memory OTP storage with expiration
const otps = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP with 5-minute expiration
function storeOTP(email, otp) {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otps.set(email, { otp, expiresAt });
}

// Validate OTP
function validateOTP(email, otp) {
  const record = otps.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otps.delete(email);
    return false;
  }
  return record.otp === otp;
}

// Send OTP endpoint
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = generateOTP();
  storeOTP(email, otp);

  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP endpoint
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  if (validateOTP(email, otp)) {
    otps.delete(email);
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ message: "OTP verified", token });
  }

  res.status(400).json({ error: "Invalid or expired OTP" });
});

// Health check
app.get("/", (req, res) => {
  res.send("Mini Auth Service is running 🚀");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));