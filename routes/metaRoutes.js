const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');

router.get('/categories', metaController.getCategories);
router.get('/localities', metaController.getLocalities);

module.exports = router;