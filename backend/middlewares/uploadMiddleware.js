const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

//configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

//file filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)){
        cb(null, true); 
    } else {
        cb(new Error("Only .jpeg, .jpg, .png, and .pdf formats are allowed"), false);
    }
};

const upload = multer({storage, fileFilter});

module.exports = upload;
