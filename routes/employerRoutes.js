const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Get All Employers (For Admin & Verification)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                e.*,
                l.name AS locality_name
            FROM employers e
            LEFT JOIN localities l ON e.locality_id = l.id
            ORDER BY e.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching employers:', error);
        res.status(500).json({ success: false, message: 'Server error fetching employers' });
    }
});

// 2. Register Employer
const registerEmployer = async (req, res) => {
    try {
        const {
            full_name,
            phone_number,
            business_name,
            locality_id,
            village,
            employer_type
        } = req.body;

        if (!full_name || !phone_number || !locality_id) {
            return res.status(400).json({ success: false, message: 'Naam, Mobile Number aur Location chuna zaroori hai.' });
        }

        const [result] = await db.query(
            `INSERT INTO employers (full_name, phone_number, business_name, locality_id, village, employer_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                full_name.trim(),
                phone_number.trim(),
                (business_name || '').trim(),
                locality_id,
                (village || '').trim(),
                (employer_type || 'Individual').trim()
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Employer registration safal raha! Ab aap kaam post kar sakte hain.',
            employer_id: result.insertId
        });
    } catch (error) {
        console.error('Employer registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during employer registration' });
    }
};

router.post('/', registerEmployer);
router.post('/register', registerEmployer);

// 3. Delete Employer (For Admin)
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM employers WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Employer delete ho gaya.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting employer' });
    }
});

module.exports = router;