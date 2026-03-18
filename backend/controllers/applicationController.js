const Application = require("../models/Application");
const Job = require("../models/Job");

//@desc  apply to a job
exports.applyToJob = async (req, res) =>{
    try{
        if (req.user.role !== "jobseeker"){
            return res.status(403).json({message: "only job seeker can apply"});
        }

        const existing =await Application.findOne({
            job: req.params.jobId,
            applicant: req.user._id, 
        });

        if(existing){
            return res.status(400).json({ message: "already applied to this job"});
        }

        const application = await Application.create({
            job: req.params.jobId,
            applicant: req.user._id,
            resume: req.user.resume, //assuming resume is stored in users profile
        });

        res.status(201).json(application);

    } catch(err){
        res.status(500).json({message: err.message});
    }
};

//@desc  get logged in user's applications
exports.getMyApplications = async(req,res) => {
    try{
        const apps = await Application.find({applicant: req.user._id})
        .populate("job", "title company location type")
        .sort({ createdAt: -1});

        res.json(apps);
    } catch(err){
        res.status(500).json({message: err.message});
    }
};

//@desc  get all applications for a job(employer)
exports.getApplicantsForJob = async (req, res) =>{
    try{
        const job = await Job.findById(req.params.jobId);

        if (!job || job.company.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "not authorized to view applicants"});
        }

        const applications = await Application.find({job: req.params.jobId})
        .populate("job","title location category type")
        .populate("applicant", "name email avatar resume");

        res.json(applications);
    } catch(err){
        res.status(500).json({message: err.message});
    }
};

//@desc  get application by id (employer of jobseeker)
exports.getApplicationById = async (req, res) =>{
    try{
        const app = await Application.findById(req.params.id)
        .populate("job", "title")
        .populate("applicant","name email avatar resume");

        if (!app) return res.status(404).json({message: "application not found.", id:req.params.id});
        const isOwner = 
        app.applicant._id.toString() === req.user._id.toString() ||
        app.job.company.toString() === req.user._id.toString();

        if(!isOwner) {
            return res.status(403).json({message: "not authorized to view this application"});
        }

        res.json(app);
    } catch(err){
        res.status(500).json({message: err.message});
    }
};

//@desc  update application status (employer)
exports.updateStatus = async (req, res) => {
    try{
        const {status} = req.body;
        const app = await Application.findById(req.params.id).populate("job");

        if (!app || app.job.company.toString() !== req.user._id.toString()){
            return res.status(403).json({message:"not authorized to update this application"});
        }

        app.status = status;
        await app.save();

        res.json({message: "application status updated", status});
    } catch(err){
        res.status(500).json({message: err.message});
    }
};