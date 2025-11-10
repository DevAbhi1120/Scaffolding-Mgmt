// routes/categories.routes.js
const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const {verifyAdmin} = require('../middleware/auth.middleware');
const { categoryUpload } = require('../middleware/upload.middleware');

router.post('/', verifyAdmin, categoryUpload.single('thumbnail_image'), categoriesController.createCategory);
router.put('/:id', verifyAdmin, categoryUpload.single('thumbnail_image'), categoriesController.updateCategory);

router.get('/', verifyAdmin, categoriesController.getAllCategories);

router.delete('/:id', verifyAdmin, categoriesController.deleteCategories);

router.get('/:id', verifyAdmin, categoriesController.getCategoryById);

module.exports = router;