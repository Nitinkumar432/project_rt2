const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const chalk=require('chalk');
const nodemailer = require('nodemailer');
const otpMap = new Map();
const app = express();
const Company = require('./models/company_register.js');
const Job=require('./models/job_post.js');
const uri = process.env.MONGO_URL;
const secretKey = process.env.JWT_SECRET;

const Admin=require('./models/admin.js');
// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up view engine and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// MongoDB connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(chalk.green.bold('Connected to MongoDB')))

  .catch(err => console.error('Failed to connect to MongoDB', err));

// Middleware to check if user is logged in
const checkAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.log("No token found, redirecting to login");
    return res.redirect('/login_home');
  }

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      console.log("Invalid token, clearing cookie and redirecting to login");
      res.clearCookie('token');
      return res.redirect('/login_home');
    }

    if (!req.session.company) {
      console.log("Valid token but no session, recreating session data");

      try {
        const company = await Company.findOne({ CompanyId: decoded.company_id });
        if (!company) {
          console.log("Company data not found, redirecting to login");
          res.clearCookie('token');
          return res.redirect('/login_home');
        }

        req.session.company = company;
        req.company_id = decoded.company_id;
        console.log("Session recreated, proceeding to home");
        next();
      } catch (err) {
        console.error('Error fetching company data:', err);
        res.clearCookie('token');
        return res.redirect('/login_home');
      }
    } else {
      req.company_id = decoded.company_id;
      console.log("Token and session are valid, proceeding to home");
      next();
    }
  });
};

// Middleware to prevent access to login page if already logged in
const checkNotAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.log("No token found, proceeding to login page");
    return next(); // No token, proceed to login page
  }

  jwt.verify(token, secretKey, (err) => {
    if (err) {
      console.log("Invalid token, clearing cookie and proceeding to login");
      res.clearCookie('token');
      return next(); // Token invalid, proceed to login page
    } else {
      console.log("Token valid, redirecting to home");
      return res.redirect('/home'); // Token valid, redirect to home
    }
  });
};

// Route for the root URL
app.get('/', checkNotAuth, (req, res) => {
  res.redirect('/login_home');
});

// Route for the home page (protected)
app.get('/home', checkAuth, (req, res) => {
  const company = req.session.company;

  if (!company) {
    console.log("Session not found after token validation, redirecting to login");
    return res.redirect('/login_home');
  }

  console.log("Rendering home page for company:", company.CompanyId);
  res.render('home', { company });
});

// Route for the login page
app.get('/login_home', checkNotAuth, (req, res) => {
  res.render('login_home');
});

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  req.session.destroy((err) => {
    if (err) {
      console.log("Error destroying session:", err);
    }
    console.log("Logged out and session destroyed");
    res.redirect('/login_home');
  });
});

// Login route
app.post('/company_login', async (req, res) => {
  const { company_id, password } = req.body;

  if (!company_id || !password) {
    console.log("Company ID or password missing");
    return res.status(400).send('Company ID and password are required.');
  }

  try {
    const company = await Company.findOne({
      $or: [
        { CompanyId: company_id },
        { contactEmail: company_id } 
      ]
    });

    if (!company || password !== company.password) {
      console.log("Incorrect company ID or password");
      return res.status(401).send('Incorrect company ID or password.');
    }

    const token = jwt.sign({ company_id }, secretKey, { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true});

    req.session.company = company;
    console.log("Login successful, session and token set");

    res.redirect('/home');
  } catch (err) {
    console.error("Server error during login:", err);
    res.status(500).send('Server error');
  }
});
app.get('/company_Register', checkNotAuth, (req, res) => {
  console.log('Company Register page accessed');
  res.render("company_register.ejs");
});
// mail transported code

// admin route to login

// app.post('/admin_login', async (req, res) => {
//   const { admin_id, password } = req.body;
//   console.log(req.body);

//   if (!admin_id || !password) {
//     console.log("Admin ID or password missing");
//     return res.status(400).send('Admin ID and password are required.');
//   }

//   try {
//     const admin = await Admin.findOne({ employee_id: admin_id });

//     if (!admin || password !== admin.password) {
//       console.log("Incorrect Admin ID or password");
//       return res.status(401).send('Incorrect Admin ID or password.');
//     }

//     const token = jwt.sign({ admin_id }, secretKey, { expiresIn: '1h' });

//     res.cookie('token', token, { httpOnly: true });

//     req.session.admin = admin;
//     console.log("Login successful, session and token set");

//     res.redirect('/home');
//   } catch (err) {
//     console.error("Server error during login:", err);
//     res.status(500).send('Server error');
//   }
// });
app.get('/company_Register', checkNotAuth, (req, res) => {
  console.log('Company Register page accessed');
  res.render("company_register.ejs");
});
 

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USER,  // Email address stored in .env
      pass: process.env.EMAIL_PASS   // Email password stored in .env
  }
});

app.post('/company_register', async (req, res) => {
  try {
      // Extract form data from the request body
      const {
          companyName,
          contactEmail,
          contactPhone,
          companyAddress,
          companyRegistration,
          taxId,
          industry,
          companySize,
          website,
          companyDescription,
          finances,
          numberOfEmployees
      } = req.body;

      // Log the received data for debugging
      console.log({
          companyName,
          contactEmail,
          contactPhone,
          companyAddress,
          companyRegistration,
          taxId,
          industry,
          companySize,
          website,
          companyDescription,
          finances,
          numberOfEmployees
      });

      // Check if a company with the same email or registration number already exists
      const existingCompany = await Company.findOne({
          $or: [
              { contactEmail },
              { companyRegistration }
          ]
      });

      if (existingCompany) {
          console.log("Duplicated registration found");
          // Send an error response if the company already exists
          return res.status(400).json({
              error: 'Company with this email or registration number already exists!'
          });
      }

      // Generate a random reference number
      const referenceNumber = `REF-${Math.floor(Math.random() * 1000000)}`;

      // Create a new company document
      const newCompany = new Company({
          companyName,
          contactEmail,
          contactPhone,
          companyAddress,
          companyRegistration,
          taxId,
          industry,
          companySize,
          website,
          companyDescription,
          finances,
          numberOfEmployees,
          referenceNumber
      });

      // Save the new company to the database
      await newCompany.save();

      // Send email with reference number and logo
      const mailOptions = {
          from: process.env.EMAIL_USER, // Sender address
          to: contactEmail, // Recipient's email address
          subject: 'Registration Successful - Your Reference Number', // Email subject
          text: `Dear ${companyName},\n\nHere is your reference number: ${referenceNumber}`, // Plain text body
          html: `
              <div style="text-align: center;">
                  <img src="cid:companyLogo" alt="Company Logo" style="width: 150px;"/>
              </div>
              <p>Dear ${companyName},</p>
              <p>Here is your reference number:</p>
              <p><strong>${referenceNumber}</strong></p>
              <p>Thank you for registering with us.</p>
              <p>Best regards,</p>
              <p>RozgarSetu</p>`, // HTML body with logo and bold reference number
          attachments: [
              {
                  filename: 'logo.png', // Your logo file
                  path: 'public/images/trpzgarsetu.png', // Path to your logo file
                  cid: 'companyLogo' // Content ID for embedding the logo
              }
          ]
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      // Respond to the client with success message and reference number
      res.status(201).json({
          message: 'Registration successful! An email has been sent with your reference number.',
          referenceNumber
      });

      // Log the reference number for debugging
      console.log(`Reference Number: ${referenceNumber}`);

  } catch (error) {
      console.error('Error during registration:', error.message);
      res.status(500).json({
          error: 'An error occurred while registering the company.'
      });
  }
});
app.get('/profile',checkAuth,(req,res)=>{
  const company = req.session.company;
  console.log('profile page accessed');
  res.render('profile.ejs',{company});
});
app.get('/post_job',checkAuth,(req,res)=>{
  const company = req.session.company;
  console.log(`post Job page accessed by ${company.companyName}`);
  res.render('job_post.ejs',{company});
})


// hit and trila
// forgot password section

 // Fixed OTP for all users

// Route to verify OTP and update password
app.post('/check-email', async (req, res) => {
  const { email } = req.body;

  try {
      const user = await Company.findOne({ contactEmail: email });
      if (!user) {
          return res.status(400).json({ error: 'Email not found!' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 5 * 60 * 1000;

      otpMap.set(email, { otp, otpExpiry });

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your OTP for Password Reset',
          text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`,
          html: `<p>Your OTP for password reset is: <strong>${otp}</strong>.</p><p>This OTP is valid for 5 minutes.</p>`
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent to your email!' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong. Please try again!' });
  }
});
// track jobs section
app.get('/track-jobs',checkAuth,async (req,res)=>{
  const jobsdata=await Job.find({CompanyId:req.session.company.CompanyId});
  console.log(jobsdata);

  console.log("track_jobs posted");
  res.render('track-jobs',{company:req.session.company,jobsdata});

});
app.post('/verify-otp', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log(req.body);

  const storedOtpInfo = otpMap.get(email);
  if (!storedOtpInfo || storedOtpInfo.otp !== otp || Date.now() > storedOtpInfo.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP!' });
  }

  try {
      await Company.updateOne({ contactEmail: email }, { password: newPassword });
      console.log("Password updated successfully.");
      otpMap.delete(email); 
      res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong. Please try again!' });
  }
});

app.post('/post-job', checkAuth, async (req, res) => {
  try {
      const jobData = req.body;
      console.log(jobData);

      // Parse job details and create a new job document
      const newJob = new Job({
          title: jobData.title,
          description: jobData.description,
          total_post: jobData.total_post,
          salary: {
              minSalary: jobData.minSalary,
              maxSalary: jobData.maxSalary,
              currency: jobData.currency
          },
          jobType: jobData.jobType,
          workingHours: jobData.workingHours,
          companyId:jobData.companyId,
          companyName: jobData.companyName,
          companyLogo: jobData.companyLogo,
          companyWebsite: jobData.companyWebsite,
          location: {
              streetAddress: jobData.streetAddress,
              city: jobData.city,
              state: jobData.state,
              country: jobData.country,
              postalCode: jobData.postalCode
          },
          requirements: {
              experience: jobData.experience,
              skills: jobData.skills.split(','), // Convert string to array
              education: jobData.education,
              certifications: jobData.certifications.split(',') // Convert string to array
          },
          contactEmail: jobData.contactEmail,
          contactPhone: jobData.contactPhone,
          benefits: jobData.benefits.split(','), // Convert string to array
          applicationDeadline: jobData.applicationDeadline,
          status: 'Pending'
      });

      // Save the job to the database
      await newJob.save();
      res.json({ success: true });

  } catch (error) {
      console.error('Error saving job:', error);
      res.status(500).json({ success: false, error: 'Failed to save job. Please try again.' });
  }
});

app.listen(3001, () => {
  console.log(chalk.green.bold('Server is running on port 3001'));
  console.log(chalk.blue('Server listing on: http://localhost:3001'));
});