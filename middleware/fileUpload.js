// middleware/upload.js
const fs = require('fs');
const multer = require('multer'); 
const path = require('path');

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads'); // Resolve to uploads in the home directory
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true }); // Create the uploads folder if it doesn't exist
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname;
        const fileExtension = path.extname(originalName);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${fileExtension}`);
    },
});

// Allowed file types
const allowedFormats = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    if (!allowedFormats.includes(file.mimetype)) {
        return cb(new Error('Invalid file format. Only PDF, DOC, DOCX, ZIP, and PPTX are allowed.'));
    }
    cb(null, true);
};

// Initialize multer with storage and file filter
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max file size: 5MB
    fileFilter,
});

module.exports = upload;
