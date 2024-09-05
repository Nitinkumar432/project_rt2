const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  contactEmail: {
    type: String,
    
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  contactPhone: {
    type: String,
    required: true,
  },
  companyAddress: {
    type: String,
    required: true,
  },
  companyRegistration: {
    type: String,
    required: true,
  },
  taxId: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  companySize: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  companyDescription: {
    type: String,
    required: true,
  },
  finances: {
    type: String,
    required: true,
  },
  numberOfEmployees: {
    type: Number,
    required: true,
  },
  referenceNumber: {
    type: String,
    required: true,
  },
  // New fields
  submissionTime: {
    type: Date,
    default: Date.now, // Automatically stores the time of submission
  },
  isVerified: {
    type: Boolean,
    default: false, // Field to track if the company has been verified
  },
  password:{
    type:String,
    
  
  },
  CompanyId:{
    type:String,
},
  verify_by:{
    type:String,
    default:"NO YET VERFIED"
  },
  verify_time:{
    type: Date,
    default: Date.now,

  },
  userType: { type: String, default: 'company' },
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
