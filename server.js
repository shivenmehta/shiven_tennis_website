require('dotenv').config();  // ← add this as the very first line
const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({
    origin: ['http://localhost:5501', 'https://shiventenniswebsite.netlify.app']
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

//Function to build Google Calendar Link for Email
function buildCalendarLink(datetime) {

    // Parse "Sun, May 25 at 5:00 PM" into a Date object
    const cleaned = datetime.replace(' at ', ' ');
    const date = new Date(`${cleaned} 2026`); // add year so JS can parse it

    // Format to YYYYMMDDTHHMMSS for Google Calendar
    const pad = (n) => String(n).padStart(2, '0');
    const start = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;

    // End time = 1 hour later
    const endDate = new Date(date.getTime() + 60 * 60 * 1000);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

    const title = encodeURIComponent('Tennis Session with Shiven Mehta');
    const details = encodeURIComponent('Your tennis session with Shiven Mehta in Sunnyvale, CA');
    const location = encodeURIComponent('Sunnyvale Tennis Center, Sunnyvale, CA');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    
}



app.post('/bookings', async (req, res) => {
    const {firstName, lastName, email, phone, datetime, skillLevel, notes} = req.body;

    //Add User Form Submission to SQL Data Base using query
    try {

        //Save the insertResult into the SQL table to access the id 
        const insertResult = await pool.query(
            `INSERT INTO bookings (first_name, last_name, email, phone, datetime, skill_level, notes) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,    
            [firstName, lastName, email, phone, datetime, skillLevel, notes]
        );

        //Set up cancellation link for user based on the SQL id
        const bookingId = insertResult.rows[0].id;
        const cancelLink = `${process.env.FRONTEND_URL}/cancel.html?id=${bookingId}`;


        //Build Calendar Link - same every time
        const calendarLink = buildCalendarLink(datetime);


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

                        <a href="${cancelLink}"
                            style="display: inline-block; background: transparent; color: #888;
                                    padding: 0.8em 1.5em; border-radius: 25px; text-decoration: none;
                                    border: 1px solid #ddd; margin-top: 0.5em; font-size: 0.85em;">
                                Cancel Booking
                        </a>
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

//Fetch request for cancelling a tennis session
app.post('/cancel', async (req,res) => {
    const {bookingId} = req.body; //Object destructuring

    try {

        //Error checking for cancellation status
        const check = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);

        if (!check.rows[0]) { //Check if cancellation id doesn't exist
            return res.json({success: false, reason: 'not_found'});
        }

        if (check.rows[0].status === 'cancelled') { //Check if booking has already cancelled
            return res.json({sucess: false, reason: 'already_cancelled'});
        }

        //Set status for booking to 'cancelled' in SQL TABLE
        await pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [bookingId]);


        const query = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
        const userData = query.rows[0];

        //Send Cancellation Email
        try {
            await transporter.sendMail({
                from: `Shiven Mehta Tennis <${process.env.GMAIL_USER}>`,
                to: [userData.email, process.env.GMAIL_USER],
                subject: `Booking Cancelled - ${userData.datetime}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                        <h2>Session cancelled, ${userData.first_name}! 🎾</h2>
                        <p>Your tennis session with Shiven has been cancelled.</p>
                        
                        <div style="background: #f5f5f5; padding: 1em; border-radius: 8px; margin: 1.5em 0;">
                            <strong>📅 Date & Time:</strong> ${userData.datetime}<br>
                            <strong>📍 Location:</strong> Sunnyvale, CA<br>
                            <strong>🎾 Level:</strong> ${userData.skill_level}
                        </div>  

                        <p style="margin-top: 2em; color: #888; font-size: 0.85em;">
                            Questions? Reply to this email or visit shiventenniswebsite.netlify.app
                        </p>

                    </div>
                `
            });
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Email erorr: ', emailError);
        }

        res.json({success: true, messsage: 'Booking Deleted'});

    } catch (err) {
        console.error('Cancel error:', err.message);
        res.status(500).json({success: false, message: "Something went wrong"});    
    }
});

//Fetch request for displaying cancellation details on cancellation page
app.get('/bookings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [id]);
        res.json(result.rows[0]); //Return the json file with booking details for the id.
    } catch (err) {
        console.error(err.message);
        res.status(500).json({success: false, message: 'Something went wrong'});
    }
    

})

app.listen(3000, () => console.log('Server running on port 3000'));