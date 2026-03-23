const User = require("../models/User");

exports.updateProfile = async (req, res) => {
    try {
        const {
            name,
            avatar,
            backgroundCheckDocument,
            hostelName,
            hostelDescription,
            hostelLogo,
        } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        user.avatar = avatar || user.avatar;

        if (user.role === "renter") {
            user.backgroundCheckDocument =
                backgroundCheckDocument || user.backgroundCheckDocument;
        }

        if (user.role === "owner") {
            user.hostelName = hostelName || user.hostelName;
            user.hostelDescription = hostelDescription || user.hostelDescription;
            user.hostelLogo = hostelLogo || user.hostelLogo;
        }

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            backgroundCheckDocument: user.backgroundCheckDocument || "",
            hostelName: user.hostelName || "",
            hostelDescription: user.hostelDescription || "",
            hostelLogo: user.hostelLogo || "",
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
