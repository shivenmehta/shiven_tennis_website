const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({
    origin: 'https://shiventenniswebsite.netlify.app'
}));
app.use(express.json()); //Let express read JSON requests



//Connect to PostgreSQL Database
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
});

//Create transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

//Function to build Google Calendar Link
function buildCalendarLink() {

     // We need to build a Google Calendar URL with the event details
    const title = encodeURIComponent(`Tennis Session with Shiven Mehta`);
    const details = encodeURIComponent(`Your tennis session with Shiven Mehta in Sunnyvale, CA`);
    const location = encodeURIComponent(`Sunnyvale Tennis Center, Sunnyvale, CA`);

    // Google Calendar URL format
    console.log(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    
}



app.post('/bookings', async (req, res) => {
    const {firstName, lastName, email, phone, datetime, skillLevel, notes} = req.body;

    //Add User Form Submission to SQL Data Base using query
    try {
        await pool.query(
            `INSERT INTO bookings (first_name, last_name, email, phone, datetime, skill_level, notes) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,    
            [firstName, lastName, email, phone, datetime, skillLevel, notes]
        );
        

        //Build Calendar Link - same every time
        const calendarLink = buildCalendarLink();


        //Send Email to User using transporter
        try {
            await transporter.sendMail({
                from: `"Shiven Mehta Tennis" <${process.env.GMAIL_USER}>`,
                to: [email, process.env.GMAIL_USER],
                subject: `Booking Confirmed - ${datetime}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2>You're booked, ${firstName}! 🎾</h2>
                        <p>Your tennis session with Shiven has been confirmed.</p>
                        
                        <div style="background: #f5f5f5; padding: 1em; border-radius: 8px; margin: 1.5em 0;">
                            <strong>📅 Date & Time:</strong> ${datetime}<br>
                            <strong>📍 Location:</strong> Sunnyvale, CA<br>
                            <strong>🎾 Level:</strong> ${skillLevel}
                        </div>

                        <a href="${calendarLink}" 
                        style="display: inline-block; background: #d4e840; color: #1a3a2a; 
                                padding: 0.8em 1.5em; border-radius: 25px; text-decoration: none; 
                                font-weight: 600;">
                            Add to Google Calendar →
                        </a>

                        <p style="margin-top: 2em; color: #888; font-size: 0.85em;">
                            Questions? Reply to this email or visit shiventenniswebsite.netlify.app
                        </p>
                    </div>
                `
            });
            console.log('Email sent succesfully');
        } catch (emailError) {
            console.error('Email error: ', emailError.message);
        }
        

        res.json({success: true, message: 'Booking Saved'});
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Something went wrong.' });
    }

});

app.listen(3000, () => console.log('Server running on port 3000'));