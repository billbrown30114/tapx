import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Debug file location
console.log('Current working directory:', process.cwd());
console.log('.env.local exists:', fs.existsSync(path.join(process.cwd(), '.env.local')));
console.log('.env exists:', fs.existsSync(path.join(process.cwd(), '.env')));

// Debug logging
console.log('Environment variables:');
console.log('EMAIL_USER:', process.env.NEXT_EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.NEXT_EMAIL_PASSWORD?.substring(0, 4) + '****');
console.log('RECIPIENT_EMAIL:', process.env.NEXT_RECIPIENT_EMAIL);
// Verify environment variables are loaded
if (!process.env.NEXT_EMAIL_USER || !process.env.NEXT_EMAIL_PASSWORD || !process.env.NEXT_RECIPIENT_EMAIL) {
  throw new Error('Missing required environment variables');
}



const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.NEXT_EMAIL_USER,
    pass: process.env.NEXT_EMAIL_PASSWORD
  },
  logger: true // Enable logging
});


// Add verification
transporter.verify(function(error, success) {
  if (error) {
    console.log('Server error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, company, phone, whereWeMet, position, resumeId } = body;

    const mailOptions = {
      from: process.env.NEXT_EMAIL_USER,
      to: process.env.NEXT_RECIPIENT_EMAIL, // Your email address
      subject: `New Viewed - ${company}`,
      html: `
        <h2>Resume Viewed</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Where We Met:</strong> ${whereWeMet}</p>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Requested Resume:</strong> ${resumeId}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 