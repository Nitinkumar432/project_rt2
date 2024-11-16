const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, default: 'Admin' }, // Default sender is Admin
  recipients: [{ type: String, required: true }], // Array of Employee IDs
  title: { type: String, required: true }, // Title of the message
  content: { type: String, required: true }, // Message content
  isRead: { type: Boolean, default: false }, // Read status
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' }, // Message priority
  category: { type: String, default: 'General' }, // Category of the message
  attachments: [{ type: String }], // Array of attachment URLs
  timestamp: { type: Date, default: Date.now }, // Time the message was sent
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
