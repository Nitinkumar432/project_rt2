const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    motherName: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        maxlength: 10,
        minlength: 10,
        match: [/^\d{10}$/, 'Phone number must be 10 digits']
    },
    password: {
        type: String,
        required: true
    },
    userType: { type: String, default: 'applicant' },
    
   
    employee_id: { type: String }
},{ timestamps: true });

// No pre-save hook for hashing the password
// The password will be stored as plain text in the database

const Register = mongoose.model('Register', registerSchema);

module.exports = Register;
