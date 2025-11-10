const express = require('express');
const router = express.Router();
const productTypesController = require('../controllers/productType.controller');
const {verifyAdmin} = require('../middleware/auth.middleware');
const { productTypeUpload } = require('../middleware/productTypeUpload');

router.post('/', verifyAdmin, productTypeUpload.single('thumbnail_image'), productTypesController.createProductType);
router.put('/:id', verifyAdmin, productTypeUpload.single('thumbnail_image'), productTypesController.updateProductType);

router.get('/', verifyAdmin, productTypesController.getAllProductTypes);

router.delete('/:id', verifyAdmin, productTypesController.deleteProductTypes);

router.get('/:id', verifyAdmin, productTypesController.getProductTypeById);

module.exports = router;