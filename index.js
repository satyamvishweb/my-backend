require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection (Using Environment Variables) ---
const MONGO_URI = process.env.MONGO_URI; 
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error: ", err.message));

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }, 
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // 465 ki jagah 587 try karo
  secure: false, // 587 ke liye secure false rahega
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Ye line connection timeout ko rokne mein madad karti hai
  }
});

// --- ROUTES ---

// 1. SEND OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { name, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: `"Satyam Official" <${process.env.EMAIL_USER}>`, // Variable use kiya taaki hardcoded na rahe
    to: email,
    subject: 'Verification Code',
    html: `<div style="font-family: Arial; padding: 20px;">
             <h2>Verification Code</h2>
             <p>Hi ${name}, tera OTP ye hai: <b>${otp}</b></p>
           </div>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to:", email);
    res.status(200).json({ success: true, otp: otp });
  } catch (error) {
    console.error("❌ Nodemailer Error:", error);
    res.status(500).json({ success: false, error: "Email service issue" });
  }
});

// 2. REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Registered Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 3. LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ error: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Credentials!" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));