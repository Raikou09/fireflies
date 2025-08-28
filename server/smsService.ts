// SMS Service for Kenya - Integration with local SMS providers
// Currently using Africa's Talking API structure (popular in Kenya)

export interface SMSParams {
  to: string; // Phone number in format +254XXXXXXXXX
  message: string;
}

export class SMSService {
  private static apiKey = process.env.SMS_API_KEY;
  private static username = process.env.SMS_USERNAME || 'SportsBox';
  private static shortCode = process.env.SMS_SHORTCODE || 'SPORTSBOX';

  static async sendSMS(params: SMSParams): Promise<boolean> {
    try {
      // For now, we'll log the SMS (in production, integrate with SMS provider)
      console.log('=== SMS NOTIFICATION ===');
      console.log('To:', params.to);
      console.log('Message:', params.message);
      console.log('========================');

      // TODO: Integrate with Africa's Talking or other Kenyan SMS provider
      // Example integration structure:
      /*
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: this.username,
          to: params.to,
          message: params.message,
          from: this.shortCode
        })
      });
      
      const result = await response.json();
      return result.SMSMessageData.Recipients[0].status === 'Success';
      */

      // Simulate success for development
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  static async sendBookingConfirmationSMS(params: {
    customerPhone: string;
    customerName: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    bookingId: string;
  }): Promise<boolean> {
    const message = `Hi ${params.customerName}! Your ${params.courtName} booking is confirmed for ${params.bookingDate} at ${params.startTime}. Booking ID: ${params.bookingId}. Arrive 15min early. - SportsBox Kenya`;

    return this.sendSMS({
      to: params.customerPhone,
      message
    });
  }

  static async sendBookingReminderSMS(params: {
    customerPhone: string;
    customerName: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
  }): Promise<boolean> {
    const message = `Reminder: ${params.customerName}, your ${params.courtName} booking is tomorrow ${params.bookingDate} at ${params.startTime}. Don't forget your ID! - SportsBox Kenya`;

    return this.sendSMS({
      to: params.customerPhone,
      message
    });
  }

  static async sendPaymentConfirmationSMS(params: {
    customerPhone: string;
    amount: string;
    transactionId: string;
  }): Promise<boolean> {
    const message = `Payment confirmed! KES ${params.amount} received. Transaction: ${params.transactionId}. Your booking is now active. - SportsBox Kenya`;

    return this.sendSMS({
      to: params.customerPhone,
      message
    });
  }

  static async sendCourtApprovalSMS(params: {
    vendorPhone: string;
    vendorName: string;
    courtName: string;
    approved: boolean;
  }): Promise<boolean> {
    const message = params.approved
      ? `Great news ${params.vendorName}! Your court "${params.courtName}" is now live on SportsBox. Start receiving bookings today! - SportsBox Kenya`
      : `Hi ${params.vendorName}, your court "${params.courtName}" needs updates. Check your vendor dashboard for details. - SportsBox Kenya`;

    return this.sendSMS({
      to: params.vendorPhone,
      message
    });
  }

  static formatKenyanPhone(phone: string): string {
    // Convert various formats to +254XXXXXXXXX
    let formatted = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '+254' + formatted.substring(1);
    } else if (formatted.startsWith('254')) {
      formatted = '+' + formatted;
    } else if (!formatted.startsWith('+254')) {
      formatted = '+254' + formatted;
    }
    
    return formatted;
  }

  static isValidKenyanPhone(phone: string): boolean {
    const formatted = this.formatKenyanPhone(phone);
    // Kenyan mobile numbers: +254 7XX XXX XXX or +254 1XX XXX XXX
    return /^\+254[17]\d{8}$/.test(formatted);
  }
}