const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'worker-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Kripya sirf image file upload karein!'), false);
    }
};

exports.upload = multer({ storage: storage, fileFilter: fileFilter });

// 1. Get All Workers (Supports filtering & Admin all=true)
exports.getWorkers = async (req, res) => {
    try {
        const { category_id, locality_id, search, all } = req.query;

        let query = `
            SELECT 
                w.id,
                w.full_name,
                w.phone_number,
                w.profile_photo,
                w.category_id,
                w.locality_id,
                w.district,
                w.village,
                w.daily_rate,
                w.visiting_charge,
                w.experience_years,
                w.is_verified,
                w.is_available,
                w.contact_permission,
                w.created_at,
                c.name AS category_name,
                c.group_name AS category_group,
                l.name AS locality_name,
                l.pincode,
                l.latitude,
                l.longitude,
                ROUND(AVG(r.rating), 1) AS avg_rating,
                COUNT(r.id) AS review_count
            FROM workers w
            LEFT JOIN categories c ON w.category_id = c.id
            LEFT JOIN localities l ON w.locality_id = l.id
            LEFT JOIN reviews r ON w.id = r.worker_id
            WHERE 1=1
        `;
        const params = [];

        if (all !== 'true') {
            query += ' AND w.is_available = TRUE AND w.contact_permission = 1';
        }

        if (category_id) {
            query += ' AND w.category_id = ?';
            params.push(category_id);
        }

        if (locality_id) {
            query += ' AND w.locality_id = ?';
            params.push(locality_id);
        }

        if (search) {
            query += ' AND (w.full_name LIKE ? OR c.name LIKE ? OR l.name LIKE ? OR w.village LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY w.id ORDER BY w.is_verified DESC, w.created_at DESC';

        const [workers] = await db.query(query, params);
        res.json({ success: true, data: workers });
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ success: false, message: 'Server error fetching workers' });
    }
};

// 2. Get Single Worker Profile
exports.getWorkerProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const workerQuery = `
            SELECT 
                w.*,
                c.name AS category_name,
                c.group_name AS category_group,
                l.name AS locality_name,
                l.pincode,
                ROUND(AVG(r.rating), 1) AS avg_rating,
                COUNT(r.id) AS review_count
            FROM workers w
            LEFT JOIN categories c ON w.category_id = c.id
            LEFT JOIN localities l ON w.locality_id = l.id
            LEFT JOIN reviews r ON w.id = r.worker_id
            WHERE w.id = ?
            GROUP BY w.id
        `;
        const [worker] = await db.query(workerQuery, [id]);

        if (worker.length === 0) {
            return res.status(404).json({ success: false, message: 'Karigar nahi mila.' });
        }

        const [reviews] = await db.query(
            'SELECT customer_name, rating, comment, created_at FROM reviews WHERE worker_id = ? ORDER BY created_at DESC',
            [id]
        );

        res.json({
            success: true,
            data: { ...worker[0], reviews }
        });
    } catch (error) {
        console.error('Error in profile API:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 3. Register Worker (With District, Village, Availability & Contact Permission)
exports.registerWorker = async (req, res) => {
    try {
        const {
            full_name,
            phone_number,
            category_id,
            locality_id,
            district,
            village,
            daily_rate,
            visiting_charge,
            experience_years,
            is_available,
            contact_permission
        } = req.body;

        const profile_photo = req.file ? `/uploads/${req.file.filename}` : null;

        if (!full_name || !phone_number || !category_id || !locality_id) {
            return res.status(400).json({ success: false, message: 'Naam, Mobile, Category aur Block bharna zaroori hai.' });
        }

        if (contact_permission !== '1' && contact_permission !== 'true' && contact_permission !== 'on' && contact_permission !== true) {
            return res.status(400).json({ success: false, message: 'Profile public karne ke liye contact permission tick karna zaroori hai.' });
        }

        const [existing] = await db.query('SELECT id FROM workers WHERE phone_number = ?', [phone_number.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Ye mobile number pehle se registered hai.' });
        }

        const availFlag = (is_available === '0' || is_available === 'false' || is_available === 'Busy') ? 0 : 1;

        await db.query(
            `INSERT INTO workers 
            (full_name, phone_number, profile_photo, category_id, locality_id, district, village, daily_rate, visiting_charge, experience_years, is_available, contact_permission) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_name.trim(),
                phone_number.trim(),
                profile_photo,
                category_id,
                locality_id,
                (district || 'Koderma').trim(),
                (village || '').trim(),
                daily_rate || 0,
                visiting_charge || 0,
                experience_years || 0,
                availFlag,
                1
            ]
        );

        res.status(201).json({ success: true, message: 'Karigar safaltapoorvak register ho gaya!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

// 4. Toggle Verification Status
exports.toggleVerify = async (req, res) => {
    try {
        const { id } = req.params;
        const [worker] = await db.query('SELECT is_verified FROM workers WHERE id = ?', [id]);
        if (worker.length === 0) return res.status(404).json({ success: false, message: 'Worker nahi mila' });

        const newStatus = !worker[0].is_verified;
        await db.query('UPDATE workers SET is_verified = ? WHERE id = ?', [newStatus, id]);
        res.json({ success: true, is_verified: newStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 5. Delete Worker
exports.deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM workers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Worker delete ho gaya' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// 6. Add Review
exports.addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, rating, comment } = req.body;
        if (!customer_name || !rating) return res.status(400).json({ success: false, message: 'Naam aur rating zaroori hai.' });

        await db.query(
            'INSERT INTO reviews (worker_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)',
            [id, customer_name.trim(), rating, comment ? comment.trim() : null]
        );
        res.status(201).json({ success: true, message: 'Review submit ho gaya!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};