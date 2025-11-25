const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const ALLOWED_FILE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads/re-image"));
  },
  filename: function (req, file, cb) {
    // Generate secure random filename
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const extension = ALLOWED_FILE_TYPES[file.mimetype];
    cb(null, `${uniqueId}-${Date.now()}.${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 4,
  },
});

module.exports = storage;
module.exports.upload = upload;
