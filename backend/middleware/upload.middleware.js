const multer = require('multer');
const path = require('path');
const fs = require('fs');

const profilePath = path.join(__dirname, '../uploads/profile');
if (!fs.existsSync(profilePath)) fs.mkdirSync(profilePath, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilePath),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});

const categoryPath = path.join(__dirname, '../uploads/categories');
if (!fs.existsSync(categoryPath)) fs.mkdirSync(categoryPath, { recursive: true });

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, categoryPath),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const categoryUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});


//
// PRODUCT IMAGE CONFIG
//
const   productPath = path.join(__dirname, '../uploads/product');
if (!fs.existsSync(productPath)) fs.mkdirSync(productPath, { recursive: true });

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productPath),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});

//
// FILE FILTER (common for all uploads)
//
function imageFileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif/;
  const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowed.test(file.mimetype);
  if (extValid && mimeValid) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
}

//
// EXPORT BOTH
//
module.exports = {
  profileUpload,
  categoryUpload,
  productUpload
};
