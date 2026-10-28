import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  MessageSquare,
  Megaphone,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  Volume2,
  VolumeX,
  X,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { PortalNotificationItem, UserNotificationSettings } from '../types';
import { getPushPermissionStatus } from '../utils/notificationManager';
import { playNotificationChime } from '../utils/speech';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PortalNotificationItem[];
  unreadIds: Set<string>;
  settings: UserNotificationSettings;
  onUpdateSettings: (next: UserNotificationSettings) => Promise<void> | void;
  onRequestPushPermission: () => Promise<{
    success: boolean;
    permission: string;
    message: string;
  }>;
  onSelectNotification: (notif: PortalNotificationItem) => void;
  onMarkAsRead: (notifId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notifId: string) => void;
  onClearAllNotifications: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadIds,
  settings,
  onUpdateSettings,
  onRequestPushPermission,
  onSelectNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);
  const [isTestingSound, setIsTestingSound] = useState(false);

  if (!isOpen) return null;

  const permissionStatus = getPushPermissionStatus();
  const filteredNotifications =
    filterMode === 'unread'
      ? notifications.filter((n) => unreadIds.has(n.id))
      : notifications;

  const getTypeIcon = (type: PortalNotificationItem['type']) => {
    switch (type) {
      case 'new_message':
      case 'message_reply':
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-amber-600" />;
      case 'emergency_alert':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'profile_update':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-600" />;
    }
  };

  const getTypeBadge = (type: PortalNotificationItem['type']) => {
    switch (type) {
      case 'new_message':
        return { label: 'نیا پیغام', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'message_reply':
        return { label: 'جواب موصول', cls: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'announcement':
        return { label: 'اہم اعلان', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'emergency_alert':
        return { label: 'ایمرجنسی الرٹ', cls: 'bg-red-100 text-red-800 border-red-200' };
      case 'profile_update':
        return { label: 'پروفائل اپڈیٹ', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
      default:
        return { label: 'اطلاع', cls: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const handleTogglePush = async () => {
    setPushFeedback(null);
    if (!settings.pushEnabled) {
      const result = await onRequestPushPermission();
      setPushFeedback(result.message);
      if (result.success) {
        await onUpdateSettings({ ...settings, pushEnabled: true });
      }
    } else {
      await onUpdateSettings({ ...settings, pushEnabled: false });
      setPushFeedback('پش نوٹیفکیشنز غیر فعال کر دی گئیں۔');
    }
  };

  const handleTestSound = async () => {
    setIsTestingSound(true);
    await playNotificationChime('message', {
      forcePlay: true,
      eventId: `test_sound_${Date.now()}`,
    });
    setTimeout(() => setIsTestingSound(false), 700);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-900 text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 relative">
              <Bell className="w-6 h-6 text-amber-300" />
              {unreadIds.size > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border border-white">
                  {unreadIds.size}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold font-urdu leading-relaxed truncate">
                مرکزِ اطلاعات و نوٹیفکیشنز
              </h2>
              <p className="text-xs text-emerald-200 font-urdu">
                {unreadIds.size > 0
                  ? `${unreadIds.size} نئی ان پڑھی اطلاعات موجود ہیں`
                  : 'تمام اطلاعات پڑھی جا چکی ہیں'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'list' ? 'settings' : 'list')}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-urdu flex items-center gap-1.5 transition-all border ${
                activeTab === 'settings'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{activeTab === 'settings' ? 'اطلاعات دیکھیں' : 'سیٹنگز'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="بند کریں"
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors border border-white/15"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar for Notifications List */}
        {activeTab === 'list' && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-urdu transition-all ${
                  filterMode === 'all'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                تمام ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-urdu transition-all ${
                  filterMode === 'unread'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ان پڑھی ({unreadIds.size})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {unreadIds.size > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold font-urdu bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>سب پڑھا گیا</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAllNotifications}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold font-urdu bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>صاف کریں</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/60">
          {activeTab === 'list' ? (
            filteredNotifications.length === 0 ? (
              <div className="text-center py-14 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-urdu text-slate-800 mb-1">
                  {filterMode === 'unread'
                    ? 'کوئی ان پڑھی اطلاع موجود نہیں ہے'
                    : 'ابھی تک کوئی اطلاع موجود نہیں ہے'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-urdu max-w-md mx-auto leading-relaxed">
                  جب آپ کو کوئی نیا پیغام، جواب یا گاؤں کا اہم اعلان موصول ہو گا تو وہ فوری طور پر یہاں دکھائی دے گا۔
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = unreadIds.has(notif.id);
                const badge = getTypeBadge(notif.type);
                const formattedTime = (() => {
                  try {
                    return new Date(notif.createdAt).toLocaleString('ur-PK', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch {
                    return '';
                  }
                })();

                return (
                  <div
                    key={notif.id}
                    className={`rounded-2xl border p-4 transition-all shadow-sm ${
                      isUnread
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isUnread
                            ? 'bg-white border-emerald-200 shadow-sm'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {getTypeIcon(notif.type)}
                      </div>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onSelectNotification(notif)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] font-bold font-urdu px-2.5 py-0.5 rounded-lg border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            {isUnread && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 font-urdu">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                نئی اطلاع
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dir-ltr">
                            {formattedTime}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold font-urdu text-slate-900 leading-relaxed break-words">
                          {notif.title}
                        </h4>
                        <p className="text-xs sm:text-sm font-urdu text-slate-600 leading-relaxed mt-1 break-words line-clamp-2">
                          {notif.body}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 font-urdu">
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>کھول کر تفصیل دیکھیں</span>
                          </span>

                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isUnread && (
                              <button
                                type="button"
                                onClick={() => onMarkAsRead(notif.id)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold font-urdu flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>پڑھا گیا</span>
                              </button>
                            )}
                            {!notif.isGlobal && (
                              <button
                                type="button"
                                onClick={() => onDeleteNotification(notif.id)}
                                className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors"
                                title="حذف کریں"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* Settings View */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold font-urdu text-slate-900">
                    نوٹیفکیشن اور آواز کی ترتیبات (Notification Settings)
                  </h3>
                  <p className="text-xs text-slate-500 font-urdu mt-0.5">
                    اپنی پسند کے مطابق پیغامات کی گھنٹی، الرٹس اور موبائل پش نوٹیفکیشنز کو کنٹرول کریں۔
                  </p>
                </div>

                {/* 1. In-App Notifications Toggle */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                      {settings.inAppEnabled ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold font-urdu text-slate-900">
                        ایپ کے اندر نوٹیفکیشنز (In-App Notifications)
                      </div>
                      <p className="text-xs text-slate-500 font-urdu">
                        نیا پیغام یا جواب آنے پر اسکرین کے اوپر فوری اطلاع دکھائیں۔
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        inAppEnabled: !settings.inAppEnabled,
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-urdu border transition-all shrink-0 ${
                      settings.inAppEnabled
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {settings.inAppEnabled ? 'فعال (ON)' : 'بند (OFF)'}
                  </button>
                </div>

                {/* 2. Notification Sound Toggle + Test Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                      {settings.soundEnabled ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold font-urdu text-slate-900">
                        نوٹیفکیشن کی آواز (Notification Sound)
                      </div>
                      <p className="text-xs text-slate-500 font-urdu">
                        نیا پیغام یا الرٹ موصول ہونے پر گھنٹی کی آواز بجائیں۔
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={handleTestSound}
                      disabled={isTestingSound}
                      className="px-3 py-2 rounded-xl text-xs font-bold font-urdu bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isTestingSound ? 'آواز بج رہی ہے...' : 'آواز ٹیسٹ کریں'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          soundEnabled: !settings.soundEnabled,
                        })
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-urdu border transition-all ${
                        settings.soundEnabled
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {settings.soundEnabled ? 'فعال (ON)' : 'بند (OFF)'}
                    </button>
                  </div>
                </div>

                {/* 3. Browser & Mobile Push Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-urdu text-slate-900">
                          براؤزر اور موبائل پش نوٹیفکیشنز (Push Alerts)
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            permissionStatus === 'granted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : permissionStatus === 'denied'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {permissionStatus === 'granted'
                            ? 'اجازت فعال ہے'
                            : permissionStatus === 'denied'
                            ? 'اجازت بلاک ہے'
                            : permissionStatus === 'unsupported'
                            ? 'ناکارہ'
                            : 'اجازت درکار'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-urdu mt-0.5">
                        اگر آپ کسی دوسرے ٹیب میں ہوں یا موبائل اسکرین بند ہو تب بھی پیغام کی اطلاع حاصل کریں۔
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePush}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-urdu border transition-all self-end sm:self-center shrink-0 ${
                      settings.pushEnabled && permissionStatus === 'granted'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                    }`}
                  >
                    {settings.pushEnabled && permissionStatus === 'granted'
                      ? 'فعال (ON)'
                      : 'پش الرٹس آن کریں'}
                  </button>
                </div>

                {pushFeedback && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-urdu text-blue-900 leading-relaxed">
                    {pushFeedback}
                  </div>
                )}

                {permissionStatus === 'denied' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-urdu text-amber-900 leading-relaxed">
                    نوٹ: آپ کے براؤزر میں نوٹیفکیشنز کی اجازت بند ہے۔ اسے دوبارہ کھولنے کے لیے اوپر ایڈریس بار کے ساتھ موجود لاک (🔒) آئیکن پر کلک کریں اور Notifications کو Allow کریں۔
                  </div>
                )}

                {/* 4. Message Alerts Toggle */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold font-urdu text-slate-900">
                        نئے پیغامات اور جوابات کے الرٹس
                      </div>
                      <p className="text-xs text-slate-500 font-urdu">
                        جب کوئی آپ کو ذاتی پیغام بھیجے یا آپ کے پیغام کا جواب دے۔
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        messageAlerts: !settings.messageAlerts,
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-urdu border transition-all shrink-0 ${
                      settings.messageAlerts
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {settings.messageAlerts ? 'فعال (ON)' : 'بند (OFF)'}
                  </button>
                </div>

                {/* 5. Announcement & Village Alerts Toggle */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold font-urdu text-slate-900">
                        گاؤں کے اعلانات اور ایمرجنسی الرٹس
                      </div>
                      <p className="text-xs text-slate-500 font-urdu">
                        رتہ کلاں کے اہم اعلانات، خبریں اور ہنگامی اطلاعات۔
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        announcementAlerts: !settings.announcementAlerts,
                      })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-urdu border transition-all shrink-0 ${
                      settings.announcementAlerts
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {settings.announcementAlerts ? 'فعال (ON)' : 'بند (OFF)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500 font-urdu shrink-0">
          <span>تمام ترتیبات خودکار طور پر محفوظ ہو جاتی ہیں</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold font-urdu transition-colors"
          >
            بند کریں
          </button>
        </div>
      </div>
    </div>
  );
};
