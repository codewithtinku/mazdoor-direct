const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Get Jobs (Supports Block, Panchayat, Village, Category & Search)
router.get('/', async (req, res) => {
    try {
        const { category_id, locality_id, search, all } = req.query;

        let query = `
            SELECT 
                j.*,
                c.name AS category_name,
                c.group_name AS category_group,
                l.name AS locality_name
            FROM jobs j
            LEFT JOIN categories c ON j.category_id = c.id
            LEFT JOIN localities l ON j.locality_id = l.id
            WHERE 1=1
        `;
        const params = [];

        if (all !== 'true') {
            query += " AND j.status = 'approved'";
        }

        if (category_id) {
            query += ' AND j.category_id = ?';
            params.push(category_id);
        }

        if (locality_id) {
            query += ' AND j.locality_id = ?';
            params.push(locality_id);
        }

        if (search) {
            query += ' AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ? OR l.name LIKE ? OR j.panchayat LIKE ? OR j.village LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY j.created_at DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ success: false, message: 'Server error fetching jobs' });
    }
});

// 2. Post a New Job (With Panchayat & Village)
router.post('/', async (req, res) => {
    try {
        const {
            title,
            category_id,
            locality_id,
            panchayat,
            village,
            wage,
            payment_type,
            description,
            contact_mode,
            employer_name,
            employer_phone
        } = req.body;

        if (!title || !category_id || !locality_id || !employer_name || !employer_phone) {
            return res.status(400).json({
                success: false,
                message: 'Job Title, Category, Block, aapka Naam aur Mobile Number zaroori hai.'
            });
        }

        await db.query(
            `INSERT INTO jobs 
            (title, category_id, locality_id, panchayat, village, wage, payment_type, description, contact_mode, employer_name, employer_phone, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                title.trim(),
                category_id,
                locality_id,
                (panchayat || '').trim(),
                (village || '').trim(),
                (wage || 'Negotiable').trim(),
                (payment_type || 'Per Day').trim(),
                (description || '').trim(),
                (contact_mode || 'website').trim(),
                employer_name.trim(),
                employer_phone.trim()
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Job post ho gayi hai! Admin approval ke baad ye live dikhne lagegi.'
        });
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ success: false, message: 'Server error posting job' });
    }
});

// 3. Apply / Contact Through Website for a Job
router.post('/:id/apply', async (req, res) => {
    try {
        const { id } = req.params;
        const { applicant_name, applicant_phone, message } = req.body;

        if (!applicant_name || !applicant_phone) {
            return res.status(400).json({ success: false, message: 'Apna naam aur mobile number bharein.' });
        }

        await db.query(
            'INSERT INTO job_applications (job_id, applicant_name, applicant_phone, message) VALUES (?, ?, ?, ?)',
            [id, applicant_name.trim(), applicant_phone.trim(), (message || '').trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Aapki application employer tak bhej di gayi hai!'
        });
    } catch (error) {
        console.error('Job apply error:', error);
        res.status(500).json({ success: false, message: 'Server error submitting application' });
    }
});

// 4. Approve Job (Admin)
router.patch('/:id/approve', async (req, res) => {
    try {
        await db.query("UPDATE jobs SET status = 'approved' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Job approve ho gayi hai!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error approving job' });
    }
});

// 5. Delete Job (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Job delete ho gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error deleting job' });
    }
});

module.exports = router;