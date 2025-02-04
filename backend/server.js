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
app.use(cors());
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


// Set up multer to store images in the "uploads/" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage: storage });

// Middleware to parse incoming JSON data
app.use(express.json());

// Create an API endpoint to handle file upload
app.post('/upload', upload.single('image'), (req, res) => {
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  
  // Insert the image URL and other ad details into the PostgreSQL database
  const { pet_name, pet_type, location, contact_details } = req.body;
  const query = 'INSERT INTO ads (pet_name, pet_type, location, contact_details, image_url) VALUES ($1, $2, $3, $4, $5)';
  
  pool.query(query, [pet_name, pet_type, location, contact_details, imageUrl], (err, result) => {
    if (err) {
      console.error('Error inserting ad into database', err);
      return res.status(500).send('Database error');
    }
    res.status(200).send('Ad with image uploaded successfully');
  });
});

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Get all pet ads (or filter by type)
app.get("/ads", async (req, res) => {
  try {
    const { petType } = req.query;
    let query = "SELECT * FROM ads";
    let values = [];

    if (petType) {
      query += " WHERE pet_type = $1";
      values.push(petType);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a new pet ad
app.post("/ads", async (req, res) => {
  try {
    const { pet_name, pet_type, location, contact_details, image_url, user_id } = req.body;
    
    // Check if user_id is provided
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Insert into the database
    const result = await pool.query(
      "INSERT INTO ads (pet_name, pet_type, location, contact_details, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [pet_name, pet_type, location, contact_details, image_url, user_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Dashboard
app.get("/dashboard", (req, res) => {
  const userId = req.query.user_id; // Get user_id from query parameters
  if (!userId) {
    return res.status(400).send('User ID is missing');
  }
  const query = 'SELECT * FROM ads WHERE user_id = $1';
  
  pool.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user ads', err);
      return res.status(500).send('Database error');
    }
    res.json(result.rows); // Send the user-specific ads as JSON
  });
});

// deleting an ad
app.delete("/ads/:id", (req, res) => {
  const adId = req.params.id;  // Get the ad id from the URL parameters

  const query = 'DELETE FROM ads WHERE id = $1';  // Only delete by ad id
  
  pool.query(query, [adId], (err, result) => {
    if (err) {
      console.error('Error deleting ad', err);
      return res.status(500).send('Database error');
    }
    if (result.rowCount === 0) {
      return res.status(404).send('Ad not found');
    }
    res.status(200).send('Ad deleted successfully');
  });
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
