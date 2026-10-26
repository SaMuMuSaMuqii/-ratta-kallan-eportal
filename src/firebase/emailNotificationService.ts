/**
 * Ratta Kallan Portal - Email Notification Service
 * Dispatches automated bilingual (Urdu + English) email alerts
 * when a villager or professional receives a new message.
 * Integrates with Firebase 'mail' trigger extension & serverless webhooks.
 * Features 10-minute anti-spam throttling per recipient.
 */

import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { VillageMessage, VillageProfile } from '../types';

interface SendNotificationOptions {
  recipientProfile: VillageProfile;
  message: VillageMessage;
  portalUrl?: string;
}

const EMAIL_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes anti-spam cooldown

// In-memory cooldown cache for the client session (supplemented by Firestore check)
const localEmailCooldownMap = new Map<string, number>();

/**
 * Generates responsive bilingual HTML email body for new messages.
 */
export function generateBilingualEmailTemplate(
  recipient: VillageProfile,
  message: VillageMessage,
  portalUrl: string
): { subject: string; html: string; text: string } {
  const safeSenderName = message.senderName || 'ایک دیہاتی شہری';
  const safeSenderMobile = message.senderMobile || 'غیر دستیاب';
  const previewText = message.messageText
    ? message.messageText.length > 80
      ? message.messageText.slice(0, 77) + '...'
      : message.messageText
    : 'وائس میسج یا منسلکہ';

  const inquiryLabels: Record<string, { ur: string; en: string }> = {
    charges: { ur: 'ریٹ / اجرت کی معلومات', en: 'Rate Inquiry' },
    availability: { ur: 'دستیابی و وقت', en: 'Availability' },
    urgent_work: { ur: 'فوری / ہنگامی کام', en: 'Urgent Work' },
    general: { ur: 'عام رابطہ', en: 'General Inquiry' },
  };

  const badge = inquiryLabels[message.inquiryType] || inquiryLabels.general;
  const directLink = `${portalUrl.replace(/\/$/, '')}/?inbox=${encodeURIComponent(
    recipient.mobile || ''
  )}`;

  const subject = `[رتہ کلاں پورٹل] ${safeSenderName} نے آپ کو نیا پیغام بھیجا ہے | New Message from ${safeSenderName}`;

  const text = `
رتہ کلاں ڈیجیٹل پورٹل (Ratta Kallan Village Portal)
السلام علیکم ${recipient.name}!
آپ کو ${safeSenderName} (${safeSenderMobile}) کی طرف سے نیا پیغام موصول ہوا ہے۔

شعبہ: ${badge.ur} (${badge.en})
پیغام کا پیش نظارہ: "${previewText}"

اپنا ان باکس دیکھنے اور 2-طرفہ خفیہ جواب دینے کے لیے پورٹل پر جائیں:
${directLink}

نوٹ: یہ خودکار اطلاع ہے۔ اس ای میل کا جواب نہ دیں۔
`.trim();

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f3; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; color: #1c1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f3; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #d1fae5;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">
                رتہ کلاں ڈیجیٹل پورٹل
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0; letter-spacing: 1px;">
                Ratta Kallan Community & Skills Portal (Jhang)
              </p>
            </td>
          </tr>

          <!-- Notification Title -->
          <tr>
            <td style="padding: 24px 24px 12px;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 15px; font-weight: bold; color: #065f46;">
                  📩 محترم <span>${recipient.name}</span> صاحب! آپ کے لیے نیا پیغام آیا ہے۔
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #047857;">
                  You have received a new private message on your profile.
                </p>
              </div>

              <!-- Message Details Card -->
              <table role="presentation" width="100%" style="background-color: #fafaf9; border-radius: 12px; border: 1px solid #e7e5e4; padding: 16px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c; width: 35%;">بھیجنے والا (Sender):</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #1c1917;">${safeSenderName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c;">موبائل نمبر (Phone):</td>
                  <td style="padding: 6px 0; font-size: 13px; font-family: monospace; font-weight: bold; color: #047857; direction: ltr; text-align: right;">${safeSenderMobile}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c;">نوعیت (Category):</td>
                  <td style="padding: 6px 0; font-size: 13px;">
                    <span style="background-color: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: bold;">
                      ${badge.ur} (${badge.en})
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c; vertical-align: top;">پیش نظارہ (Preview):</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #292524; font-style: italic;">
                    "${previewText}"
                  </td>
                </tr>
              </table>

              <!-- Direct Action Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${directLink}" style="background-color: #047857; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(4, 120, 87, 0.3);">
                  محفوظ ان باکس کھولیں اور جواب دیں ➔
                </a>
                <p style="margin: 8px 0 0; font-size: 11px; color: #78716c;">
                  Open Secure Inbox to reply directly
                </p>
              </div>

              <!-- Privacy Notice -->
              <div style="border-top: 1px dashed #d6d3d1; padding-top: 14px; margin-top: 20px; font-size: 11px; color: #78716c; line-height: 1.6;">
                🔒 <strong>رازداری کی ضمانت:</strong> یہ پیغام رتہ کلاں پورٹل کے محفوظ سرور پر انکرپٹڈ ہے۔ آپ کا موبائل نمبر اور ای میل کسی تیسرے فریق کو کبھی نہیں دیا جاتا۔
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f4; padding: 16px 24px; text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4;">
              رتہ کلاں، تحصیل و ضلع جھنگ، پنجاب، پاکستان • Ratta Kallan Village Portal<br>
              یہ ایک خودکار الرٹ ہے۔ براہ کرم اس ای میل کا جواب نہ دیں۔
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, html, text };
}

/**
 * Checks anti-spam throttle limit (1 email per 10 minutes per recipient profile).
 */
export async function canSendNotificationEmail(recipientId: string): Promise<boolean> {
  const now = Date.now();

  // Local memory check
  const lastLocal = localEmailCooldownMap.get(recipientId);
  if (lastLocal && now - lastLocal < EMAIL_THROTTLE_MS) {
    return false;
  }

  // Firestore persistent throttle check
  try {
    const throttleDocRef = doc(db, 'emailThrottles', recipientId);
    const snap = await getDoc(throttleDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const lastSent = data.lastSentAt?.toMillis ? data.lastSentAt.toMillis() : (data.lastSentAt || 0);
      if (now - lastSent < EMAIL_THROTTLE_MS) {
        return false;
      }
    }
  } catch {
    // If offline, rely on memory
  }

  return true;
}

/**
 * Records that a notification email was dispatched to respect the 10-minute cooldown.
 */
export async function recordNotificationSent(recipientId: string): Promise<void> {
  const now = Date.now();
  localEmailCooldownMap.set(recipientId, now);

  try {
    const throttleDocRef = doc(db, 'emailThrottles', recipientId);
    await setDoc(throttleDocRef, {
      recipientId,
      lastSentAt: now,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not record email throttle in Firestore:', err);
  }
}

/**
 * Dispatches the notification email via Firebase 'mail' trigger extension
 * if recipient has a valid email address and cooldown has passed.
 */
export async function dispatchMessageNotificationEmail({
  recipientProfile,
  message,
  portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ratta-kallan.web.app',
}: SendNotificationOptions): Promise<boolean> {
  const email = recipientProfile.email?.trim();
  if (!email || !email.includes('@')) {
    return false;
  }

  const allowed = await canSendNotificationEmail(recipientProfile.id);
  if (!allowed) {
    console.info(`[EmailService] Notification for ${recipientProfile.name} throttled (10m cooldown).`);
    return false;
  }

  const { subject, html, text } = generateBilingualEmailTemplate(
    recipientProfile,
    message,
    portalUrl
  );

  try {
    // Standard Firebase Trigger Email collection schema
    await addDoc(collection(db, 'mail'), {
      to: [email],
      message: {
        subject,
        text,
        html,
      },
      recipientProfileId: recipientProfile.id,
      messageId: message.id,
      createdAt: new Date().toISOString(),
    });

    await recordNotificationSent(recipientProfile.id);
    return true;
  } catch (err) {
    console.warn('[EmailService] Failed to write email trigger to Firestore:', err);
    return false;
  }
}
