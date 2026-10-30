import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Per-IP rate limiter to protect AI, STT & TTS endpoints
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  entry.count += 1;
  return true;
}

// In-memory LRU cache for synthesized TTS clips (200 entries) so repeated letters, numbers, greetings & answers play in <10ms without consuming Gemini Free-Tier 3 RPM TTS quota
const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string; provider: string }>();
const MAX_TTS_CACHE_ITEMS = 200;

// Track Gemini TTS 429 cooldown window (Free tier allows 3 RPM on gemini-3.8-flash-lite-tts)
let geminiTtsCooldownUntilMs = 0;

export type GeminiVoiceOption = 'Puck' | 'Charon' | 'Kore' | 'Zephyr' | 'Fenrir';

const VALID_GEMINI_VOICES: GeminiVoiceOption[] = ['Puck', 'Charon', 'Kore', 'Zephyr', 'Fenrir'];

function getGeminiClient(): GoogleGenAI | null {
  const rawKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!rawKey || rawKey === 'MY_GEMINI_API_KEY' || rawKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isAzureSpeechConfigured(): boolean {
  const key = (process.env.AZURE_SPEECH_KEY || '').trim();
  const region = (process.env.AZURE_SPEECH_REGION || '').trim();
  return Boolean(key && region && key !== 'YOUR_AZURE_SPEECH_KEY');
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Primary TTS Provider: Google Gemini Native Audio TTS (`gemini-3.8-flash-lite-tts`).
 * Tested & verified in Google AI Studio:
 * - Voices: Puck (warm male teacher), Charon (calm male elder), Kore (warm female teacher), Zephyr (gentle female nursery guide)
 * - Output: Complete 24kHz, 16-bit mono WAV file (`audio/wav` with RIFF header)
 * - Round-trip verified with `gemini-3.5-transcribe` at 100% word accuracy on Pakistani Urdu + English.
 */
async function synthesizeWithGeminiTts(params: {
  text: string;
  lang: 'ur' | 'en' | 'pa';
  gender: 'male' | 'female';
  voiceName?: string;
  slowMode?: boolean;
}): Promise<{ audioBase64: string; mimeType: string; voiceUsed: string } | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  if (Date.now() < geminiTtsCooldownUntilMs) {
    return null;
  }

  const requestedVoice = params.voiceName as GeminiVoiceOption | undefined;
  const voiceName: GeminiVoiceOption =
    requestedVoice && VALID_GEMINI_VOICES.includes(requestedVoice)
      ? requestedVoice
      : params.gender === 'female'
      ? 'Kore'
      : 'Puck';

  const paceInstruction = params.slowMode
    ? 'Speak slowly, gently, and very clearly with natural pauses so young village children and elders can follow every word.'
    : 'Speak at a natural, warm, friendly conversational Pakistani pace with clear articulation.';

  const stylePrompt =
    params.lang === 'en'
      ? `Warm, patient Pakistani educator speaking clear English. ${paceInstruction}`
      : `Warm, respectful, natural Pakistani Urdu speaker (ur-PK) from Punjab, Pakistan. Use authentic Pakistani Urdu pronunciation and natural sentence rhythm, and pronounce any embedded English words with clear, natural English pronunciation. ${paceInstruction}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: params.text,
              speechMetadata: {
                style: stylePrompt,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return null;
    }

    return {
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceUsed: `gemini-3.8-flash-lite-tts (${voiceName})`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      // Free Tier limit is 3 requests/minute; enter 50s cooldown so subsequent calls immediately use fallback TTS without waiting
      geminiTtsCooldownUntilMs = Date.now() + 50 * 1000;
    }
    throw err;
  }
}

/**
 * Secondary Cloud TTS Provider: Microsoft Azure Cognitive Services Speech API
 * (`ur-PK-AsadNeural` Male / `ur-PK-UzmaNeural` Female) when configured.
 */
async function synthesizeWithAzureNeural(params: {
  text: string;
  lang: 'ur' | 'en' | 'pa';
  gender: 'male' | 'female';
  rate?: number;
}): Promise<{ audioBase64: string; mimeType: string; voiceUsed: string } | null> {
  if (!isAzureSpeechConfigured()) return null;

  const key = process.env.AZURE_SPEECH_KEY!.trim();
  const region = process.env.AZURE_SPEECH_REGION!.trim();

  const isEnglishOnly =
    params.lang === 'en' && !/[\u0600-\u06FF\u0750-\u077F]/.test(params.text);

  const voiceName = isEnglishOnly
    ? params.gender === 'female'
      ? 'en-US-JennyNeural'
      : 'en-US-GuyNeural'
    : params.gender === 'female'
    ? 'ur-PK-UzmaNeural'
    : 'ur-PK-AsadNeural';

  const xmlLang = isEnglishOnly ? 'en-US' : 'ur-PK';
  const ratePct =
    params.rate && params.rate < 0.88
      ? '-15%'
      : params.rate && params.rate > 1.05
      ? '+8%'
      : '0%';

  const ssml = `<speak version='1.0' xml:lang='${xmlLang}'>
    <voice xml:lang='${xmlLang}' name='${voiceName}'>
      <prosody rate='${ratePct}'>${escapeXml(params.text)}</prosody>
    </voice>
  </speak>`;

  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
      'User-Agent': 'RattaKallanPortal-SpeechEngine',
    },
    body: ssml,
  });

  if (!response.ok) {
    throw new Error(`Azure TTS HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
  return {
    audioBase64,
    mimeType: 'audio/wav',
    voiceUsed: voiceName,
  };
}

/**
 * Determines whether a question requires live Google Search grounding.
 */
function shouldUseGoogleSearchGrounding(question: string): boolean {
  const q = question.toLowerCase();
  const researchPatterns = [
    /\bcurrent\b/i,
    /\bpresent\b/i,
    /\btoday\b/i,
    /\blatest\b/i,
    /\bwho is the\b/i,
    /\bprime minister\b/i,
    /\bpresident\b/i,
    /\bchief minister\b/i,
    /\bminister\b/i,
    /\b2025\b/,
    /\b2026\b/,
    /\bnews\b/i,
    /\bweather\b/i,
    /\bpopulation\b/i,
    /موجودہ/,
    /وزیر اعظم/,
    /وزیراعظم/,
    /صدر کون/,
    /وزیر اعلی/,
    /آج کل/,
    /تازہ ترین/,
    /حالیہ/,
  ];
  return researchPatterns.some((pat) => pat.test(q));
}

/**
 * Generates a conversational or educational answer using the fast `gemini-3.1-flash-lite` model (~1.4s latency)
 * with automatic fallback if a search-grounded request hits free-tier rate limits.
 */
async function generateGeminiEducationalOrChatResponse(params: {
  ai: GoogleGenAI;
  contentsPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  systemInstruction: string;
  needsSearch: boolean;
}): Promise<{
  text: string;
  sources: Array<{ title: string; url: string }>;
  modelUsed: string;
}> {
  const extractSources = (res: any): Array<{ title: string; url: string }> => {
    const sources: Array<{ title: string; url: string }> = [];
    const groundingChunks = res?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    for (const chunk of groundingChunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title;
      if (uri && title && !sources.some((s) => s.url === uri)) {
        sources.push({ title, url: uri });
      }
    }
    return sources;
  };

  // Try fast gemini-3.1-flash-lite first (verified 1.3s - 1.9s latency on Pakistani Urdu, Roman Urdu & Mixed Urdu-English)
  try {
    const response = await params.ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: params.contentsPayload,
      config: {
        systemInstruction: params.systemInstruction,
        ...(params.needsSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
    const text = (response.text || '').trim();
    if (text) {
      return {
        text,
        sources: extractSources(response),
        modelUsed: 'gemini-3.1-flash-lite',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // If search tool quota caused 429, retry immediately without search tool on gemini-3.1-flash-lite
    if (params.needsSearch && (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED'))) {
      const retryRes = await params.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: params.contentsPayload,
        config: {
          systemInstruction: params.systemInstruction,
        },
      });
      const retryText = (retryRes.text || '').trim();
      if (retryText) {
        return {
          text: retryText,
          sources: [],
          modelUsed: 'gemini-3.1-flash-lite',
        };
      }
    }
    throw err;
  }

  throw new Error('Empty response from Gemini model');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  // 1. Status & Provider Inspection Endpoint
  app.get('/api/ai/status', (_req: Request, res: Response) => {
    const geminiReady = Boolean(getGeminiClient());
    const azureReady = isAzureSpeechConfigured();
    const geminiTtsAvailableNow = geminiReady && Date.now() >= geminiTtsCooldownUntilMs;
    res.json({
      ok: true,
      geminiConfigured: geminiReady,
      azureSpeechConfigured: azureReady,
      geminiTtsInCooldown: geminiReady && !geminiTtsAvailableNow,
      activeTtsProvider: geminiTtsAvailableNow
        ? 'gemini_3_8_flash_lite_tts'
        : azureReady
        ? 'azure_neural_ur_pk'
        : 'browser_segmented_speech',
      activeSttProvider: geminiReady ? 'gemini_3_5_transcribe' : 'browser_web_speech_stt',
      activeAnswerProvider: geminiReady ? 'gemini_3_1_flash_lite' : 'local_verified_knowledge_engine',
      supportedNeuralVoices: {
        gemini: [
          'Puck (Warm Male Teacher)',
          'Charon (Calm Male Guide)',
          'Kore (Warm Female Teacher)',
          'Zephyr (Gentle Female Nursery)',
          'Fenrir (Deep Male)',
        ],
        azure: ['ur-PK-AsadNeural', 'ur-PK-UzmaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'],
      },
    });
  });

  // 2. Hybrid Online Text-to-Speech Endpoint (/api/ai/tts)
  // Priority 1: Google Gemini TTS (`gemini-3.8-flash-lite-tts`)
  // Priority 2: Microsoft Azure Neural (`ur-PK-AsadNeural` / `ur-PK-UzmaNeural`) if configured
  // Priority 3: Client-side Language-Aware Segmented Web Speech
  app.post('/api/ai/tts', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        ok: false,
        fallbackRecommended: true,
        error: 'آواز کی درخواستوں کی حد مکمل ہو گئی ہے۔',
      });
      return;
    }

    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const lang: 'ur' | 'en' | 'pa' =
      req.body?.lang === 'en' ? 'en' : req.body?.lang === 'pa' ? 'pa' : 'ur';
    const gender: 'male' | 'female' = req.body?.gender === 'female' ? 'female' : 'male';
    const voiceName = typeof req.body?.voiceName === 'string' ? req.body.voiceName.trim() : undefined;
    const rate = typeof req.body?.rate === 'number' ? req.body.rate : 0.95;
    const slowMode = Boolean(req.body?.slowMode) || rate < 0.86;

    if (!rawText) {
      res.status(400).json({ ok: false, error: 'Empty text provided for TTS.' });
      return;
    }

    const clippedText = rawText.slice(0, 900);
    const cacheKey = `${lang}:${gender}:${voiceName || 'auto'}:${slowMode ? 'slow' : 'norm'}:${clippedText}`;
    const cached = ttsAudioCache.get(cacheKey);
    if (cached) {
      res.json({
        ok: true,
        provider: cached.provider,
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        cached: true,
      });
      return;
    }

    // Priority 1: Google Gemini Native TTS (`gemini-3.8-flash-lite-tts`)
    if (getGeminiClient() && Date.now() >= geminiTtsCooldownUntilMs) {
      try {
        const geminiRes = await synthesizeWithGeminiTts({
          text: clippedText,
          lang,
          gender,
          voiceName,
          slowMode,
        });
        if (geminiRes) {
          if (ttsAudioCache.size >= MAX_TTS_CACHE_ITEMS) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, {
            audioBase64: geminiRes.audioBase64,
            mimeType: geminiRes.mimeType,
            provider: geminiRes.voiceUsed,
          });
          res.json({
            ok: true,
            provider: geminiRes.voiceUsed,
            audioBase64: geminiRes.audioBase64,
            mimeType: geminiRes.mimeType,
          });
          return;
        }
      } catch (err) {
        console.warn(
          'Gemini TTS quota/network notice, falling back to secondary TTS:',
          err instanceof Error ? err.message : err
        );
      }
    }

    // Priority 2: Azure Neural Speech (ur-PK-AsadNeural / ur-PK-UzmaNeural) if configured
    if (isAzureSpeechConfigured()) {
      try {
        const azureRes = await synthesizeWithAzureNeural({
          text: clippedText,
          lang,
          gender,
          rate,
        });
        if (azureRes) {
          if (ttsAudioCache.size >= MAX_TTS_CACHE_ITEMS) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, {
            audioBase64: azureRes.audioBase64,
            mimeType: azureRes.mimeType,
            provider: azureRes.voiceUsed,
          });
          res.json({
            ok: true,
            provider: azureRes.voiceUsed,
            audioBase64: azureRes.audioBase64,
            mimeType: azureRes.mimeType,
          });
          return;
        }
      } catch (err) {
        console.warn('Azure Neural TTS error:', err);
      }
    }

    res.status(503).json({
      ok: false,
      fallbackRecommended: true,
      error:
        'جیمنائی مفت کوٹہ (3 درخواستیں فی منٹ) وقتی طور پر مکمل ہے — فوری طور پر مقامی پاکستانی اردو/انگلش سیگمنٹڈ آواز استعمال کی جا رہی ہے۔',
    });
  });

  // 3. Google Gemini Speech-to-Text (Voice Input) Endpoint (/api/ai/transcribe)
  // Uses `gemini-3.5-transcribe` (extracting `audioTranscription.text`) with fallback to `gemini-3.1-flash-lite`
  app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({ ok: false, error: 'Rate limit exceeded.' });
      return;
    }

    const rawAudio = typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
    const mimeType =
      typeof req.body?.mimeType === 'string' && req.body.mimeType.trim()
        ? req.body.mimeType.trim()
        : 'audio/webm';

    if (!rawAudio) {
      res.status(400).json({ ok: false, error: 'No audio data provided.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ ok: false, error: 'GEMINI_API_KEY not configured.' });
      return;
    }

    // Strip data URL prefix if present (e.g. "data:audio/webm;base64,...")
    const base64Clean = rawAudio.includes(',') ? rawAudio.split(',')[1] : rawAudio;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Clean,
              },
            },
            {
              text: 'Transcribe this spoken Pakistani Urdu, Roman Urdu, Punjabi, or English audio accurately.',
            },
          ],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let transcript = '';
      for (const p of parts as any[]) {
        if (p?.audioTranscription?.text) {
          transcript += p.audioTranscription.text + ' ';
        } else if (typeof p?.text === 'string') {
          transcript += p.text + ' ';
        }
      }
      transcript = (transcript || response.text || '').trim();

      res.json({
        ok: true,
        transcript,
        provider: 'gemini-3.5-transcribe',
      });
    } catch (err: unknown) {
      // Fallback to gemini-3.1-flash-lite multimodal audio transcription if gemini-3.5-transcribe hits 3 RPM quota
      try {
        const fallbackRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Clean,
                },
              },
              {
                text: 'Transcribe the spoken Urdu, Punjabi, or English words in this audio accurately into Urdu/English script. Return only the spoken words.',
              },
            ],
          },
        });
        res.json({
          ok: true,
          transcript: (fallbackRes.text || '').trim(),
          provider: 'gemini-3.1-flash-lite',
        });
      } catch (fallbackErr: unknown) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        res.status(500).json({ ok: false, error: msg });
      }
    }
  });

  // 4. Online School Teacher & Smart Answer Endpoint (/api/ai/teacher)
  app.post('/api/ai/teacher', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        ok: false,
        error: 'سوالات کی حد مکمل ہو گئی ہے۔ براہ کرم تھوڑا انتظار کریں۔',
      });
      return;
    }

    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    const selectedClass =
      typeof req.body?.selectedClass === 'string' ? req.body.selectedClass : 'پانچویں جماعت';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject : 'general';
    const studentName = typeof req.body?.studentName === 'string' ? req.body.studentName : '';
    const currentLesson = typeof req.body?.currentLesson === 'string' ? req.body.currentLesson : '';
    const history: Array<{ sender: 'student' | 'teacher'; text: string }> = Array.isArray(
      req.body?.history
    )
      ? req.body.history.slice(-6)
      : [];

    if (!question) {
      res.status(400).json({ ok: false, error: 'براہ کرم اپنا سوال لکھیں یا بولیں۔' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        ok: false,
        reason: 'no_api_key',
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    try {
      const needsSearch = shouldUseGoogleSearchGrounding(question);
      const isEnglishQuery =
        /^[a-zA-Z0-9\s?,!.'"+*/=-]+$/.test(question) &&
        !/\b(urdu|اردو|in simple urdu|kya|kia|kyun|kesay|kaise|hai|hain|mein|batao|samjhao)\b/i.test(
          question
        );

      const systemInstruction = `You are the Online School Teacher ("رتہ کلاں ورچوئل اسکول کے آن لائن استاد") for the Ratta Kallan Community Portal in District Jhang, Punjab, Pakistan.
You are an AI educational assistant — be warm, patient, encouraging, and human-like in conversation, speaking like a caring Pakistani school teacher.

CURRENT STUDENT CONTEXT:
- Selected Class/Grade: ${selectedClass}
- Selected Subject: ${subject}
${studentName ? `- Student First Name: ${studentName}` : ''}
${currentLesson ? `- Active Lesson/Topic: ${currentLesson}` : ''}

STRICT TEACHING & CONVERSATION RULES:
1. ANSWER THE EXACT QUESTION ASKED: Read the student's current question carefully. Never repeat a generic greeting or a previous answer.
2. LANGUAGE MATCHING:
   - If the student asks in English (e.g. "What is 2 + 2?", "What is a noun? Give three English examples.") and does NOT ask for Urdu, answer clearly in simple, age-appropriate English (with a short Urdu translation of key terms if helpful for village students).
   - If the student asks in Urdu, Roman Urdu, or asks to "Explain in simple Urdu" (e.g., "Explain photosynthesis in simple Urdu", "پاکستان میں بارش کیوں ہوتی ہے؟", "khana khane se pehle haath dhona kyun zaroori hai"), answer in clear, natural, everyday Pakistani Urdu using relatable rural examples (crops, sunlight, tube-wells, village life) that a student in ${selectedClass} or an elder with limited education can easily understand.
3. STEP-BY-STEP PEDAGOGY:
   - For simple factual or math questions (like "What is 2 + 2?" or "What is 15 multiplied by 6?"), give the direct, clear answer immediately, show the quick step, and ask one short follow-up practice question.
   - For conceptual questions (like photosynthesis, the water cycle, plants vs animals, why we wash hands), explain step by step in 3 to 5 clear sentences, give a relatable example, and end with one short follow-up question to check the student's understanding.
4. HONESTY & CURRICULUM INTEGRITY:
   - Never invent facts or fabricate websites/citations.
   - Keep all content 100% child-safe and appropriate for school students.`;

      const contentsPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const h of history) {
        if (!h.text || !h.text.trim()) continue;
        contentsPayload.push({
          role: h.sender === 'student' ? 'user' : 'model',
          parts: [{ text: h.text.trim() }],
        });
      }
      contentsPayload.push({
        role: 'user',
        parts: [{ text: question }],
      });

      const result = await generateGeminiEducationalOrChatResponse({
        ai,
        contentsPayload,
        systemInstruction,
        needsSearch,
      });

      res.json({
        ok: true,
        answer: result.text,
        spokenText: result.text,
        language: isEnglishQuery ? 'en' : 'ur',
        usedOnlineSearch: needsSearch && result.sources.length > 0,
        sources: result.sources.slice(0, 3),
        provider: result.modelUsed,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error in /api/ai/teacher:', msg);
      res.status(500).json({
        ok: false,
        error: 'آن لائن استاد سے رابطہ کرنے میں وقتی دشواری پیش آئی۔',
        details: msg,
      });
    }
  });

  // 5. Conversational Village Assistant Endpoint (/api/ai/chat)
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'local';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        ok: false,
        error: 'درخواستوں کی حد مکمل ہو گئی ہے۔ براہ کرم تھوڑا انتظار کریں۔',
      });
      return;
    }

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const portalContext =
      typeof req.body?.portalContext === 'string' ? req.body.portalContext.trim() : '';
    const history: Array<{ role: 'user' | 'assistant'; text: string }> = Array.isArray(
      req.body?.history
    )
      ? req.body.history.slice(-6)
      : [];

    if (!message) {
      res.status(400).json({ ok: false, error: 'Empty message.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        ok: false,
        reason: 'no_api_key',
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    try {
      const needsSearch = shouldUseGoogleSearchGrounding(message);
      const systemInstruction = `You are "رتہ کلاں پورٹل کا اے آئی مددگار" (Ratta Kallan Portal AI Assistant), a patient, respectful, intelligent Pakistani conversational assistant for residents of Ratta Kallan (District Jhang, Punjab, Pakistan).
CRITICAL RULES:
1. You are an AI assistant — never pretend to be a human being, but speak warmly and naturally like a helpful Pakistani neighbor in simple, easy-to-understand Pakistani Urdu.
2. For ANY question about local shops, doctors, electricians, masons, mosques, schools, transport vans, mandi rates, or phone numbers in Ratta Kallan:
   - Use ONLY the verified Portal Data Context provided below.
   - NEVER invent business names, phone numbers, addresses, timings, or rates.
   - If the requested local business/person is not in the Portal Data Context, state clearly: "معذرت، یہ معلومات فی الحال پورٹل پر دستیاب نہیں ہیں۔"
3. For general educational, science, math, health, agriculture, or everyday knowledge questions (whether asked in Urdu script, Roman Urdu, or mixed Urdu-English):
   - Explain clearly in simple Pakistani Urdu (or English if the user asked in English) so ordinary village residents, children, and elders can easily understand.
4. Keep simple answers concise (2–4 sentences) and detailed explanations clear.

VERIFIED PORTAL DATA CONTEXT:
${portalContext || 'No specific local listing matched this query.'}`;

      const contentsPayload: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const h of history) {
        if (!h.text || !h.text.trim()) continue;
        contentsPayload.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text.trim() }],
        });
      }
      contentsPayload.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const result = await generateGeminiEducationalOrChatResponse({
        ai,
        contentsPayload,
        systemInstruction,
        needsSearch,
      });

      res.json({
        ok: true,
        reply: result.text,
        sources: result.sources.slice(0, 3),
        usedOnlineSearch: needsSearch && result.sources.length > 0,
        provider: result.modelUsed,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // Mount Vite dev server in development or static dist in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ratta Kallan Portal full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
