const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// AB YE CHALNA HI CHAHIYE 🔥
// Username: satyam | Password: satyam9560
const MONGO_URI = "mongodb+srv://satyam:satyam9560@cluster0.m8x1iuz.mongodb.net/myDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DATABASE CONNECTED! Party shuru karo Satyam bhai! 🚀"))
  .catch(err => {
    console.log("❌ DB Error: ", err.message);
  });

app.get('/', (req, res) => res.send("<h1>Backend Live!</h1>"));

// Server Port (Render ke liye process.env.PORT hona zaroori hai)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chalu hai: http://localhost:${PORT}`));