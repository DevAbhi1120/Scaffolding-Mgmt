const multer = require("multer");
const path = require("path");
const fs = require("fs");

const productTypePath = path.join(__dirname, "../uploads/productType");
if (!fs.existsSync(productTypePath)) fs.mkdirSync(productTypePath, { recursive: true });

// ✅ file filter define kar diya
function imageFileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
}

const productTypeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productTypePath),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const productTypeUpload = multer({
  storage: productTypeStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter,
});

module.exports = { productTypeUpload };
