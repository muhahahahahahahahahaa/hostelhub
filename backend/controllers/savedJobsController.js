const SavedJob = require("../models/SavedJob");

//@desc save a job
exports.saveJob = async (req, res) => {
    try{
        const exists = await SavedJob.findOne({job: req.params.jobId, jobseeker: req.user._id});
        if (exists) return res.status(400).json({message: "job already saved"});

        const saved = await SavedJob.create({ job: req.params.jobId, jobseeker: req.user._id});
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({message: "failed to save a job", error:err.message});
    }
}

//@desc unsave a job
exports.unsaveJob = async (req, res) => {
    try{
        await SavedJob.findOneAndDelete({job:req.params.jobId, jobseeker: req.user._id});
        res.json({message: "job removed from saved list"});
    } catch (err) {
        res.status(500).json({message: "failed to remove saved a job", error:err.message});
    }
};

//@desc get saved jobs for current user 
exports.getMySavedJobs = async(req, res) => {
    try{
        const savedJobs = await SavedJob.find({jobseeker: req.user._id})
        .populate({
            path: "job",
            populate: {
                path:"company",
                select: "name companyName companyLogo",
            },
        });
        res.json(savedJobs);
    } catch (err) {
        res.status(500).json({message: "failed to fetch saved a jobs", error:err.message});
    }
}