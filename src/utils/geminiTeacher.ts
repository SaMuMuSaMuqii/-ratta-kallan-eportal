import { getOfflineAiResponse } from './aiKnowledgeEngine';
import { SubjectKey } from '../types';

/**
 * Virtual School AI Helper Engine
 * Answers school questions in 3 to 4 simple sentences
 */
export async function askSirAshraf(
  question: string,
  selectedClass: string,
  subject: SubjectKey = 'general'
): Promise<string> {
  const cleanQ = question.trim();
  if (!cleanQ) {
    return 'السلام علیکم! آپ کیا سیکھنا چاہتے ہیں؟ اپنا سوال لکھیں یا مائیک دبا کر بولیں۔';
  }

  // Check if server-side Gemini or local engine is used
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    '';

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `آپ رتہ کلاں ورچوئل اسکول کے مددگار ہیں۔
آپ طلبہ کو نرسری سے دسویں جماعت (Nursery to 10th Matric) تک تعلیم دیتے ہیں۔
موجودہ طالب علم کی جماعت ہے: "${selectedClass}" اور مضمون ہے: "${subject}"۔
طرزِ تحریر:
1. شائستہ، آسان اور مددگار اردو لہجہ (یا اگر سوال پنجابی میں ہو تو آسان پنجابی)۔
2. جواب بالکل واضح، آسان اور 3 سے 4 مختصر جملوں میں ہو تاکہ بچہ باآسانی سمجھ سکے اور آواز سن سکے۔
3. صرف اسکول کے درسی نصاب پر رہیں۔ غیر محفوظ یا غیر تعلیمی موضوعات پر شائستگی سے انکار کریں۔`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: cleanQ,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        return reply;
      }
    } catch (err) {
      console.warn('Gemini API call skipped, using local subject engine:', err);
    }
  }

  // Instant offline intelligence engine customized for subject & class level
  const baseAnswer = getOfflineAiResponse(subject, cleanQ);
  return `جماعت: ${selectedClass} | مضمون: ${subject}\n\n${baseAnswer}\n\nروزانہ محنت جاری رکھیں اور اپنا ہوم ورک مکمل کریں۔`;
}
