/**
 * Ratta Kallan Portal - Cloud Function (Node.js / Firebase Functions)
 * Automatically triggers when a new document is created in the 'messages' collection
 * and sends an email via SendGrid, Resend, or Nodemailer if the recipient has an email.
 */

export const cloudFunctionExampleCode = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Configure your SMTP or Resend/SendGrid credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or host: 'smtp.resend.com'
  auth: {
    user: process.env.EMAIL_USER || 'notifications@ratta.pk',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

exports.onNewVillageMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const targetProfileId = message.targetProfileId;

    if (!targetProfileId) return null;

    // Fetch recipient profile to find their registered email
    const profileDoc = await db.collection('profiles').doc(targetProfileId).get();
    if (!profileDoc.exists) return null;

    const profile = profileDoc.data();
    const recipientEmail = profile.email;
    if (!recipientEmail || !recipientEmail.includes('@')) return null;

    // 10-minute anti-spam throttle check
    const throttleRef = db.collection('emailThrottles').doc(targetProfileId);
    const throttleDoc = await throttleRef.get();
    const now = Date.now();
    if (throttleDoc.exists) {
      const lastSent = throttleDoc.data().lastSentAt || 0;
      if (now - lastSent < 10 * 60 * 1000) {
        console.log('Throttling email for profile ' + targetProfileId);
        return null;
      }
    }

    const safeSender = message.senderName || 'ایک دیہاتی شہری';
    const preview = (message.messageText || '').slice(0, 77);

    const mailOptions = {
      from: '"رتہ کلاں پورٹل" <portal@ratta.pk>',
      to: recipientEmail,
      subject: '[رتہ کلاں پورٹل] ' + safeSender + ' نے آپ کو نیا پیغام بھیجا ہے',
      html: \`
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f4f6f3;">
          <div style="max-width: 550px; margin: auto; background: white; border-radius: 16px; padding: 24px; border: 1px solid #10b981;">
            <h2 style="color: #065f46; margin-top: 0;">رتہ کلاں ڈیجیٹل پورٹل</h2>
            <p>محترم \${profile.name} صاحب! آپ کے لیے نیا پیغام موصول ہوا ہے۔</p>
            <p><strong>بھیجنے والا:</strong> \${safeSender} (\${message.senderMobile || ''})</p>
            <p><strong>پیش نظارہ:</strong> "\${preview}"</p>
            <div style="margin: 25px 0; text-align: center;">
              <a href="https://ratta-kallan.web.app/?inbox=\${encodeURIComponent(profile.mobile || '')}" 
                 style="background: #047857; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold;">
                محفوظ ان باکس کھولیں اور جواب دیں
              </a>
            </div>
            <p style="font-size: 11px; color: #888;">یہ خودکار پیغام ہے، اس کا جواب نہ دیں۔</p>
          </div>
        </div>
      \`,
    };

    try {
      await transporter.sendMail(mailOptions);
      await throttleRef.set({ recipientId: targetProfileId, lastSentAt: now }, { merge: true });
      console.log('Notification email dispatched to ' + recipientEmail);
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  });
`;
