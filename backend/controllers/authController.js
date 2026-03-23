const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined. Check backend/.env loading.");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "60d" });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, avatar, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = new User({ name, email, password, role, avatar });
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            backgroundCheckDocument: user.backgroundCheckDocument || "",
            role: user.role,
            token: generateToken(user._id),
            hostelName: user.hostelName || "",
            hostelDescription: user.hostelDescription || "",
            hostelLogo: user.hostelLogo || "",
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            avatar: user.avatar || "",
            backgroundCheckDocument: user.backgroundCheckDocument || "",
            hostelName: user.hostelName || "",
            hostelDescription: user.hostelDescription || "",
            hostelLogo: user.hostelLogo || "",
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMe = async (req, res) => {
    res.json(req.user);
};
