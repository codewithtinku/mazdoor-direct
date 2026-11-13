const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Send OTP to Registered Worker or Employer
router.post('/send-otp', async (req, res) => {
    try {
        const { phone_number, role } = req.body;
        if (!phone_number || phone_number.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Sahi 10-digit mobile number dalein.' });
        }

        const cleanPhone = phone_number.trim();
        const userRole = role === 'employer' ? 'employer' : 'worker';

        // Check if user exists
        if (userRole === 'worker') {
            const [workers] = await db.query('SELECT id, full_name FROM workers WHERE phone_number = ?', [cleanPhone]);
            if (workers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ye mobile number Worker ke roop mein registered nahi hai. Pehle Worker Registration karein.'
                });
            }
        } else {
            const [employers] = await db.query('SELECT id, full_name FROM employers WHERE phone_number = ?', [cleanPhone]);
            if (employers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ye mobile number Employer ke roop mein registered nahi hai. Pehle Employer Registration karein.'
                });
            }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes valid

        await db.query('DELETE FROM otp_codes WHERE phone_number = ? AND role = ?', [cleanPhone, userRole]);
        await db.query(
            'INSERT INTO otp_codes (phone_number, otp_code, role, expires_at) VALUES (?, ?, ?, ?)',
            [cleanPhone, otp, userRole, expiresAt]
        );

        res.json({
            success: true,
            message: `OTP bhej diya gaya hai! (Demo OTP: ${otp})`,
            demo_otp: otp
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error sending OTP' });
    }
});

// 2. Verify OTP & Return User Session Data
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone_number, otp_code, role } = req.body;
        if (!phone_number || !otp_code) {
            return res.status(400).json({ success: false, message: 'Mobile number aur OTP dono bharein.' });
        }

        const cleanPhone = phone_number.trim();
        const userRole = role === 'employer' ? 'employer' : 'worker';

        const [rows] = await db.query(
            'SELECT * FROM otp_codes WHERE phone_number = ? AND role = ? AND otp_code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
            [cleanPhone, userRole, otp_code.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Galat ya expire ho chuka OTP! Dobara koshish karein.' });
        }

        // Delete used OTP
        await db.query('DELETE FROM otp_codes WHERE id = ?', [rows[0].id]);

        if (userRole === 'worker') {
            const [workers] = await db.query(
                `SELECT w.*, c.name AS category_name, l.name AS locality_name 
                 FROM workers w 
                 LEFT JOIN categories c ON w.category_id = c.id 
                 LEFT JOIN localities l ON w.locality_id = l.id 
                 WHERE w.phone_number = ? LIMIT 1`,
                [cleanPhone]
            );
            return res.json({ success: true, role: 'worker', user: workers[0] });
        } else {
            const [employers] = await db.query(
                `SELECT e.*, l.name AS locality_name 
                 FROM employers e 
                 LEFT JOIN localities l ON e.locality_id = l.id 
                 WHERE e.phone_number = ? LIMIT 1`,
                [cleanPhone]
            );
            return res.json({ success: true, role: 'employer', user: employers[0] });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error verifying OTP' });
    }
});

module.exports = router;