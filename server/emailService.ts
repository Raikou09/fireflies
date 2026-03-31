import { Resend } from 'resend';

// Resend integration via Replit connector
let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'hello@sportsbox.in'
  };
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static fromName = 'SportsBox Kenya';

  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const { client, fromEmail } = await getResendClient();
      
      const { data, error } = await client.emails.send({
        from: `${this.fromName} <${fromEmail}>`,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text || this.stripHtml(template.html)
      });

      if (error) {
        console.error('Email sending failed:', error);
        return false;
      }

      console.log('Email sent successfully to:', template.to, 'ID:', data?.id);
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
                <li>Cancellations must be made at least 2 hours before your booking time</li>
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

  static async sendNewVendorAlertToAdmin(params: {
    vendorName: string;
    businessName: string;
    vendorEmail: string;
  }): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not set, skipping admin notification');
      return false;
    }

    const template: EmailTemplate = {
      to: adminEmail,
      subject: `New Vendor Application - ${params.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>New Vendor Application</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello Admin,</h3>
            <p>A new vendor has submitted an onboarding application and is waiting for your approval.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2563eb; margin-top: 0;">Vendor Details</h4>
              <p><strong>Name:</strong> ${params.vendorName}</p>
              <p><strong>Business Name:</strong> ${params.businessName}</p>
              <p><strong>Email:</strong> ${params.vendorEmail}</p>
            </div>
            
            <p>Please review this application in the admin dashboard at your earliest convenience.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke/admin" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Admin Dashboard</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Admin Notification</p>
            <p>Email: admin@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendVendorApplicationReceived(params: {
    vendorEmail: string;
    vendorName: string;
    businessName: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.vendorEmail,
      subject: `Application Received - ${params.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Application Received</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>Thank you for submitting your vendor application for <strong>${params.businessName}</strong>!</p>
            
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">What Happens Next?</h4>
              <ul>
                <li>Our team will review your application</li>
                <li>You will receive an email once a decision has been made</li>
                <li>Review typically takes 1-2 business days</li>
              </ul>
            </div>
            
            <p>If you have any questions in the meantime, feel free to reach out to our support team.</p>
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

  static async sendVendorApproved(params: {
    vendorEmail: string;
    vendorName: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.vendorEmail,
      subject: `Account Approved - Welcome to SportsBox Kenya!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Account Approved!</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>Great news! Your vendor account has been approved. You can now list your venues on SportsBox Kenya.</p>
            
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">Get Started</h4>
              <ul>
                <li>Log into your vendor dashboard</li>
                <li>Add your courts and venues</li>
                <li>Set pricing and availability</li>
                <li>Start receiving bookings</li>
              </ul>
            </div>
            
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

  static async sendVendorRejected(params: {
    vendorEmail: string;
    vendorName: string;
    reason?: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.vendorEmail,
      subject: `Vendor Application Update - SportsBox Kenya`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Application Not Approved</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>We regret to inform you that your vendor application has not been approved at this time.</p>
            
            ${params.reason ? `
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin-top: 0;">Reason</h4>
              <p>${params.reason}</p>
            </div>
            ` : ''}
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #d97706; margin-top: 0;">What You Can Do</h4>
              <ul>
                <li>Review the feedback provided above</li>
                <li>Update your application details</li>
                <li>Contact our support team for more information</li>
                <li>Reapply once the issues have been addressed</li>
              </ul>
            </div>
            
            <p>If you believe this decision was made in error or have questions, please contact our support team.</p>
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

  static async sendBookingCancellationCustomer(params: {
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
      subject: `Booking Cancelled - ${params.courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Booking Cancelled</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>Your booking has been successfully cancelled. Here are the details of the cancelled booking:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin-top: 0;">Cancelled Booking</h4>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Amount Paid:</strong> KES ${params.totalAmount}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Refund Information</h4>
              <p>Refunds are processed manually within <strong>3–5 business days</strong> via M-Pesa reversal to the number used during payment. If you have not received your refund after 5 business days, please contact us at <strong>info@sportsbox.co.ke</strong>.</p>
            </div>
            <p>We hope to see you back on the court soon!</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Browse Courts</a>
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

  static async sendBookingCancellationVendor(params: {
    vendorEmail: string;
    vendorName: string;
    courtName: string;
    customerName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    bookingId: string;
  }): Promise<boolean> {
    const template: EmailTemplate = {
      to: params.vendorEmail,
      subject: `Booking Cancelled - ${params.courtName} on ${params.bookingDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🏀 SportsBox Kenya</h1>
            <h2>Booking Cancelled by Customer</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>A customer has cancelled their booking for <strong>${params.courtName}</strong>. The time slot is now available again.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin-top: 0;">Cancelled Booking Details</h4>
              <p><strong>Customer:</strong> ${params.customerName}</p>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Amount:</strong> KES ${params.totalAmount}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            <p>Please log in to your vendor dashboard to view your updated bookings.</p>
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

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
