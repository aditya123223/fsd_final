import Notification from '../models/Notification.model.js';

let _io = null;

export const setIo = (io) => {
  _io = io;
};

/**
 * Create a notification, save to DB, then emit via socket
 */
export const createNotification = async ({ recipientId, type, title, message, appointmentId }) => {
  const notification = await Notification.create({
    recipientId,
    type,
    title,
    message,
    appointmentId,
  });

  // Emit via socket if io is available
  if (_io) {
    _io.to(`user:${recipientId.toString()}`).emit('notification:new', notification);
  }

  return notification;
};

/**
 * Get paginated notifications for a user
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipientId: userId }),
  ]);
  return { notifications, total };
};

/**
 * Mark a single notification as read
 */
export const markRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }
  return notification;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true }
  );
  return result;
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipientId: userId, isRead: false });
};
