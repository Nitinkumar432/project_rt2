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
const JobApplication = require('./models/job_apply.js');
const Job=require('./models/job_post.js');
const uri = process.env.MONGO_URL;
const secretKey = process.env.JWT_SECRET;
const Register=require('./models/register_data.js');
const Admin=require('./models/admin.js');
const generateJobId = require('./function/generete_job_id.js');
const Notification=require('./models/notification.js');
const PostNotiifcationforuser=require("./models/UserNotification.js");
const SeparateNotification=require('./models/SeparateNotification.js');
// const CompanyNotifications=require('./models/CompanyNotification.js');
// download pdf kit
const PDFDocument = require('pdfkit');
const fs = require('fs');

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
const MongoStore = require('connect-mongo');
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL, // Your MongoDB URI
    ttl: 14 * 24 * 60 * 60 // Session expiration time (14 days here)
  }),
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));


// MongoDB connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(chalk.green.bold('Connected to MongoDB')))

  .catch(err => console.error('Failed to connect to MongoDB', err));


// Middleware to prevent access to login page if already logged in
const checkNotAuth = (req, res, next) => {
  const companyToken = req.cookies.token;
  const adminToken = req.cookies.admin;

  if (companyToken) {
    // If a company token is found, prevent access to the login page or admin pages
    jwt.verify(companyToken, secretKey, (err) => {
      if (err) {
        console.log("Invalid company token, clearing cookie and proceeding to login");
        res.clearCookie('token');
        return next(); // Token invalid, proceed to login page
      } else {
        console.log("Company token valid, redirecting to home");
        return res.redirect('Company/home'); // Token valid, redirect to company home
      }
    });
  } else if (adminToken) {
    // If an admin token is found, prevent access to the login page or company pages
    jwt.verify(adminToken, secretKey, (err) => {
      if (err) {
        console.log("Invalid admin token, clearing cookie and proceeding to login");
        res.clearCookie('admin');
        return next(); // Token invalid, proceed to login page
      } else {
        console.log("Admin token valid, redirecting to admin home");
        return res.redirect('/admin_home'); // Token valid, redirect to admin home
      }
    });
  } else {
    // No token found, allow access to the login page
    console.log("No token found, proceeding to login page");
    return next(); // No token, proceed to login page
  }
};

// check admin authentication

const checkAdminAuth = async (req, res, next) => {
  const adminToken = req.cookies.admin;
  const companyToken = req.cookies.token;

  // Block if company tries to access an admin route
  if (companyToken) {
    console.log("Company trying to access admin page, redirecting to company home");
    return res.redirect('Company/home');
  }

  if (!adminToken) {
    console.log("No admin token found, redirecting to login");
    return res.redirect('/login_home');
  }

  jwt.verify(adminToken, secretKey, async (err, decoded) => {
    if (err) {
      console.log("Invalid admin token, clearing cookie and redirecting to login");
      res.clearCookie('admin');
      return res.redirect('/login_home');
    }

    // Recreate session if not found
    if (!req.session.admin) {
      const admin = await Admin.findOne({ employee_id: decoded.admin_id });
      if (!admin) {
        console.log("Admin data not found, redirecting to login");
        res.clearCookie('admin');
        return res.redirect('/login_home');
      }

      req.session.admin = admin;
    }

    // Token and session are valid, proceed
    req.admin_id = decoded.admin_id;
    next();
  });
};

// check company authentication
const checkCompanyAuth = async (req, res, next) => {
  const companyToken = req.cookies.token;
  const adminToken = req.cookies.admin;

  // Block if admin tries to access a company route
  if (adminToken) {
    console.log("Admin trying to access company page, redirecting to admin home");
    return res.redirect('/admin_home');
  }

  if (!companyToken) {
    console.log("No company token found, redirecting to login");
    return res.redirect('/login_home');
  }

  jwt.verify(companyToken, secretKey, async (err, decoded) => {
    if (err) {
      console.log("Invalid company token, clearing cookie and redirecting to login");
      res.clearCookie('token');
      return res.redirect('/login_home');
    }

    // Recreate session if not found
    if (!req.session.company) {
      const company = await Company.findOne({ CompanyId: decoded.company_id });
      if (!company) {
        console.log("Company data not found, redirecting to login");
        res.clearCookie('token');
        return res.redirect('/login_home');
      }

      req.session.company = company;
    }

    // Token and session are valid, proceed
    req.company_id = decoded.company_id;
    next();
  });
};

app.get('/admin_home', checkAdminAuth, (req, res) => {
  const admin = req.session.admin;
  res.render('admin_home', { admin });
});


// 66767
// Route for the root URL
app.get('/', (req, res) => {
  const companyToken = req.cookies.token;
  const adminToken = req.cookies.admin;

  // If the user is a company, redirect to company home
  if (companyToken) {
    return res.redirect('Company/home');
  }

  // If the user is an admin, redirect to admin home
  if (adminToken) {
    return res.redirect('/admin_home');
  }

  // If neither company nor admin token is found, redirect to login
  return res.redirect('/login_home');
});


// Route for the home page (protected)
app.get('/home', checkCompanyAuth, async (req, res) => {
  const company = req.session.company;

  if (!company) {
    console.log("Session not found after token validation, redirecting to login");
    return res.redirect('/login_home');
  }

  try {
    // Query the top 3 recently posted jobs sorted by jobPostDate in descending order
    const top3jobpost = await Job.find({ companyId: company.CompanyId })
   
      .sort({ jobPostDate: -1 }) // Sort by jobPostDate in descending order (most recent first)
      .limit(3); // Limit to 3 jobs
      const countnotification=await Notification.countDocuments({});
    // Query to count total job posts for the company
    const totalJobPosts = await Job.countDocuments({ companyId: company.CompanyId });
    const totalcountofapp=await JobApplication.countDocuments({companyName:company.companyName});
    const totalActiveJobPosts = await Job.countDocuments({
      companyId: company.CompanyId,
      applicationDeadline: { $gt: Date.now() } 
    });

    // console.log("Top 3 recent jobs:", top3jobpost);
    // console.log("Total job posts:", totalJobPosts);

    // Render the home page with the company, the top 3 jobs, and total job posts
    res.render('Company/home', { company, top3jobpost, totalJobPosts ,totalcountofapp,totalActiveJobPosts,countnotification});
  } catch (error) {
    console.error("Error fetching recent job posts:", error);
    res.status(500).send("Internal server error");
  }
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
    // Clear admin session if present
    if (req.session.admin) {
      req.session.admin = null;
      res.clearCookie('admin');
    }

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

    res.cookie('token', token, { httpOnly: true });
    req.session.company = company;
    console.log("Login successful, session and token set");

    res.redirect('home');
  } catch (err) {
    console.error("Server error during login:", err);
    res.status(500).send('Server error');
  }
});

app.get('/company_Register', checkNotAuth, (req, res) => {
  console.log('Company Register page accessed');
  res.render("Company/company_register.ejs");
});


// admin route to login
app.post('/admin_login', async (req, res) => {
  const { admin_id, password } = req.body;

  if (!admin_id || !password) {
    console.log("Admin ID or password missing");
    return res.status(400).send('Admin ID and password are required.');
  }

  try {
    // Clear company session if present
    if (req.session.company) {
      req.session.company = null;
      res.clearCookie('token');
    }

    const admin = await Admin.findOne({ employee_id: admin_id });

    if (!admin || password !== admin.password) {
      console.log("Incorrect Admin ID or password");
      return res.status(401).send('Incorrect Admin ID or password.');
    }

    const token = jwt.sign({ admin_id }, secretKey, { expiresIn: '1h' });

    res.cookie('admin', token, { httpOnly: true });
    req.session.admin = admin;
    console.log("Login successful, session and token set");

    res.redirect('/admin_home');
  } catch (err) {
    console.error("Server error during login:", err);
    res.status(500).send('Server error');
  }
});

app.get('/company_Register', checkNotAuth, (req, res) => {
  console.log('Company Register page accessed');
  res.render("Company/company_register.ejs");
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
app.get('/profile',checkCompanyAuth,(req,res)=>{
  const company = req.session.company;
  console.log('profile page accessed');
  res.render('Company/profile.ejs',{company});
});
app.get('/post_job',checkCompanyAuth,(req,res)=>{
  const company = req.session.company;
  console.log(`post Job page accessed by ${company.companyName}`);
  res.render('Company/job_post.ejs',{company});
})


// company job-post details:
app.get('/jobs-posted-details/:companyid', checkCompanyAuth, async (req, res) => {
  const companyid = req.params.companyid;
  console.log(companyid);

  // Fetch the top 3 recent job posts for the given company
  const Jobdetails = await Job.find({ companyId: companyid })
                               .sort({ jobPostDate: -1 }) 

  res.render('Company/Company_Jobpostdetails', { Jobdetails });
});
// each job posted by company details

app.get('/jobs-posted-details/:companyId/:job_id', async (req, res) => {
  const job_id = req.params.job_id;
  
  
  
  try {
    // Count the total documents that match the given job_id
    const totalApplicants = await JobApplication.countDocuments({ job_id: job_id });
 const Post=await Job.findOne({job_id});
 
    // Retrieve all the applicant data that matches the job_id
    const applicantsData = await JobApplication.find({ job_id: job_id });

    // Log the job_id and applicants data
    // console.log("Job ID:", job_id);
    // console.log("Total Applicants:", totalApplicants);
    // console.log("Applicants Data:", applicantsData);

    res.render('Company/viewjobapplication.ejs',{totalApplicants,applicantsData,Post});
  
  } catch (error) {
    console.error("Error fetching job applicants:", error);
    res.status(500).send("Error fetching job applicants");
  }
});


// doenload each job applicant details

app.get('/download-job-report/:companyId/:job_id', async (req, res) => {
  const job_id = req.params.job_id;

  try {
    // Fetch job post and applicants data
    const Post = await Job.findOne({ job_id: job_id });
    const applicantsData = await JobApplication.find({ job_id: job_id });

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set the response headers to trigger a download in the browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Job_Report_${job_id}.pdf`);

    // Pipe the PDF to the response (send directly to the browser)
    doc.pipe(res);

    // Add a title for the PDF
    doc.fontSize(20).text('Job Report', {
      align: 'center',
      underline: true,
      lineGap: 10
    });

    // Add job post details in the center with proper spacing
    doc.moveDown(1);
    doc.fontSize(16).text(`Job Title: ${Post.title}`, { align: 'center' });
    doc.text(`Job ID: ${Post.job_id}`, { align: 'center' });
    doc.text(`Company: ${Post.companyName}`, { align: 'center' });
    doc.text(`Deadline: ${new Date(Post.applicationDeadline).toLocaleDateString()}`, { align: 'center' });
    doc.text(`Total Applicants: ${applicantsData.length}`, { align: 'center' });

    doc.moveDown(2); // Extra space

    // Draw a line separator
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Table headers for applicants
    doc.moveDown(2);
    doc.fontSize(14).text('Applicant Details:', { underline: true });
    
    // Setup table headers with bold styling
    const tableHeaders = ['Name', 'Employee ID', 'Registration ID', 'Phone', 'Date Applied'];
    const tableHeaderY = doc.y + 15;

    doc.fontSize(12).font('Helvetica-Bold');
    tableHeaders.forEach((header, i) => {
      doc.text(header, 50 + i * 100, tableHeaderY, { width: 100, align: 'left' });
    });

    doc.moveTo(50, tableHeaderY + 15).lineTo(550, tableHeaderY + 15).stroke(); // Line after headers
    doc.font('Helvetica'); // Reset to regular font

    // Loop over the applicants and display their information in table rows
    applicantsData.forEach((applicant, index) => {
      const rowY = doc.y + 20;
      doc.text(applicant.name, 50, rowY, { width: 100, align: 'left' });
      doc.text(applicant.employeeId, 150, rowY, { width: 100, align: 'left' });
      doc.text(applicant.registrationId, 250, rowY, { width: 100, align: 'left' });
      doc.text(applicant.phone, 350, rowY, { width: 100, align: 'left' });
      doc.text(new Date(applicant.appliedAt).toLocaleDateString(), 450, rowY, { width: 100, align: 'left' });

      // Add a separator line between rows
      doc.moveTo(50, rowY + 15).lineTo(550, rowY + 15).stroke();
    });

    // Add footer with page number
    doc.on('pageAdded', () => {
      doc.fontSize(10).text(`Page ${doc.pageNumber}`, 50, 750, { align: 'center' });
    });

    // Finalize the PDF and end the stream
    doc.end();

  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Error generating report");
  }
});

// now we have to create to update job data how to do it

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
app.get('/track-jobs', checkCompanyAuth, async (req, res) => {
  const companyId = req.session.company.CompanyId;
  console.log(companyId);

  try {
      const jobsdata = await Job.find({ companyId: companyId });

      // Filter jobs into different categories
      const pendingJobs = jobsdata.filter(job => job.status === 'Pending');
      const rejectedJobs = jobsdata.filter(job => job.status === 'Rejected');
      const verifiedJobs = jobsdata.filter(job => job.status === 'Verified');

      console.log("track_jobs posted page accessed");
      res.render('Company/track-jobs', {
          company: req.session.company,
          pendingJobs,
          rejectedJobs,
          verifiedJobs
      });
  } catch (err) {
      console.error("Error fetching jobs", err);
      res.status(500).send('Server Error');
  }
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

app.post('/post-job', checkCompanyAuth, async (req, res) => {
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
// getting verifing company
app.get('/verify_company', async (req, res) => {




  try {
      const companies = await Company.find({});
     // Filter and sort pending companies (those not yet verified)
     const pendingCompanies = companies
     .filter(company => company.isVerified === false)  // Filter by non-verified companies
     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by recently applied (createdAt)
   
   // Sort and filter verified companies (those that have been verified)
   const verifiedCompanies = companies
     .filter(company => company.isVerified === true)  // Filter by verified companies
     .sort((a, b) => new Date(b.verify_time) - new Date(a.verify_time))
     
      res.render('verify_company.ejs', { 
          pendingCompanies, 
          verifiedCompanies, 
          
      });
     
  } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).send("Internal Server Error");
  }
});
// approving company



// Helper function to generate a temporary password
function generateTempPassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  let tempPassword = '';
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      tempPassword += charset[randomIndex];
  }
  return tempPassword;
}
function generateCompanyId(prefix = 'RGSTU', length = 10) {
  // Generate a numeric sequence (e.g., 6 digits from timestamp)
  const timestamp = Date.now();
  const numericSequence = String(timestamp % 1000000).padStart(6, '0');

  // Generate a random suffix (e.g., 4 characters)
  const randomSuffix = Math.random().toString(36).substring(2, 2 + length).toUpperCase();

  // Combine prefix, numeric sequence, and random suffix
  return `${prefix}${numericSequence}${randomSuffix}`;
}
app.post('/verify_company/approve/:id',checkAdminAuth, async (req, res) => {
const user=req.session.admin;

  try {
      // Generate unique company ID and temporary password
      const companyId = req.params.id;
      console.log(companyId);
      const company_id=generateCompanyId();
      const tempPassword = generateTempPassword(); // Generate a temporary password

      // Fetch company details
      const company = await Company.findById(companyId);
      if (!company) {
          return res.status(404).send('Company not found');
      }

      // Create mail options
      let mailOptions = {
          from: process.env.EMAIL_USER, // Sender address from .env file
          to: company.contactEmail, // Recipient's email address from the company document
          subject: 'Account Approval and Temporary Password', // Subject line
          text: `Your company  has been approved. Here are your details:
          
      Company ID: ${company_id} 
      Temporary Password: ${tempPassword}
      
      Please use the temporary password to log in and change it within 48 hours. If you don't update your password within this period, you will need to request a new one.`, // Plain text body
          html: `
              <div style="text-align: center;">
                  <img src="cid:companyLogo" alt="Company Logo" style="width: 150px;" />
              </div>
              <p>Your company has been approved. Here are your details:</p>
              <p><strong>Company ID:</strong> ${company_id}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p>Please use the temporary password to log in and change it within 48 hours. If you don't update your password within this period, you will need to request a new one.</p>
              <p>Regards,</p>
              <p>RozgarSetu</p>`, // HTML body with embedded logo at the top
          attachments: [
              {
                  filename: 'Logo', // Name of the logo file
                  path: 'public/images/trpzgarsetu.png', // Path to the logo file
                  cid: 'companyLogo' // Content-ID for embedding the logo
              }
          ]
      };

      // Send email
      await transporter.sendMail(mailOptions);

      // Decode token and update company details
   

      // Update company verification details
      await Company.findByIdAndUpdate(companyId, {
          isVerified: true,
          CompanyId:company_id,
          verify_by: user.employee_id, // Store phone number of the user verifying
          verify_time: new Date(),
          password: tempPassword, // Store the temporary password in the company document if needed
          // tempPasswordExpiration: new Date(Date.now() + 48 * 60 * 60 * 1000) // Set expiration time for 48 hours from now
      });

      res.redirect('/verify_company');
  } catch (err) {
      console.error('Error approving company:', err);
      res.status(500).send("Internal Server Error to approving it");
  }
});
































// company activity  admin side
app.get('/user_activity', checkAdminAuth, async (req, res) => {
  try {
      console.log("user_activity accessed");

      const searchQuery = req.query.search || null;

      // Fetch the top 3 recent applicants
      const top3Recent = await Register.find().sort({ createdAt: -1 }).limit(3);

      // Fetch total users
      const totalUsers = await Register.countDocuments();

      // Dates for user activity statistics
      const today = new Date();
      const last7Days = new Date();
      last7Days.setDate(today.getDate() - 7);

      const last30Days = new Date();
      last30Days.setDate(today.getDate() - 30);

      const last6Months = new Date();
      last6Months.setMonth(today.getMonth() - 6);

      const last1Year = new Date();
      last1Year.setFullYear(today.getFullYear() - 1);

      // Fetch new users registered in the last 7 days
      const newUsersLast7Days = await Register.countDocuments({ createdAt: { $gte: last7Days, $lte: today } });

      // Fetch new users for last 30 days, 6 months, and 1 year
      const statsLast30Days = await Register.countDocuments({ createdAt: { $gte: last30Days, $lte: today } });
      const statsLast6Months = await Register.countDocuments({ createdAt: { $gte: last6Months, $lte: today } });
      const statsLast1Year = await Register.countDocuments({ createdAt: { $gte: last1Year, $lte: today } });

      // Fetch new users registered in the previous 7 days (for growth rate calculation)
      const previous7Days = new Date();
      previous7Days.setDate(today.getDate() - 14);

      const previousUsers7Days = await Register.countDocuments({ createdAt: { $gte: previous7Days, $lte: last7Days } });

      // Calculate growth rate
      let growthRate = 0;
      if (previousUsers7Days > 0) {
          growthRate = ((newUsersLast7Days - previousUsers7Days) / previousUsers7Days) * 100;
      } else if (newUsersLast7Days > 0) {
          growthRate = 100;  // If there were no users in the previous period, assume 100% growth
      }

      // Aggregate stats for the last 7 days (for the chart)
      const stats = await Register.aggregate([
          {
              $match: { createdAt: { $gte: last7Days } }
          },
          {
              $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                  count: { $sum: 1 }
              }
          },
          { $sort: { _id: 1 } }
      ]);

      // Search logic
      let user = null;
      if (searchQuery) {
          user = await Register.findOne({
              $or: [
                  { employee_id: searchQuery },
                  { name: new RegExp(searchQuery, 'i') }  // Case-insensitive search for name
              ]
          });
      }

      // Render the page with data
      res.render('user_activity', {
          totalUsers,            // Total number of users
          newUsersLast7Days,     // New users in the last 7 days
          growthRate,            // Growth rate percentage
          top3Recent,            // Recent applicants
          stats,                 // User activity statistics for graph
          user,                  // Searched user data (if any)
          statsLast30Days,       // New users in the last 30 days
          statsLast6Months,      // New users in the last 6 months
          statsLast1Year         // New users in the last 1 year
      });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching user data");
  }
});


// manage jobs posted by company and verify that jobs
// Routes to verify, reject, and hold jobs (updated to /verify_jobs)

app.post('/verify_jobs/verify/:id', async (req, res) => {
  try {
    const newjobid = generateJobId(); // Ensure this function generates a valid job ID
    const job = await Job.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'Verified', 
        job_id: newjobid, 
        verified_time: Date.now()  // Call Date.now() to get the current time
      }
    );
    
    res.redirect('/manage_jobs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


app.post('/verify_jobs/reject/:id', async (req, res) => {
  try {
      const job = await Job.findByIdAndUpdate(req.params.id, { status: 'Rejected' });
      res.redirect('/manage_jobs');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

app.post('/verify_jobs/hold/:id', async (req, res) => {
  try {
      const job = await Job.findByIdAndUpdate(req.params.id, { status: 'Hold' });
      res.redirect('/manage_jobs');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

// Fetch and sort jobs based on the most recent date
app.get('/manage_jobs', async (req, res) => {
  try {
      const pendingJobs = await Job.find({ status: 'Pending' }).sort({ jobPostDate: -1 });
      const verifiedJobs = await Job.find({ status: 'Verified' }).sort({ jobPostDate: -1 });
      const rejectedJobs = await Job.find({ status: 'Reject' }).sort({ updatedAt: -1 });  // Sort by rejection date
      const holdJobs = await Job.find({ status: 'Hold' }).sort({ jobPostDate: -1 });

      res.render('manage_jobs', {
          pendingJobs,
          verifiedJobs,
          rejectedJobs,
          holdJobs,
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});
// admin  psting notification  for all company 

app.get('/admin/post-notification',checkAdminAuth, async (req, res) => {
  const admin=req.session.admin;
  const alladminpostdata = await Notification.find({ adminId: admin.username }).sort({ createdAt: -1 });
  res.render('Admin/postNotification.ejs',{alladminpostdata,adminname:admin.username});
});

// Route to handle the form submission and save the notification
app.post('/admin/post-notification',checkAdminAuth, async (req, res) => {
  const admin=req.session.admin;
  const { title, message } = req.body;
  
  try {
    // Create a new notification
    const newNotification = new Notification({
      title: title,
      message: message,
      adminId: admin.username,
    });

    // Save the notification to the database
    await newNotification.save();
    
    // Send success message without redirecting
    res.status(200).json({ message: 'Notification posted successfully!' });
  } catch (error) {
    console.error("Error posting notification:", error);
    res.status(500).json({ message: 'Error posting notification' });
  }
});
// gettign all info:
app.get('/company/notifications', async (req, res) => {
  try {
    // Fetch all notifications from the database
    const notifications = await Notification.find().sort({ createdAt: -1 });
    
    res.render('Company/Notification.ejs', { notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send("Error fetching notifications");
  }
});

// mark as read user notification:





// now from here admin can send all notifcation to rozgarsetu user
app.get('/admin/notificationtousers',checkAdminAuth,async (req, res) => {
  const admin=req.session.admin;
  const alladminpostdataforusers = await PostNotiifcationforuser.find({ author: admin.username }).sort({ createdAt: -1 });
  
  res.render('Admin/PostNotificationforuser',{success:false,alladminpostdataforusers}); // Render the EJS notification form
});
app.post('/admin/notificationtousers', checkAdminAuth, async (req, res) => {
  const admin = req.session.admin;
  const alladminpostdataforusers = await PostNotiifcationforuser.find({ author: admin.username }).sort({ createdAt: -1 });
  try {
    const { title, content, recipients } = req.body;

    const notification = new PostNotiifcationforuser({
      title,
      content,
      recipients: recipients ? recipients.split(',').map(email => email.trim()) : [],
      author: admin.username,
    });

    await notification.save();

    // Render the form with success status
    res.render('Admin/PostNotificationforuser', { success: true,alladminpostdataforusers });
  } catch (error) {
    console.error(error);
    res.status(500).render('adminNotification', { success: false });
  }
});
// separate notiifcation sending
app.get('/separateNotification/:id', checkAdminAuth, (req, res) => {
  const employeeId = req.params.id;

  // Render the view and pass the employee ID to the template
  res.render('Admin/SeparateNotification', { employeeId });
});

app.post('/admin/send-message', checkAdminAuth,async (req, res) => {
  const admin = req.session.admin;
  const { title, content, recipients } = req.body;
  console.log(req.body);

  if (!title || !content || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ message: 'Invalid data provided.' });
  }

  try {
    const newMessage = new SeparateNotification({
      sender:admin.username,
      title,
      content,
      recipients,
    });

    await newMessage.save();
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// track job post and update by admin
// Fetch verified jobs
// Render Verified Jobs Page
// Fetch verified jobs
// Fetch verified jobs
// Fetch verified jobs for admin tracking
app.get('/admin_track_post', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Verified' });
    res.render('verifiedJobs', { jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs', error });
  }
});

// Update job details
app.post('/jobs/update', async (req, res) => {
  const {
    jobId,
    title,
    description,
    totalPost,
    salaryMin,
    salaryMax,
    jobType,
    workingHours,
    companyName,
    companyLogo,
    companyWebsite,
    location,
    requirements,
    contactEmail,
    contactPhone,
    benefits,
    applicationDeadline,
  } = req.body;

  try {
    const job = await Job.findOne({ job_id: jobId });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Update job properties
    job.title = title;
    job.description = description;
    job.total_post = totalPost;
    job.salary.minSalary = salaryMin;
    job.salary.maxSalary = salaryMax;
    job.jobType = jobType;
    job.workingHours = workingHours;
    job.companyName = companyName;
    job.companyLogo = companyLogo;
    job.companyWebsite = companyWebsite;
    job.location = location;
    job.requirements = requirements;
    job.contactEmail = contactEmail;
    job.contactPhone = contactPhone;
    job.benefits = benefits;
    job.applicationDeadline = applicationDeadline;

    await job.save();
    res.json({ message: 'Job updated successfully!' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Error updating job', error });
  }
});

// Delete job
app.delete('/jobs/delete/:jobId', async (req, res) => {
  const { jobId } = req.params;
  try {
    const result = await Job.deleteOne({ job_id: jobId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Job not found' });

    res.json({ message: 'Job deleted successfully!' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job', error });
  }
});




app.listen(3001, () => {
  console.log(chalk.green.bold('Server is running on port 3001'));
  console.log(chalk.blue('Server listing on: http://localhost:3001'));
});



