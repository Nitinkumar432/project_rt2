const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    job_id:{
        type:String,
        unique:true,
        
        

    },
    companyId : {
        type:String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    total_post:{
        type:Number,
    },
    salary: {
        minSalary: {
            type: Number,
            required: true
        },
        maxSalary: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'],
        required: true
    },
    workingHours: {
        type: String,
        enum: ['Day Shift', 'Night Shift', 'Rotational Shift', 'Flexible', 'Weekend'],
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyLogo: {
        type: String, // URL to the company logo image
        trim: true
    },
    companyWebsite: {
        type: String,
        trim: true
    },
    location: {
        streetAddress: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true
        },
        postalCode: {
            type: String,
            required: true,
            trim: true
        }
    },
    requirements: {
        experience: {
            type: Number, // Number of years
            required: true
        },
        skills: {
            type: [String], // Array of skills
            required: true
        },
        education: {
            type: String,
            required: true,
            trim: true
        },
        certifications: {
            type: [String], // Array of certifications
            trim: true
        }
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    contactPhone: {
        type: String,
        trim: true
    },
    benefits: {
        type: [String], // Array of benefits such as health insurance, paid leave, etc.
        trim: true
    },
    jobPostDate: {
        type: Date,
        default: Date.now
    },
    applicationDeadline: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ['Verifed', 'Reject', 'Pending', 'Hold'],
        default: 'Pending'
    },verified_time:{
        type:Date,

    }
},{ timestamps: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
