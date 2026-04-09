const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); // Ye zaroori hai taaki Web aur App dono access kar sakein
app.use(express.json());

// Database Connection
const MONGO_URI = "mongodb+srv://satyam:satyam9560@cluster0.m8x1iuz.mongodb.net/myDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ API is connected to MongoDB!"))
  .catch(err => console.log("❌ DB Error: ", err.message));

// Schema: Maan lo ye ek 'Users' ya 'Products' ki API hai
const ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', ItemSchema);

// --- API ROUTES ---

// 1. Home Page (Sirf check karne ke liye)
app.get('/', (req, res) => {
  res.send({ status: "Success", message: "Satyam's Universal API is Running!" });
});

// 2. GET ALL: Saara data nikalne ke liye (Web/App dono par list dikhane ke liye)
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST: Naya data dalne ke liye (App ya Web se form submit hone par)
app.post('/api/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE: Kisi item ko delete karne ke liye
app.delete('/api/items/:id', async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// 5. UPDATE: Kisi item ko badalne ke liye (id ke through)
app.put('/api/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    
    // findByIdAndUpdate database mein item dhoond kar use naye data se badal dega
    const updatedItem = await Item.findByIdAndUpdate(id, updatedData, { new: true });
    
    if (!updatedItem) {
      return res.status(404).json({ message: "Item nahi mila!" });
    }

    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: "Update error: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API Server live on port ${PORT}`));