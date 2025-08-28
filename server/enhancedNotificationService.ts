// Enhanced notification service integrating email, SMS, and in-app notifications
import { db } from "./db";
import { notifications } from "../shared/schema";
import { EmailService } from "./emailService";
import { SMSService } from "./smsService";
import { eq, desc, and, count } from "drizzle-orm";

export interface BookingNotificationParams {
  bookingId: string;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: string;
  equipmentRented?: string[];
}

export interface CourtApprovalParams {
  vendorId: string;
  vendorEmail: string;
  vendorPhone?: string;
  vendorName: string;
  courtName: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface PaymentNotificationParams {
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
  amount: string;
  transactionId: string;
  courtName: string;
  bookingDate: string;
  paymentMethod: string;
}

export class EnhancedNotificationService {
  // Create in-app notification
  static async createInAppNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.metadata || {},
          isRead: false,
          createdAt: new Date(),
        })
        .returning();

      return notification;
    } catch (error) {
      console.error("Error creating in-app notification:", error);
      throw error;
    }
  }

  // Send complete booking confirmation (in-app + email + SMS)
  static async sendBookingConfirmation(params: BookingNotificationParams) {
    try {
      console.log('🔔 Sending comprehensive booking confirmation for:', params.bookingId);

      // 1. Create in-app notification
      await this.createInAppNotification({
        userId: params.customerId,
        type: 'booking_confirmed',
        title: '🎾 Booking Confirmed!',
        message: `Your booking for ${params.courtName} on ${params.bookingDate} at ${params.startTime} has been confirmed.`,
        metadata: {
          bookingId: params.bookingId,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime,
          endTime: params.endTime,
          totalAmount: params.totalAmount,
          equipmentRented: params.equipmentRented
        }
      });

      // 2. Send email confirmation
      const emailSent = await EmailService.sendBookingConfirmation({
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        courtName: params.courtName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        endTime: params.endTime,
        totalAmount: params.totalAmount,
        bookingId: params.bookingId
      });

      // 3. Send SMS confirmation (if phone number provided)
      let smsSent = true;
      if (params.customerPhone && SMSService.isValidKenyanPhone(params.customerPhone)) {
        smsSent = await SMSService.sendBookingConfirmationSMS({
          customerPhone: SMSService.formatKenyanPhone(params.customerPhone),
          customerName: params.customerName,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime,
          bookingId: params.bookingId
        });
      }

      console.log('✅ Booking confirmation sent - Email:', emailSent, 'SMS:', smsSent);
      return { 
        inAppCreated: true, 
        emailSent, 
        smsSent,
        totalChannels: 1 + (emailSent ? 1 : 0) + (smsSent ? 1 : 0)
      };
    } catch (error) {
      console.error('❌ Error sending booking confirmation:', error);
      throw error;
    }
  }

  // Send payment confirmation across all channels
  static async sendPaymentConfirmation(params: PaymentNotificationParams) {
    try {
      console.log('💰 Sending payment confirmation for transaction:', params.transactionId);

      // 1. Create in-app notification
      await this.createInAppNotification({
        userId: params.customerId,
        type: 'payment_received',
        title: '💰 Payment Confirmed',
        message: `Your payment of KES ${params.amount} has been confirmed. Transaction ID: ${params.transactionId}`,
        metadata: {
          amount: params.amount,
          transactionId: params.transactionId,
          paymentMethod: params.paymentMethod,
          courtName: params.courtName,
          bookingDate: params.bookingDate
        }
      });

      // 2. Send email confirmation
      const emailSent = await EmailService.sendPaymentConfirmation({
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        amount: params.amount,
        transactionId: params.transactionId,
        courtName: params.courtName,
        bookingDate: params.bookingDate
      });

      // 3. Send SMS confirmation
      let smsSent = true;
      if (params.customerPhone && SMSService.isValidKenyanPhone(params.customerPhone)) {
        smsSent = await SMSService.sendPaymentConfirmationSMS({
          customerPhone: SMSService.formatKenyanPhone(params.customerPhone),
          amount: params.amount,
          transactionId: params.transactionId
        });
      }

      console.log('✅ Payment confirmation sent - Email:', emailSent, 'SMS:', smsSent);
      return { inAppCreated: true, emailSent, smsSent };
    } catch (error) {
      console.error('❌ Error sending payment confirmation:', error);
      throw error;
    }
  }

  // Send court approval/rejection notification
  static async sendCourtApprovalNotification(params: CourtApprovalParams) {
    try {
      console.log('🏢 Sending court approval notification for:', params.courtName);

      // 1. Create in-app notification
      await this.createInAppNotification({
        userId: params.vendorId,
        type: params.approved ? 'court_approved' : 'court_rejected',
        title: params.approved ? '🎉 Court Approved!' : '⚠️ Court Update Required',
        message: params.approved 
          ? `Your court "${params.courtName}" has been approved and is now live!`
          : `Your court "${params.courtName}" requires updates. ${params.rejectionReason || 'Please review the details.'}`,
        metadata: {
          courtName: params.courtName,
          approved: params.approved,
          rejectionReason: params.rejectionReason
        }
      });

      // 2. Send email notification
      const emailSent = await EmailService.sendVendorCourtApproval({
        vendorEmail: params.vendorEmail,
        vendorName: params.vendorName,
        courtName: params.courtName,
        approvalStatus: params.approved ? 'approved' : 'rejected',
        rejectionReason: params.rejectionReason
      });

      // 3. Send SMS notification
      let smsSent = true;
      if (params.vendorPhone && SMSService.isValidKenyanPhone(params.vendorPhone)) {
        smsSent = await SMSService.sendCourtApprovalSMS({
          vendorPhone: SMSService.formatKenyanPhone(params.vendorPhone),
          vendorName: params.vendorName,
          courtName: params.courtName,
          approved: params.approved
        });
      }

      console.log('✅ Court approval notification sent - Email:', emailSent, 'SMS:', smsSent);
      return { inAppCreated: true, emailSent, smsSent };
    } catch (error) {
      console.error('❌ Error sending court approval notification:', error);
      throw error;
    }
  }

  // Send booking reminder
  static async sendBookingReminder(params: {
    customerId: string;
    customerEmail: string;
    customerPhone?: string;
    customerName: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    bookingId: string;
  }) {
    try {
      console.log('⏰ Sending booking reminder for booking:', params.bookingId);

      // 1. Create in-app notification
      await this.createInAppNotification({
        userId: params.customerId,
        type: 'booking_reminder',
        title: '⏰ Booking Reminder',
        message: `Don't forget! Your booking at ${params.courtName} is tomorrow at ${params.startTime}.`,
        metadata: {
          bookingId: params.bookingId,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime
        }
      });

      // 2. Send email reminder
      const emailSent = await EmailService.sendBookingReminder({
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        courtName: params.courtName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        endTime: params.endTime,
        bookingId: params.bookingId
      });

      // 3. Send SMS reminder
      let smsSent = true;
      if (params.customerPhone && SMSService.isValidKenyanPhone(params.customerPhone)) {
        smsSent = await SMSService.sendBookingReminderSMS({
          customerPhone: SMSService.formatKenyanPhone(params.customerPhone),
          customerName: params.customerName,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime
        });
      }

      console.log('✅ Booking reminder sent - Email:', emailSent, 'SMS:', smsSent);
      return { inAppCreated: true, emailSent, smsSent };
    } catch (error) {
      console.error('❌ Error sending booking reminder:', error);
      throw error;
    }
  }

  // Send vendor earnings notification
  static async sendVendorEarningsNotification(params: {
    vendorId: string;
    vendorEmail: string;
    vendorName: string;
    courtName: string;
    bookingDate: string;
    customerName: string;
    earnings: string;
    commission: string;
    bookingId: string;
  }) {
    try {
      console.log('💸 Sending vendor earnings notification');

      // Create in-app notification
      await this.createInAppNotification({
        userId: params.vendorId,
        type: 'vendor_earnings',
        title: '💸 New Booking Revenue',
        message: `You earned KES ${params.earnings} from ${params.customerName}'s booking at ${params.courtName}`,
        metadata: {
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          customerName: params.customerName,
          earnings: params.earnings,
          commission: params.commission,
          bookingId: params.bookingId
        }
      });

      console.log('✅ Vendor earnings notification sent');
      return { inAppCreated: true };
    } catch (error) {
      console.error('❌ Error sending vendor earnings notification:', error);
      throw error;
    }
  }

  // Get notifications for user
  static async getNotifications(userId: string) {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // Test notification system
  static async testNotificationSystem(testParams: {
    customerEmail: string;
    customerPhone?: string;
    vendorEmail: string;
    vendorPhone?: string;
  }) {
    console.log('🧪 Testing notification system...');

    try {
      // Test email service
      const emailTest = await EmailService.sendEmail({
        to: testParams.customerEmail,
        subject: 'SportsBox Notification Test',
        html: '<h2>Email notifications are working!</h2><p>This is a test from SportsBox Kenya notification system.</p>'
      });

      // Test SMS service (if phone provided)
      let smsTest = true;
      if (testParams.customerPhone) {
        smsTest = await SMSService.sendSMS({
          to: SMSService.formatKenyanPhone(testParams.customerPhone),
          message: 'Test SMS from SportsBox Kenya. Notifications are working!'
        });
      }

      console.log('🧪 Notification test results - Email:', emailTest, 'SMS:', smsTest);
      return { emailTest, smsTest };
    } catch (error) {
      console.error('❌ Notification test failed:', error);
      throw error;
    }
  }
}