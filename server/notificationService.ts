import { db } from './db';
import { notifications, userNotificationPreferences } from '@shared/schema';
import type { InsertNotification, UserNotificationPreferences } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export type NotificationType = 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation' | 'booking_update' | 'vendor_new_booking';

export interface NotificationData {
  bookingId?: string;
  courtName?: string;
  date?: string;
  timeSlot?: string;
  customerName?: string;
  totalAmount?: number;
  [key: string]: any;
}

export class NotificationService {
  /**
   * Create and send a notification to a user
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {}
  }: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: NotificationData;
  }): Promise<void> {
    try {
      // Check user preferences first
      const userPrefs = await this.getUserNotificationPreferences(userId);
      
      if (!this.shouldSendNotification(type, userPrefs)) {
        console.log(`Notification ${type} not sent to user ${userId} due to preferences`);
        return;
      }

      const notificationData: InsertNotification = {
        userId,
        type,
        title,
        message,
        data: data as any,
        isRead: false,
      };

      await db.insert(notifications).values(notificationData);
      console.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation({
    userId,
    bookingId,
    courtName,
    date,
    timeSlot,
    totalAmount
  }: {
    userId: string;
    bookingId: string;
    courtName: string;
    date: string;
    timeSlot: string;
    totalAmount: number;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'booking_confirmation',
      title: 'Booking Confirmed!',
      message: `Your booking for ${courtName} on ${new Date(date).toLocaleDateString()} at ${timeSlot} has been confirmed.`,
      data: {
        bookingId,
        courtName,
        date,
        timeSlot,
        totalAmount,
      }
    });
  }

  /**
   * Send booking reminder notification
   */
  async sendBookingReminder({
    userId,
    bookingId,
    courtName,
    date,
    timeSlot
  }: {
    userId: string;
    bookingId: string;
    courtName: string;
    date: string;
    timeSlot: string;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'booking_reminder',
      title: 'Booking Reminder',
      message: `Don't forget your booking at ${courtName} tomorrow at ${timeSlot}!`,
      data: {
        bookingId,
        courtName,
        date,
        timeSlot,
      }
    });
  }

  /**
   * Send booking cancellation notification
   */
  async sendBookingCancellation({
    userId,
    bookingId,
    courtName,
    date,
    timeSlot,
    reason = 'Booking cancelled'
  }: {
    userId: string;
    bookingId: string;
    courtName: string;
    date: string;
    timeSlot: string;
    reason?: string;
  }): Promise<void> {
    await this.createNotification({
      userId,
      type: 'booking_cancellation',
      title: 'Booking Cancelled',
      message: `Your booking for ${courtName} on ${new Date(date).toLocaleDateString()} at ${timeSlot} has been cancelled. ${reason}`,
      data: {
        bookingId,
        courtName,
        date,
        timeSlot,
        reason,
      }
    });
  }

  /**
   * Send vendor notification for new booking
   */
  async sendVendorBookingAlert({
    vendorId,
    bookingId,
    courtName,
    customerName,
    date,
    timeSlot,
    totalAmount
  }: {
    vendorId: string;
    bookingId: string;
    courtName: string;
    customerName: string;
    date: string;
    timeSlot: string;
    totalAmount: number;
  }): Promise<void> {
    await this.createNotification({
      userId: vendorId,
      type: 'vendor_new_booking',
      title: 'New Booking Received!',
      message: `${customerName} booked ${courtName} for ${new Date(date).toLocaleDateString()} at ${timeSlot}. Amount: KSh ${totalAmount}`,
      data: {
        bookingId,
        courtName,
        customerName,
        date,
        timeSlot,
        totalAmount,
      }
    });
  }

  /**
   * Get user's notification preferences
   */
  async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const [prefs] = await db
        .select()
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userId));
      
      return prefs || null;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  /**
   * Create default notification preferences for new user
   */
  async createDefaultNotificationPreferences(userId: string): Promise<void> {
    try {
      await db.insert(userNotificationPreferences).values({
        userId,
        bookingConfirmations: true,
        bookingReminders: true,
        bookingCancellations: true,
        vendorBookingAlerts: true,
      });
    } catch (error) {
      console.error('Error creating default notification preferences:', error);
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    try {
      await db
        .update(userNotificationPreferences)
        .set(preferences)
        .where(eq(userNotificationPreferences.userId, userId));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string, 
    limit = 20, 
    offset = 0
  ): Promise<any[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      return result.length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(type: NotificationType, prefs: UserNotificationPreferences | null): boolean {
    if (!prefs) return true; // Default to sending if no preferences found

    switch (type) {
      case 'booking_confirmation':
        return prefs.bookingConfirmations;
      case 'booking_reminder':
        return prefs.bookingReminders;
      case 'booking_cancellation':
        return prefs.bookingCancellations;
      case 'vendor_new_booking':
        return prefs.vendorBookingAlerts;
      default:
        return true;
    }
  }

  /**
   * Schedule booking reminders (to be called by a cron job)
   */
  async scheduleBookingReminders(): Promise<void> {
    try {
      // Get bookings for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // This would be implemented with a proper job queue in production
      // For now, this is just the structure for the reminder system
      console.log(`Checking for booking reminders for ${tomorrowStr}`);
    } catch (error) {
      console.error('Error scheduling booking reminders:', error);
    }
  }
}

export const notificationService = new NotificationService();