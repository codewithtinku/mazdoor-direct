const db = require('../config/db');

// Sare categories fetch karna (Electrician, Plumber, etc.)
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Server error fetching categories' });
    }
};

// Sari local areas fetch karna
exports.getLocalities = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM localities ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching localities:', error);
        res.status(500).json({ success: false, message: 'Server error fetching localities' });
    }
};