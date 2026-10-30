import {
  resolveEducationalQuestionLocally,
  StructuredTeacherResponse,
  EducationalSourceCitation,
} from './aiKnowledgeEngine';
import { SubjectKey, Language } from '../types';

export interface AskTeacherOptions {
  question: string;
  selectedClass: string;
  subject?: SubjectKey;
  studentId?: string;
  studentName?: string;
  currentLesson?: string;
  history?: Array<{ sender: 'student' | 'teacher'; text: string }>;
}

/**
 * Full-featured Online School Teacher & Smart Answer Engine client service.
 * 1. Calls the secure backend `/api/ai/teacher` (`gemini-3.8-flash` + Google Search grounding when needed).
 * 2. Never exposes API keys in client-side code.
 * 3. Uses the verified curriculum & math solver when offline or for instant deterministic verification,
 *    and NEVER returns a repeated generic fallback paragraph!
 */
export async function askOnlineTeacherDetailed(
  options: AskTeacherOptions
): Promise<StructuredTeacherResponse> {
  const cleanQ = (options.question || '').trim();
  const subject: SubjectKey = options.subject || 'general';

  if (!cleanQ) {
    return resolveEducationalQuestionLocally({
      question: '',
      selectedClass: options.selectedClass,
      subject,
      studentName: options.studentName,
    });
  }

  // First check if running in browser environment where `/api/ai/teacher` is reachable
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const response = await fetch('/api/ai/teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: cleanQ,
          selectedClass: options.selectedClass,
          subject,
          studentId: options.studentId || 'guest',
          studentName: options.studentName || '',
          currentLesson: options.currentLesson || '',
          history: (options.history || []).slice(-6),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.ok && typeof data.answer === 'string' && data.answer.trim()) {
          const sources: EducationalSourceCitation[] = Array.isArray(data.sources)
            ? data.sources
            : [];
          const lang: Language = data.language === 'en' ? 'en' : 'ur';
          return {
            ok: true,
            question: cleanQ,
            detectedSubject: subject,
            language: lang,
            answer: data.answer.trim(),
            spokenText: (data.spokenText || data.answer).trim(),
            sources,
            usedOnlineSearch: Boolean(data.usedOnlineSearch),
            provider: 'gemini-3.8-flash',
          };
        }
      }
    } catch {
      // Network or server offline — fall through to verified curriculum engine
    }
  }

  // Fallback to verified local curriculum & arithmetic solver (which never returns fake generic answers)
  return resolveEducationalQuestionLocally({
    question: cleanQ,
    selectedClass: options.selectedClass,
    subject,
    studentName: options.studentName,
    history: options.history,
  });
}

/**
 * Backwards-compatible helper returning the teacher's answer string.
 */
export async function askSirAshraf(
  question: string,
  selectedClass: string,
  subject: SubjectKey = 'general'
): Promise<string> {
  const res = await askOnlineTeacherDetailed({
    question,
    selectedClass,
    subject,
  });
  return res.answer;
}
