const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); //Let express read JSON requests

//Connect to PostgreSQL Database
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

app.post('/bookings', async (req, res) => {
    const {firstName, lastName, email, phone, datetime, skillLevel, notes} = req.body;

    //Add User Form Submission to SQL Data Base using query
    try {
        await pool.query(
            `INSERT INTO bookings (first_name, last_name, email, phone, datetime, skill_level, notes) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,    
            [firstName, lastName, email, phone, datetime, skillLevel, notes]
        );
        res.json({success: true, message: 'Booking Saved'});
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Something went wrong.' });
    }

});

app.listen(3000, () => console.log('Server running on port 3000'));