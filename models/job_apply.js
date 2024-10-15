const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Job Application Schema
const jobApplicationSchema = new Schema({
    jobTitle: {
        type: String,
        required: true,
    },
    job_id:{
        type: String,
        required: true,


    },
    companyName: {
        type: String,
        required: true,
    },
    employeeId: {
        type: String,
        required: true,
    },
    registrationId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    fatherName: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    experience: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    minimumSalary: {
        type: Number,
        required: true,
    },
    availability: {
        type: String,
        required: true,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    }
},{ timestamps: true });

// Create the JobApplication model
const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
