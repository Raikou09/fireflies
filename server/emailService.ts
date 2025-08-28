import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static fromEmail = 'noreply@sportsbox.co.ke';
  private static fromName = 'SportsBox Kenya';

  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const msg = {
        to: template.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: template.subject,
        html: template.html,
        text: template.text || this.stripHtml(template.html)
      };

      await sgMail.send(msg);
      console.log('Email sent successfully to:', template.to);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  static async sendBookingConfirmation(params: {
    customerEmail: string;
    customerName: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    bookingId: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.customerEmail,
      subject: `Booking Confirmed - ${params.courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Booking Confirmed!</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>Your court booking has been confirmed! Here are your booking details:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">Booking Details</h4>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Total Amount:</strong> KES ${params.totalAmount}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            
            <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #0277bd; margin-top: 0;">Important Reminders</h4>
              <ul>
                <li>Please arrive 15 minutes before your booking time</li>
                <li>Bring valid ID for verification</li>
                <li>Court cancellations must be made 24 hours in advance</li>
                <li>Contact the venue directly for any special requirements</li>
              </ul>
            </div>
            
            <p>Thank you for choosing SportsBox Kenya! Enjoy your game!</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View My Bookings</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Your Premier Sports Court Booking Platform</p>
            <p>Email: info@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendVendorCourtApproval(params: {
    vendorEmail: string;
    vendorName: string;
    courtName: string;
    approvalStatus: 'approved' | 'rejected';
    rejectionReason?: string;
  }): Promise<boolean> {
    const isApproved = params.approvalStatus === 'approved';
    
    const template: EmailTemplate = {
      to: params.vendorEmail,
      subject: `Court ${isApproved ? 'Approved' : 'Update Required'} - ${params.courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${isApproved ? '#16a34a' : '#dc2626'}; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Court ${isApproved ? 'Approved' : 'Update Required'}</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            
            ${isApproved ? `
              <p>Great news! Your court "${params.courtName}" has been approved and is now live on SportsBox Kenya.</p>
              
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #16a34a; margin-top: 0;">Your Court is Now Live!</h4>
                <p>Customers can now discover and book your court. You can:</p>
                <ul>
                  <li>Monitor bookings through your vendor dashboard</li>
                  <li>Update court details and pricing</li>
                  <li>Manage equipment rentals</li>
                  <li>Track revenue and analytics</li>
                </ul>
              </div>
            ` : `
              <p>Your court "${params.courtName}" requires some updates before it can be approved.</p>
              
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #dc2626; margin-top: 0;">Required Updates</h4>
                <p><strong>Reason:</strong> ${params.rejectionReason || 'Please review court details and ensure all required information is provided.'}</p>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #d97706; margin-top: 0;">Next Steps</h4>
                <ul>
                  <li>Log into your vendor dashboard</li>
                  <li>Update your court information</li>
                  <li>Resubmit for approval</li>
                  <li>Our team will review within 24 hours</li>
                </ul>
              </div>
            `}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke/vendor" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Vendor Dashboard</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Empowering Sports Venue Owners</p>
            <p>Email: vendor@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendBookingReminder(params: {
    customerEmail: string;
    customerName: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    bookingId: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.customerEmail,
      subject: `Booking Reminder - Tomorrow at ${params.startTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Booking Reminder</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>This is a friendly reminder about your upcoming court booking!</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2563eb; margin-top: 0;">Tomorrow's Booking</h4>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #d97706; margin-top: 0;">Don't Forget!</h4>
              <ul>
                <li>Arrive 15 minutes early</li>
                <li>Bring your ID and booking confirmation</li>
                <li>Check weather conditions for outdoor courts</li>
                <li>Contact venue for any questions</li>
              </ul>
            </div>
            
            <p>Looking forward to your game! Have a great time at ${params.courtName}.</p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Your Game, Our Courts</p>
          </div>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendPaymentConfirmation(params: {
    customerEmail: string;
    customerName: string;
    amount: string;
    transactionId: string;
    courtName: string;
    bookingDate: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.customerEmail,
      subject: `Payment Confirmed - KES ${params.amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Payment Confirmed</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>Your payment has been successfully processed!</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">Payment Details</h4>
              <p><strong>Amount:</strong> KES ${params.amount}</p>
              <p><strong>Transaction ID:</strong> ${params.transactionId}</p>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Payment Method:</strong> M-Pesa</p>
            </div>
            
            <p>Your booking is now confirmed. You'll receive a separate booking confirmation email shortly.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Receipt</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Secure Payments, Great Games</p>
          </div>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}