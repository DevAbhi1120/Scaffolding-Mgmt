// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {verifyAdmin} = require('../middleware/auth.middleware');
const { profileUpload } = require('../middleware/upload.middleware'); // updated import

// GET all users
router.get('/', verifyAdmin, userController.getAllUsers);
router.get('/search',verifyAdmin, userController.searchUser);


router.get('/:id', verifyAdmin, userController.getUsers);

router.put('/:id', verifyAdmin, profileUpload.single('profile_image'), userController.updateUser);
router.put('/:id/delete',verifyAdmin, userController.softDeleteUser); //soft delete
router.put('/:id/restore',verifyAdmin,userController.restoreUser);




module.exports = router;