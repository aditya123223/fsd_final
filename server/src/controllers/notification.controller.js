import * as notificationService from '../services/notification.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.utils.js';

export const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const { notifications, total } = await notificationService.getUserNotifications(
      userId,
      Number(page),
      Number(limit)
    );
    const unreadCount = await notificationService.getUnreadCount(userId);
    return sendPaginated(res, { notifications, unreadCount }, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markRead(id, req.user.userId);
    return sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user.userId);
    return sendSuccess(res, { modifiedCount: result.modifiedCount }, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
