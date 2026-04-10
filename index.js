const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Login session ke liye zaroori hai

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGO_URI = "mongodb+srv://satyam:satyam9560@cluster0.m8x1iuz.mongodb.net/myRealProject?retryWrites=true&w=majority";
const JWT_SECRET = "satyam_secret_key_123"; // Ise .env mein rakhna chahiye baad mein

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected for Real Project"))
  .catch(err => console.log("❌ DB Error: ", err.message));

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }, // Default admin taaki dashboard access kar sako
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_GMAIL@gmail.com', 
    pass: 'YOUR_APP_PASSWORD'    
  }
});

// --- ROUTES ---

// 1. SEND OTP: Backend se email verification
app.post('/api/auth/send-otp', async (req, res) => {
  const { name, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const mailOptions = {
    from: '"Satyam Official" <YOUR_GMAIL@gmail.com>',
    to: email,
    subject: 'Verification Code for Your New Project',
    html: `
      <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #007bff;">Email Verification</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Tera registration OTP code ye hai:</p>
        <h1 style="background: #f8f9fa; padding: 15px; text-align: center; letter-spacing: 5px; color: #333;">${otp}</h1>
        <p>Ise kisi ko mat batana.</p>
      </div>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, otp: otp });
  } catch (error) {
    res.status(500).json({ success: false, error: "Email nahi ja saka!" });
  }
});

// 2. REGISTER: Verify hone ke baad user save karna
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email pehle se register hai!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Admin Registered Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// 3. LOGIN: Admin entry ke liye
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ error: "User nahi mila!" });

    const isMatch = await bcrypt.hash(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Galat Password!" });

    // Token generate karo taaki session bana rahe
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Real Project Backend live on port ${PORT}`));