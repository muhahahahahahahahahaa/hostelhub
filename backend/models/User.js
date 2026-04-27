const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const leaseTemplateSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        url: { type: String, trim: true, default: "" },
        content: { type: String, trim: true, default: "" },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required:true, unique: true},
    password: {type: String, required:true},
    role: {type: String, enum: ["renter", "owner"], required: true},
    avatar: String,
    backgroundCheckDocument: String,
    leaseAgreementTemplate: String,
    leaseAgreementTemplateName: String,
    leaseAgreementTemplates: {
        type: [leaseTemplateSchema],
        default: [],
    },
    hostelName: String,
    hostelDescription: String,
    hostelLogo: String,
},{timestamps: true});

//encrypt password before save
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return; // no need for next()
    try {
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
        throw error; // Mongoose will handle the error
    }
});

//match password
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
