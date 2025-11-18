const express = require('express');
const router = express.Router();
const swmsController = require('../controllers/swms.controller');
const { authMiddleware, checkAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');  // For photos if needed

router.use(authMiddleware);
router.post('/', swmsController.submit);
router.put('/:id', checkAdmin, swmsController.update);  // Admin editable

module.exports = router;