const mongoose = require('mongoose');
const Admin = require('./models/admin');  // Ensure the path to your model file is correct
require('dotenv').config();
const chalk=require('chalk');
// Sample data array as defined above
const sampleAdmins = [
  {
    username: "john_doe",
    employee_id: "EMP001",
    password: "password123",
    email: "john.doe@example.com",
    userType: "superadmin",
    permissions: {
      read: true,
      write: true,
      update: true,
      delete: true,
    },
  },
  {
    username: "jane_smith",
    employee_id: "EMP002",
    password: "securepass456",
    email: "jane.smith@example.com",
    userType: "admin",
    permissions: {
      read: true,
      write: true,
      update: false,
      delete: false,
    },
  },
  {
    username: "alex_jones",
    employee_id: "EMP003",
    password: "mypassword789",
    email: "alex.jones@example.com",
    userType: "moderator",
    permissions: {
      read: true,
      write: false,
      update: false,
      delete: false,
    },
  },
  {
    username: "mary_williams",
    employee_id: "EMP004",
    password: "password321",
    email: "mary.williams@example.com",
    userType: "admin",
    permissions: {
      read: true,
      write: true,
      update: true,
      delete: false,
    },
  },
  {
    username: "david_brown",
    employee_id: "EMP005",
    password: "password654",
    email: "david.brown@example.com",
    userType: "moderator",
    permissions: {
      read: true,
      write: false,
      update: true,
      delete: false,
    },
  },
];
const uri = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(chalk.green.bold('Connected to MongoDB')))

  .catch(err => console.error('Failed to connect to MongoDB', err));

  Admin.insertMany(sampleAdmins)
  .then(() => {
    console.log('Admin data inserted successfully.');
  })
  .catch((error) => {
    console.error('Error inserting admin data:', error);
  });

