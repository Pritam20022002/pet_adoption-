const express = require("express");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg"); // PostgreSQL client
require('dotenv').config(); // To load environment variables
const bcrypt = require('bcrypt');

const app = express();

app.use(cors({
  origin: "*", // Allow only your frontend
  methods: "GET, POST , DELETE", // Allow necessary HTTP methods
  allowedHeaders: "Content-Type",
  credentials: true
}));
// Serve static files (uploaded images)
// app.use("/uploads", express.static("uploads"));
app.use('/uploads', express.static(path.join(__dirname, 'backend/uploads')));

//serving static files
app.use(express.static('frontend'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection using connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Database connected');
  }
});

// POST route for user registration
app.post('/register', async (req, res) => {
  const { name, mobile_number, password } = req.body;

  // Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

  // Add RETURNING id to get the inserted user's ID
  const query = 'INSERT INTO users (name, mobile_number, password) VALUES ($1, $2, $3) RETURNING id';

  pool.query(query, [name, mobile_number, hashedPassword], (err, result) => {
    if (err) {
      console.error('Error inserting user into database', err);
      return res.status(500).send('Database error');
    }

    // Ensure the query returned a valid result
    if (result.rows.length === 0) {
      return res.status(500).send('User registration failed');
    }

    const userId = result.rows[0].id; // Get the returned ID

    res.json({
      message: 'Registration successful',
      userId: userId,  // Include the user ID in the response
    });
  });
});


// POST route for user login
app.post('/login', async (req, res) => {
  const { mobile_number, password } = req.body;

  const query = 'SELECT * FROM users WHERE mobile_number = $1';
  
  pool.query(query, [mobile_number], async (err, result) => {
    if (err) {
      console.error('Error querying user', err);
      return res.status(500).send('Database error');
    }

    if (result.rows.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = result.rows[0];
    
    // Compare the entered password with the hashed password in the database
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).send('Incorrect password');
    }
    const userId = result.rows[0].id;
    res.json({
      message: 'Login successful',
      userId: userId,
    });
  });
});


// Middleware to parse incoming JSON data
app.use(express.json());



// // Get all pet ads (or filter by type)
// const storage = multer.diskStorage({
//   destination: "backend/uploads/", // Store uploaded files here
//   filename: (req, file, cb) => {
//     console.log(`Uploading file: ${file.originalname}`);
//     cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
//   }
// });

// Configure multer for handling image uploads
const storage = multer.memoryStorage(); // Store the file in memory (as buffer)
const upload = multer({ storage: storage });
// Post a new pet ad
app.post("/ads", upload.single("image"), async (req, res) => {
  try {
    const { pet_name, pet_type, location, contact_details, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imageBuffer = req.file.buffer;

    const result = await pool.query(
      "INSERT INTO ads (pet_name, pet_type, location, contact_details, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [pet_name, pet_type, location, contact_details, imageBuffer, user_id]
    );

    res.status(201).json({ success: true, message: "Ad posted successfully", ad: result.rows[0] });
  } catch (err) {
    console.error("Error posting ad:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/ads/:id/image", async (req, res) => {
  try {
    const adId = req.params.id;
    // Correct the query
    const query = 'SELECT image_url FROM ads WHERE id = $1';
    const result = await pool.query(query, [adId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const imageBuffer = result.rows[0].image_url;

    res.setHeader('Content-Type', 'image/jpeg'); // Set the content type to image/jpeg

    res.send(imageBuffer); // Send the binary data
  } catch (err) {
    console.error('Error retrieving image:', err);
    res.status(500).json({ error: err.message }); // Keep json for error
  }
});


// Dashboard
app.get("/dashboard", (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).send('User ID is missing');
  }

  const query = 'SELECT * FROM ads WHERE user_id = $1';
  
  pool.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user ads', err);
      return res.status(500).send('Database error');
    }

    const ads = result.rows.map(ad => ({
      ...ad,
      image_url: `/ads/${ad.id}/image`
    }));

    res.json(ads);
  });
});

// deleting an ad
app.delete("/ads/:id", async (req, res) => {
  const adId = req.params.id;

  try {
    // No need to fetch image_url here
    // Delete the ad from the database
    await pool.query("DELETE FROM ads WHERE id = $1", [adId]);

    res.json({ message: "Ad deleted successfully" });

  } catch (err) {
    console.error("Error deleting ad:", err);
    res.status(500).json({ error: "Server error" });
  }
});




// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
