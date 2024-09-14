const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for an admin user
const adminSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  employee_id:{
    type:String,
    required: true,
    unique: true,
    trim: true,

  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  userType: {
    type: String,
    enum: ['superadmin', 'admin', 'moderator'], 
    default: 'admin',
  },
  permissions: {
    read: {
      type: Boolean,
      default: false,
    },
    write: {
      type: Boolean,
      default: false,
    },
    update: {
      type: Boolean,
      default: false,
    },
    delete: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updatedAt` field before saving
adminSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
},{ timestamps: true });

// Create the Admin model from the schema
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
