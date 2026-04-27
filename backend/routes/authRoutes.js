const express = require("express");
const {register, login, getMe} = require("../controllers/authController");
const {protect} = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");


const router = express.Router();
const buildUploadUrl = (req, file) =>
    `/uploads/${file.filename}`;

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

router.post("/upload-image", upload.single("image"), (req,res)=>{
    if (!req.file) {
        return res.status(400).json({message: "no file uploaded"})
    }
    if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Only image files are allowed" });
    }

    const imageUrl = buildUploadUrl(req, req.file);
    res.status(200).json({imageUrl, assetUrl: imageUrl});
});

router.post("/upload-file", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "no file uploaded" });
    }

    const allowedFileTypes = [
        "application/pdf",
        "image/png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedFileTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            message: "Only PDF, PNG, or DOCX files are allowed",
        });
    }

    const fileUrl = buildUploadUrl(req, req.file);
    res.status(200).json({
        fileUrl,
        assetUrl: fileUrl,
        mimeType: req.file.mimetype,
    });
});

module.exports = router;
