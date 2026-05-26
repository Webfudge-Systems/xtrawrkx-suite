import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email configuration - uses environment variables for security
const createTransporter = () => {
  // Check if environment variables are set
  // if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  //   throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env.local');
  // }

  // For Google Workspace email (xsos@xtrawrkx.com)
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "hiten@xtrawrkx.com",
      pass: "yhws dmzi qtcc icgr",
    },
  });
};

// Email templates
const getContactInquiryEmailTemplate = (data) => {
  const subject = `Contact Inquiry Confirmation - ${data.inquiryType ? data.inquiryType.charAt(0).toUpperCase() + data.inquiryType.slice(1) : 'General'} Inquiry`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Inquiry Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .info-section { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .priority-high { color: #dc3545; font-weight: bold; }
        .priority-medium { color: #fd7e14; font-weight: bold; }
        .priority-low { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Contacting XtraWrkx</h1>
          <p>Your inquiry has been received and will be processed shortly</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.contactName},</h2>
          
          <p>Thank you for reaching out to XtraWrkx. We have successfully received your inquiry and our team will review it shortly.</p>
          
          <div class="info-section">
            <h3>Your Inquiry Details:</h3>
            <p><strong>Inquiry Type:</strong> ${data.inquiryType ? data.inquiryType.charAt(0).toUpperCase() + data.inquiryType.slice(1).replace('_', ' ') : 'General'}</p>
            <p><strong>Priority Level:</strong> <span class="priority-${data.priority || 'medium'}">${(data.priority || 'medium').charAt(0).toUpperCase() + (data.priority || 'medium').slice(1)}</span></p>
            ${data.purpose ? `<p><strong>Purpose:</strong> ${data.purpose.charAt(0).toUpperCase() + data.purpose.slice(1).replace('_', ' ')}</p>` : ''}
            ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.jobTitle ? `<p><strong>Job Title:</strong> ${data.jobTitle}</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
            <p><strong>Reference ID:</strong> ${data.inquiryId}</p>
          </div>
          
          <div class="info-section">
            <h3>Your Message:</h3>
            <p style="font-style: italic; background: white; padding: 15px; border-left: 4px solid #667eea;">"${data.message}"</p>
          </div>
          
          <h3>What Happens Next?</h3>
          <ul>
            <li><strong>Response Time:</strong> You can expect a response within ${data.priority === 'high' ? '4 hours' : data.priority === 'medium' ? '24 hours' : '48 hours'}</li>
            <li><strong>Our team</strong> will review your inquiry and contact you via your preferred method</li>
            <li><strong>Follow-up:</strong> We may reach out for additional information if needed</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:info@xtrawrkx.com" class="btn">Reply to This Email</a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>XtraWrkx</strong><br>
          Professional Development & Consulting</p>
          <p>📧 <a href="mailto:info@xtrawrkx.com">info@xtrawrkx.com</a> | 🌐 <a href="https://xtrawrkx.com">xtrawrkx.com</a></p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            This is an automated confirmation email. Please do not reply to this email address directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

const getConsultationBookingEmailTemplate = (data) => {
  const consultationTypes = {
    'free-consultation': 'Free Consultation Call (30 min)',
    'business-consultation': 'Business Consultation Call (45 min)',
    'technical-consultation': 'Technical Consultation Call (60 min)'
  };

  const subject = `Consultation Booking Confirmation - ${consultationTypes[data.consultationType] || 'Consultation Call'}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Consultation Booking Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .info-section { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .calendar-section { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #11998e; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Consultation Booking Confirmed</h1>
          <p>Your consultation call request has been received</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.contactName},</h2>
          
          <p>Thank you for booking a consultation call with XtraWrkx! We're excited to connect with you and discuss your needs.</p>
          
          <div class="calendar-section">
            <h3>📅 Consultation Details:</h3>
            <p><strong>Type:</strong> ${consultationTypes[data.consultationType] || data.consultationType}</p>
            <p><strong>Preferred Date:</strong> ${new Date(data.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Preferred Time:</strong> ${data.preferredTime} ${data.timezone}</p>
            ${data.alternativeDate ? `<p><strong>Alternative Date:</strong> ${new Date(data.alternativeDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
            ${data.alternativeTime ? `<p><strong>Alternative Time:</strong> ${data.alternativeTime} ${data.timezone}</p>` : ''}
            <p><strong>Meeting Mode:</strong> ${data.meetingMode === 'video' ? '📹 Video Call' : data.meetingMode === 'phone' ? '📞 Phone Call' : '🏢 In-Person'}</p>
            <p><strong>Participants:</strong> ${data.participants} ${data.participants > 1 ? 'people' : 'person'}</p>
          </div>
          
          <div class="info-section">
            <h3>Contact Information:</h3>
            ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.jobTitle ? `<p><strong>Job Title:</strong> ${data.jobTitle}</p>` : ''}
            <p><strong>Email:</strong> ${data.primaryContactEmail}</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          </div>
          
          ${data.purpose ? `
          <div class="info-section">
            <h3>Discussion Purpose:</h3>
            <p>${data.purpose}</p>
          </div>
          ` : ''}
          
          ${data.agenda ? `
          <div class="info-section">
            <h3>Agenda/Topics to Discuss:</h3>
            <p style="font-style: italic; background: white; padding: 15px; border-left: 4px solid #11998e;">"${data.agenda}"</p>
          </div>
          ` : ''}
          
          ${data.specialRequests ? `
          <div class="info-section">
            <h3>Special Requests:</h3>
            <p>${data.specialRequests}</p>
          </div>
          ` : ''}
          
          <div class="highlight">
            <h3>📋 Next Steps:</h3>
            <ol>
              <li><strong>Confirmation:</strong> Our team will review your request and confirm the final meeting time within 24 hours</li>
              <li><strong>Calendar Invite:</strong> You'll receive a calendar invitation with meeting details and access links</li>
              <li><strong>Preparation:</strong> We'll send you a brief preparation guide to make the most of our time together</li>
              <li><strong>Meeting:</strong> Join the consultation at the scheduled time using the provided link or phone number</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:info@xtrawrkx.com" class="btn">Contact Us if Needed</a>
          </div>
          
          <p><strong>Important:</strong> If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        </div>
        
        <div class="footer">
          <p><strong>XtraWrkx</strong><br>
          Professional Development & Consulting</p>
          <p>📧 <a href="mailto:info@xtrawrkx.com">info@xtrawrkx.com</a> | 🌐 <a href="https://xtrawrkx.com">xtrawrkx.com</a></p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            This is an automated confirmation email. Please reply to confirm or make any changes.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

const getRegistrationEmailTemplate = (data) => {
  const {
    registrationId,
    companyName,
    primaryContactName,
    eventTitle,
    eventDate,
    eventLocation,
    ticketType,
    totalCost,
    paymentStatus
  } = data;

  const isPaymentPending = paymentStatus === 'pending';
  const isPaid = paymentStatus === 'completed';

  return {
    subject: `Registration ${isPaid ? 'Confirmed' : 'Received'} - ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Registration ${isPaid ? 'Confirmation' : 'Received'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
          }
          .confirmed {
            background: #d4edda;
            color: #155724;
          }
          .pending {
            background: #fff3cd;
            color: #856404;
          }
          .detail-row {
            display: flex;
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            min-width: 150px;
          }
          .detail-value {
            flex: 1;
          }
          .next-steps {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ${isPaid ? 'Registration Confirmed!' : 'Registration Received!'}</h1>
          <p>Thank you for registering with xtrawrkx Events</p>
        </div>
        
        <div class="content">
          <div class="status-badge ${isPaid ? 'confirmed' : 'pending'}">
            ${isPaid ? '✅ Registration Confirmed' : '⏳ Registration Received'}
          </div>
          
          <h2>Hello ${primaryContactName},</h2>
          
          <p>
            ${isPaid
        ? `We are pleased to confirm your registration for <strong>${eventTitle}</strong>. Your payment has been successfully processed and your spot is secured.`
        : `Thank you for registering for <strong>${eventTitle}</strong>. We have received your registration details.`
      }
          </p>

          ${isPaymentPending && totalCost > 0 ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Payment Required</h3>
              <p style="color: #856404; margin-bottom: 0;">
                Your registration is currently pending. Please complete the payment of <strong>₹${totalCost}</strong> to confirm your spot.
              </p>
            </div>
          ` : ''}

          <h3>Registration Details:</h3>
          <div class="detail-row">
            <div class="detail-label">Registration ID:</div>
            <div class="detail-value"><strong>${registrationId}</strong></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Company:</div>
            <div class="detail-value">${companyName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Event:</div>
            <div class="detail-value">${eventTitle}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date & Time:</div>
            <div class="detail-value">${eventDate}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">${eventLocation}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Ticket Type:</div>
            <div class="detail-value">${ticketType}</div>
          </div>
          ${totalCost > 0 ? `
            <div class="detail-row">
              <div class="detail-label">Amount:</div>
              <div class="detail-value">₹${totalCost}</div>
            </div>
          ` : ''}

          <div class="next-steps">
            <h3>📋 What's Next?</h3>
            <ul>
              ${isPaid
        ? `
                  <li>✅ Your registration is confirmed</li>
                  <li>✅ Event details and instructions will follow closer to the date</li>
                  <li>✅ You will receive your event pass shortly</li>
                  <li>✅ Join our community for updates and networking opportunities</li>
                `
        : `
                  <li>Complete payment to confirm your registration</li>
                  <li>Once payment is received, you'll get a confirmation email</li>
                  <li>Event pass will be sent after payment confirmation</li>
                  <li>Contact support if you need assistance with payment</li>
                `
      }
            </ul>
          </div>

          ${isPaid ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://xtrawrkx.com/events" class="btn">View All Events</a>
              <a href="https://xtrawrkx.com/communities" class="btn">Join Our Community</a>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>
            <strong>Need help?</strong><br>
            Contact our support team at <a href="mailto:support@xtrawrkx.com">support@xtrawrkx.com</a><br>
            Registration ID: ${registrationId}
          </p>
          <p>
            <strong>xtrawrkx Events</strong><br>
            Empowering Professional Growth Through Strategic Networking
          </p>
        </div>
      </body>
      </html>
    `
  };
};

const getPaymentConfirmationTemplate = (data) => {
  const {
    registrationId,
    companyName,
    primaryContactName,
    eventTitle,
    eventDate,
    eventLocation,
    ticketType,
    totalCost,
    paymentId
  } = data;

  return {
    subject: `Payment Received & Registration Confirmed - ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .success-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
            background: #d4edda;
            color: #155724;
          }
          .detail-row {
            display: flex;
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            min-width: 150px;
          }
          .detail-value {
            flex: 1;
          }
          .next-steps {
            background: #e7f3ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💳 Payment Received!</h1>
          <p>Your registration is now confirmed</p>
        </div>
        
        <div class="content">
          <div class="success-badge">
            ✅ Payment Successful
          </div>
          
          <h2>Hello ${primaryContactName},</h2>
          
          <p>
            We are pleased to inform you that we have received your payment for <strong>${eventTitle}</strong>. 
            Your registration is now confirmed and your spot is secured.
          </p>

          <p><strong>You will receive your confirmation pass shortly.</strong></p>

          <h3>Payment Details:</h3>
          <div class="detail-row">
            <div class="detail-label">Payment ID:</div>
            <div class="detail-value"><strong>${paymentId}</strong></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Amount Paid:</div>
            <div class="detail-value"><strong>₹${totalCost}</strong></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Registration ID:</div>
            <div class="detail-value">${registrationId}</div>
          </div>

          <h3>Event Details:</h3>
          <div class="detail-row">
            <div class="detail-label">Company:</div>
            <div class="detail-value">${companyName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Event:</div>
            <div class="detail-value">${eventTitle}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Date & Time:</div>
            <div class="detail-value">${eventDate}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Location:</div>
            <div class="detail-value">${eventLocation}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Ticket Type:</div>
            <div class="detail-value">${ticketType}</div>
          </div>

          <div class="next-steps">
            <h3>📋 What's Next?</h3>
            <ul>
              <li>✅ Your payment has been processed successfully</li>
              <li>✅ Registration is confirmed</li>
              <li>✅ You will receive your event pass shortly</li>
              <li>✅ Event details and instructions will follow closer to the date</li>
              <li>✅ Join our community for updates and networking opportunities</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="https://xtrawrkx.com/events" class="btn">View All Events</a>
            <a href="https://xtrawrkx.com/communities" class="btn">Join Our Community</a>
          </div>
        </div>

        <div class="footer">
          <p>
            <strong>Need help?</strong><br>
            Contact our support team at <a href="mailto:support@xtrawrkx.com">support@xtrawrkx.com</a><br>
            Payment ID: ${paymentId} | Registration ID: ${registrationId}
          </p>
          <p>
            <strong>xtrawrkx Events</strong><br>
            Empowering Professional Growth Through Strategic Networking
          </p>
        </div>
      </body>
      </html>
    `
  };
};

// Admin notification template
const getAdminNotificationTemplate = (data, type) => {
  // Handle new contact inquiry and booking types
  if (type === 'contact_inquiry') {
    return {
      subject: `🔔 New Contact Inquiry - ${data.inquiryType ? data.inquiryType.charAt(0).toUpperCase() + data.inquiryType.slice(1) : 'General'} [${data.priority ? data.priority.toUpperCase() : 'MEDIUM'} Priority]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>🔔 New Contact Inquiry Received</h2>
            <p>Priority: <strong>${(data.priority || 'medium').toUpperCase()}</strong></p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Contact Information:</h3>
            <p><strong>Name:</strong> ${data.contactName}</p>
            <p><strong>Email:</strong> ${data.primaryContactEmail}</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
            ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.jobTitle ? `<p><strong>Job Title:</strong> ${data.jobTitle}</p>` : ''}
            ${data.website ? `<p><strong>Website:</strong> ${data.website}</p>` : ''}
          </div>
          
          <div style="padding: 20px;">
            <h3>Inquiry Details:</h3>
            <p><strong>Type:</strong> ${data.inquiryType ? data.inquiryType.charAt(0).toUpperCase() + data.inquiryType.slice(1).replace('_', ' ') : 'General'}</p>
            <p><strong>Priority:</strong> ${(data.priority || 'medium').charAt(0).toUpperCase() + (data.priority || 'medium').slice(1)}</p>
            ${data.purpose ? `<p><strong>Purpose:</strong> ${data.purpose.charAt(0).toUpperCase() + data.purpose.slice(1).replace('_', ' ')}</p>` : ''}
            <p><strong>Preferred Contact:</strong> ${data.preferredContact || 'Email'}</p>
            ${data.bestTimeToCall ? `<p><strong>Best Time to Call:</strong> ${data.bestTimeToCall}</p>` : ''}
            ${data.hearAboutUs ? `<p><strong>How they heard about us:</strong> ${data.hearAboutUs}</p>` : ''}
          </div>
          
          <div style="padding: 20px; background: #f0f8ff; border-left: 4px solid #667eea;">
            <h3>Message:</h3>
            <p style="font-style: italic;">"${data.message}"</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Administrative Details:</h3>
            <p><strong>Inquiry ID:</strong> ${data.inquiryId}</p>
            <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
            <p><strong>Newsletter Signup:</strong> ${data.newsletter ? 'Yes' : 'No'}</p>
            <p><strong>Source:</strong> Contact Form</p>
          </div>
          
          <div style="padding: 20px; text-align: center;">
            <p><strong>⏰ Expected Response Time:</strong> ${data.priority === 'high' ? '4 hours' : data.priority === 'medium' ? '24 hours' : '48 hours'}</p>
            <p style="margin-top: 20px;">
              <a href="mailto:${data.primaryContactEmail}?subject=Re: Your Inquiry - ${data.inquiryType}&body=Hello ${data.contactName},%0A%0AThank you for your inquiry..." 
                 style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Reply to ${data.contactName}
              </a>
            </p>
          </div>
        </div>
      `
    };
  }

  if (type === 'consultation_booking') {
    const consultationTypes = {
      'free-consultation': 'Free Consultation Call (30 min)',
      'business-consultation': 'Business Consultation Call (45 min)',
      'technical-consultation': 'Technical Consultation Call (60 min)'
    };

    return {
      subject: `📅 New Consultation Booking - ${consultationTypes[data.consultationType] || 'Consultation Call'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #11998e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>📅 New Consultation Booking</h2>
            <p><strong>${consultationTypes[data.consultationType] || data.consultationType}</strong></p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Contact Information:</h3>
            <p><strong>Name:</strong> ${data.contactName}</p>
            <p><strong>Email:</strong> ${data.primaryContactEmail}</p>
            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
            ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
            ${data.jobTitle ? `<p><strong>Job Title:</strong> ${data.jobTitle}</p>` : ''}
          </div>
          
          <div style="padding: 20px; background: #e8f5e8; border-left: 4px solid #11998e;">
            <h3>📅 Meeting Details:</h3>
            <p><strong>Consultation Type:</strong> ${consultationTypes[data.consultationType] || data.consultationType}</p>
            <p><strong>Preferred Date:</strong> ${new Date(data.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Preferred Time:</strong> ${data.preferredTime} ${data.timezone}</p>
            ${data.alternativeDate ? `<p><strong>Alternative Date:</strong> ${new Date(data.alternativeDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
            ${data.alternativeTime ? `<p><strong>Alternative Time:</strong> ${data.alternativeTime} ${data.timezone}</p>` : ''}
            <p><strong>Meeting Mode:</strong> ${data.meetingMode === 'video' ? '📹 Video Call' : data.meetingMode === 'phone' ? '📞 Phone Call' : '🏢 In-Person'}</p>
            <p><strong>Participants:</strong> ${data.participants} ${data.participants > 1 ? 'people' : 'person'}</p>
          </div>
          
          ${data.purpose ? `
          <div style="padding: 20px;">
            <h3>Discussion Purpose:</h3>
            <p><strong>${data.purpose}</strong></p>
          </div>
          ` : ''}
          
          ${data.agenda ? `
          <div style="padding: 20px; background: #f0f8ff; border-left: 4px solid #11998e;">
            <h3>Agenda/Topics to Discuss:</h3>
            <p style="font-style: italic;">"${data.agenda}"</p>
          </div>
          ` : ''}
          
          ${data.specialRequests ? `
          <div style="padding: 20px; background: #fff3cd;">
            <h3>Special Requests:</h3>
            <p>${data.specialRequests}</p>
          </div>
          ` : ''}
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Administrative Details:</h3>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
            <p><strong>Newsletter Signup:</strong> ${data.newsletter ? 'Yes' : 'No'}</p>
            <p><strong>Status:</strong> Pending Confirmation</p>
            <p><strong>Source:</strong> Book Meet Modal</p>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #fff3cd;">
            <h3>🚨 Action Required:</h3>
            <p><strong>Please confirm this booking within 24 hours and send calendar invite</strong></p>
            <p style="margin-top: 20px;">
              <a href="mailto:${data.primaryContactEmail}?subject=Consultation Booking Confirmation&body=Hello ${data.contactName},%0A%0AThank you for booking a consultation with XtraWrkx..." 
                 style="background: #11998e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                Confirm & Send Calendar Invite
              </a>
            </p>
          </div>
        </div>
      `
    };
  }

  // Handle existing event registration types
  const {
    registrationId,
    companyName,
    primaryContactName,
    primaryContactEmail,
    companyEmail,
    eventTitle,
    eventDate,
    eventLocation,
    ticketType,
    totalCost,
    paymentStatus,
    paymentId,
    season
  } = data;

  const isPaymentNotification = type === 'payment_confirmation';
  const isSeasonRegistration = season && eventTitle.includes('Season');

  return {
    subject: `🚨 ${isPaymentNotification ? 'Payment Received' : 'New Registration'} - ${eventTitle}`,
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Notification</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 700px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: ${isPaymentNotification ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)'};
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }
                    .content {
                        background: #f8f9fa;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                        border: 1px solid #dee2e6;
                    }
                    .alert {
                        background: ${isPaymentNotification ? '#d4edda' : '#fff3cd'};
                        border: 1px solid ${isPaymentNotification ? '#c3e6cb' : '#ffeeba'};
                        color: ${isPaymentNotification ? '#155724' : '#856404'};
                        padding: 15px;
                        border-radius: 8px;
                        margin: 15px 0;
                        font-weight: bold;
                    }
                    .detail-section {
                        background: white;
                        padding: 20px;
                        margin: 15px 0;
                        border-radius: 8px;
                        border: 1px solid #dee2e6;
                    }
                    .detail-row {
                        display: flex;
                        margin: 8px 0;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .detail-label {
                        font-weight: bold;
                        min-width: 180px;
                        color: #495057;
                    }
                    .detail-value {
                        flex: 1;
                        color: #212529;
                    }
                    .section-title {
                        color: #495057;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #007bff;
                        padding-bottom: 5px;
                    }
                    .footer {
                        text-align: center;
                        padding: 20px;
                        color: #6c757d;
                        font-size: 14px;
                        background: #e9ecef;
                        margin-top: 20px;
                        border-radius: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${isPaymentNotification ? '💰 Payment Received!' : '📝 New Registration Alert!'}</h1>
                    <p>xtrawrkx Admin Notification</p>
                </div>
                
                <div class="content">
                    <div class="alert">
                        ${isPaymentNotification
        ? `💳 Payment of ₹${totalCost} received for ${eventTitle}`
        : `🆕 New registration received for ${eventTitle}`
      }
                    </div>

                    <div class="detail-section">
                        <div class="section-title">📋 Registration Information</div>
                        <div class="detail-row">
                            <div class="detail-label">Registration ID:</div>
                            <div class="detail-value"><strong>${registrationId}</strong></div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Event:</div>
                            <div class="detail-value">${eventTitle}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Date & Location:</div>
                            <div class="detail-value">${eventDate} | ${eventLocation}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Ticket Type:</div>
                            <div class="detail-value">${ticketType}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Payment Status:</div>
                            <div class="detail-value">
                                <span style="color: ${paymentStatus === 'completed' ? '#28a745' : '#dc3545'}; font-weight: bold;">
                                    ${paymentStatus === 'completed' ? '✅ PAID' : '⏳ PENDING'}
                                </span>
                            </div>
                        </div>
                        ${totalCost > 0 ? `
                            <div class="detail-row">
                                <div class="detail-label">Amount:</div>
                                <div class="detail-value"><strong>₹${totalCost}</strong></div>
                            </div>
                        ` : ''}
                        ${paymentId ? `
                            <div class="detail-row">
                                <div class="detail-label">Payment ID:</div>
                                <div class="detail-value"><strong>${paymentId}</strong></div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="detail-section">
                        <div class="section-title">🏢 Company Details</div>
                        <div class="detail-row">
                            <div class="detail-label">Company Name:</div>
                            <div class="detail-value">${companyName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Primary Contact:</div>
                            <div class="detail-value">${primaryContactName}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Contact Email:</div>
                            <div class="detail-value"><a href="mailto:${primaryContactEmail}">${primaryContactEmail}</a></div>
                        </div>
                        ${companyEmail && companyEmail !== primaryContactEmail ? `
                            <div class="detail-row">
                                <div class="detail-label">Company Email:</div>
                                <div class="detail-value"><a href="mailto:${companyEmail}">${companyEmail}</a></div>
                            </div>
                        ` : ''}
                    </div>

                    ${isSeasonRegistration && data.selectedEvents ? `
                        <div class="detail-section">
                            <div class="section-title">📅 Selected Events</div>
                            ${data.selectedEvents.map(event => `
                                <div class="detail-row">
                                    <div class="detail-label">Event:</div>
                                    <div class="detail-value">${event.title || event.id}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://xtrawrkx.com/admin" 
                           style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            View in Admin Panel
                        </a>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>xtrawrkx Admin Panel</strong></p>
                    <p>This is an automated notification for new registrations and payments.</p>
                    <p>Registration Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>
            </body>
            </html>
        `
  };
};

export async function POST(request) {
  try {
    const { type, data } = await request.json();

    // Validate required data
    if (!data || !data.primaryContactEmail) {
      return NextResponse.json(
        { error: "Missing required email data" },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = createTransporter();

    let emailTemplate;

    // Generate appropriate email template based on type
    switch (type) {
      case 'registration':
        emailTemplate = getRegistrationEmailTemplate(data);
        break;
      case 'payment_confirmation':
        emailTemplate = getPaymentConfirmationTemplate(data);
        break;
      case 'contact_inquiry':
        emailTemplate = getContactInquiryEmailTemplate(data);
        break;
      case 'consultation_booking':
        emailTemplate = getConsultationBookingEmailTemplate(data);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    // Check if we should send user confirmation email
    const shouldSendToUser = data.sendToUser !== false; // Default to true unless explicitly false

    if (shouldSendToUser) {
      // Prepare recipient list
      const recipients = [data.primaryContactEmail];

      // Add company email if different from primary contact
      if (data.companyEmail && data.companyEmail !== data.primaryContactEmail) {
        recipients.push(data.companyEmail);
      }

      // Email configuration for user/company
      const mailOptions = {
        from: `"xtrawrkx Events" <${process.env.EMAIL_USER || 'hiten@xtrawrkx.com'}>`,
        replyTo: 'xsos@xtrawrkx.com', // Replies go to the group email
        to: recipients.join(', '),
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      };

      // Send email to user/company
      await transporter.sendMail(mailOptions);
    } else {
    }

    // Send notification to xtrawrkx admin
    const adminEmails = "info@xtrawrkx.com";
    const adminEmailTemplate = getAdminNotificationTemplate(data, type);

    const adminMailOptions = {
      from: `"xtrawrkx Events" <hiten@xtrawrkx.com>`,
      replyTo: 'xsos@xtrawrkx.com', // Replies go to the group email
      to: adminEmails,
      subject: adminEmailTemplate.subject,
      html: adminEmailTemplate.html,
    };

    // Send admin notification

    try {
      await transporter.sendMail(adminMailOptions);
    } catch (adminEmailError) {
      // Don't fail the whole process if admin email fails
    }

    return NextResponse.json({
      success: true,
      message: "Emails sent successfully",
      recipients: {
        users: recipients,
        admin: adminEmails
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
