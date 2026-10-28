import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Mic,
  Square,
  Play,
  Pause,
  Send,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Zap,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Clock,
} from 'lucide-react';
import { VillageProfile, VillageMessage, Language, AuthUserSession } from '../types';
import { translations } from '../data/translations';
import { AudioVoiceRecorder } from '../utils/speech';
import { compressImageFile } from '../firebase/firestoreService';

interface LeaveMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: VillageProfile | null;
  onSendMessage: (
    message: Omit<VillageMessage, 'id' | 'createdAt' | 'isRead'>
  ) => Promise<boolean> | boolean | void;
  defaultSenderName?: string;
  defaultSenderMobile?: string;
  activeSession?: AuthUserSession | null;
  lang: Language;
}

export const LeaveMessageModal: React.FC<LeaveMessageModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onSendMessage,
  defaultSenderName = '',
  defaultSenderMobile = '',
  activeSession,
  lang,
}) => {
  const t = translations[lang];

  const [senderName, setSenderName] = useState(
    activeSession?.name || defaultSenderName
  );
  const [senderMobile, setSenderMobile] = useState(defaultSenderMobile);

  React.useEffect(() => {
    if (activeSession?.name && !senderName) {
      setSenderName(activeSession.name);
    } else if (defaultSenderName && !senderName) {
      setSenderName(defaultSenderName);
    }
    if (defaultSenderMobile && !senderMobile) {
      setSenderMobile(defaultSenderMobile);
    }
  }, [defaultSenderName, defaultSenderMobile, activeSession]);

  const [messageText, setMessageText] = useState('');
  const [inquiryType, setInquiryType] = useState<VillageMessage['inquiryType']>('charges');

  // Photo / Document Attachment
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [isCompressingImg, setIsCompressingImg] = useState(false);

  // Audio voice note recording
  const [recorder, setRecorder] = useState<AudioVoiceRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{
    base64Audio: string;
    durationEstimate: number;
  } | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sendFailed, setSendFailed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen || !targetProfile) return null;

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingImg(true);
    try {
      const compressedBlob = await compressImageFile(file, 1200, 0.7);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(compressedBlob);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingImg(false);
    }
  };

  const handleStartAudioRecord = async () => {
    setErrorMsg('');
    const rec = new AudioVoiceRecorder();
    const started = await rec.start();
    if (started) {
      setRecorder(rec);
      setIsRecording(true);
    } else {
      setErrorMsg('مائیکروفون شروع نہیں ہو سکا۔ براؤزر کی پرمیشن چیک کریں۔');
    }
  };

  const handleStopAudioRecord = async () => {
    if (!recorder) return;
    try {
      const result = await recorder.stop();
      setIsRecording(false);
      setRecordedAudio({
        base64Audio: result.base64Audio,
        durationEstimate: result.durationEstimate,
      });
      setRecorder(null);
    } catch (err) {
      console.error('Error stopping recording:', err);
      setIsRecording(false);
    }
  };

  const handlePlayRecordedAudio = () => {
    if (!recordedAudio) return;

    if (isPlayingRecorded && audioElement) {
      audioElement.pause();
      setIsPlayingRecorded(false);
      return;
    }

    const audio = new Audio(recordedAudio.base64Audio);
    setAudioElement(audio);
    setIsPlayingRecorded(true);

    audio.onended = () => {
      setIsPlayingRecorded(false);
    };
    audio.onerror = () => {
      setIsPlayingRecorded(false);
    };

    audio.play();
  };

  const executeSend = async () => {
    if (isSending) return;
    setErrorMsg('');
    setSendFailed(false);

    if (!senderName.trim()) {
      setErrorMsg('براہ کرم اپنا نام درج کریں۔');
      return;
    }

    if (!senderMobile.trim() || senderMobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('درست موبائل نمبر درج کریں تاکہ کاریگر آپ کو واپس رابطہ کر سکے۔');
      return;
    }

    if (!messageText.trim() && !recordedAudio && !attachmentUrl) {
      setErrorMsg('براہ کرم پیغام لکھیں یا نیچے سے وائس نوٹ ریکارڈ کریں۔');
      return;
    }

    setIsSending(true);
    try {
      const result = await onSendMessage({
        targetProfileId: targetProfile.id,
        targetProfileName: targetProfile.name,
        targetMobile: targetProfile.mobile,
        senderUid: activeSession?.uid,
        recipientUid: targetProfile.ownerUid,
        senderProfileId: activeSession?.profileId,
        senderUsername: activeSession?.username,
        senderName: senderName.trim(),
        senderMobile: senderMobile.trim(),
        messageText:
          messageText.trim() ||
          (attachmentUrl ? 'منسلک تصویر / دستاویز' : 'وائس میسج (صوتی پیغام)'),
        audioData: recordedAudio?.base64Audio,
        audioDurationSeconds: recordedAudio?.durationEstimate,
        attachmentUrl: attachmentUrl || undefined,
        attachmentType: attachmentUrl ? 'image' : undefined,
        inquiryType,
        discussionThread: [],
      });

      if (result === false) {
        setSendFailed(true);
        setErrorMsg(
          'انٹرنیٹ یا سرور کے مسئلے کی وجہ سے پیغام ارسال نہیں ہو سکا۔ آپ کا لکھا ہوا پیغام محفوظ ہے، براہ کرم دوبارہ کوشش کریں۔'
        );
        setIsSending(false);
        return;
      }

      setIsSending(false);
      setMessageText('');
      setAttachmentUrl('');
      setRecordedAudio(null);
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        onClose();
      }, 1500);
    } catch {
      setIsSending(false);
      setSendFailed(true);
      setErrorMsg(
        'پیغام بھیجتے وقت تکنیکی خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSend();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl">
              <MessageSquare className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold font-nastaliq text-lg">
                پیغام چھوڑیں برائے {targetProfile.name}
              </h3>
              <p className="text-xs text-emerald-200">
                {targetProfile.businessName} — رتہ کلاں جھنگ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-full bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 text-amber-950 text-xs font-nastaliq flex items-center gap-2">
          <span className="text-base shrink-0">🔒</span>
          <span>
            یہ پیغام سیدھا <strong>{targetProfile.name}</strong> کے ذاتی پروفائل ان باکس میں پہنچے گا۔ وہ لاگ ان کر کے خفیہ بات چیت (2-Way Private Discussion) کر سکتے ہیں۔
          </span>
        </div>

        {successNotice ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Send className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold font-nastaliq text-emerald-800">
              پیغام کامیابی سے بھیج دیا گیا!
            </h4>
            <p className="text-sm text-stone-600">
              {targetProfile.name} جب پورٹل چیک کریں گے تو ان کو آپ کا میسج مل جائے گا۔
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {sendFailed && (
                  <button
                    type="button"
                    onClick={() => void executeSend()}
                    disabled={isSending}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 cursor-pointer transition"
                  >
                    ↻ دوبارہ کوشش کریں (Retry)
                  </button>
                )}
              </div>
            )}

            {/* Inquiry Type Chips */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                {t.inquiryTypePrompt}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setInquiryType('charges')}
                  className={`p-2 rounded-xl border flex items-center gap-2 font-semibold transition ${
                    inquiryType === 'charges'
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.inquiryRate}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('availability')}
                  className={`p-2 rounded-xl border flex items-center gap-2 font-semibold transition ${
                    inquiryType === 'availability'
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.inquiryAvail}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('urgent_work')}
                  className={`p-2 rounded-xl border flex items-center gap-2 font-semibold transition ${
                    inquiryType === 'urgent_work'
                      ? 'bg-red-100 border-red-600 text-red-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                  <span>{t.inquiryUrgent}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('general')}
                  className={`p-2 rounded-xl border flex items-center gap-2 font-semibold transition ${
                    inquiryType === 'general'
                      ? 'bg-blue-100 border-blue-600 text-blue-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.inquiryGeneral}</span>
                </button>
              </div>
            </div>

            {/* Sender Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.senderName} *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="مثلاً: احمد رضا"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.senderMobile} *
                </label>
                <input
                  type="tel"
                  value={senderMobile}
                  onChange={(e) => setSenderMobile(e.target.value)}
                  placeholder="0300-XXXXXXX"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Written Message */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {t.messageContent}
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="مثلاً: السلام علیکم استاد جی! مجھے کل صبح کے لیے ٹریکٹر کی ضرورت ہے۔ کیا آپ فارغ ہیں؟ ریٹ کیا لیں گے؟"
                rows={3}
                className="w-full rounded-xl border border-stone-300 p-3 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Photo / Attachment Option */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-emerald-50 text-stone-700 text-xs font-semibold transition">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{attachmentUrl ? 'تصویر تبدیل کریں' : 'تصویر یا رسید منسلک کریں (Photo/Receipt)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                </label>
                {isCompressingImg && (
                  <span className="text-[11px] text-emerald-600 animate-pulse font-medium">تصویر کمپریس ہو رہی ہے...</span>
                )}
              </div>

              {/* Attachment Preview */}
              {attachmentUrl && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={attachmentUrl}
                    alt="منسلکہ پیش نظارہ"
                    className="h-24 w-auto rounded-xl border-2 border-emerald-500 object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl('')}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                    title="تصویر ہٹائیں"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Audio Voice Note Section (for non-readers / village convenience) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-700" />
                  <span>آواز کا پیغام (Voice Note - اگر لکھنا نہ آتا ہو):</span>
                </span>
                {isRecording && (
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    <span>ریکارڈ ہو رہا ہے...</span>
                  </span>
                )}
              </div>

              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopAudioRecord}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow animate-voice-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>{t.stopRecording} (مکمل کریں)</span>
                </button>
              ) : recordedAudio ? (
                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-emerald-300">
                  <button
                    type="button"
                    onClick={handlePlayRecordedAudio}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition"
                  >
                    {isPlayingRecorded ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>رکیں</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>سنیں ({recordedAudio.durationEstimate}s)</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-stone-600">وائس نوٹ تیار ہے</span>
                  <button
                    type="button"
                    onClick={() => setRecordedAudio(null)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    ختم کریں
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartAudioRecord}
                  className="w-full py-2 px-4 rounded-xl bg-white border border-emerald-400 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Mic className="w-4 h-4 text-emerald-700" />
                  <span>مائیکروفون سے بول کر پیغام ریکارڈ کریں</span>
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'بھیجا جا رہا ہے...' : t.sendDirectMessage}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
