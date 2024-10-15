const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  notificationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isRead: { type: Boolean, default: false }, // Track read status
  createdAt: { type: Date, default: Date.now },
});

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
