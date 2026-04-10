const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGO_URI = "mongodb+srv://satyam:satyam9560@cluster0.m8x1iuz.mongodb.net/myRealProject?retryWrites=true&w=majority";
const JWT_SECRET = "satyam_secret_key_123";

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
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL@gmail.com', // 👈 Apna asli Gmail dalo
    pass: 'YOUR_APP_PASSWORD'     // 👈 16-digit App Password dalo
  }
});

// --- ROUTES ---

// 1. SEND OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { name, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: '"Satyam Official" <YOUR_GMAIL@gmail.com>',
    to: email,
    subject: 'Verification Code',
    html: `<h1>OTP: ${otp}</h1>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to:", email);
    res.status(200).json({ success: true, otp: otp });
  } catch (error) {
    console.error("❌ Nodemailer Error:", error); // 👈 Ise check karna terminal mein
    res.status(500).json({ success: false, error: error.message });
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

    // ✅ FIXED: bcrypt.compare use kiya hai
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