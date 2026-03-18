const User = require("../models/User");
const jwt = require("jsonwebtoken");

//generate token

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "60d"})
}

//@desc register new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, avatar, role } = req.body;

        // validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // Create new user
        const user = new User({ name, email, password, role, avatar });
        await user.save(); // pre-save hook will hash the password

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            token: generateToken(user._id),
            companyName: user.companyName || '',
            companyDescription: user.companyDescription || '',
            companyLogo: user.companyLogo || '',
            resume: user.resume || '',
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: err.message });
    }
};

//@desc login user
exports.login = async(req, res) => {
    try{
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user || !(await user.matchPassword(password))){
            return res.status(401).json({message: "Invalid email or password"});
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            avatar: user.avatar || '',
            companyName: user.companyName || '',
            companyDescription: user.companyDescription || '',
            companyLogo: user.companyLogo || '',
            resume: user.resume || '', 
        });
    } catch (err){
        res.status(500).json({message: err.message});
    }
};

//@desc get logged- in user
exports.getMe = async(req, res) => {
    res.json(req.user);
};