import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Phone,
  Play,
  Pause,
  MessageCircle,
  Calendar,
  Send,
  Trash2,
  Lock,
  CheckCircle,
  ShieldCheck,
  Mic,
  Square,
  User,
  Inbox,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Clock,
  LogIn,
} from 'lucide-react';
import {
  VillageMessage,
  Language,
  AuthUserSession,
  VillageProfile,
  ChatDiscussionItem,
} from '../types';
import { translations } from '../data/translations';
import { AudioVoiceRecorder } from '../utils/speech';

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: VillageMessage[];
  onReplyDiscussion?: (
    messageId: string,
    replyText: string,
    audioData?: string,
    audioDuration?: number
  ) => void;
  onReply?: (messageId: string, replyText: string) => void;
  onDeleteMessageForUser?: (messageId: string, role: 'sender' | 'receiver') => void;
  onAdminDeleteMessage?: (messageId: string) => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  isAdmin?: boolean;
  activeSession?: AuthUserSession | null;
  profiles?: VillageProfile[];
  prefilledMobile?: string;
  onOpenLoginModal?: () => void;
  lang: Language;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  messages,
  onReplyDiscussion,
  onReply,
  onDeleteMessageForUser,
  onAdminDeleteMessage,
  onReportMessage,
  isAdmin = false,
  activeSession,
  profiles = [],
  prefilledMobile = '',
  onOpenLoginModal,
  lang,
}) => {
  const t = translations[lang];

  // Active view tab: 'received' | 'sent'
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  // Lookup state if not logged in
  const [lookupQuery, setLookupQuery] = useState(prefilledMobile);
  const [verifiedPhone, setVerifiedPhone] = useState(prefilledMobile);

  // Audio Playback state
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Per-message Reply text inputs
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  // Voice recording state for replies
  const [recordingMessageId, setRecordingMessageId] = useState<string | null>(null);
  const [recorder, setRecorder] = useState<AudioVoiceRecorder | null>(null);
  const [replyVoiceMap, setReplyVoiceMap] = useState<
    Record<string, { base64Audio: string; durationEstimate: number }>
  >({});
  const [playingVoiceKey, setPlayingVoiceKey] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledMobile) {
      setLookupQuery(prefilledMobile);
      setVerifiedPhone(prefilledMobile);
    }
  }, [prefilledMobile]);

  // Clean up audio on close
  useEffect(() => {
    if (!isOpen) {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      setActiveAudioId(null);
      if (recorder) {
        recorder.stop().catch(() => {});
        setRecorder(null);
      }
      setRecordingMessageId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine current user context
  const isSuperAdmin = isAdmin || activeSession?.type === 'admin';
  const sessionProfileId = activeSession?.profileId;
  const sessionMobile = activeSession?.mobile || verifiedPhone;

  // Normalization helper
  const cleanDigits = (s?: string) => (s ? s.replace(/\D/g, '') : '');

  // Filter messages based on authentication / lookup (Strictly sender or recipient only!)
  const receivedMessages = messages.filter((m) => {
    if (m.deletedByRecipient) return false;
    if (sessionProfileId && m.targetProfileId === sessionProfileId) return true;
    if (sessionMobile && cleanDigits(m.targetMobile) === cleanDigits(sessionMobile)) return true;
    return false;
  });

  const sentMessages = messages.filter((m) => {
    if (m.deletedBySender) return false;
    if (sessionProfileId && m.senderProfileId === sessionProfileId) return true;
    if (sessionMobile && cleanDigits(m.senderMobile) === cleanDigits(sessionMobile)) return true;
    return false;
  });

  const currentDisplayList = activeTab === 'sent' ? sentMessages : receivedMessages;

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupQuery.trim()) {
      setVerifiedPhone(lookupQuery.trim());
    }
  };

  const handlePlayVoice = (key: string, audioData: string) => {
    if (activeAudioId === key && audioPlayer) {
      audioPlayer.pause();
      setActiveAudioId(null);
      return;
    }

    if (audioPlayer) {
      audioPlayer.pause();
    }

    const audio = new Audio(audioData);
    setAudioPlayer(audio);
    setActiveAudioId(key);

    audio.onended = () => {
      setActiveAudioId(null);
    };
    audio.onerror = () => {
      setActiveAudioId(null);
    };

    audio.play();
  };

  // Start voice recording for reply
  const handleStartReplyVoice = async (msgId: string) => {
    try {
      const rec = new AudioVoiceRecorder();
      const started = await rec.start();
      if (started) {
        setRecorder(rec);
        setRecordingMessageId(msgId);
      } else {
        alert('مائیکروفون شروع نہیں ہو سکا۔ براؤزر کی پرمیشن چیک کریں۔');
      }
    } catch (e) {
      console.warn('Voice reply record error:', e);
    }
  };

  // Stop voice recording for reply
  const handleStopReplyVoice = async (msgId: string) => {
    if (!recorder) return;
    try {
      const result = await recorder.stop();
      setReplyVoiceMap((prev) => ({
        ...prev,
        [msgId]: {
          base64Audio: result.base64Audio,
          durationEstimate: result.durationEstimate,
        },
      }));
      setRecordingMessageId(null);
      setRecorder(null);
    } catch (e) {
      console.warn('Stop voice reply error:', e);
      setRecordingMessageId(null);
      setRecorder(null);
    }
  };

  // Submit reply (either text or voice or both)
  const handleSendDiscussionReply = (msg: VillageMessage) => {
    const text = (replyTextMap[msg.id] || '').trim();
    const voice = replyVoiceMap[msg.id];

    if (!text && !voice) {
      alert('براہ کرم جواب کا متن لکھیں یا وائس ریکارڈ کریں۔');
      return;
    }

    if (onReplyDiscussion) {
      onReplyDiscussion(
        msg.id,
        text || 'وائس جواب (صوتی پیغام)',
        voice?.base64Audio,
        voice?.durationEstimate
      );
    } else if (onReply && text) {
      onReply(msg.id, text);
    }

    // Reset inputs for this message
    setReplyTextMap((prev) => ({ ...prev, [msg.id]: '' }));
    setReplyVoiceMap((prev) => {
      const copy = { ...prev };
      delete copy[msg.id];
      return copy;
    });
  };

  // Soft delete message with Super Admin Vault audit assurance
  const handleDeleteForUser = (msg: VillageMessage) => {
    const isSender =
      (sessionProfileId && msg.senderProfileId === sessionProfileId) ||
      (sessionMobile && cleanDigits(msg.senderMobile) === cleanDigits(sessionMobile));
    const role: 'sender' | 'receiver' = isSender ? 'sender' : 'receiver';

    const confirmMsg =
      'کیا آپ واقعی یہ پیغام اپنے ان باکس سے ہٹانا چاہتے ہیں؟\n\n' +
      'نوٹ: ریکارڈ کے تحفظ کے لیے اس پیغام اور گفتگو کی نقل سپر ایڈمن ثمر سعید کے پاس محفوظ رہے گی۔';

    if (window.confirm(confirmMsg)) {
      if (onDeleteMessageForUser) {
        onDeleteMessageForUser(msg.id, role);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-nastaliq text-base sm:text-lg">
                  رتہ کلاں محفوظ ان باکس و گفتگو (Village Inbox)
                </h3>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full font-mono">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200 font-nastaliq">
                صرف بھیجنے اور وصول کرنے والے کے درمیان 2-طرفہ خفیہ رابطہ | ایڈمن آڈٹ شدہ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white rounded-full bg-black/20 hover:bg-black/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Ribbon */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-nastaliq">
          {activeSession ? (
            <div className="flex items-center gap-2 text-emerald-950">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span>
                آپ لاگ ان ہیں بطور: <strong>{activeSession.name}</strong> ({activeSession.username})
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                {activeSession.type === 'admin' ? 'سپر ایڈمن' : 'پروفائل اونر'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="flex items-center gap-2 text-stone-700">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>اپنے ذاتی پروفائل کے پیغامات دیکھنے کے لیے لاگ ان کریں یا نمبر درج کریں</span>
              </div>
              {onOpenLoginModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLoginModal();
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>پاس ورڈ سے لاگ ان کریں</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Selector & Lookup Box */}
        <div className="bg-stone-100 border-b border-stone-200 p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 font-nastaliq">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'received'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>موصول شدہ پیغامات ({receivedMessages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>میرے بھیجے گئے ({sentMessages.length})</span>
            </button>
          </div>

          {/* Quick Lookup by Mobile if user wants to switch phone or is unauthenticated */}
          {!activeSession && (
            <form onSubmit={handleManualLookup} className="flex items-center gap-1.5 text-xs">
              <input
                type="text"
                placeholder="موبائل نمبر 0300-XXXXXXX"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="px-2.5 py-1 rounded-xl border border-stone-300 bg-white font-mono text-xs focus:ring-1 focus:ring-emerald-600 outline-none w-36 sm:w-44"
                dir="ltr"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold cursor-pointer transition"
              >
                تلاش
              </button>
            </form>
          )}
        </div>

        {/* Message Cards Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 font-nastaliq">
          {!activeSession && !verifiedPhone ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-stone-800 text-sm sm:text-base">
                اپنا موبائل نمبر درج کریں یا لاگ ان کریں
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                گاؤں کی پروفائل یا دکان سے متعلق تمام موصول شدہ و بھیجے گئے پیغامات دیکھنے کے لیے اوپر اپنا موبائل نمبر لکھیں، یا پاس ورڈ کے ذریعے لاگ ان ہوں۔
              </p>
              {onOpenLoginModal && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLoginModal();
                    }}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
                  >
                    پروفائل لاگ ان کھولیں
                  </button>
                </div>
              )}
            </div>
          ) : currentDisplayList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-stone-700">
                {activeTab === 'sent'
                  ? 'آپ نے ابھی تک کوئی پیغام نہیں بھیجا۔'
                  : 'اس وقت کوئی پیغام موصول نہیں ہوا ہے۔'}
              </p>
              <p className="text-xs text-stone-400">
                جب کوئی گاؤں کا شہری آپ سے رابطہ کرے گا، پیغام اور وائس نوٹ یہاں نظر آئے گا۔
              </p>
            </div>
          ) : (
            currentDisplayList.map((msg) => {
              const isSender =
                (sessionProfileId && msg.senderProfileId === sessionProfileId) ||
                (sessionMobile && cleanDigits(msg.senderMobile) === cleanDigits(sessionMobile));
              const isReceiver =
                (sessionProfileId && msg.targetProfileId === sessionProfileId) ||
                (sessionMobile && cleanDigits(msg.targetMobile) === cleanDigits(sessionMobile));

              const isRecordingThis = recordingMessageId === msg.id;
              const pendingVoice = replyVoiceMap[msg.id];

              return (
                <div
                  key={msg.id}
                  className="bg-stone-50 border border-stone-200 rounded-3xl p-3.5 sm:p-4 shadow-sm space-y-3 transition hover:shadow-md"
                >
                  {/* Top Bar: Sender / Recipient / Timestamp / Inquiry Type */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-stone-900">
                          {msg.senderName}
                        </span>
                        <span className="text-xs text-emerald-800 font-mono bg-emerald-100 px-2 py-0.5 rounded-full">
                          {msg.senderMobile}
                        </span>
                        <span className="text-xs text-stone-400">➔</span>
                        <span className="text-xs font-bold text-stone-800 bg-stone-200 px-2 py-0.5 rounded-full">
                          برائے: {msg.targetProfileName}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{new Date(msg.createdAt).toLocaleString('ur-PK')}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        {msg.inquiryType === 'charges'
                          ? 'ریٹ استفسار'
                          : msg.inquiryType === 'availability'
                          ? 'دستیابی'
                          : msg.inquiryType === 'urgent_work'
                          ? 'فوری کام'
                          : 'عام رابطہ'}
                      </span>

                      {/* Report Abusive Message to Admin */}
                      {onReportMessage && (
                        <button
                          onClick={() => {
                            if (msg.isReported) return;
                            const reason =
                              window.prompt(
                                'اس پیغام کی شکایت کی وجہ لکھیں (صرف رپورٹ ہونے پر ایڈمن یہ پیغام دیکھ سکے گا):',
                                'نامناسب یا غلط پیغام'
                              ) || '';
                            if (reason.trim()) {
                              onReportMessage(msg.id, reason.trim());
                            }
                          }}
                          disabled={Boolean(msg.isReported)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            msg.isReported
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-stone-200 hover:bg-red-600 hover:text-white text-stone-700'
                          }`}
                          title="نامناسب پیغام کی شکایت درج کریں"
                        >
                          {msg.isReported ? 'رپورٹ شدہ' : '🚨 شکایت'}
                        </button>
                      )}

                      {/* Delete from user inbox */}
                      <button
                        onClick={() => handleDeleteForUser(msg)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="ان باکس سے ڈیلیٹ کریں"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Primary Message Content */}
                  <div className="bg-white p-3 rounded-2xl border border-stone-200 text-stone-800 text-xs sm:text-sm leading-relaxed">
                    <p className="font-semibold text-stone-900 mb-1">ابتدائی پیغام:</p>
                    <p>{msg.messageText}</p>

                    {/* Primary Voice Message Playback */}
                    {msg.audioData && (
                      <div className="mt-2.5 bg-emerald-50 border border-emerald-300 rounded-xl p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayVoice(`main-${msg.id}`, msg.audioData!)}
                            className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 transition shadow cursor-pointer"
                          >
                            {activeAudioId === `main-${msg.id}` ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                            )}
                          </button>
                          <span className="text-xs font-bold text-emerald-950">
                            وائس پیغام سنیں ({msg.audioDurationSeconds || 5} سیکنڈ)
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-mono">Audio Note</span>
                      </div>
                    )}

                    {/* Primary Photo / Attachment */}
                    {msg.attachmentUrl && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200">
                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">منسلک تصویر / رسید:</span>
                        <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                          <img
                            src={msg.attachmentUrl}
                            alt="منسلک تصویر"
                            className="max-h-48 rounded-xl border border-emerald-300 object-cover shadow-sm hover:opacity-90 transition cursor-zoom-in"
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 2-Way Confidential Discussion Thread */}
                  {msg.discussionThread && msg.discussionThread.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>خفیہ باہمی گفتگو کی لڑی ({msg.discussionThread.length} پیغامات):</span>
                      </div>

                      <div className="space-y-2 pl-2 sm:pl-4 border-r-2 border-emerald-400">
                        {msg.discussionThread.map((item) => {
                          const isFromReceiver = item.senderRole === 'receiver';
                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 rounded-2xl text-xs space-y-1 ${
                                isFromReceiver
                                  ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-950 mr-4'
                                  : 'bg-blue-50 border border-blue-200 text-blue-950 ml-4'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span>
                                  {item.senderName} (
                                  {isFromReceiver ? 'دکاندار / کاریگر' : 'گاہک / شہری'}
                                  )
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {new Date(item.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <p className="leading-relaxed text-stone-800">{item.text}</p>

                              {/* Voice playback in thread */}
                              {item.audioData && (
                                <div className="mt-1 flex items-center gap-2 bg-white/70 px-2 py-1 rounded-lg w-fit border border-stone-200">
                                  <button
                                    type="button"
                                    onClick={() => handlePlayVoice(`thread-${item.id}`, item.audioData!)}
                                    className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center cursor-pointer"
                                  >
                                    {activeAudioId === `thread-${item.id}` ? (
                                      <Pause className="w-3 h-3" />
                                    ) : (
                                      <Play className="w-3 h-3 fill-white ml-0.5" />
                                    )}
                                  </button>
                                  <span className="text-[10px] font-bold text-stone-800">
                                    صوتی جواب ({item.audioDurationSeconds || 5}s)
                                  </span>
                                </div>
                              )}

                              {/* Attachment in thread */}
                              {item.attachmentUrl && (
                                <div className="mt-1.5">
                                  <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={item.attachmentUrl}
                                      alt="منسلک تصویر"
                                      className="max-h-36 rounded-lg border border-stone-300 object-cover cursor-zoom-in hover:opacity-90 transition"
                                    />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Legacy Single Reply display if thread wasn't populated yet */}
                  {(!msg.discussionThread || msg.discussionThread.length === 0) && msg.replyText && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-xs text-stone-800 space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span>جواب:</span>
                        {msg.replyCreatedAt && (
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(msg.replyCreatedAt).toLocaleString('ur-PK')}
                          </span>
                        )}
                      </div>
                      <p>{msg.replyText}</p>
                    </div>
                  )}

                  {/* Live 2-Way Reply Composer */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span className="font-bold flex items-center gap-1 text-emerald-900">
                        <Send className="w-3.5 h-3.5 text-emerald-700" />
                        <span>اپنا فوری و نجی جواب لکھیں یا بولیں:</span>
                      </span>
                      {pendingVoice && (
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                          وائس نوٹ تیار ہے ({pendingVoice.durationEstimate}s)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="یہاں اپنا خفیہ جواب یا اگلا سوال لکھیں..."
                        value={replyTextMap[msg.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [msg.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendDiscussionReply(msg);
                          }
                        }}
                        className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-stone-50"
                      />

                      {/* Voice Note Button */}
                      {isRecordingThis ? (
                        <button
                          type="button"
                          onClick={() => handleStopReplyVoice(msg.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 animate-pulse shadow cursor-pointer shrink-0"
                          title="ریکارڈنگ مکمل کریں"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>بند کریں</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartReplyVoice(msg.id)}
                          className="px-3 py-2 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                          title="وائس نوٹ ریکارڈ کریں"
                        >
                          <Mic className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="hidden sm:inline">وائس</span>
                        </button>
                      )}

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={() => handleSendDiscussionReply(msg)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow transition cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال کریں</span>
                      </button>
                    </div>

                    {/* Pending Voice Note Preview */}
                    {pendingVoice && (
                      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayVoice(`prev-${msg.id}`, pendingVoice.base64Audio)}
                            className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center cursor-pointer"
                          >
                            {activeAudioId === `prev-${msg.id}` ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3 fill-white ml-0.5" />
                            )}
                          </button>
                          <span className="text-[11px] font-bold text-amber-950">
                            ریکارڈ شدہ وائس نوٹ سنیں
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyVoiceMap((prev) => {
                              const copy = { ...prev };
                              delete copy[msg.id];
                              return copy;
                            });
                          }}
                          className="text-red-600 hover:underline text-[10px] font-bold cursor-pointer"
                        >
                          حذف کریں
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Direct Contact Links */}
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <a
                      href={`tel:${isReceiver ? msg.senderMobile : msg.targetMobile}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-300" />
                      <span>فون ملائیں ({isReceiver ? msg.senderMobile : msg.targetMobile})</span>
                    </a>

                    <a
                      href={`https://wa.me/${(isReceiver ? msg.senderMobile : msg.targetMobile)
                        .replace(/\D/g, '')
                        .replace(/^0/, '92')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واٹس ایپ پر رابطہ</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
