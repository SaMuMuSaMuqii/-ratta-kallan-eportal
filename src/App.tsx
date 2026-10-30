/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PlusCircle,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Send,
  Eye,
  Megaphone,
  Briefcase,
  Compass,
  GraduationCap,
  Bus,
  Menu,
  AlertTriangle,
  Users,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  BookOpen,
  Lock,
  HeartPulse,
  Activity,
  PhoneCall,
  Stethoscope,
  KeyRound,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  Bell,
} from 'lucide-react';
import {
  VillageProfile,
  VillageMessage,
  VillageAnnouncement,
  VillageNewsEvent,
  VillageMosque,
  VillageInstitute,
  VillageTransport,
  VillageHospital,
  Language,
  AdminAlertItem,
  AuthUserSession,
  DeletedMessageArchiveItem,
  ChatDiscussionItem,
  MandiRateItem,
  ShelterItem,
  HelpGuideItem,
  CustomSearchKeywordItem,
  FloodAlertStatus,
  PortalNotificationItem,
  UserNotificationSettings,
} from './types';
import { translations, categoryLabels } from './data/translations';
import { initialProfiles, initialAnnouncements, initialNewsEvents } from './data/initialProfiles';
import { initialMosques, initialInstitutes, initialTransports, initialHospitals } from './data/villageExtraData';
import {
  speakText,
  stopSpeaking,
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  playNotificationChime,
  unlockAudioContext,
  getSpeechRate,
  setSpeechRate,
  formatSpokenCardText,
  formatSpokenMosqueText,
  formatSpokenInstituteText,
  formatSpokenTransportText,
  formatSpokenHospitalText,
} from './utils/speech';
import { getProfileOperatingStatus, getSchoolOperatingStatus } from './utils/operatingHours';
import { RegisterItemModal, RegistrationTab } from './components/RegisterItemModal';
import { AddProfileModal } from './components/AddProfileModal';
import { AuthModal } from './components/AuthModal';
import { ProfileAuthChallengeModal } from './components/ProfileAuthChallengeModal';
import { ProfileDetailsModal } from './components/ProfileDetailsModal';
import { LeaveMessageModal } from './components/LeaveMessageModal';
import { InboxModal } from './components/InboxModal';
import { AdminPanelModal, FacebookIcon } from './components/AdminPanelModal';
import { AdminSupervisionPage } from './components/AdminSupervisionPage';
import { VillageNewsPopupModal } from './components/VillageNewsPopupModal';
import { VillageEventsBanner } from './components/VillageEventsBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MosquesModal } from './components/MosquesModal';
import { InstitutesModal } from './components/InstitutesModal';
import { TransportModal } from './components/TransportModal';
import { RoutePlannerSection } from './components/RoutePlannerSection';
import { MainMenuDrawer } from './components/MainMenuDrawer';
import { AiVillageAssistant } from './components/AiVillageAssistant';
import { AiSchoolModal } from './components/AiSchoolModal';
import { TimetableEditModal } from './components/TimetableEditModal';
import { HospitalsModal } from './components/HospitalsModal';
import { TermsModal } from './components/TermsModal';
import { EmergencyQuickCallBox } from './components/EmergencyQuickCallBox';
import { CommunityHelpNoticeboardModal } from './components/CommunityHelpNoticeboardModal';
import { VoiceAskModal, VoiceAskPanel } from './components/VoiceAskModal';
import { FooterPageView, FooterPageType } from './components/FooterPages';
import {
  answerVoiceQuestion,
  DEFAULT_EXAMPLE_QUESTIONS,
  PublicHelpPostItem,
} from './utils/voiceAskEngine';
import {
  performUniversalSearch,
  PortalFeatureSearchItem,
} from './utils/searchEngine';
import {
  sanitizePublicProfile,
  sanitizePublicProfileList,
  savePrivateProfileCredentials,
  getSuperAdminCredentials,
  saveSuperAdminCredentials,
  initialMandiRates,
  initialShelters,
  initialHelpGuides,
  initialFloodAlertStatus,
} from './utils/privacySanitizer';
import {
  saveMessageToFirestore,
  deleteMessageFromFirestore,
  saveProfileToFirestore,
  deleteProfileFromFirestore,
  saveMosqueToFirestore,
  deleteMosqueFromFirestore,
  saveInstituteToFirestore,
  deleteInstituteFromFirestore,
  saveTransportToFirestore,
  deleteTransportFromFirestore,
  saveHospitalToFirestore,
  deleteHospitalFromFirestore,
  saveNewsEventToFirestore,
  deleteNewsEventFromFirestore,
  saveBannerSlideImageDoc,
  deleteBannerSlideImageDoc,
  ensureInitialFirestoreSeed,
  subscribeProfiles,
  subscribeMessages,
  subscribeNewsEvents,
  subscribeMosques,
  subscribeInstitutes,
  subscribeTransports,
  subscribeHospitals,
  subscribePortalSettings,
  savePortalSettingsToFirestore,
  subscribeNotifications,
  saveNotificationToFirestore,
  deleteNotificationFromFirestore,
} from './firebase/firestoreService';
import { dispatchMessageNotificationEmail } from './firebase/emailNotificationService';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import {
  getUserNotificationKey,
  loadNotificationSettings,
  saveNotificationSettings,
  syncNotificationSettingsFromCloud,
  isCurrentUserRecipientOfMessage,
  isCurrentUserSenderOfMessage,
  isMessageUnreadForCurrentUser,
  isNotificationForCurrentUser,
  isNotificationUnreadForCurrentUser,
  markGlobalNotificationIdRead,
  markNotificationIdClearedLocally,
  requestAndRegisterPushNotifications,
  dissociatePushSubscriptionOnLogout,
  dispatchSystemPushNotification,
  phonesMatch,
} from './utils/notificationManager';

const STORAGE_PROFILES_KEY = 'ratta_kallan_profiles_v6';
const STORAGE_MESSAGES_KEY = 'ratta_kallan_messages_v6';
const STORAGE_NOTIFICATIONS_KEY = 'ratta_kallan_notifications_v1';
const STORAGE_DELETED_ARCHIVE_KEY = 'ratta_kallan_deleted_archive_v6';
const STORAGE_ANNOUNCEMENTS_KEY = 'ratta_kallan_announcements_v6';
const STORAGE_NEWS_KEY = 'ratta_kallan_news_events_v7';
const STORAGE_LANG_KEY = 'ratta_kallan_lang_v6';
const STORAGE_FB_URL_KEY = 'ratta_kallan_fb_url_v6';
const STORAGE_BG_IMAGE_KEY = 'ratta_kallan_bg_image_v6';
const STORAGE_MOSQUES_KEY = 'ratta_kallan_mosques_v6';
const STORAGE_INSTITUTES_KEY = 'ratta_kallan_institutes_v6';
const STORAGE_TRANSPORTS_KEY = 'ratta_kallan_transports_v6';
const STORAGE_HOSPITALS_KEY = 'ratta_kallan_hospitals_v6';
const STORAGE_ALERTS_KEY = 'ratta_kallan_alerts_v6';
const STORAGE_HELP_NOTICES_KEY = 'rk_community_help_notices_v2';
const STORAGE_MANDI_RATES_KEY = 'rk_mandi_rates_v1';
const STORAGE_SHELTERS_KEY = 'rk_shelters_v1';
const STORAGE_HELP_GUIDES_KEY = 'rk_help_guides_v1';
const STORAGE_CUSTOM_KEYWORDS_KEY = 'rk_custom_keywords_v1';
const STORAGE_FLOOD_ALERT_KEY = 'rk_flood_alert_status_v1';

export default function App() {
  // Language
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_LANG_KEY) as Language) || 'ur';
  });

  const t = translations[lang];
  const cats = categoryLabels[lang];

  // Village Background Image (configurable by Admin)
  const [villageBgImage, setVillageBgImage] = useState<string>(() => {
    return localStorage.getItem(STORAGE_BG_IMAGE_KEY) || '';
  });

  // Official Facebook Page URL
  const [facebookPageUrl, setFacebookPageUrl] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_FB_URL_KEY) ||
      'https://facebook.com/RattaKallanOfficial'
    );
  });

  // Persistent Public Directory State (Strictly sanitized via whitelist — NEVER stores email, username, or password of others)
  const [profiles, setProfiles] = useState<VillageProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (saved) {
        const loaded: VillageProfile[] = JSON.parse(saved);
        const existingIds = new Set(loaded.map((p) => p.id));
        const merged = [
          ...loaded,
          ...initialProfiles.filter((ip) => !existingIds.has(ip.id)),
        ];
        return sanitizePublicProfileList(merged);
      }
    } catch (e) {
      console.warn('Failed to load profiles:', e);
    }
    return sanitizePublicProfileList(initialProfiles);
  });

  const [messages, setMessages] = useState<VillageMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load messages:', e);
    }
    return [];
  });

  const [portalNotifications, setPortalNotifications] = useState<PortalNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
    return [];
  });

  const [deletedMessagesArchive, setDeletedMessagesArchive] = useState<
    DeletedMessageArchiveItem[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DELETED_ARCHIVE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load deleted archive:', e);
    }
    return [];
  });

  const [announcements, setAnnouncements] = useState<VillageAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ANNOUNCEMENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load announcements:', e);
    }
    return initialAnnouncements;
  });

  const [newsEvents, setNewsEvents] = useState<VillageNewsEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NEWS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load news events:', e);
    }
    return initialNewsEvents;
  });

  const [mosques, setMosques] = useState<VillageMosque[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MOSQUES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load mosques:', e);
    }
    return initialMosques;
  });

  const [institutes, setInstitutes] = useState<VillageInstitute[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INSTITUTES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load institutes:', e);
    }
    return initialInstitutes;
  });

  const [transports, setTransports] = useState<VillageTransport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TRANSPORTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load transports:', e);
    }
    return initialTransports;
  });

  const [hospitals, setHospitals] = useState<VillageHospital[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HOSPITALS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load hospitals:', e);
    }
    return initialHospitals;
  });

  const [adminAlerts, setAdminAlerts] = useState<AdminAlertItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ALERTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load admin alerts:', e);
    }
    return [];
  });

  const [helpNotices, setHelpNotices] = useState<PublicHelpPostItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HELP_NOTICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [mandiRates, setMandiRates] = useState<MandiRateItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MANDI_RATES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialMandiRates;
  });

  const [shelters, setShelters] = useState<ShelterItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHELTERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialShelters;
  });

  const [helpGuides, setHelpGuides] = useState<HelpGuideItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HELP_GUIDES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialHelpGuides;
  });

  const [customKeywords, setCustomKeywords] = useState<CustomSearchKeywordItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_KEYWORDS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [floodAlertStatus, setFloodAlertStatus] = useState<FloodAlertStatus>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FLOOD_ALERT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialFloodAlertStatus;
  });

  // LocalStorage sync (Strictly sanitized public directory!)
  useEffect(() => {
    const cleanPublicList = sanitizePublicProfileList(profiles);
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(cleanPublicList));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(portalNotifications));
  }, [portalNotifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DELETED_ARCHIVE_KEY, JSON.stringify(deletedMessagesArchive));
  }, [deletedMessagesArchive]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_NEWS_KEY, JSON.stringify(newsEvents));
  }, [newsEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MOSQUES_KEY, JSON.stringify(mosques));
  }, [mosques]);

  useEffect(() => {
    localStorage.setItem(STORAGE_INSTITUTES_KEY, JSON.stringify(institutes));
  }, [institutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_TRANSPORTS_KEY, JSON.stringify(transports));
  }, [transports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HOSPITALS_KEY, JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ALERTS_KEY, JSON.stringify(adminAlerts));
  }, [adminAlerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HELP_NOTICES_KEY, JSON.stringify(helpNotices));
  }, [helpNotices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MANDI_RATES_KEY, JSON.stringify(mandiRates));
  }, [mandiRates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SHELTERS_KEY, JSON.stringify(shelters));
  }, [shelters]);

  useEffect(() => {
    localStorage.setItem(STORAGE_HELP_GUIDES_KEY, JSON.stringify(helpGuides));
  }, [helpGuides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CUSTOM_KEYWORDS_KEY, JSON.stringify(customKeywords));
  }, [customKeywords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FLOOD_ALERT_KEY, JSON.stringify(floodAlertStatus));
  }, [floodAlertStatus]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FB_URL_KEY, facebookPageUrl);
  }, [facebookPageUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_BG_IMAGE_KEY, villageBgImage);
  }, [villageBgImage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [onlyAvailableWorkers, setOnlyAvailableWorkers] = useState<boolean>(false);

  // Firestore Real-Time Subscriptions & Automatic Initial Cloud Seeding
  useEffect(() => {
    ensureInitialFirestoreSeed({
      profiles,
      mosques,
      institutes,
      transports,
      hospitals,
      newsEvents,
      announcements,
    }).catch(() => {});

    const unsubProfiles = subscribeProfiles((list) => {
      if (list && list.length > 0) {
        const existingIds = new Set(list.map((p) => p.id));
        const merged = [
          ...list,
          ...initialProfiles.filter((ip) => !existingIds.has(ip.id)),
        ];
        setProfiles(sanitizePublicProfileList(merged));
      }
    });
    const unsubMessages = subscribeMessages((list) => {
      if (list) setMessages(list);
    });
    const unsubNews = subscribeNewsEvents((list) => {
      if (list && list.length > 0) {
        setNewsEvents(list);
        setBannerImagesVersion((v) => v + 1);
      }
    });
    const unsubMosques = subscribeMosques((list) => {
      if (list && list.length > 0) setMosques(list);
    });
    const unsubInstitutes = subscribeInstitutes((list) => {
      if (list && list.length > 0) setInstitutes(list);
    });
    const unsubTransports = subscribeTransports((list) => {
      if (list && list.length > 0) setTransports(list);
    });
    const unsubHospitals = subscribeHospitals((list) => {
      if (list && list.length > 0) setHospitals(list);
    });
    const unsubNotifications = subscribeNotifications((list) => {
      if (list) setPortalNotifications(list);
    });
    const unsubSettings = subscribePortalSettings((settingsData) => {
      if (Array.isArray(settingsData.mandiRates) && settingsData.mandiRates.length > 0) {
        setMandiRates(settingsData.mandiRates);
      }
      if (Array.isArray(settingsData.shelters) && settingsData.shelters.length > 0) {
        setShelters(settingsData.shelters);
      }
      if (Array.isArray(settingsData.helpGuides) && settingsData.helpGuides.length > 0) {
        setHelpGuides(settingsData.helpGuides);
      }
      if (Array.isArray(settingsData.customKeywords)) {
        setCustomKeywords(settingsData.customKeywords);
      }
      if (settingsData.floodAlertStatus) {
        setFloodAlertStatus(settingsData.floodAlertStatus);
      }
      if (Array.isArray(settingsData.helpNotices)) {
        setHelpNotices(settingsData.helpNotices);
      }
      if (typeof settingsData.facebookPageUrl === 'string' && settingsData.facebookPageUrl) {
        setFacebookPageUrl(settingsData.facebookPageUrl);
      }
      if (typeof settingsData.villageBgImage === 'string') {
        setVillageBgImage(settingsData.villageBgImage);
      }
    });

    return () => {
      unsubProfiles();
      unsubMessages();
      unsubNews();
      unsubMosques();
      unsubInstitutes();
      unsubTransports();
      unsubHospitals();
      unsubNotifications();
      unsubSettings();
    };
  }, []);

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerDefaultTab, setRegisterDefaultTab] = useState<RegistrationTab>('profile');

  // Modals & Drawer state
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [inboxPreselectedPhone, setInboxPreselectedPhone] = useState<string>('');
  const [inboxInitialMessageId, setInboxInitialMessageId] = useState<string | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMosquesModalOpen, setIsMosquesModalOpen] = useState(false);
  const [isInstitutesModalOpen, setIsInstitutesModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isHospitalsModalOpen, setIsHospitalsModalOpen] = useState(false);
  const [isHelpNoticeboardOpen, setIsHelpNoticeboardOpen] = useState(false);
  const [isVoiceAskModalOpen, setIsVoiceAskModalOpen] = useState(false);
  const [voiceAskInitialQuestion, setVoiceAskInitialQuestion] = useState<string>('');
  const [bannerImagesVersion, setBannerImagesVersion] = useState<number>(0);

  // Separate Admin Entrance Route (#admin) — never mixed with normal user screens
  const [isAdminSupervisionRoute, setIsAdminSupervisionRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.replace('#', '') === 'admin';
    }
    return false;
  });

  // Dedicated Footer Pages state ("پرائیویسی پالیسی", "شرائط و ضوابط", "ایمرجنسی") synced with URL hash
  const [activeFooterPage, setActiveFooterPage] = useState<FooterPageType | null>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.replace('#', '');
      if (h === 'privacy' || h === 'terms' || h === 'emergency') return h;
    }
    return null;
  });

  const navigateToFooterPage = (page: FooterPageType | null) => {
    setActiveFooterPage(page);
    setIsAdminSupervisionRoute(false);
    if (typeof window !== 'undefined') {
      if (page) {
        window.history.pushState({ footerPage: page }, '', `#${page}`);
      } else if (window.location.hash) {
        window.history.pushState({}, '', window.location.pathname);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncHashRoute = () => {
      const h = window.location.hash.replace('#', '');
      if (h === 'admin') {
        setIsAdminSupervisionRoute(true);
        setActiveFooterPage(null);
      } else if (h === 'privacy' || h === 'terms' || h === 'emergency') {
        setIsAdminSupervisionRoute(false);
        setActiveFooterPage(h);
      } else {
        setIsAdminSupervisionRoute(false);
        setActiveFooterPage(null);
      }
    };
    window.addEventListener('popstate', syncHashRoute);
    window.addEventListener('hashchange', syncHashRoute);
    return () => {
      window.removeEventListener('popstate', syncHashRoute);
      window.removeEventListener('hashchange', syncHashRoute);
    };
  }, []);

  const [selectedProfile, setSelectedProfile] = useState<VillageProfile | null>(null);
  const [messageTargetProfile, setMessageTargetProfile] = useState<VillageProfile | null>(null);

  // AI School Modal State
  const [isAiSchoolModalOpen, setIsAiSchoolModalOpen] = useState(false);

  // Sub-Login & Timetable Edit Modal State for All 4 Categories (Mosques, Schools, Hospitals, Transports)
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingEntityType, setEditingEntityType] = useState<'mosque' | 'institute' | 'hospital' | 'transport'>('mosque');
  const [selectedMosqueForEdit, setSelectedMosqueForEdit] = useState<VillageMosque | null>(null);
  const [selectedInstituteForEdit, setSelectedInstituteForEdit] = useState<VillageInstitute | null>(null);
  const [selectedHospitalForEdit, setSelectedHospitalForEdit] = useState<VillageHospital | null>(null);
  const [selectedTransportForEdit, setSelectedTransportForEdit] = useState<VillageTransport | null>(null);

  // Personal Mobile Phone State for Every Villager (Saved locally on their device)
  const STORAGE_CURRENT_USER_PHONE_KEY = 'rk_village_user_phone';
  const STORAGE_CURRENT_USER_NAME_KEY = 'rk_village_user_name';

  const [currentUserPhone, setCurrentUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_CURRENT_USER_PHONE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_CURRENT_USER_NAME_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isEditingUserPhone, setIsEditingUserPhone] = useState(false);
  const [userPhoneInput, setUserPhoneInput] = useState(currentUserPhone);
  const [userNameInput, setUserNameInput] = useState(currentUserName);

  // Super Admin Credentials state (never displayed in UI)
  const [adminCreds, setAdminCreds] = useState<{ username: string; pin: string; email?: string }>(() =>
    getSuperAdminCredentials()
  );

  const handleUpdateAdminCreds = (newCreds: { username: string; pin: string; email?: string }) => {
    saveSuperAdminCredentials(newCreds);
    setAdminCreds(getSuperAdminCredentials());
    showToastNotification('Admin credentials updated successfully.');
  };

  // Active User Authentication Session (Owner or Admin)
  const STORAGE_ACTIVE_SESSION_KEY = 'rk_active_auth_session_v1';
  const [activeUserSession, setActiveUserSession] = useState<AuthUserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'reset' | 'admin'>('login');

  // Profile Security Challenge state (for edit/delete verification)
  const [isAuthChallengeOpen, setIsAuthChallengeOpen] = useState(false);
  const [authChallengeProfile, setAuthChallengeProfile] = useState<VillageProfile | null>(null);
  const [authChallengeAction, setAuthChallengeAction] = useState<'edit' | 'delete'>('edit');

  // Add/Edit Profile Modal state
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [editingProfileForModal, setEditingProfileForModal] = useState<VillageProfile | null>(null);

  // Village News Popup Modal state (auto-opens on launch for village events)
  const [isNewsPopupOpen, setIsNewsPopupOpen] = useState(true);

  // Terms and conditions modal state
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // In-App Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastActionTarget, setToastActionTarget] = useState<{
    messageId?: string;
    recipientPhone?: string;
    openNotifications?: boolean;
  } | null>(null);
  const toastTimerRef = useRef<any>(null);

  // Global Audio / Voice Search state
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceTranscriptPreview, setVoiceTranscriptPreview] = useState('');
  const [isGlobalAudioPlaying, setIsGlobalAudioPlaying] = useState(false);
  const [activeCardAudioId, setActiveCardAudioId] = useState<string | null>(null);
  const voiceRecognizerRef = useRef<VoiceRecognizer | null>(null);

  // Mobile Bottom Nav active tab
  const [mobileTab, setMobileTab] = useState<'home' | 'news' | 'messages' | 'add'>('home');

  // Matched registered profile for current user's phone or session
  const matchedUserProfile = useMemo(() => {
    if (activeUserSession?.profileId) {
      const bySession = profiles.find((p) => p.id === activeUserSession.profileId);
      if (bySession) return bySession;
    }
    const phoneToMatch = currentUserPhone || activeUserSession?.mobile;
    if (!phoneToMatch) return null;
    return profiles.find((p) => phonesMatch(p.mobile, phoneToMatch)) || null;
  }, [currentUserPhone, activeUserSession, profiles]);

  // Current user notification identity key
  const currentUserNotifKey = useMemo(
    () =>
      getUserNotificationKey(
        activeUserSession,
        currentUserPhone,
        matchedUserProfile?.id || null
      ),
    [activeUserSession, currentUserPhone, matchedUserProfile?.id]
  );

  // Persistent Notification Settings (In-App, Sound, Push, Message Alerts, Announcement Alerts)
  const [notificationSettings, setNotificationSettings] =
    useState<UserNotificationSettings>(() => loadNotificationSettings());

  useEffect(() => {
    const localPrefs = loadNotificationSettings(currentUserNotifKey);
    setNotificationSettings(localPrefs);
    syncNotificationSettingsFromCloud(currentUserNotifKey)
      .then((remote) => {
        if (remote) setNotificationSettings(remote);
      })
      .catch(() => {});
  }, [currentUserNotifKey]);

  const handleUpdateNotificationSettings = async (next: UserNotificationSettings) => {
    const saved = await saveNotificationSettings(next, currentUserNotifKey);
    setNotificationSettings(saved);
  };

  // Unread message count per profile ID
  const unreadCountsByProfileId = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      if (m.deletedByRecipient) return;
      const isUnread =
        typeof m.unreadByRecipient === 'boolean' ? m.unreadByRecipient : !m.isRead;
      if (isUnread) {
        counts[m.targetProfileId] = (counts[m.targetProfileId] || 0) + 1;
      }
    });
    return counts;
  }, [messages]);

  // Recipient-scoped unread messages count for the current user (never leaks other villagers' unread counts)
  const totalUnreadCount = useMemo(() => {
    return messages.filter((m) =>
      isMessageUnreadForCurrentUser(
        m,
        activeUserSession,
        currentUserPhone,
        matchedUserProfile?.id || null
      )
    ).length;
  }, [messages, activeUserSession, currentUserPhone, matchedUserProfile?.id]);

  // Notifications scoped strictly to the current user
  const userScopedNotifications = useMemo(() => {
    return portalNotifications.filter((n) =>
      isNotificationForCurrentUser(
        n,
        activeUserSession,
        currentUserPhone,
        matchedUserProfile?.id || null,
        currentUserNotifKey
      )
    );
  }, [
    portalNotifications,
    activeUserSession,
    currentUserPhone,
    matchedUserProfile?.id,
    currentUserNotifKey,
  ]);

  const unreadNotificationIds = useMemo(() => {
    const set = new Set<string>();
    userScopedNotifications.forEach((n) => {
      if (isNotificationUnreadForCurrentUser(n, currentUserNotifKey)) {
        set.add(n.id);
      }
    });
    return set;
  }, [userScopedNotifications, currentUserNotifKey]);

  // Messages directed to this user's phone
  const userDirectMessagesCount = useMemo(() => {
    if (!currentUserPhone) return 0;
    return messages.filter(
      (m) =>
        !m.deletedByRecipient &&
        phonesMatch(m.targetMobile, currentUserPhone) &&
        (typeof m.unreadByRecipient === 'boolean' ? m.unreadByRecipient : !m.isRead)
    ).length;
  }, [currentUserPhone, messages]);

  const handleSaveUserPhone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = userPhoneInput.trim();
    if (!clean || clean.replace(/\D/g, '').length < 10) {
      alert('براہ کرم درست 11 ہندسوں کا موبائل نمبر درج کریں (مثلاً: 03001234567)');
      return;
    }
    setCurrentUserPhone(clean);
    setCurrentUserName(userNameInput.trim());
    localStorage.setItem(STORAGE_CURRENT_USER_PHONE_KEY, clean);
    localStorage.setItem(STORAGE_CURRENT_USER_NAME_KEY, userNameInput.trim());
    setIsEditingUserPhone(false);
    showToastNotification(`آپ کا موبائل نمبر (${clean}) کامیابی سے محفوظ ہو گیا!`);
  };

  // Search normalization helper
  const normalizeText = (str: string) => {
    return (str || '')
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ة]/g, 'ہ')
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[\u064B-\u065F]/g, '')
      .trim();
  };

  // Search input ref for Search Icon Action
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Universal Multilingual Everything-Search Engine Integration
  // Searches the entire portal (including Admin Panel, Login, Register, AI School, Mandi Rates, Shelters, News, Guides, Profiles, Mosques, Schools, Hospitals, Transport)
  // Strictly NEVER searches or exposes anyone's username, password, email, or personal messages.
  const universalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return performUniversalSearch({
      query: searchQuery,
      profiles,
      mosques,
      institutes,
      transports,
      hospitals,
      newsEvents,
      announcements,
      mandiRates,
      shelters,
      helpNotices,
      helpGuides,
      customKeywords,
      viewerIsSignedIn: Boolean(activeUserSession),
      categoryFilter: selectedCategory,
    });
  }, [
    searchQuery,
    profiles,
    mosques,
    institutes,
    transports,
    hospitals,
    newsEvents,
    announcements,
    mandiRates,
    shelters,
    helpNotices,
    helpGuides,
    customKeywords,
    activeUserSession,
    selectedCategory,
  ]);

  // Matched Portal Features / Control Panels (e.g., Admin Panel #admin, Login, Password Reset, Register, AI School)
  const filteredPortalActions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'portal_action')
      .map((r) => r.rawItem as PortalFeatureSearchItem);
  }, [universalSearchResults, searchQuery]);

  // Filtered Profiles list (Strictly excludes hidden or disabled profiles)
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return profiles.filter((p) => {
        if (p.isHidden || p.isDisabled) return false;
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        if (availabilityFilter !== 'all' && p.availability !== availabilityFilter) return false;
        if (
          onlyAvailableWorkers &&
          !p.isAvailableForWorkToday &&
          !(p.category === 'laborer' && p.availability === 'available')
        ) {
          return false;
        }
        return true;
      });
    }

    return universalSearchResults
      .filter((r) => r.type === 'profile')
      .map((r) => r.rawItem as VillageProfile)
      .filter((p) => {
        if (p.isHidden || p.isDisabled) return false;
        if (availabilityFilter !== 'all' && p.availability !== availabilityFilter) return false;
        if (
          onlyAvailableWorkers &&
          !p.isAvailableForWorkToday &&
          !(p.category === 'laborer' && p.availability === 'available')
        ) {
          return false;
        }
        return true;
      });
  }, [universalSearchResults, profiles, searchQuery, selectedCategory, availabilityFilter, onlyAvailableWorkers]);

  // Matching Mosques for universal search
  const filteredMosques = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'mosque')
      .map((r) => r.rawItem as VillageMosque);
  }, [universalSearchResults, searchQuery]);

  // Matching Institutes for universal search
  const filteredInstitutes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'institute')
      .map((r) => r.rawItem as VillageInstitute);
  }, [universalSearchResults, searchQuery]);

  // Matching Transports for universal search
  const filteredTransports = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'transport')
      .map((r) => r.rawItem as VillageTransport);
  }, [universalSearchResults, searchQuery]);

  // Matching Hospitals & Medical Emergency Services for universal search
  const filteredHospitals = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'hospital')
      .map((r) => r.rawItem as VillageHospital);
  }, [universalSearchResults, searchQuery]);

  // Matching News & Events for universal search
  const filteredNewsEvents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'news')
      .map((r) => r.rawItem as VillageNewsEvent);
  }, [universalSearchResults, searchQuery]);

  // Matching Official Announcements for universal search
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'announcement')
      .map((r) => r.rawItem as VillageAnnouncement);
  }, [universalSearchResults, searchQuery]);

  // Matching Mandi & Crop Rates for universal search
  const filteredMandiRates = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'mandi_rate')
      .map((r) => r.rawItem as MandiRateItem);
  }, [universalSearchResults, searchQuery]);

  // Matching Emergency & Flood Shelters for universal search
  const filteredShelters = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'shelter')
      .map((r) => r.rawItem as ShelterItem);
  }, [universalSearchResults, searchQuery]);

  // Matching Public Community Help / Blood / Lost & Found Notices for universal search
  const filteredHelpNotices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'help_notice')
      .map((r) => r.rawItem as PublicHelpPostItem);
  }, [universalSearchResults, searchQuery]);

  // Matching Step-by-Step How-To Help Guides for universal search
  const filteredHelpGuides = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return universalSearchResults
      .filter((r) => r.type === 'help_guide')
      .map((r) => r.rawItem as HelpGuideItem);
  }, [universalSearchResults, searchQuery]);

  // Unified "بول کر پوچھیں" Search Assistant Answer behind the Search Bar
  const searchAssistantAnswer = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return answerVoiceQuestion(
      searchQuery,
      {
        profiles,
        mosques,
        institutes,
        transports,
        hospitals,
        newsEvents,
        announcements,
        helpNotices,
        mandiRates,
        shelters,
        helpGuides,
        customKeywords,
        floodAlertStatus,
        signedInUser: activeUserSession
          ? {
              id: activeUserSession.id,
              uid: activeUserSession.uid,
              name: activeUserSession.name,
              mobile: activeUserSession.mobile,
              email: activeUserSession.email,
              profileId: activeUserSession.profileId,
            }
          : null,
        userMessages: activeUserSession ? messages : [],
      },
      lang
    );
  }, [
    searchQuery,
    profiles,
    mosques,
    institutes,
    transports,
    hospitals,
    newsEvents,
    announcements,
    helpNotices,
    mandiRates,
    shelters,
    helpGuides,
    customKeywords,
    floodAlertStatus,
    activeUserSession,
    messages,
    lang,
  ]);

  // Execute a portal feature/page action directly from a search result card or search bar
  const handleTriggerPortalAction = (actionType: PortalFeatureSearchItem['actionType']) => {
    if (actionType === 'open_admin_supervision') {
      setIsAdminSupervisionRoute(true);
      if (typeof window !== 'undefined') {
        window.location.hash = '#admin';
      }
    } else if (actionType === 'open_admin_panel') {
      setIsAdminModalOpen(true);
    } else if (actionType === 'open_login') {
      setAuthModalInitialMode('login');
      setIsAuthModalOpen(true);
    } else if (actionType === 'open_reset_password') {
      setAuthModalInitialMode('reset');
      setIsAuthModalOpen(true);
    } else if (actionType === 'open_register') {
      setRegisterDefaultTab('profile');
      setIsRegisterModalOpen(true);
    } else if (actionType === 'open_ai_school') {
      setIsAiSchoolModalOpen(true);
    } else if (actionType === 'open_route_planner') {
      setSearchQuery('');
      navigateToFooterPage(null);
      setTimeout(() => {
        const el = document.getElementById('route-planner-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else if (actionType === 'open_help_noticeboard') {
      setIsHelpNoticeboardOpen(true);
    } else if (actionType === 'open_voice_ask') {
      setVoiceAskInitialQuestion(searchQuery.trim());
      setIsVoiceAskModalOpen(true);
    } else if (actionType === 'open_emergency_page') {
      navigateToFooterPage('emergency');
    } else if (actionType === 'open_privacy_page') {
      navigateToFooterPage('privacy');
    } else if (actionType === 'open_terms_page') {
      navigateToFooterPage('terms');
    } else if (actionType === 'open_mosques_modal') {
      setIsMosquesModalOpen(true);
    } else if (actionType === 'open_institutes_modal') {
      setIsInstitutesModalOpen(true);
    } else if (actionType === 'open_hospitals_modal') {
      setIsHospitalsModalOpen(true);
    } else if (actionType === 'open_transport_modal') {
      setIsTransportModalOpen(true);
    } else if (actionType === 'open_news_modal') {
      setIsNewsPopupOpen(true);
    } else if (actionType === 'open_inbox_modal') {
      setInboxPreselectedPhone('');
      setIsInboxModalOpen(true);
    }
  };

  // Interactive Search Bar Icon & Enter Key Action
  const handleExecuteSearchBarAction = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
      showToastNotification(
        'تلاش کرنے کے لیے یہاں کچھ بھی لکھیں (مثلاً: admin، ڈاکٹر، سکول، منڈی ریٹ، مسجد، گاڑی...)'
      );
      return;
    }

    // Ensure footer subpage is closed so front search results are visible
    if (activeFooterPage) {
      navigateToFooterPage(null);
    }

    unlockAudioContext();
    playNotificationChime('start');

    // Scroll smoothly to the front search results container
    setTimeout(() => {
      const resultsEl = document.getElementById('universal-search-front-results');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);

    // Speak the assistant's answer for immediate feedback
    if (searchAssistantAnswer?.spokenText) {
      stopSpeaking();
      speakText(
        searchAssistantAnswer.spokenText,
        lang === 'en' ? 'en' : 'ur',
        undefined,
        { isFemaleVillageVoice: false, voiceGender: 'male', rate: 0.95, pitch: 1.0 }
      );
    }
  };

  // Voice Search Handler with Dialog & 1-tap keywords
  const handleOpenVoiceSearch = () => {
    setIsVoiceModalOpen(true);
    setVoiceTranscriptPreview('');

    if (isSpeechRecognitionSupported()) {
      const vr = new VoiceRecognizer(lang);
      voiceRecognizerRef.current = vr;
      setIsVoiceSearching(true);

      vr.start(
        (transcript, isFinal) => {
          setVoiceTranscriptPreview(transcript);
          if (isFinal) {
            setSearchQuery(transcript);
            setIsVoiceSearching(false);
            setTimeout(() => {
              setIsVoiceModalOpen(false);
            }, 600);
          }
        },
        (error) => {
          console.warn('Voice search note:', error);
          setIsVoiceSearching(false);
        },
        () => {
          setIsVoiceSearching(false);
        }
      );
    } else {
      setIsVoiceSearching(false);
    }
  };

  const handleSelectQuickVoiceTag = (tag: string) => {
    if (voiceRecognizerRef.current) {
      voiceRecognizerRef.current.stop();
    }
    setIsVoiceSearching(false);
    setSearchQuery(tag);
    setIsVoiceModalOpen(false);

    // Speak confirmation
    speakText(
      lang === 'pa' ? `${tag} دی تلاش کیتی جا رہی اے` : `${tag} تلاش کیا جا رہا ہے`,
      lang
    );
  };

  // Dedicated Header Voice Search using the unified "بول کر پوچھیں" assistant
  const handleHeaderVoiceSearch = () => {
    unlockAudioContext();
    setVoiceAskInitialQuestion(searchQuery.trim());
    setIsVoiceAskModalOpen(true);
  };

  // Speak Portal Guide
  const handleToggleGlobalGuide = () => {
    unlockAudioContext();
    if (isGlobalAudioPlaying) {
      stopSpeaking();
      setIsGlobalAudioPlaying(false);
      return;
    }

    const guideText =
      lang === 'pa'
        ? 'رتہ کلاں جھنگ پورٹل وچ جی آیاں نوں۔ ایتھے تسیں پنڈ دے کسے وی بندے، مستری، ٹریکٹر، ڈاکٹر یا دکاندار دا ناں بول کے لبھ سکدے او۔ مذہبی پروموشن توں پرہیز کرو، ایہ پورٹل صرف روزگار لئی اے۔'
        : 'رتہ کلاں جھنگ پورٹل میں خوش آمدید۔ یہ پورٹل گاؤں والوں کے روزگار، رابطے، مساجد، اسکولز اور پبلک ٹرانسپورٹ کے لیے بنایا گیا ہے۔ مذہبی پروموشن اور فرقہ واریت سے پرہیز کریں۔ آپ مائیک دبا کر نام یا کاروبار بول کر تلاش کر سکتے ہیں۔';

    setIsGlobalAudioPlaying(true);
    playNotificationChime('start');
    speakText(guideText, lang, () => setIsGlobalAudioPlaying(false), {
      isFemaleVillageVoice: false,
      rate: getSpeechRate(),
      pitch: 1.0,
    });
  };

  // Speak Individual Card
  const handleSpeakCard = (p: VillageProfile) => {
    unlockAudioContext();
    if (activeCardAudioId === p.id) {
      stopSpeaking();
      setActiveCardAudioId(null);
      return;
    }

    const opStatus = getProfileOperatingStatus(p);
    const text = formatSpokenCardText({
      name: p.name,
      fatherName: p.fatherName,
      businessName: p.businessName,
      address: p.address,
      rateInfo: p.chargesDescription,
      mobile: p.mobile,
      timingInfo: `${opStatus.openingTime} تا ${opStatus.closingTime}`,
      breakInfo: opStatus.breakTime,
      statusInfo: opStatus.statusTextUrdu,
    });

    setActiveCardAudioId(p.id);
    playNotificationChime('start');
    speakText(text, lang, () => setActiveCardAudioId(null), {
      isFemaleVillageVoice: false,
      rate: getSpeechRate(),
      pitch: 1.0,
    });
  };

  // Add / Save Profile (Strictly sanitized via whitelist before storing in public directory & Cloud Firestore)
  const handleSaveProfile = (
    profileData: Omit<VillageProfile, 'id' | 'createdAt' | 'isVerified'> | VillageProfile
  ) => {
    if ('id' in profileData) {
      savePrivateProfileCredentials(profileData.id, {
        email: profileData.email,
        username: profileData.username,
        password: profileData.password,
      });
      const cleanProfile = sanitizePublicProfile(profileData as VillageProfile);
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === cleanProfile.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = cleanProfile;
          return copy;
        }
        return [cleanProfile, ...prev];
      });
      saveProfileToFirestore(profileData as VillageProfile).catch(() => {});
      showToastNotification(`پروفائل "${cleanProfile.name}" محفوظ ہو گیا!`);
      return;
    }
    const newProfileId = `profile-${Date.now()}`;
    savePrivateProfileCredentials(newProfileId, {
      email: profileData.email,
      username: profileData.username,
      password: profileData.password,
    });
    const fullNewProfile = {
      ...profileData,
      id: newProfileId,
      createdAt: new Date().toISOString(),
      isVerified: false,
      isApproved: true,
    } as VillageProfile;
    const newProfile: VillageProfile = sanitizePublicProfile(fullNewProfile);
    setProfiles((prev) => [newProfile, ...prev]);
    setSelectedProfile(newProfile);
    saveProfileToFirestore(fullNewProfile).catch(() => {});

    // Admin Alert Hook for New Shop/Business Registration
    const newRegAlert: AdminAlertItem = {
      id: `alert-reg-${Date.now()}`,
      type: 'new_registration',
      title: `نیا اندراج: ${newProfile.name} (${newProfile.businessName})`,
      details: `کیٹیگری: ${cats[newProfile.category] || newProfile.category} | فون نمبر: ${newProfile.mobile} | پتہ: ${newProfile.address} | شامل کنندہ: ${newProfile.addedByName || 'گاؤں کا شہری'}`,
      targetProfileId: newProfile.id,
      targetProfileName: newProfile.name,
      createdAt: new Date().toLocaleDateString('ur-PK') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isResolved: false,
    };
    setAdminAlerts((prev) => [newRegAlert, ...prev]);

    showToastNotification('نیا کاروبار / پروفائل کامیابی سے شامل ہو گئی ہے!');
  };

  // User Reporting / Violation Alert Hook for Portal Administration
  const handleReportViolation = (profile: VillageProfile, reason: string) => {
    const updatedProfile = { ...profile, isReported: true, reportReason: reason };
    setProfiles((prev) =>
      prev.map((p) => (p.id === profile.id ? updatedProfile : p))
    );
    saveProfileToFirestore(updatedProfile).catch(() => {});
    const newAlert: AdminAlertItem = {
      id: `alert-viol-${Date.now()}`,
      type: 'violation_report',
      title: `خلاف ورزی رپورٹ: ${profile.name} (${profile.businessName})`,
      details: `وجہ / نوعیت: ${reason} | فون: ${profile.mobile} | پتہ: ${profile.address}`,
      targetProfileId: profile.id,
      targetProfileName: profile.name,
      createdAt: new Date().toLocaleDateString('ur-PK') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isResolved: false,
    };
    setAdminAlerts((prev) => [newAlert, ...prev]);
    showToastNotification('شکایت ایڈمن کو موصول ہو گئی ہے!');
  };

  // Report Abusive Message (Marks message as reported so Admin can read it in Reported Messages)
  const handleReportMessage = (messageId: string, reason: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reportedMsg = {
          ...m,
          isReported: true,
          reportReason: reason,
          reportedAt: new Date().toISOString(),
        };
        saveMessageToFirestore(reportedMsg).catch(() => {});
        return reportedMsg;
      })
    );
    const targetMsg = messages.find((m) => m.id === messageId);
    if (targetMsg) {
      const msgAlert: AdminAlertItem = {
        id: `alert-msg-${Date.now()}`,
        type: 'violation_report',
        title: `رپورٹ شدہ پیغام: ${targetMsg.senderName} ➔ ${targetMsg.targetProfileName}`,
        details: `شکایت کی وجہ: ${reason}`,
        targetProfileId: targetMsg.targetProfileId,
        targetProfileName: targetMsg.targetProfileName,
        createdAt: new Date().toLocaleDateString('ur-PK') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isResolved: false,
      };
      setAdminAlerts((prev) => [msgAlert, ...prev]);
    }
    showToastNotification('پیغام کی شکایت درج کر دی گئی ہے۔ اب ایڈمن اسے دیکھ سکے گا۔');
  };

  const handleSaveHelpNotice = (item: PublicHelpPostItem) => {
    setHelpNotices((prev) => {
      const idx = prev.findIndex((h) => h.id === item.id);
      const next =
        idx >= 0
          ? prev.map((h, i) => (i === idx ? item : h))
          : [item, ...prev];
      savePortalSettingsToFirestore({ helpNotices: next }).catch(() => {});
      return next;
    });
    showToastNotification('امداد / عطیہ خون کی پوسٹ محفوظ ہو گئی!');
  };

  const handleDeleteHelpNotice = (id: string) => {
    setHelpNotices((prev) => {
      const next = prev.filter((h) => h.id !== id);
      savePortalSettingsToFirestore({ helpNotices: next }).catch(() => {});
      return next;
    });
    showToastNotification('پوسٹ حذف کر دی گئی!');
  };

  const handleResolveAlert = (id: string) => {
    setAdminAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isResolved: true } : a))
    );
    showToastNotification('الرٹ حل شدہ مارک کر دیا گیا!');
  };

  const handleDeleteAlert = (id: string) => {
    setAdminAlerts((prev) => prev.filter((a) => a.id !== id));
    showToastNotification('الرٹ ہٹا دیا گیا!');
  };

  // Add or Update Mosque
  const handleSaveMosque = (mosque: VillageMosque) => {
    setMosques((prev) => {
      const idx = prev.findIndex((m) => m.id === mosque.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = mosque;
        return copy;
      }
      return [mosque, ...prev];
    });
    saveMosqueToFirestore(mosque).catch(() => {});
    showToastNotification(`جامع مسجد "${mosque.name}" کے اوقات و تفصیلات محفوظ ہو گئیں!`);
  };

  // Add or Update Institute / School
  const handleSaveInstitute = (institute: VillageInstitute) => {
    setInstitutes((prev) => {
      const idx = prev.findIndex((inst) => inst.id === institute.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = institute;
        return copy;
      }
      return [institute, ...prev];
    });
    saveInstituteToFirestore(institute).catch(() => {});
    showToastNotification(`تعلیمی ادارہ "${institute.name}" کا ٹائم ٹیبل محفوظ ہو گیا!`);
  };

  // Delete Handlers for Super Admin
  const handleDeleteMosque = (id: string) => {
    setMosques((prev) => prev.filter((m) => m.id !== id));
    deleteMosqueFromFirestore(id).catch(() => {});
    showToastNotification('جامع مسجد کو پورٹل سے حذف کر دیا گیا!');
  };

  const handleDeleteInstitute = (id: string) => {
    setInstitutes((prev) => prev.filter((inst) => inst.id !== id));
    deleteInstituteFromFirestore(id).catch(() => {});
    showToastNotification('تعلیمی ادارے کو پورٹل سے حذف کر دیا گیا!');
  };

  const handleDeleteTransport = (id: string) => {
    setTransports((prev) => prev.filter((t) => t.id !== id));
    deleteTransportFromFirestore(id).catch(() => {});
    showToastNotification('گاڑی کا ریکارڈ پورٹل سے حذف کر دیا گیا!');
  };

  const handleDeleteMessage = (id: string) => {
    const targetMsg = messages.find((m) => m.id === id);
    if (targetMsg) {
      const archiveItem: DeletedMessageArchiveItem = {
        id: `arc-${Date.now()}`,
        originalMessageId: targetMsg.id,
        targetProfileId: targetMsg.targetProfileId,
        targetProfileName: targetMsg.targetProfileName,
        targetMobile: targetMsg.targetMobile,
        senderProfileId: targetMsg.senderProfileId,
        senderName: targetMsg.senderName,
        senderMobile: targetMsg.senderMobile,
        messageText: targetMsg.messageText,
        audioData: targetMsg.audioData,
        audioDurationSeconds: targetMsg.audioDurationSeconds,
        discussionThread: targetMsg.discussionThread ? [...targetMsg.discussionThread] : [],
        deletedAt: new Date().toISOString(),
        deletedBy: 'سپر ایڈمن (ثمر سعید)',
        deletedByRole: 'admin',
        originalCreatedAt: targetMsg.createdAt,
      };
      setDeletedMessagesArchive((prev) => [archiveItem, ...prev]);
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    deleteMessageFromFirestore(id).catch(() => {});
    showToastNotification('پیغام حذف کر دیا گیا اور آڈٹ والٹ میں محفوظ ہو گیا!');
  };

  // Super Admin Credentials Handlers
  const handleUpdateMosqueCredentials = (id: string, username: string, pass: string) => {
    setMosques((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, username, password: pass };
        saveMosqueToFirestore(updated).catch(() => {});
        return updated;
      })
    );
    showToastNotification('مسجد کا لاگ ان پاس ورڈ تبدیل کر دیا گیا ہے!');
  };

  const handleUpdateInstituteCredentials = (id: string, username: string, pass: string) => {
    setInstitutes((prev) =>
      prev.map((inst) => {
        if (inst.id !== id) return inst;
        const updated = { ...inst, username, password: pass };
        saveInstituteToFirestore(updated).catch(() => {});
        return updated;
      })
    );
    showToastNotification('اسکول کا لاگ ان پاس ورڈ تبدیل کر دیا گیا ہے!');
  };

  // Add or Update Transport
  const handleSaveTransport = (transport: VillageTransport) => {
    setTransports((prev) => {
      const idx = prev.findIndex((t) => t.id === transport.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = transport;
        return copy;
      }
      return [transport, ...prev];
    });
    saveTransportToFirestore(transport).catch(() => {});
    showToastNotification(`گاڑی "${transport.title}" محفوظ ہو گئی!`);
  };

  // Add or Update Hospital / Emergency Service
  const handleSaveHospital = (hospital: VillageHospital) => {
    setHospitals((prev) => {
      const idx = prev.findIndex((h) => h.id === hospital.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = hospital;
        return copy;
      }
      return [hospital, ...prev];
    });
    saveHospitalToFirestore(hospital).catch(() => {});
    showToastNotification(`طبی سروس "${hospital.name}" محفوظ ہو گئی!`);
  };

  const handleDeleteHospital = (id: string) => {
    setHospitals((prev) => prev.filter((h) => h.id !== id));
    deleteHospitalFromFirestore(id).catch(() => {});
    showToastNotification('ہسپتال/سروس کامیابی سے حذف کر دی گئی!');
  };

  const handleEditHospital = (hosp: VillageHospital) => {
    setSelectedHospitalForEdit(hosp);
    setEditingEntityType('hospital');
    setIsTimetableModalOpen(true);
  };

  const handleEditTransport = (veh: VillageTransport) => {
    setSelectedTransportForEdit(veh);
    setEditingEntityType('transport');
    setIsTimetableModalOpen(true);
  };

  const handleSpeakHospital = (hosp: VillageHospital) => {
    unlockAudioContext();
    if (activeCardAudioId === hosp.id) {
      stopSpeaking();
      setActiveCardAudioId(null);
      return;
    }
    setActiveCardAudioId(hosp.id);
    playNotificationChime('start');
    const speechText = formatSpokenHospitalText({
      name: hosp.name,
      categoryUrdu: hosp.categoryUrdu,
      address: hosp.address,
      distance: hosp.distance,
      timing: hosp.timing,
      contact: hosp.contact,
    });
    speakText(
      speechText,
      lang,
      () => setActiveCardAudioId(null),
      {
        isFemaleVillageVoice: false,
        voiceGender: 'male',
        rate: getSpeechRate(),
        pitch: 0.82,
      }
    );
  };

  const handleSpeakMosque = (m: VillageMosque) => {
    unlockAudioContext();
    if (activeCardAudioId === m.id) {
      stopSpeaking();
      setActiveCardAudioId(null);
      return;
    }
    setActiveCardAudioId(m.id);
    playNotificationChime('start');
    const speechText = formatSpokenMosqueText({
      name: m.name,
      imamName: m.imamName,
      location: m.location,
      prayerTimes: m.prayerTimes,
    });
    speakText(
      speechText,
      lang,
      () => setActiveCardAudioId(null),
      {
        isFemaleVillageVoice: false,
        voiceGender: 'male',
        rate: getSpeechRate(),
        pitch: 0.82,
      }
    );
  };

  const handleSpeakInstitute = (inst: VillageInstitute) => {
    unlockAudioContext();
    if (activeCardAudioId === inst.id) {
      stopSpeaking();
      setActiveCardAudioId(null);
      return;
    }
    setActiveCardAudioId(inst.id);
    playNotificationChime('start');
    const speechText = formatSpokenInstituteText({
      name: inst.name,
      headName: inst.headName,
      location: inst.location,
      classesOffered: inst.classesOffered,
      timing: inst.timing,
    });
    speakText(
      speechText,
      lang,
      () => setActiveCardAudioId(null),
      {
        isFemaleVillageVoice: false,
        voiceGender: 'male',
        rate: getSpeechRate(),
        pitch: 0.82,
      }
    );
  };

  const handleSpeakTransport = (v: VillageTransport) => {
    unlockAudioContext();
    if (activeCardAudioId === v.id) {
      stopSpeaking();
      setActiveCardAudioId(null);
      return;
    }
    setActiveCardAudioId(v.id);
    playNotificationChime('start');
    const speechText = formatSpokenTransportText({
      title: v.title,
      driverName: v.driverName,
      driverMobile: v.driverMobile,
      route: v.route,
      fare: v.fare,
      departureTime: v.departureTime,
    });
    speakText(
      speechText,
      lang,
      () => setActiveCardAudioId(null),
      {
        isFemaleVillageVoice: false,
        voiceGender: 'male',
        rate: getSpeechRate(),
        pitch: 0.82,
      }
    );
  };

  const showToastNotification = (
    msg: string,
    options?: {
      playSound?: boolean;
      eventId?: string;
      actionTarget?: {
        messageId?: string;
        recipientPhone?: string;
        openNotifications?: boolean;
      };
    }
  ) => {
    if (options?.playSound !== false && notificationSettings.soundEnabled) {
      void playNotificationChime('message', { eventId: options?.eventId });
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    setToastActionTarget(options?.actionTarget || null);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastActionTarget(null);
    }, 6000);
  };

  // Real-time detector for newly arrived incoming messages & replies for the current user
  const prevMessageSignaturesRef = useRef<Map<string, string>>(new Map());
  const isInitialMessagesSnapshotRef = useRef<boolean>(true);

  useEffect(() => {
    const prevMap = prevMessageSignaturesRef.current;
    const nextMap = new Map<string, string>();

    messages.forEach((m) => {
      const threadLen = m.discussionThread?.length || 0;
      const lastReplyId =
        threadLen > 0 ? m.discussionThread![threadLen - 1].id : m.replyCreatedAt || '';
      const sig = `${m.id}_${threadLen}_${lastReplyId}`;
      nextMap.set(m.id, sig);

      if (isInitialMessagesSnapshotRef.current) return;

      const prevSig = prevMap.get(m.id);
      if (prevSig === sig) return; // No new message or reply on this thread

      const isRecipient = isCurrentUserRecipientOfMessage(
        m,
        activeUserSession,
        currentUserPhone,
        matchedUserProfile?.id || null
      );
      const isSender = isCurrentUserSenderOfMessage(
        m,
        activeUserSession,
        currentUserPhone,
        matchedUserProfile?.id || null
      );

      // Case 1: Brand new message arrived for current user (and wasn't sent by current user)
      if (!prevSig && isRecipient && !isSender) {
        const eventId = `incoming_msg_${m.id}`;
        if (notificationSettings.messageAlerts) {
          if (notificationSettings.soundEnabled) {
            void playNotificationChime('message', { eventId });
          }
          if (notificationSettings.inAppEnabled) {
            showToastNotification(
              `📩 نیا پیغام موصول ہوا: ${m.senderName} کی طرف سے "${(
                m.messageText || ''
              ).slice(0, 55)}" — دیکھنے کے لیے کلک کریں`,
              {
                playSound: false,
                eventId,
                actionTarget: {
                  messageId: m.id,
                  recipientPhone: m.targetMobile,
                },
              }
            );
          }
          const incomingNotif: PortalNotificationItem = {
            id: `notif-msg-${m.id}`,
            recipientProfileId: m.targetProfileId,
            recipientMobile: m.targetMobile,
            recipientUid: m.recipientUid,
            type: 'new_message',
            title: `${m.senderName} کی طرف سے نیا پیغام`,
            body: m.messageText || 'وائس میسج موصول ہوا ہے',
            senderName: m.senderName,
            senderMobile: m.senderMobile,
            relatedMessageId: m.id,
            relatedProfileId: m.targetProfileId,
            createdAt: m.createdAt || new Date().toISOString(),
            isRead: false,
          };
          void dispatchSystemPushNotification(incomingNotif, notificationSettings);
        }
      }

      // Case 2: New reply added to an existing conversation where current user is the other participant
      if (prevSig && prevSig !== sig && (isRecipient || isSender)) {
        const latestItem =
          m.discussionThread && m.discussionThread.length > 0
            ? m.discussionThread[m.discussionThread.length - 1]
            : null;
        const replyRole = latestItem?.senderRole || m.lastSenderRole;
        const replyForCurrentUser =
          (replyRole === 'receiver' && isSender) ||
          (replyRole === 'sender' && isRecipient) ||
          (replyRole === 'admin' && (isSender || isRecipient));

        if (replyForCurrentUser && notificationSettings.messageAlerts) {
          const eventId = `incoming_reply_${m.id}_${latestItem?.id || Date.now()}`;
          const replySenderName =
            latestItem?.senderName ||
            (replyRole === 'receiver' ? m.targetProfileName : m.senderName);
          const replyPreview = latestItem?.text || m.replyText || 'نیا جواب موصول ہوا';

          if (notificationSettings.soundEnabled) {
            void playNotificationChime('message', { eventId });
          }
          if (notificationSettings.inAppEnabled) {
            showToastNotification(
              `💬 ${replySenderName} کا نیا جواب: "${replyPreview.slice(
                0,
                55
              )}" — کھولنے کے لیے کلک کریں`,
              {
                playSound: false,
                eventId,
                actionTarget: {
                  messageId: m.id,
                  recipientPhone: isRecipient ? m.targetMobile : m.senderMobile,
                },
              }
            );
          }

          const replyNotif: PortalNotificationItem = {
            id: `notif-reply-${m.id}-${latestItem?.id || Date.now()}`,
            recipientProfileId: isRecipient ? m.targetProfileId : m.senderProfileId,
            recipientMobile: isRecipient ? m.targetMobile : m.senderMobile,
            type: 'message_reply',
            title: `${replySenderName} نے آپ کے پیغام کا جواب دیا`,
            body: replyPreview,
            senderName: replySenderName,
            relatedMessageId: m.id,
            createdAt: latestItem?.timestamp || new Date().toISOString(),
            isRead: false,
          };
          void dispatchSystemPushNotification(replyNotif, notificationSettings);
        }
      }
    });

    prevMessageSignaturesRef.current = nextMap;
    if (messages.length > 0) {
      isInitialMessagesSnapshotRef.current = false;
    }
  }, [
    messages,
    activeUserSession,
    currentUserPhone,
    matchedUserProfile?.id,
    notificationSettings,
  ]);

  // Listen for Service Worker notification clicks & URL query parameters (?open_message=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const openTargetMessage = (messageId?: string | null, phone?: string | null) => {
      if (phone && phone !== 'user' && phone !== 'admin') {
        setInboxPreselectedPhone(phone);
      }
      if (messageId) {
        setInboxInitialMessageId(messageId);
      }
      setIsInboxModalOpen(true);
    };

    // Check URL query parameters on initial load
    const params = new URLSearchParams(window.location.search);
    const openMsgId = params.get('open_message');
    const inboxParam = params.get('inbox');
    if (openMsgId) {
      openTargetMessage(openMsgId, inboxParam);
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'RK_NOTIFICATION_CLICK') {
        const data = event.data.data || {};
        openTargetMessage(data.messageId, data.recipientMobile || data.recipientId);
      }
    };

    const handleCustomNotifClick = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      openTargetMessage(detail.messageId, detail.recipientMobile || detail.recipientId);
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }
    window.addEventListener('rk-open-notification-target', handleCustomNotifClick);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      window.removeEventListener('rk-open-notification-target', handleCustomNotifClick);
    };
  }, []);

  // Mark a message and its associated notifications as read for the current user
  const handleMarkMessageRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const isRecipient = isCurrentUserRecipientOfMessage(
          m,
          activeUserSession,
          currentUserPhone,
          matchedUserProfile?.id || null
        );
        const isSender = isCurrentUserSenderOfMessage(
          m,
          activeUserSession,
          currentUserPhone,
          matchedUserProfile?.id || null
        );

        const nextUnreadRecipient = isRecipient ? false : Boolean(m.unreadByRecipient);
        const nextUnreadSender = isSender ? false : Boolean(m.unreadBySender);
        const nextIsRead = isRecipient ? true : m.isRead;

        if (
          m.isRead === nextIsRead &&
          Boolean(m.unreadByRecipient) === nextUnreadRecipient &&
          Boolean(m.unreadBySender) === nextUnreadSender
        ) {
          return m;
        }

        const updated: VillageMessage = {
          ...m,
          isRead: nextIsRead,
          readAt: new Date().toISOString(),
          unreadByRecipient: nextUnreadRecipient,
          unreadBySender: nextUnreadSender,
          deliveryStatus: nextIsRead ? 'read' : m.deliveryStatus || 'delivered',
        };
        saveMessageToFirestore(updated).catch(() => {});
        return updated;
      })
    );

    // Also mark related notifications as read
    setPortalNotifications((prev) =>
      prev.map((n) => {
        if (n.relatedMessageId !== messageId) return n;
        if (n.isRead) return n;
        const updatedNotif: PortalNotificationItem = {
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        };
        saveNotificationToFirestore(updatedNotif).catch(() => {});
        return updatedNotif;
      })
    );
  };

  // Notification Center Actions
  const handleMarkNotificationAsRead = (notifId: string) => {
    const target = portalNotifications.find((n) => n.id === notifId);
    if (!target) return;
    if (target.isGlobal) {
      markGlobalNotificationIdRead(currentUserNotifKey, notifId);
    }
    const nextReadKeys = Array.from(
      new Set([...(target.readByKeys || []), currentUserNotifKey])
    );
    const updated: PortalNotificationItem = {
      ...target,
      isRead: target.isGlobal ? target.isRead : true,
      readAt: new Date().toISOString(),
      readByKeys: nextReadKeys,
    };
    setPortalNotifications((prev) => prev.map((n) => (n.id === notifId ? updated : n)));
    saveNotificationToFirestore(updated).catch(() => {});
    if (target.relatedMessageId) {
      handleMarkMessageRead(target.relatedMessageId);
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    setPortalNotifications((prev) =>
      prev.map((n) => {
        if (!unreadNotificationIds.has(n.id)) return n;
        if (n.isGlobal) {
          markGlobalNotificationIdRead(currentUserNotifKey, n.id);
        }
        const nextReadKeys = Array.from(
          new Set([...(n.readByKeys || []), currentUserNotifKey])
        );
        const updated: PortalNotificationItem = {
          ...n,
          isRead: n.isGlobal ? n.isRead : true,
          readAt: new Date().toISOString(),
          readByKeys: nextReadKeys,
        };
        saveNotificationToFirestore(updated).catch(() => {});
        return updated;
      })
    );
  };

  const handleDeleteSingleNotification = (notifId: string) => {
    const target = portalNotifications.find((n) => n.id === notifId);
    markNotificationIdClearedLocally(currentUserNotifKey, notifId);
    if (target && !target.isGlobal) {
      deleteNotificationFromFirestore(notifId).catch(() => {});
    }
    setPortalNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleClearAllNotifications = () => {
    userScopedNotifications.forEach((n) => {
      markNotificationIdClearedLocally(currentUserNotifKey, n.id);
      if (!n.isGlobal) {
        deleteNotificationFromFirestore(n.id).catch(() => {});
      }
    });
    const clearedIds = new Set(userScopedNotifications.map((n) => n.id));
    setPortalNotifications((prev) => prev.filter((n) => !clearedIds.has(n.id)));
  };

  const handleSelectNotificationItem = (notif: PortalNotificationItem) => {
    handleMarkNotificationAsRead(notif.id);
    setIsNotificationCenterOpen(false);
    if (notif.relatedMessageId) {
      setInboxInitialMessageId(notif.relatedMessageId);
      if (notif.recipientMobile) {
        setInboxPreselectedPhone(notif.recipientMobile);
      }
      setIsInboxModalOpen(true);
    } else if (notif.type === 'announcement') {
      setIsNewsPopupOpen(true);
    } else if (notif.type === 'emergency_alert') {
      navigateToFooterPage('emergency');
    } else if (notif.relatedProfileId) {
      const prof = profiles.find((p) => p.id === notif.relatedProfileId);
      if (prof) setSelectedProfile(prof);
    }
  };

  // Send Message with Profile Notification, Firestore verification, and Discussion Thread setup
  const handleSendMessage = async (
    messageData: Omit<VillageMessage, 'id' | 'createdAt' | 'isRead'>
  ): Promise<boolean> => {
    const nowIso = new Date().toISOString();
    const msgId = `msg-${Date.now()}`;
    const newMsg: VillageMessage = {
      ...messageData,
      id: msgId,
      createdAt: nowIso,
      updatedAt: nowIso,
      isRead: false,
      unreadByRecipient: true,
      unreadBySender: false,
      deliveryStatus: 'sending',
      lastMessagePreview: messageData.messageText,
      lastSenderRole: 'sender',
      discussionThread: messageData.discussionThread || [],
    };

    // Prevent duplicate messages if user double-taps within 2 seconds
    const isDuplicate = messages.some(
      (existing) =>
        existing.targetProfileId === newMsg.targetProfileId &&
        phonesMatch(existing.senderMobile, newMsg.senderMobile) &&
        existing.messageText === newMsg.messageText &&
        Date.now() - new Date(existing.createdAt).getTime() < 3000
    );
    if (isDuplicate) {
      return true;
    }

    setMessages((prev) => [newMsg, ...prev]);

    // Remember sender's phone locally if not already set so they receive reply alerts automatically
    if (!currentUserPhone && messageData.senderMobile) {
      setCurrentUserPhone(messageData.senderMobile);
      localStorage.setItem(STORAGE_CURRENT_USER_PHONE_KEY, messageData.senderMobile);
    }

    const savedOk = await saveMessageToFirestore({
      ...newMsg,
      deliveryStatus: 'delivered',
    });

    if (!savedOk) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, deliveryStatus: 'failed' } : m))
      );
      return false;
    }

    const deliveredMsg: VillageMessage = {
      ...newMsg,
      deliveryStatus: 'delivered',
    };
    setMessages((prev) => prev.map((m) => (m.id === msgId ? deliveredMsg : m)));

    // Create persistent real-time notification document for the recipient
    const newNotif: PortalNotificationItem = {
      id: `notif-msg-${msgId}`,
      recipientProfileId: newMsg.targetProfileId,
      recipientMobile: newMsg.targetMobile,
      recipientUid: newMsg.recipientUid,
      type: 'new_message',
      title: `${newMsg.senderName} کی طرف سے نیا پیغام`,
      body: newMsg.messageText || 'وائس میسج موصول ہوا ہے',
      senderName: newMsg.senderName,
      senderMobile: newMsg.senderMobile,
      relatedMessageId: msgId,
      relatedProfileId: newMsg.targetProfileId,
      createdAt: nowIso,
      isRead: false,
    };
    setPortalNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif).catch(() => {});

    // Trigger email notification hook if recipient has email
    const targetProf = profiles.find((p) => p.id === newMsg.targetProfileId);
    if (targetProf) {
      dispatchMessageNotificationEmail({
        recipientProfile: targetProf,
        message: deliveredMsg,
      }).catch(() => {});
    }

    showToastNotification(
      `پیغام براہ راست ${messageData.targetProfileName} کے ان باکس میں پہنچ چکا ہے!`,
      {
        eventId: `sent_${msgId}`,
        actionTarget: {
          messageId: msgId,
          recipientPhone: newMsg.senderMobile,
        },
      }
    );
    return true;
  };

  // Retry sending a failed message from InboxModal
  const handleRetrySendMessage = async (msg: VillageMessage): Promise<boolean> => {
    const retrying: VillageMessage = {
      ...msg,
      deliveryStatus: 'delivered',
      updatedAt: new Date().toISOString(),
    };
    const ok = await saveMessageToFirestore(retrying);
    if (ok) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? retrying : m)));
      showToastNotification('پیغام کامیابی سے دوبارہ ارسال ہو گیا!');
      return true;
    }
    showToastNotification('پیغام ابھی بھی ارسال نہیں ہو سکا۔ انٹرنیٹ چیک کریں۔');
    return false;
  };

  // 2-Way Continuous Discussion Thread Reply Handler
  const handleReplyDiscussion = async (
    messageId: string,
    replyText: string,
    audioData?: string,
    audioDuration?: number
  ): Promise<boolean> => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return false;

    const isUserReceiver = isCurrentUserRecipientOfMessage(
      targetMsg,
      activeUserSession,
      currentUserPhone,
      matchedUserProfile?.id || null
    );
    const isUserAdmin = activeUserSession?.type === 'admin';

    const role: 'receiver' | 'sender' | 'admin' = isUserAdmin
      ? 'admin'
      : isUserReceiver
      ? 'receiver'
      : 'sender';

    const senderName =
      activeUserSession?.name ||
      (role === 'receiver' ? targetMsg.targetProfileName : targetMsg.senderName);

    const senderMobile =
      activeUserSession?.mobile ||
      (role === 'receiver' ? targetMsg.targetMobile : targetMsg.senderMobile);

    const nowIso = new Date().toISOString();
    const replyId = `reply-${Date.now()}`;
    const newReplyItem: ChatDiscussionItem = {
      id: replyId,
      senderRole: role,
      senderName,
      senderMobile,
      text: replyText,
      audioData,
      audioDurationSeconds: audioDuration,
      timestamp: nowIso,
      isRead: false,
    };

    const existingThread = targetMsg.discussionThread || [];
    const updatedMsg: VillageMessage = {
      ...targetMsg,
      replyText,
      replyCreatedAt: nowIso,
      updatedAt: nowIso,
      isRead: role === 'sender' ? false : targetMsg.isRead,
      unreadByRecipient: role === 'sender',
      unreadBySender: role === 'receiver' || role === 'admin',
      deliveryStatus: 'delivered',
      lastMessagePreview: replyText,
      lastSenderRole: role,
      discussionThread: [...existingThread, newReplyItem],
    };

    setMessages((prev) => prev.map((m) => (m.id === messageId ? updatedMsg : m)));
    const ok = await saveMessageToFirestore(updatedMsg);
    if (!ok) {
      return false;
    }

    // Create real-time notification for the other participant in this conversation
    const recipientProfileId =
      role === 'sender' ? targetMsg.targetProfileId : targetMsg.senderProfileId;
    const recipientMobile =
      role === 'sender' ? targetMsg.targetMobile : targetMsg.senderMobile;

    const replyNotif: PortalNotificationItem = {
      id: `notif-reply-${messageId}-${replyId}`,
      recipientProfileId,
      recipientMobile,
      type: 'message_reply',
      title: `${senderName} نے گفتگو میں جواب بھیجا`,
      body: replyText,
      senderName,
      senderMobile,
      relatedMessageId: messageId,
      relatedProfileId: targetMsg.targetProfileId,
      createdAt: nowIso,
      isRead: false,
    };
    setPortalNotifications((prev) => [replyNotif, ...prev]);
    saveNotificationToFirestore(replyNotif).catch(() => {});

    showToastNotification('خفیہ گفتگو میں آپ کا جواب ارسال ہو گیا ہے!', {
      eventId: `reply_sent_${replyId}`,
    });
    return true;
  };

  // Backward compatibility forwarder
  const handleReplyMessage = (messageId: string, replyText: string) => {
    void handleReplyDiscussion(messageId, replyText);
  };

  // PART C2 & C3: Per-side Soft-Delete Message (persisted to Firestore; hard-deletes ONLY when both sides delete AND message is not reported)
  const handleDeleteMessageForUser = (messageId: string, role: 'sender' | 'receiver') => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    // Archive snapshot in Super Admin's Vault
    const archiveItem: DeletedMessageArchiveItem = {
      id: `arc-${Date.now()}`,
      originalMessageId: targetMsg.id,
      targetProfileId: targetMsg.targetProfileId,
      targetProfileName: targetMsg.targetProfileName,
      targetMobile: targetMsg.targetMobile,
      senderProfileId: targetMsg.senderProfileId,
      senderName: targetMsg.senderName,
      senderMobile: targetMsg.senderMobile,
      messageText: targetMsg.messageText,
      audioData: targetMsg.audioData,
      audioDurationSeconds: targetMsg.audioDurationSeconds,
      discussionThread: targetMsg.discussionThread ? [...targetMsg.discussionThread] : [],
      deletedAt: new Date().toISOString(),
      deletedBy:
        activeUserSession?.name ||
        (role === 'sender' ? targetMsg.senderName : targetMsg.targetProfileName),
      deletedByRole: role,
      originalCreatedAt: targetMsg.createdAt,
    };

    setDeletedMessagesArchive((prev) => [archiveItem, ...prev]);

    const updatedMsg: VillageMessage = {
      ...targetMsg,
      deletedBySender: role === 'sender' ? true : Boolean(targetMsg.deletedBySender),
      deletedByRecipient: role === 'receiver' ? true : Boolean(targetMsg.deletedByRecipient),
      deletedAt: new Date().toISOString(),
      deletedByRole: role,
    };

    const bothSidesDeleted = Boolean(updatedMsg.deletedBySender && updatedMsg.deletedByRecipient);

    // Update message state: keep reported messages for admin review, remove from active list only when both sides deleted and not reported
    setMessages((prev) =>
      prev
        .map((m) => (m.id === messageId ? updatedMsg : m))
        .filter((m) => !(m.deletedBySender && m.deletedByRecipient && !m.isReported))
    );

    // Persist to Firestore
    if (bothSidesDeleted && !updatedMsg.isReported) {
      deleteMessageFromFirestore(messageId).catch(() => {});
    } else {
      saveMessageToFirestore(updatedMsg).catch(() => {});
    }

    showToastNotification('پیغام آپ کی طرف سے حذف کر دیا گیا۔');
  };

  // PART C1: Undo per-side message delete within 5 seconds
  const handleUndoDeleteMessageForUser = (messageId: string, role: 'sender' | 'receiver') => {
    setMessages((prev) => {
      const existing = prev.find((m) => m.id === messageId);
      if (existing) {
        const restored: VillageMessage = {
          ...existing,
          deletedBySender: role === 'sender' ? false : existing.deletedBySender,
          deletedByRecipient: role === 'receiver' ? false : existing.deletedByRecipient,
        };
        saveMessageToFirestore(restored).catch(() => {});
        return prev.map((m) => (m.id === messageId ? restored : m));
      }
      // If it was removed because both sides deleted, restore from archive
      const arc = deletedMessagesArchive.find((a) => a.originalMessageId === messageId);
      if (arc) {
        const restoredFromArc: VillageMessage = {
          id: arc.originalMessageId,
          targetProfileId: arc.targetProfileId,
          targetProfileName: arc.targetProfileName,
          targetMobile: arc.targetMobile,
          senderProfileId: arc.senderProfileId,
          senderName: arc.senderName,
          senderMobile: arc.senderMobile,
          messageText: arc.messageText,
          audioData: arc.audioData,
          audioDurationSeconds: arc.audioDurationSeconds,
          inquiryType: 'general',
          createdAt: arc.originalCreatedAt,
          isRead: true,
          discussionThread: arc.discussionThread || [],
          deletedBySender: role === 'sender' ? false : true,
          deletedByRecipient: role === 'receiver' ? false : true,
        };
        saveMessageToFirestore(restoredFromArc).catch(() => {});
        return [restoredFromArc, ...prev];
      }
      return prev;
    });
    showToastNotification('پیغام واپس بحال کر دیا گیا ہے!');
  };

  // Super Admin Restore Message from Vault
  const handleRestoreDeletedMessage = (archiveId: string) => {
    const arc = deletedMessagesArchive.find((a) => a.id === archiveId);
    if (!arc) return;

    setMessages((prev) => {
      const existing = prev.find((m) => m.id === arc.originalMessageId);
      if (existing) {
        return prev.map((m) =>
          m.id === arc.originalMessageId
            ? { ...m, deletedBySender: false, deletedByRecipient: false }
            : m
        );
      }
      // Re-insert original message
      const restoredMsg: VillageMessage = {
        id: arc.originalMessageId,
        targetProfileId: arc.targetProfileId,
        targetProfileName: arc.targetProfileName,
        targetMobile: arc.targetMobile,
        senderProfileId: arc.senderProfileId,
        senderName: arc.senderName,
        senderMobile: arc.senderMobile,
        messageText: arc.messageText,
        audioData: arc.audioData,
        audioDurationSeconds: arc.audioDurationSeconds,
        inquiryType: 'general',
        createdAt: arc.originalCreatedAt,
        isRead: true,
        discussionThread: arc.discussionThread || [],
        deletedBySender: false,
        deletedByRecipient: false,
      };
      return [restoredMsg, ...prev];
    });

    setDeletedMessagesArchive((prev) => prev.filter((a) => a.id !== archiveId));
    showToastNotification('پیغام دوبارہ فعال ان باکس میں بحال کر دیا گیا ہے!');
  };

  // Super Admin Permanent Purge from Vault
  const handlePermanentDeleteArchivedMessage = (archiveId: string) => {
    setDeletedMessagesArchive((prev) => prev.filter((a) => a.id !== archiveId));
    showToastNotification('پیغام والٹ سے ہمیشہ کے لیے ختم کر دیا گیا!');
  };

  // Open Inbox for specific profile
  const handleOpenInboxForProfile = (phone: string) => {
    setInboxPreselectedPhone(phone);
    setIsInboxModalOpen(true);
  };

  // Admin Actions for Profiles
  const handleToggleVerifyProfile = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, isVerified: !p.isVerified };
        saveProfileToFirestore(updated).catch(() => {});
        return updated;
      })
    );
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    deleteProfileFromFirestore(id).catch(() => {});
    if (selectedProfile && selectedProfile.id === id) {
      setSelectedProfile(null);
    }
  };

  // User Authentication Handlers
  const handleLoginSuccess = (session: AuthUserSession) => {
    setActiveUserSession(session);
    localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(session));
    showToastNotification(`Welcome, ${session.name}! You have signed in successfully.`);
  };

  const handleLogout = () => {
    void dissociatePushSubscriptionOnLogout({
      session: activeUserSession,
      currentUserPhone,
      matchedProfileId: matchedUserProfile?.id || null,
    });
    setActiveUserSession(null);
    localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    showToastNotification('You have signed out successfully.');
  };

  // Profile Edit / Delete Security Interceptors
  const handleRequestEditProfile = (profile: VillageProfile) => {
    const isOwner = activeUserSession && activeUserSession.profileId === profile.id;
    const isAdmin = activeUserSession && activeUserSession.type === 'admin';

    if (isOwner || isAdmin) {
      setEditingProfileForModal(profile);
      setIsAddProfileModalOpen(true);
    } else {
      setAuthChallengeProfile(profile);
      setAuthChallengeAction('edit');
      setIsAuthChallengeOpen(true);
    }
  };

  const handleRequestDeleteProfile = (profile: VillageProfile) => {
    const isOwner = activeUserSession && activeUserSession.profileId === profile.id;
    const isAdmin = activeUserSession && activeUserSession.type === 'admin';

    if (isOwner || isAdmin) {
      if (window.confirm(`کیا آپ واقعی "${profile.name}" کا پروفائل حذف کرنا چاہتے ہیں؟`)) {
        handleDeleteProfile(profile.id);
        showToastNotification(`پروفائل "${profile.name}" کامیابی سے حذف ہو گئی!`);
      }
    } else {
      setAuthChallengeProfile(profile);
      setAuthChallengeAction('delete');
      setIsAuthChallengeOpen(true);
    }
  };

  const handleAuthChallengeAuthorized = (profile: VillageProfile, action: 'edit' | 'delete') => {
    const session: AuthUserSession = {
      type: 'profile_owner',
      id: profile.id,
      username: profile.username || profile.name,
      name: profile.name,
      email: profile.email,
      profileId: profile.id,
      avatar: profile.personImage,
      loginTime: new Date().toISOString(),
    };
    setActiveUserSession(session);
    localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(session));

    if (action === 'edit') {
      setEditingProfileForModal(profile);
      setIsAddProfileModalOpen(true);
    } else if (action === 'delete') {
      handleDeleteProfile(profile.id);
      showToastNotification(`پروفائل "${profile.name}" حذف ہو گئی!`);
    }
  };

  const handleOpenForgotPassword = (profile?: VillageProfile) => {
    setAuthModalInitialMode('reset');
    setIsAuthModalOpen(true);
  };

  // Admin Actions for News Events & Banner Slides
  const handleAddNewsEvent = async (
    eventData: Omit<VillageNewsEvent, 'id' | 'createdAt' | 'author'>,
    compressedBannerDoc?: { dataUrl: string; width: number; height: number; byteSize: number } | null
  ) => {
    const newId = `event-${Date.now()}`;
    const newEv: VillageNewsEvent = {
      ...eventData,
      id: newId,
      author: 'ثمر سعید (سپر ایڈمن)',
      createdAt: new Date().toISOString(),
    };
    if (compressedBannerDoc && compressedBannerDoc.dataUrl) {
      await saveBannerSlideImageDoc(newId, {
        eventId: newId,
        imageData: compressedBannerDoc.dataUrl,
        width: compressedBannerDoc.width,
        height: compressedBannerDoc.height,
        byteSize: compressedBannerDoc.byteSize,
        updatedAt: new Date().toISOString(),
      });
      setBannerImagesVersion((v) => v + 1);
    }
    setNewsEvents((prev) => [newEv, ...prev]);
    saveNewsEventToFirestore(newEv).catch(() => {});

    // Broadcast announcement notification to all villagers
    const announcementNotif: PortalNotificationItem = {
      id: `notif-ann-${newId}`,
      isGlobal: true,
      type: 'announcement',
      title: `📢 گاؤں کا اہم اعلان: ${newEv.title}`,
      body: newEv.content,
      senderName: newEv.author,
      createdAt: newEv.createdAt,
      isRead: false,
    };
    setPortalNotifications((prev) => [announcementNotif, ...prev]);
    saveNotificationToFirestore(announcementNotif).catch(() => {});
  };

  const handleUpdateNewsEvent = (updatedEv: VillageNewsEvent) => {
    setNewsEvents((prev) => prev.map((ev) => (ev.id === updatedEv.id ? updatedEv : ev)));
    saveNewsEventToFirestore(updatedEv).catch(() => {});
    setBannerImagesVersion((v) => v + 1);
  };

  const handleDeleteNewsEvent = (id: string) => {
    setNewsEvents((prev) => prev.filter((ev) => ev.id !== id));
    deleteNewsEventFromFirestore(id).catch(() => {});
    deleteBannerSlideImageDoc(id).catch(() => {});
    setBannerImagesVersion((v) => v + 1);
  };

  const handleTogglePopupNewsEvent = (id: string) => {
    setNewsEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev;
        const updated = { ...ev, isPopupOnLaunch: !ev.isPopupOnLaunch };
        saveNewsEventToFirestore(updated).catch(() => {});
        return updated;
      })
    );
  };

  const handleExportData = () => {
    const data = {
      village: 'Ratta Kallan, Jhang',
      exportedAt: new Date().toISOString(),
      facebookPageUrl,
      villageBgImage,
      profiles,
      messages,
      newsEvents,
      mosques,
      institutes,
      transports,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ratta-kallan-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.newsEvents) setNewsEvents(parsed.newsEvents);
        if (parsed.mosques) setMosques(parsed.mosques);
        if (parsed.institutes) setInstitutes(parsed.institutes);
        if (parsed.transports) setTransports(parsed.transports);
        if (parsed.facebookPageUrl) setFacebookPageUrl(parsed.facebookPageUrl);
        if (parsed.villageBgImage) setVillageBgImage(parsed.villageBgImage);
        alert('ڈیٹا کامیابی سے بحال ہو گیا!');
      } catch (err) {
        alert('فائل درست نہیں ہے۔');
      }
    };
    reader.readAsText(file);
  };

  // Handle Mobile Bottom Nav Switch
  const handleMobileNavSelect = (tab: 'home' | 'news' | 'messages' | 'add') => {
    setMobileTab(tab);
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'news') {
      setIsNewsPopupOpen(true);
    } else if (tab === 'messages') {
      setInboxPreselectedPhone('');
      setIsInboxModalOpen(true);
    } else if (tab === 'add') {
      setRegisterDefaultTab('profile');
      setIsRegisterModalOpen(true);
    }
  };

  // Handle Drawer Navigation
  const handleDrawerNavigate = (
    destination:
      | 'home'
      | 'hospitals'
      | 'mosques'
      | 'institutes'
      | 'aischool'
      | 'management'
      | 'transport'
      | 'planner'
      | 'news'
      | 'messages'
      | 'add'
      | 'terms'
      | 'admin'
      | 'auth'
      | 'reset_password'
  ) => {
    if (destination === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (destination === 'hospitals') {
      setIsHospitalsModalOpen(true);
    } else if (destination === 'aischool') {
      setIsAiSchoolModalOpen(true);
    } else if (destination === 'management') {
      setSelectedMosqueForEdit(mosques[0] || null);
      setEditingEntityType('mosque');
      setIsTimetableModalOpen(true);
    } else if (destination === 'mosques') {
      setIsMosquesModalOpen(true);
    } else if (destination === 'institutes') {
      setIsInstitutesModalOpen(true);
    } else if (destination === 'transport') {
      setIsTransportModalOpen(true);
    } else if (destination === 'planner') {
      const el = document.getElementById('route-planner-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (destination === 'news') {
      setIsNewsPopupOpen(true);
    } else if (destination === 'messages') {
      setInboxPreselectedPhone('');
      setIsInboxModalOpen(true);
    } else if (destination === 'add') {
      setRegisterDefaultTab('profile');
      setIsRegisterModalOpen(true);
    } else if (destination === 'terms') {
      setIsTermsModalOpen(true);
    } else if (destination === 'admin') {
      setIsAdminModalOpen(true);
    } else if (destination === 'auth') {
      setAuthModalInitialMode('login');
      setIsAuthModalOpen(true);
    } else if (destination === 'reset_password') {
      setAuthModalInitialMode('reset');
      setIsAuthModalOpen(true);
    }
  };


  // Card render helpers for universal search isolation and regular list
  const renderProfileCard = (profile: VillageProfile) => {
    const whatsappClean = profile.whatsapp
      ? profile.whatsapp.replace(/\D/g, '').replace(/^0/, '92')
      : profile.mobile.replace(/\D/g, '').replace(/^0/, '92');
    const profileUnread = unreadCountsByProfileId[profile.id] || 0;
    const opStatus = getProfileOperatingStatus(profile);

    return (
      <div
        key={profile.id}
        className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl border border-stone-200/90 shadow-xs sm:shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between h-full relative min-w-0"
      >
        {/* Card Media Header */}
        <div className="relative h-20 sm:h-32 lg:h-36 bg-stone-900 overflow-hidden shrink-0">
          {profile.businessImage ? (
            <img
              src={profile.businessImage}
              alt={profile.businessName}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 flex items-center justify-center text-white/25">
              <Briefcase className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />

          {/* Notification Badge if messages arrived for this profile */}
          {profileUnread > 0 && (
            <div className="absolute top-1 sm:top-2.5 right-6 sm:right-12 z-20">
              <span className="px-1 sm:px-2.5 py-0.5 rounded-full text-[7px] sm:text-[10px] font-bold bg-red-600 text-white shadow-lg animate-pulse flex items-center gap-0.5 sm:gap-1 font-nastaliq">
                🔔 {profileUnread}
              </span>
            </div>
          )}

          {/* Person Avatar & Name overlay with responsive sizing for 4-col mobile & desktop */}
          <div className="absolute bottom-1 sm:bottom-2.5 right-1 sm:right-3 left-1 sm:left-3 flex flex-col sm:flex-row sm:items-end gap-0.5 sm:gap-2.5 z-10 min-w-0">
            <div className="relative shrink-0 self-center sm:self-auto">
              <img
                src={profile.personImage}
                alt={profile.name}
                className="w-7 h-7 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-full object-cover border sm:border-2 border-amber-400 shadow bg-stone-800"
              />
              {profile.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-amber-400 rounded-full p-0.5 shadow hidden sm:block">
                  <ShieldCheck className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-stone-950 fill-amber-400" />
                </div>
              )}
            </div>

            <div className="text-white drop-shadow min-w-0 flex-1 text-center sm:text-right w-full">
              <h4 className="font-bold text-[9px] sm:text-xs lg:text-base font-nastaliq leading-tight sm:leading-relaxed text-amber-200 truncate">
                {profile.name}
              </h4>
              <span className="text-[7.5px] sm:text-[10px] lg:text-xs text-stone-200 font-semibold block leading-tight sm:leading-relaxed truncate">
                {profile.businessName}
              </span>
            </div>
          </div>

          {/* Audio button on card */}
          <button
            onClick={() => handleSpeakCard(profile)}
            className={`absolute top-1 sm:top-2.5 right-1 sm:right-2.5 p-1 sm:p-2 rounded-full text-white backdrop-blur shadow z-10 cursor-pointer transition ${
              activeCardAudioId === profile.id
                ? 'bg-red-600 animate-voice-pulse'
                : 'bg-black/50 hover:bg-black/75'
            }`}
            title="تفصیل سنیں 🔊"
          >
            {activeCardAudioId === profile.id ? (
              <VolumeX className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            ) : (
              <Volume2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            )}
          </button>

          {/* Category pill */}
          <div className="absolute top-1 sm:top-2.5 left-1 sm:left-2.5 z-10 max-w-[68%]">
            <span className="px-1 sm:px-2.5 py-0.5 rounded-full text-[7px] sm:text-[10px] font-bold bg-emerald-800/90 text-white backdrop-blur shadow block truncate">
              {cats[profile.category] || profile.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-1.5 sm:p-3 lg:p-3.5 space-y-1 sm:space-y-2.5 flex-1 flex flex-col justify-between min-w-0">
          {/* Compact Mobile Info (<640px) for 4-Column Mobile Grid */}
          <div className="flex sm:hidden flex-col gap-0.5 min-w-0 font-nastaliq">
            <div className="flex items-center justify-center gap-1 min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opStatus.dotClass}`} />
              <span className="text-[7.5px] font-bold text-stone-700 truncate">
                {opStatus.statusTextUrdu}
              </span>
            </div>
            <div className="text-[7.5px] text-stone-500 text-center truncate">
              {profile.address}
            </div>
          </div>

          {/* Full Tablet & Desktop Details (>=640px) */}
          <div className="hidden sm:block space-y-2.5 min-w-0">
            {/* Business Dedicated Operating Hours, Break & Live Status Badge */}
            <div className="bg-gradient-to-r from-stone-50 via-amber-50/20 to-stone-50 border border-stone-200/90 rounded-2xl p-2 lg:p-2.5 space-y-1.5 font-nastaliq shadow-2xs">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opStatus.dotClass}`} />
                  <span
                    className={`text-xs font-bold ${
                      opStatus.color === 'emerald'
                        ? 'text-emerald-800'
                        : opStatus.color === 'amber'
                        ? 'text-amber-800'
                        : 'text-rose-800'
                    }`}
                  >
                    {opStatus.statusTextUrdu}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">({opStatus.statusTextEnglish})</span>
                </div>

                <span className="text-[10px] lg:text-[11px] font-bold text-stone-700 bg-white px-2 py-0.5 rounded-lg border border-stone-200 font-mono shadow-2xs" dir="ltr">
                  ⏰ {opStatus.openingTime} – {opStatus.closingTime}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 text-[10px] lg:text-[11px] text-stone-600 pt-1 border-t border-stone-200/60 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>دوپہر وقفہ / لنچ بریک:</span>
                </span>
                <span className="font-mono font-bold text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200/50" dir="ltr">
                  {opStatus.breakTime}
                </span>
              </div>
            </div>

            {/* Rate & Address */}
            <div className="flex items-center justify-between gap-2 text-xs bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 font-nastaliq">
              <div className="flex items-center gap-1 font-bold text-amber-950 min-w-0 flex-1">
                <span className="shrink-0">ریٹ:</span>
                <span className="truncate">{profile.chargesDescription || 'کام کے مطابق طے شدہ'}</span>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                رتہ کلاں
              </span>
            </div>

            <div className="text-xs text-stone-600 flex items-start gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-1" />
              <span className="line-clamp-1 break-words">{profile.address}</span>
            </div>
          </div>

          {/* Compact Action buttons on Mobile (<640px) so 4 columns fit without overflow */}
          <div className="grid grid-cols-2 gap-1 pt-0.5 sm:hidden font-nastaliq">
            {profile.mobile ? (
              <a
                href={`tel:${profile.mobile}`}
                className="min-h-[26px] py-1 px-1 rounded-lg bg-emerald-700 text-white font-bold text-[8px] flex items-center justify-center gap-0.5 shadow-2xs transition active:scale-95 truncate"
              >
                <Phone className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">کال</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedProfile(profile)}
                className="min-h-[26px] py-1 px-1 rounded-lg bg-stone-200 text-stone-700 font-bold text-[8px] flex items-center justify-center truncate"
              >
                <span>پروفائل</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedProfile(profile)}
              className="min-h-[26px] py-1 px-1 rounded-lg bg-stone-100 text-stone-800 font-bold text-[8px] border border-stone-200 flex items-center justify-center gap-0.5 transition cursor-pointer truncate"
            >
              <Eye className="w-2.5 h-2.5 text-stone-600 shrink-0" />
              <span className="truncate">تفصیل</span>
            </button>
          </div>

          {/* Full Action buttons on Tablet & Desktop (>=640px) */}
          <div className="hidden sm:block space-y-1.5 pt-1 font-nastaliq">
            <div className="grid grid-cols-3 gap-1.5">
              <a
                href={`tel:${profile.mobile}`}
                className="min-h-[40px] py-2 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>کال</span>
              </a>

              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] py-2 px-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span>واٹس ایپ</span>
              </a>

              <button
                onClick={() => setMessageTargetProfile(profile)}
                className="min-h-[40px] py-2 px-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>میسج</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedProfile(profile)}
                className="min-h-[40px] flex-1 py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 flex items-center justify-center gap-1 transition cursor-pointer font-nastaliq"
              >
                <Eye className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                <span>مکمل تفصیل</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestEditProfile(profile);
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer font-nastaliq shadow-2xs shrink-0"
                title="پروفائل ایڈٹ کریں (پاس ورڈ سے محفوظ)"
              >
                <Edit className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>ایڈٹ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHospitalCard = (hosp: VillageHospital) => {
    const isPlaying = activeCardAudioId === hosp.id;
    return (
      <div
        key={hosp.id}
        className="bg-white rounded-3xl border-2 border-red-300 p-4 shadow-sm flex flex-col justify-between gap-3 h-full font-nastaliq"
      >
        <div className="space-y-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-base text-stone-900 break-words">{hosp.name}</h4>
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                    {hosp.categoryUrdu}
                  </span>
                </div>
                <span className="text-xs text-stone-500 block">اوقات: {hosp.timing}</span>
              </div>
            </div>

            <button
              onClick={() => handleSpeakHospital(hosp)}
              className={`p-2 rounded-xl text-xs font-bold transition shadow shrink-0 cursor-pointer ${
                isPlaying ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-100 text-stone-800 hover:bg-red-100'
              }`}
              title="آواز سنیں 🔊"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-600" />}
            </button>
          </div>

          <div className="text-xs text-stone-600 flex items-center justify-between gap-2 bg-stone-50 p-2.5 rounded-2xl border border-stone-200 flex-wrap">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="truncate">{hosp.address} ({hosp.distance})</span>
            </span>
            {hosp.is24Hours && (
              <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                24 گھنٹے
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <a
            href={`tel:${hosp.contact.replace(/\D/g, '')}`}
            className="min-h-[42px] flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>فوری کال: <span className="font-mono" dir="ltr">{hosp.contact}</span></span>
          </a>
        </div>
      </div>
    );
  };

  const renderMosqueCard = (m: VillageMosque) => (
    <div
      key={m.id}
      className="bg-white rounded-3xl border border-emerald-200 p-4 shadow-sm flex flex-col justify-between gap-3 h-full font-nastaliq"
    >
      <div className="space-y-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {m.image ? (
              <img
                src={m.image}
                alt={m.name}
                className="w-12 h-12 rounded-2xl object-cover border border-emerald-300 shrink-0 bg-emerald-950"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <Compass className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-base text-stone-900 truncate">{m.name}</h4>
              <span className="text-xs text-stone-500 block truncate">خطیب: {m.imamName}</span>
            </div>
          </div>
          <button
            onClick={() => handleSpeakMosque(m)}
            className={`p-2 rounded-xl text-xs font-bold transition shadow shrink-0 cursor-pointer ${
              activeCardAudioId === m.id ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-100 text-stone-800 hover:bg-emerald-100'
            }`}
            title="آواز سنیں 🔊"
          >
            {activeCardAudioId === m.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-700" />}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1 text-[11px] text-center bg-emerald-50/70 p-2 rounded-2xl border border-emerald-200 font-mono">
          <div className="min-w-0"><span className="block text-[9px] font-nastaliq text-stone-500">فجر</span><strong className="text-emerald-950 block truncate">{m.prayerTimes?.fajr || '05:15'}</strong></div>
          <div className="min-w-0"><span className="block text-[9px] font-nastaliq text-stone-500">ظہر</span><strong className="text-emerald-950 block truncate">{m.prayerTimes?.dhuhr || '01:30'}</strong></div>
          <div className="min-w-0"><span className="block text-[9px] font-nastaliq text-stone-500">عصر</span><strong className="text-emerald-950 block truncate">{m.prayerTimes?.asr || '05:00'}</strong></div>
          <div className="min-w-0"><span className="block text-[9px] font-nastaliq text-stone-500">مغرب</span><strong className="text-emerald-950 block truncate">{m.prayerTimes?.maghrib || '06:40'}</strong></div>
          <div className="min-w-0"><span className="block text-[9px] font-nastaliq text-stone-500">عشاء</span><strong className="text-emerald-950 block truncate">{m.prayerTimes?.isha || '08:15'}</strong></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-stone-600 pt-1">
        <span className="flex items-center gap-1 min-w-0 flex-1">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">{m.location}</span>
        </span>
        <button onClick={() => setIsMosquesModalOpen(true)} className="text-emerald-700 font-bold hover:underline cursor-pointer shrink-0">
          تمام اوقات دیکھیں ➔
        </button>
      </div>
    </div>
  );

  const renderInstituteCard = (inst: VillageInstitute) => (
    <div
      key={inst.id}
      className="bg-white rounded-3xl border border-blue-200 p-4 shadow-sm flex flex-col justify-between gap-3 h-full font-nastaliq"
    >
      <div className="space-y-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {inst.image ? (
              <img
                src={inst.image}
                alt={inst.name}
                className="w-12 h-12 rounded-2xl object-cover border border-blue-300 shrink-0 bg-blue-950"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-base text-stone-900 truncate">{inst.name}</h4>
              <span className="text-xs text-stone-500 block truncate">ہیڈ ماسٹر: {inst.headName}</span>
            </div>
          </div>
          <button
            onClick={() => handleSpeakInstitute(inst)}
            className={`p-2 rounded-xl text-xs font-bold transition shadow shrink-0 cursor-pointer ${
              activeCardAudioId === inst.id ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-100 text-stone-800 hover:bg-blue-100'
            }`}
            title="آواز سنیں 🔊"
          >
            {activeCardAudioId === inst.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-700" />}
          </button>
        </div>

        <div className="text-xs text-stone-700 bg-blue-50/60 p-2.5 rounded-2xl border border-blue-100 space-y-1">
          <div className="truncate"><strong>کلاسیں:</strong> {inst.classesOffered}</div>
          <div className="truncate"><strong>اوقات:</strong> {inst.timing}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-stone-600 pt-1">
        <span className="flex items-center gap-1 min-w-0 flex-1">
          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">{inst.location}</span>
        </span>
        <button onClick={() => setIsInstitutesModalOpen(true)} className="text-blue-700 font-bold hover:underline cursor-pointer shrink-0">
          مکمل تفصیل ➔
        </button>
      </div>
    </div>
  );

  const renderTransportCard = (veh: VillageTransport) => (
    <div
      key={veh.id}
      className="bg-white rounded-3xl border border-amber-200 p-4 shadow-sm flex flex-col justify-between gap-3 h-full font-nastaliq"
    >
      <div className="space-y-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {veh.image ? (
              <img
                src={veh.image}
                alt={veh.title}
                className="w-12 h-12 rounded-2xl object-cover border border-amber-300 shrink-0 bg-stone-900"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Bus className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-base text-stone-900 truncate">{veh.title}</h4>
              <span className="text-xs text-stone-500 block truncate">ڈرائیور: {veh.driverName}</span>
            </div>
          </div>
          <button
            onClick={() => handleSpeakTransport(veh)}
            className={`p-2 rounded-xl text-xs font-bold transition shadow shrink-0 cursor-pointer ${
              activeCardAudioId === veh.id ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-100 text-stone-800 hover:bg-amber-100'
            }`}
            title="آواز سنیں 🔊"
          >
            {activeCardAudioId === veh.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-700" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200">
          <div className="truncate"><strong>روٹ:</strong> {veh.route}</div>
          <div className="truncate"><strong>روانگی:</strong> {veh.departureTime}</div>
          <div className="truncate"><strong>کرایہ:</strong> {veh.fare}</div>
          <div className="truncate"><strong>نمبر پلیٹ:</strong> <span className="font-mono" dir="ltr">{veh.vehicleNumber}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <a
          href={`tel:${veh.driverMobile.replace(/\D/g, '')}`}
          className="min-h-[42px] flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>ڈرائیور کو کال کریں: <span className="font-mono" dir="ltr">{veh.driverMobile}</span></span>
        </a>
      </div>
    </div>
  );

  // Separate Admin Entrance Page (#admin) — Never mixed with normal user screens
  if (isAdminSupervisionRoute) {
    return (
      <AdminSupervisionPage
        activeSession={activeUserSession}
        onAdminLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onBackToPortal={() => {
          setIsAdminSupervisionRoute(false);
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', window.location.pathname);
          }
        }}
        profiles={profiles}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
        mosques={mosques}
        onSaveMosque={handleSaveMosque}
        onDeleteMosque={handleDeleteMosque}
        institutes={institutes}
        onSaveInstitute={handleSaveInstitute}
        onDeleteInstitute={handleDeleteInstitute}
        transports={transports}
        onSaveTransport={handleSaveTransport}
        onDeleteTransport={handleDeleteTransport}
        hospitals={hospitals}
        onSaveHospital={handleSaveHospital}
        onDeleteHospital={handleDeleteHospital}
        newsEvents={newsEvents}
        onSaveNewsEvent={(ev) => {
          setNewsEvents((prev) => {
            const idx = prev.findIndex((item) => item.id === ev.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = ev;
              return copy;
            }
            return [ev, ...prev];
          });
          saveNewsEventToFirestore(ev).catch(() => {});
          setBannerImagesVersion((v) => v + 1);
        }}
        onDeleteNewsEvent={handleDeleteNewsEvent}
        onBannerImagesChanged={() => setBannerImagesVersion((v) => v + 1)}
        announcements={announcements}
        messages={messages}
        onDeleteMessage={handleDeleteMessage}
        alerts={adminAlerts}
        onResolveAlert={handleResolveAlert}
        onDeleteAlert={handleDeleteAlert}
        helpNotices={helpNotices}
        onSaveHelpNotice={handleSaveHelpNotice}
        onDeleteHelpNotice={handleDeleteHelpNotice}
        mandiRates={mandiRates}
        onSaveMandiRates={(items) => {
          setMandiRates(items);
          savePortalSettingsToFirestore({ mandiRates: items }).catch(() => {});
        }}
        shelters={shelters}
        onSaveShelters={(items) => {
          setShelters(items);
          savePortalSettingsToFirestore({ shelters: items }).catch(() => {});
        }}
        helpGuides={helpGuides}
        onSaveHelpGuides={(items) => {
          setHelpGuides(items);
          savePortalSettingsToFirestore({ helpGuides: items }).catch(() => {});
        }}
        customKeywords={customKeywords}
        onSaveCustomKeywords={(items) => {
          setCustomKeywords(items);
          savePortalSettingsToFirestore({ customKeywords: items }).catch(() => {});
        }}
        floodAlert={floodAlertStatus}
        onSaveFloodAlert={(status) => {
          setFloodAlertStatus(status);
          savePortalSettingsToFirestore({ floodAlertStatus: status }).catch(() => {});
        }}
      />
    );
  }

  return (
    <div
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      lang={lang}
      className={`min-h-screen relative text-stone-900 flex flex-col pb-28 md:pb-12 select-none overflow-x-hidden ${
        lang === 'en' ? 'font-sans leading-snug' : 'font-urdu-clean'
      }`}
    >
      {/* Optional Village Background Image */}
      {villageBgImage ? (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-500 opacity-20"
          style={{ backgroundImage: `url(${villageBgImage})` }}
        />
      ) : null}

      {/* Background soft tint */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-stone-100/90" />

      {/* Floating Notification Toast (Clickable to open target conversation or Notification Center) */}
      {toastMessage && (
        <div
          onClick={() => {
            if (toastActionTarget?.messageId) {
              setInboxInitialMessageId(toastActionTarget.messageId);
              if (toastActionTarget.recipientPhone) {
                setInboxPreselectedPhone(toastActionTarget.recipientPhone);
              }
              setIsInboxModalOpen(true);
              setToastMessage(null);
              setToastActionTarget(null);
            } else if (toastActionTarget?.openNotifications) {
              setIsNotificationCenterOpen(true);
              setToastMessage(null);
              setToastActionTarget(null);
            }
          }}
          className={`fixed top-14 left-4 right-4 z-50 max-w-md mx-auto bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center justify-between gap-2 animate-in slide-in-from-top-4 duration-300 ${
            toastActionTarget ? 'cursor-pointer hover:from-emerald-700 hover:to-teal-800' : ''
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold font-nastaliq min-w-0">
            <span className="p-1.5 bg-amber-400 text-stone-950 rounded-full shrink-0">🔔</span>
            <span className="break-words">{toastMessage}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToastMessage(null);
              setToastActionTarget(null);
            }}
            className="p-1 text-emerald-200 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clean, Polished Top Header with Embedded Universal Search Bar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-950 text-white shadow-xl border-b border-emerald-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 space-y-2">
          {/* Top Brand & Utility Row (Cleaned & De-cluttered) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Main Menu Hamburger */}
              <button
                onClick={() => setIsMainMenuOpen(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 min-h-[38px] min-w-[38px]"
                title="مین مینیو"
                aria-label="Main Menu"
              >
                <Menu className="w-5 h-5 text-amber-300" />
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/logo.png"
                  alt="رتہ کلاں جھنگ پورٹل لوگو"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-amber-400/90 shadow-md shrink-0 bg-emerald-950"
                />
                <div className="min-w-0">
                  <h1 className="font-bold text-sm sm:text-base text-amber-200 font-nastaliq leading-relaxed truncate">
                    رتہ کلاں جھنگ پورٹل
                  </h1>
                  <span className="text-[10px] text-emerald-300 font-nastaliq block leading-relaxed truncate">
                    کمیونٹی سروسز و ہنر مند ڈائریکٹری
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* News events indicator */}
              <button
                onClick={() => setIsNewsPopupOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition active:scale-95 font-nastaliq min-h-[34px]"
                title="گاؤں کے واقعات و خبریں"
              >
                <Megaphone className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">خبریں</span>
                <span className="font-mono">({newsEvents.length})</span>
              </button>

              {/* Messages button with recipient-scoped unread badge */}
              <button
                onClick={() => {
                  setInboxPreselectedPhone('');
                  setInboxInitialMessageId(null);
                  setIsInboxModalOpen(true);
                }}
                className="relative p-1.5 sm:px-2.5 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs cursor-pointer flex items-center gap-1 transition min-h-[34px]"
                title="پیغامات / ان باکس"
              >
                <Mail className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="text-[10px] font-nastaliq hidden sm:inline">ان باکس</span>
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Center Bell button with unread badge */}
              <button
                onClick={() => setIsNotificationCenterOpen(true)}
                className="relative p-1.5 sm:px-2.5 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs cursor-pointer flex items-center gap-1 transition min-h-[34px]"
                title="اطلاعات و نوٹیفکیشنز (Notifications & Sound Settings)"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-[10px] font-nastaliq hidden md:inline">اطلاعات</span>
                {unreadNotificationIds.size > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationIds.size}
                  </span>
                )}
              </button>

              {/* Language Switcher */}
              <button
                onClick={() =>
                  setLang((prev) => (prev === 'ur' ? 'pa' : prev === 'pa' ? 'en' : 'ur'))
                }
                className="px-2 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-amber-200 rounded-xl text-[10px] font-bold border border-emerald-700/60 cursor-pointer transition min-h-[34px]"
                title="زبان تبدیل کریں"
              >
                {lang === 'ur' ? 'اردو' : lang === 'pa' ? 'پنجابی' : 'EN'}
              </button>

              {/* Account / Personal Security Sign In Button */}
              {activeUserSession ? (
                <button
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  dir="ltr"
                  lang="en"
                  className="px-2 sm:px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-[10px] sm:text-xs cursor-pointer flex items-center gap-1.5 border border-emerald-500/50 shadow-xs transition font-sans min-h-[34px]"
                  title={`${activeUserSession.name} (Signed In — Click for Account & Sign Out)`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="font-bold truncate max-w-[60px] sm:max-w-[90px]">
                    {activeUserSession.name.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalInitialMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  dir="ltr"
                  lang="en"
                  className="px-2 sm:px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-[10px] sm:text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs transition active:scale-95 font-sans min-h-[34px]"
                  title="Sign In to your account"
                >
                  <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-950 shrink-0" />
                  <span className="hidden xs:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Prominent Universal Search Bar Embedded in Header */}
          <div className="relative">
            <div
              className={`bg-white rounded-2xl p-1.5 sm:p-2 shadow-lg border-2 flex items-center gap-1.5 sm:gap-2 transition-all ${
                isVoiceSearching
                  ? 'border-red-500 ring-2 ring-red-300 bg-red-50/20'
                  : 'border-amber-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-300'
              }`}
            >
              {/* Clickable Search Icon Button (Performs Search Action) */}
              <button
                type="button"
                onClick={handleExecuteSearchBarAction}
                className="p-1.5 sm:p-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold shrink-0 cursor-pointer transition active:scale-95 shadow-2xs flex items-center gap-1"
                title="تلاش کریں (Search Now)"
                aria-label="تلاش کریں"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-nastaliq hidden sm:inline">تلاش</span>
              </button>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeFooterPage && e.target.value.trim().length > 0) {
                    navigateToFooterPage(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExecuteSearchBarAction();
                  }
                }}
                placeholder={
                  isVoiceSearching
                    ? 'سن رہے ہیں... بولیں (Listening...)'
                    : 'کچھ بھی تلاش کریں: ڈاکٹر، سکول، مسجد، گاڑی، منڈی ریٹ، نام...'
                }
                className="flex-1 text-stone-900 text-xs sm:text-sm font-semibold focus:outline-none bg-transparent placeholder:text-stone-400 font-nastaliq min-w-0"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center text-xs font-bold cursor-pointer transition shrink-0"
                  title="تلاش صاف کریں"
                >
                  ✕
                </button>
              )}

              {/* Voice Search (SpeechRecognition) Button Embedded in Header Bar */}
              <button
                type="button"
                onClick={handleHeaderVoiceSearch}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ${
                  isVoiceSearching
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
                title="آواز سے بول کر تلاش کریں (Voice Search)"
              >
                {isVoiceSearching ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-nastaliq hidden xs:inline">سن رہے ہیں...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-[10px] font-nastaliq hidden xs:inline">بولیں</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick 1-Tap Keyword Badges for Instant Illiterate / Mobile Filter (Hidden during active search to prevent clutter) */}
            {!searchQuery.trim() && (
              <div className="quick-search-container flex flex-wrap items-center gap-2 pt-2 text-[11px]">
                <span className="text-emerald-300 font-nastaliq shrink-0 font-bold py-0.5">فوری تلاش:</span>
                {[
                  { label: 'ڈاکٹر', icon: '🩺' },
                  { label: 'ہسپتال', icon: '🏥' },
                  { label: 'جامع مسجد', icon: '🕌' },
                  { label: 'سکول', icon: '🏫' },
                  { label: 'جھنگ گاڑی', icon: '🚌' },
                  { label: 'منڈی ریٹ', icon: '🌾' },
                  { label: 'الیکٹریشن', icon: '⚡' },
                  { label: 'مستری', icon: '🔨' },
                  { label: 'ٹریکٹر', icon: '🚜' },
                  { label: 'کریانہ', icon: '🛒' },
                  { label: 'ایڈمن پینل', icon: '🔐' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectQuickVoiceTag(item.label)}
                    className={`px-2.5 py-1 rounded-xl border whitespace-nowrap shrink-0 font-nastaliq cursor-pointer transition inline-flex items-center gap-1 ${
                      searchQuery === item.label
                        ? 'bg-amber-400 text-stone-950 font-bold border-amber-300 shadow'
                        : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100 border-emerald-700/60'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container - Responsive Across Mobile (320px+), Tablet & Desktop */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-3 flex-1 flex flex-col relative z-10">
        {/* ========================================================================= */}
        {/* CONDITIONAL RENDERING: STRICT SEARCH ISOLATION VS NORMAL HOME VIEW */}
        {/* ========================================================================= */}
        {activeFooterPage ? (
          /* ========================================================================= */
          /* DEDICATED FOOTER PAGE VIEW ("پرائیویسی پالیسی", "شرائط و ضوابط", "ایمرجنسی") */
          /* ========================================================================= */
          <FooterPageView
            page={activeFooterPage}
            onBack={() => navigateToFooterPage(null)}
            lang={lang}
            hospitals={hospitals}
            activeSession={activeUserSession}
            onOpenHospitals={() => setIsHospitalsModalOpen(true)}
            onOpenDonorList={() => setIsHelpNoticeboardOpen(true)}
            onOpenLogin={() => {
              setAuthModalInitialMode('login');
              setIsAuthModalOpen(true);
            }}
            onOpenMyProfileOrAuth={() => {
              if (matchedUserProfile) {
                setSelectedProfile(matchedUserProfile);
              } else {
                setAuthModalInitialMode('login');
                setIsAuthModalOpen(true);
              }
            }}
          />
        ) : searchQuery.trim().length > 0 ? (
          /* STRICT UNIVERSAL SEARCH RESULTS VIEW: Surfaces Everything on the Portal at the Front */
          <div id="universal-search-front-results" className="space-y-4 my-2">
            {/* Search Header Bar with Total Count, Privacy Guarantee & Clear Button */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-950 text-white p-3.5 sm:p-4 rounded-3xl shadow-lg border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-nastaliq">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-emerald-200">مکمل پورٹل تلاش برائے:</span>
                    <span className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                      "{searchQuery}"
                    </span>
                    <span className="text-[11px] bg-emerald-800 text-amber-200 px-2 py-0.5 rounded-full border border-emerald-600">
                      کل نتائج: {universalSearchResults.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-200 block mt-0.5">
                    🔒 رازداری اصول: کسی کا یوزر نیم، پاس ورڈ یا ذاتی پیغامات تلاش میں شامل نہیں کیے جاتے — باقی تمام پورٹل ریکارڈ سامنے موجود ہے
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                title="تلاش ختم کریں"
              >
                <X className="w-4 h-4 text-amber-300" />
                <span className="font-nastaliq">تلاش ختم کریں</span>
              </button>
            </div>

            {/* 0. DIRECT PORTAL CONTROL PANELS & SECTIONS (e.g., Admin Panel #admin, Login, Password Reset, Register, AI School) */}
            {filteredPortalActions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 font-nastaliq px-1 border-b-2 border-amber-400 pb-1">
                  <span>✨ مطلوبہ پورٹل سیکشنز اور کنٹرول پینل ({filteredPortalActions.length})</span>
                  <span className="text-emerald-800 font-bold">فوری رسائی</span>
                </div>
                {filteredPortalActions.map((feat) => (
                  <div
                    key={feat.id}
                    className="bg-gradient-to-br from-emerald-950 via-stone-900 to-teal-950 text-white rounded-3xl border-2 border-amber-400 p-4 sm:p-5 shadow-xl space-y-3 font-nastaliq"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-stone-950">
                            {feat.badgeUrdu}
                          </span>
                          <span className="text-xs text-emerald-300 font-mono">{feat.titleEn}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-amber-300 leading-relaxed">
                          {feat.titleUrdu}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed bg-white/10 p-3 rounded-2xl border border-white/15">
                      {feat.descriptionUrdu}
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleTriggerPortalAction(feat.actionType)}
                        className="min-h-[52px] flex-1 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                      >
                        <ArrowRight className="w-5 h-5" />
                        <span>{feat.buttonLabelUrdu}</span>
                      </button>

                      {feat.secondaryActionType && feat.secondaryButtonLabelUrdu && (
                        <button
                          type="button"
                          onClick={() => handleTriggerPortalAction(feat.secondaryActionType!)}
                          className="min-h-[52px] px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm sm:text-base border border-emerald-400 shadow flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                        >
                          <KeyRound className="w-4 h-4 text-amber-300" />
                          <span>{feat.secondaryButtonLabelUrdu}</span>
                        </button>
                      )}

                      {feat.contactPhone && (
                        <a
                          href={`tel:${feat.contactPhone}`}
                          className="min-h-[52px] px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base shadow flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                        >
                          <PhoneCall className="w-5 h-5" />
                          <span>کال کریں: {feat.contactPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unified "بول کر پوچھیں" Assistant Answer Box for the Search Bar */}
            {searchAssistantAnswer && (
              <div className="bg-emerald-50 border-2 border-emerald-600 rounded-3xl p-4 space-y-3 shadow-md font-nastaliq">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                  <span className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-emerald-700" />
                    <span>مددگار کا جواب ("بول کر پوچھیں"):</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        unlockAudioContext();
                        stopSpeaking();
                        speakText(
                          searchAssistantAnswer.spokenText,
                          lang === 'en' ? 'en' : 'ur',
                          undefined,
                          { isFemaleVillageVoice: false, voiceGender: 'male', rate: 0.92, pitch: 1.0 }
                        );
                      }}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>جواب سنیں</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        unlockAudioContext();
                        stopSpeaking();
                        speakText(
                          searchAssistantAnswer.spokenText,
                          lang === 'en' ? 'en' : 'ur',
                          undefined,
                          { isFemaleVillageVoice: false, voiceGender: 'male', rate: 0.72, pitch: 1.0 }
                        );
                      }}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>آہستہ سنیں</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => stopSpeaking()}
                      className="min-h-[44px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <VolumeX className="w-4 h-4" />
                      <span>آواز روکیں</span>
                    </button>
                  </div>
                </div>

                <div className="text-base sm:text-lg font-bold text-stone-900 leading-loose whitespace-pre-line bg-white p-3.5 rounded-2xl border border-emerald-200">
                  {searchAssistantAnswer.displayText}
                </div>

                {/* Short List of Best Matches with Big Call Button or Portal Action Button */}
                {searchAssistantAnswer.matchedItems && searchAssistantAnswer.matchedItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-emerald-950 block">
                      بہترین نتائج (فوری ایکشن / فون کال):
                    </span>
                    {searchAssistantAnswer.matchedItems.map((mItem) => (
                      <div
                        key={mItem.id}
                        className="bg-white border-2 border-emerald-500 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                      >
                        <div className="text-right space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm sm:text-base text-stone-900">
                              {mItem.title}
                            </span>
                            {mItem.badgeText && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                                {mItem.badgeText}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-600 font-bold">
                            {mItem.categoryLabel} — 📍 {mItem.area}
                          </div>
                          {mItem.phone && (
                            <div className="font-mono font-bold text-sm text-emerald-800" dir="ltr">
                              {mItem.phone}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {mItem.portalActionType && (
                            <button
                              type="button"
                              onClick={() => handleTriggerPortalAction(mItem.portalActionType!)}
                              className="min-h-[52px] px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-extrabold text-sm sm:text-base rounded-2xl shadow flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                            >
                              <ArrowRight className="w-5 h-5" />
                              <span>{mItem.portalActionButtonLabel || 'کھولیں'}</span>
                            </button>
                          )}

                          {mItem.phone && (
                            <a
                              href={`tel:${mItem.phone.replace(/[^0-9+]/g, '')}`}
                              className="min-h-[52px] px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer transition active:scale-95"
                            >
                              <PhoneCall className="w-5 h-5" />
                              <span>فون کریں</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clarification Buttons when multiple people share similar names */}
                {searchAssistantAnswer.needsClarification &&
                  searchAssistantAnswer.clarificationOptions &&
                  searchAssistantAnswer.clarificationOptions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-amber-300">
                      <span className="text-xs sm:text-sm font-bold text-amber-950 block">
                        براہ کرم مطلوبہ شخص منتخب کریں:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchAssistantAnswer.clarificationOptions.map((personName) => (
                          <button
                            key={personName}
                            type="button"
                            onClick={() => {
                              setSearchQuery(personName);
                              const ans = answerVoiceQuestion(
                                personName,
                                {
                                  profiles,
                                  mosques,
                                  institutes,
                                  transports,
                                  hospitals,
                                  newsEvents,
                                  announcements,
                                },
                                lang
                              );
                              speakText(ans.spokenText, lang === 'en' ? 'en' : 'ur');
                            }}
                            className="min-h-[48px] px-4 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 text-stone-950 font-bold text-sm sm:text-base border-2 border-amber-400 flex items-center justify-between gap-2 cursor-pointer transition"
                          >
                            <span>👤 {personName}</span>
                            <ArrowRight className="w-4 h-4 text-amber-900 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Example Buttons when nothing matches or unclear */}
                {(searchAssistantAnswer.intent === 'not_found' ||
                  (searchAssistantAnswer.intent === 'unclear' && !searchAssistantAnswer.needsClarification)) && (
                  <div className="space-y-2 pt-2 border-t border-emerald-200">
                    <span className="text-xs font-bold text-stone-700 block">
                      مثال والے بٹن دبا کر پوچھیں:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DEFAULT_EXAMPLE_QUESTIONS.map((exQ) => (
                        <button
                          key={exQ}
                          type="button"
                          onClick={() => {
                            setSearchQuery(exQ);
                            const ans = answerVoiceQuestion(
                              exQ,
                              {
                                profiles,
                                mosques,
                                institutes,
                                transports,
                                hospitals,
                                newsEvents,
                                announcements,
                              },
                              lang
                            );
                            speakText(ans.spokenText, lang === 'en' ? 'en' : 'ur');
                          }}
                          className="min-h-[56px] px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-100 text-stone-900 font-bold text-sm sm:text-base border-2 border-emerald-400 flex items-center justify-between gap-2 cursor-pointer transition"
                        >
                          <span>{exQ}</span>
                          <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1. Matching Profiles List */}
            {filteredProfiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 font-nastaliq px-1 border-b border-stone-200 pb-1">
                  <span>مطلوبہ ہنر مند، دکانیں و کاریگر ({filteredProfiles.length})</span>
                  <span className="text-stone-500">رتہ کلاں</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {filteredProfiles.map((p) => renderProfileCard(p))}
                </div>
              </div>
            )}

            {/* 2. Matching Hospitals & Clinics */}
            {filteredHospitals.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-red-950 font-nastaliq px-1 border-b border-red-200 pb-1">
                  <span>مطلوبہ طبی خدمات و ہسپتال ({filteredHospitals.length})</span>
                  <span className="text-red-600 font-bold animate-pulse">24/7 الرٹ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {filteredHospitals.map((hosp) => renderHospitalCard(hosp))}
                </div>
              </div>
            )}

            {/* 3. Matching Mosques */}
            {filteredMosques.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 font-nastaliq px-1 border-b border-emerald-200 pb-1">
                  <span>مطلوبہ مساجد و نماز کے اوقات ({filteredMosques.length})</span>
                  <span className="text-stone-500">رتہ کلاں</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {filteredMosques.map((m) => renderMosqueCard(m))}
                </div>
              </div>
            )}

            {/* 4. Matching Schools / Institutes */}
            {filteredInstitutes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950 font-nastaliq px-1 border-b border-blue-200 pb-1">
                  <span>مطلوبہ اسکولز و تعلیمی ادارے ({filteredInstitutes.length})</span>
                  <span className="text-stone-500">رتہ کلاں</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {filteredInstitutes.map((inst) => renderInstituteCard(inst))}
                </div>
              </div>
            )}

            {/* 5. Matching Public Transport */}
            {filteredTransports.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950 font-nastaliq px-1 border-b border-amber-200 pb-1">
                  <span>مطلوبہ پبلک ٹرانسپورٹ و جھنگ گاڑیاں ({filteredTransports.length})</span>
                  <span className="text-stone-500">رتہ تا جھنگ</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {filteredTransports.map((veh) => renderTransportCard(veh))}
                </div>
              </div>
            )}

            {/* 6. Matching Mandi & Crop Rates */}
            {filteredMandiRates.length > 0 && (
              <div className="space-y-3 font-nastaliq">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950 px-1 border-b border-amber-300 pb-1">
                  <span>🌾 مطلوبہ غلہ منڈی اور زرعی اجناس کے ریٹس ({filteredMandiRates.length})</span>
                  <span className="text-stone-500">جھنگ / رتہ کلاں</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredMandiRates.map((rate) => (
                    <div
                      key={rate.id}
                      className="bg-white rounded-2xl border-2 border-amber-300 p-3.5 shadow-sm flex items-center justify-between gap-2"
                    >
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-stone-900">
                          🌾 {rate.cropNameUrdu} ({rate.cropNameEn})
                        </h4>
                        <span className="text-xs text-stone-500 block">منڈی: {rate.marketName}</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 font-extrabold text-xs sm:text-sm border border-amber-300">
                        {rate.rateText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Matching Emergency & Flood Shelters */}
            {filteredShelters.length > 0 && (
              <div className="space-y-3 font-nastaliq">
                <div className="flex items-center justify-between text-xs font-bold text-red-950 px-1 border-b border-red-300 pb-1">
                  <span>⛺ ہنگامی پناہ گاہیں اور شیلٹرز ({filteredShelters.length})</span>
                  <span className="text-red-700 font-bold">ہنگامی تحفظ</span>
                </div>
                {filteredShelters.map((sh) => (
                  <div
                    key={sh.id}
                    className="bg-white rounded-2xl border-2 border-red-300 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-stone-900">⛺ {sh.name}</h4>
                      <p className="text-xs text-stone-600">📍 مقام: {sh.location}</p>
                      <p className="text-xs text-emerald-900 font-bold">
                        گنجائش: {sh.capacityText} | انچارج: {sh.contactPerson}
                      </p>
                    </div>
                    {sh.contactPhone && (
                      <a
                        href={`tel:${sh.contactPhone.replace(/\D/g, '')}`}
                        className="min-h-[48px] px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>کال: {sh.contactPhone}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 8. Matching Village News Events & Official Announcements */}
            {(filteredNewsEvents.length > 0 || filteredAnnouncements.length > 0) && (
              <div className="space-y-3 font-nastaliq">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 px-1 border-b border-emerald-300 pb-1">
                  <span>
                    📢 گاؤں کی خبریں اور اعلانات ({filteredNewsEvents.length + filteredAnnouncements.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewsPopupOpen(true)}
                    className="text-emerald-700 underline cursor-pointer"
                  >
                    تمام خبریں کھولیں
                  </button>
                </div>
                {filteredNewsEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-emerald-300 p-4 shadow-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-base text-stone-900">{ev.title}</h4>
                      <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold">
                        {ev.date}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{ev.content}</p>
                    <div className="text-[11px] text-stone-500">📍 مقام: {ev.location}</div>
                  </div>
                ))}
                {filteredAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-amber-50 rounded-2xl border border-amber-300 p-4 shadow-sm space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-base text-stone-900">📣 {ann.title}</h4>
                      <span className="text-[11px] text-stone-600">{ann.date}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 9. Matching Public Help / Blood / Lost & Found Notices */}
            {filteredHelpNotices.length > 0 && (
              <div className="space-y-3 font-nastaliq">
                <div className="flex items-center justify-between text-xs font-bold text-rose-950 px-1 border-b border-rose-300 pb-1">
                  <span>🩸 کمیونٹی امداد، گمشدہ اشیاء و عطیہ خون نوٹس ({filteredHelpNotices.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsHelpNoticeboardOpen(true)}
                    className="text-rose-700 underline cursor-pointer"
                  >
                    نوٹس بورڈ کھولیں
                  </button>
                </div>
                {filteredHelpNotices.map((hn) => (
                  <div
                    key={hn.id}
                    className="bg-white rounded-2xl border-2 border-rose-300 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-stone-900">📌 {hn.title}</h4>
                      <p className="text-xs sm:text-sm text-stone-700">{hn.details}</p>
                      <p className="text-xs text-stone-500">
                        رابطہ: {hn.contactName} | 📍 {hn.location}
                      </p>
                    </div>
                    {hn.contactMobile && (
                      <a
                        href={`tel:${hn.contactMobile.replace(/\D/g, '')}`}
                        className="min-h-[48px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>کال: {hn.contactMobile}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 10. Matching How-To Guides */}
            {filteredHelpGuides.length > 0 && (
              <div className="space-y-3 font-nastaliq">
                <div className="flex items-center justify-between text-xs font-bold text-teal-950 px-1 border-b border-teal-300 pb-1">
                  <span>📖 پورٹل کے استعمال کی رہنمائی ({filteredHelpGuides.length})</span>
                  <span className="text-stone-500">طریقہ کار</span>
                </div>
                {filteredHelpGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-white rounded-2xl border border-teal-300 p-4 shadow-sm space-y-2"
                  >
                    <h4 className="font-bold text-base text-emerald-950">❓ {guide.questionUrdu}</h4>
                    <div className="text-xs sm:text-sm text-stone-700 space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                      {guide.stepsUrdu.map((st, idx) => (
                        <div key={idx}>{st}</div>
                      ))}
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      👉 بٹن دبائیں: <span className="bg-amber-100 px-2 py-0.5 rounded">{guide.buttonToTap}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* EXPLICIT EMPTY SEARCH STATE WHEN NO RELEVANT RESULTS ARE FOUND */}
            {universalSearchResults.length === 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 text-center border-2 border-dashed border-amber-400 shadow-md space-y-4 font-nastaliq">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-stone-900">
                    کوئی میچنگ رزلٹ نہیں ملا (Koi matching result nahi mila)
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 font-bold leading-relaxed max-w-xl mx-auto">
                    معذرت، "{searchQuery}" کے متعلق یہ معلومات فی الحال پورٹل پر دستیاب نہیں ہیں۔ براہ کرم املا چیک کریں یا نیچے دیے گئے بٹن دبا کر تلاش کریں:
                  </p>
                </div>

                <div className="quick-search-container flex flex-wrap items-center justify-center gap-2 pt-1">
                  {['ڈاکٹر', 'الیکٹریشن', 'مستری', 'ٹریکٹر', 'کریانہ', 'مسجد', 'سکول', 'جھنگ وین', 'منڈی ریٹ'].map(
                    (sampleTag) => (
                      <button
                        key={sampleTag}
                        type="button"
                        onClick={() => setSearchQuery(sampleTag)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-700 hover:text-white text-emerald-950 border border-emerald-300 text-xs font-bold transition cursor-pointer"
                      >
                        🔍 {sampleTag}
                      </button>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      setSearchQuery('');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow cursor-pointer transition"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-300" />
                    <span>تلاش صاف کریں (واپس ہوم پیج)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterDefaultTab('profile');
                      setIsRegisterModalOpen(true);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow cursor-pointer transition"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-300" />
                    <span>+ نیا کاروبار / نمبر شامل کریں</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* NORMAL FULL PORTAL VIEW (When not searching) */
          /* ========================================================================= */
          <>
            {/* Top Village News & Events Banner (Admin-controlled image per slide, 3s loop, touch pause) */}
            <VillageEventsBanner
              events={newsEvents}
              onOpenDetails={() => setIsNewsPopupOpen(true)}
              lang={lang}
              bannerImagesVersion={bannerImagesVersion}
            />

            {/* Direct On-Home-Screen "بول کر پوچھیں" (Ask by Voice) Panel for Elderly & Non-Readers */}
            <VoiceAskPanel
              isInlineHomeScreen={true}
              profiles={profiles}
              mosques={mosques}
              institutes={institutes}
              transports={transports}
              hospitals={hospitals}
              newsEvents={newsEvents}
              announcements={announcements}
              helpNotices={helpNotices}
              mandiRates={mandiRates}
              shelters={shelters}
              helpGuides={helpGuides}
              customKeywords={customKeywords}
              floodAlertStatus={floodAlertStatus}
              signedInUser={
                activeUserSession
                  ? {
                      id: activeUserSession.id,
                      uid: activeUserSession.uid,
                      name: activeUserSession.name,
                      mobile: activeUserSession.mobile,
                      email: activeUserSession.email,
                      profileId: activeUserSession.profileId,
                    }
                  : null
              }
              userMessages={activeUserSession ? messages : []}
              initialLang={lang}
              onApplyToSearchBar={(q) => setSearchQuery(q)}
            />

            {/* User Personal Mobile Number Setup & Messages Widget */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-3xl p-3 sm:p-3.5 mb-3 shadow-md border-2 border-emerald-400/80">
              {!currentUserPhone || isEditingUserPhone ? (
                <form onSubmit={handleSaveUserPhone} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold font-nastaliq text-xs sm:text-sm text-amber-300">
                          📱 اپنا موبائل فون نمبر درج کریں (Personal Mobile Portal)
                        </h4>
                        <p className="text-[10px] text-emerald-200 font-nastaliq">
                          ہر شہری اپنا نمبر درج کرے تاکہ ان کے نام کے پیغامات اور ذاتی ریکارڈ خود بخود موصول ہوں
                        </p>
                      </div>
                    </div>
                    {currentUserPhone && (
                      <button
                        type="button"
                        onClick={() => setIsEditingUserPhone(false)}
                        className="text-stone-300 hover:text-white text-xs font-nastaliq cursor-pointer"
                      >
                        منسوخ
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={userNameInput}
                      onChange={(e) => setUserNameInput(e.target.value)}
                      placeholder="آپ کا نام (اختیاری)"
                      className="px-3 py-2 rounded-xl bg-white/10 text-white placeholder-emerald-200 border border-emerald-400/50 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300 font-nastaliq"
                    />
                    <div className="flex-1 flex gap-1.5">
                      <input
                        type="tel"
                        value={userPhoneInput}
                        onChange={(e) => setUserPhoneInput(e.target.value)}
                        placeholder="موبائل نمبر: 03001234567 *"
                        className="flex-1 px-3 py-2 rounded-xl bg-white text-stone-900 font-mono text-xs font-bold border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        dir="ltr"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold font-nastaliq rounded-xl text-xs shadow shrink-0 cursor-pointer transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>محفوظ کریں</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 border border-emerald-500/60 shadow-inner">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-emerald-200 font-nastaliq">محفوظ موبائل نمبر:</span>
                        <span className="font-mono font-bold text-amber-300 text-sm tracking-wide">
                          {currentUserPhone}
                        </span>
                        {matchedUserProfile ? (
                          <span className="bg-emerald-700 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full font-nastaliq border border-emerald-500">
                            ✓ منسلک پروفائل: {matchedUserProfile.name} ({matchedUserProfile.businessName})
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setRegisterDefaultTab('profile');
                              setIsRegisterModalOpen(true);
                            }}
                            className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-nastaliq border border-amber-400/40 cursor-pointer"
                          >
                            + دکان / ہنر رجسٹر کریں
                          </button>
                        )}
                      </div>
                      {userDirectMessagesCount > 0 ? (
                        <span className="text-[11px] text-amber-300 font-bold font-nastaliq block animate-pulse mt-0.5">
                          📩 آپ کے لیے {userDirectMessagesCount} نئے پیغامات موصول ہوئے ہیں!
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-200 block font-nastaliq mt-0.5">
                          آپ کا نمبر پورٹل پر فعال ہے — پیغامات اور آرڈرز براہ راست آپ کو موصول ہوں گے۔
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        setInboxPreselectedPhone(currentUserPhone);
                        setIsInboxModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold font-nastaliq rounded-xl text-xs flex items-center gap-1 shadow cursor-pointer transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>میرے پیغامات ({userDirectMessagesCount})</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserPhoneInput(currentUserPhone);
                        setUserNameInput(currentUserName);
                        setIsEditingUserPhone(true);
                      }}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-emerald-200 rounded-xl text-xs cursor-pointer transition"
                      title="موبائل نمبر تبدیل کریں"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual AI School Banner - Featuring Sir Ashraf & Operating Hours */}
            <div
              onClick={() => setIsAiSchoolModalOpen(true)}
              className="bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-900 text-white rounded-3xl p-3.5 mb-3 shadow-xl border-2 border-indigo-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition active:scale-98 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base font-nastaliq text-amber-300 leading-relaxed">
                      رتہ کلاں ورچوئل AI اسکول
                    </h4>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow font-nastaliq">
                      رتہ کلاں اسکول مددگار
                    </span>
                    <span className="bg-amber-400 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow font-nastaliq flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
                      <span>{getSchoolOperatingStatus().statusTextUrdu}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200 font-nastaliq mt-0.5">
                    نرسری تا دسویں جماعت — اوقات: 08:00 AM تا 02:00 PM (تفریح: 10:30 تا 11:00 AM)
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs shrink-0 shadow font-nastaliq whitespace-nowrap self-end sm:self-center">
                اسکول کھولیں ➔
              </span>
            </div>

            {/* Emergency 1-Tap Quick Dial & Urgent Blood / Community Help Noticeboard */}
            <EmergencyQuickCallBox
              lang={lang}
              onOpenHospitals={() => setIsHospitalsModalOpen(true)}
            />

            <div className="mb-3">
              <button
                onClick={() => setIsHelpNoticeboardOpen(true)}
                className="w-full py-2.5 px-3.5 bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 hover:from-rose-800 hover:to-amber-700 text-white font-bold text-xs rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-nastaliq transition cursor-pointer active:scale-98 border border-red-300 text-right"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping shrink-0" />
                  <HeartPulse className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="leading-relaxed">
                    مدد درکار ہے — خون کا عطیہ / گمشدہ اشیاء و ہنگامی امداد نوٹس بورڈ
                  </span>
                </div>
                <span className="bg-white/20 px-2.5 py-1 rounded-xl text-[10px] shrink-0 self-end sm:self-center">
                  دیکھیں و درج کریں ➔
                </span>
              </button>
            </div>

            {/* Quick Services Buttons Row: Mosques, Schools, Transport, Hospitals, Management */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-3 text-xs">
              {/* Mosques & Prayer Timings */}
              <button
                onClick={() => setIsMosquesModalOpen(true)}
                className="p-3 rounded-2xl bg-white border border-emerald-300 shadow-sm flex flex-col items-center justify-center text-center gap-1 hover:bg-emerald-50 transition active:scale-95 cursor-pointer min-h-[84px]"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 text-emerald-800" />
                </div>
                <strong className="text-emerald-950 text-xs sm:text-sm font-nastaliq leading-relaxed">
                  مساجد ({mosques.length})
                </strong>
                <span className="text-[10px] sm:text-xs text-stone-500 leading-relaxed">اوقات نماز</span>
              </button>

              {/* Schools & Colleges */}
              <button
                onClick={() => setIsInstitutesModalOpen(true)}
                className="p-3 rounded-2xl bg-white border border-blue-300 shadow-sm flex flex-col items-center justify-center text-center gap-1 hover:bg-blue-50 transition active:scale-95 cursor-pointer min-h-[84px]"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-blue-800" />
                </div>
                <strong className="text-blue-950 text-xs sm:text-sm font-nastaliq leading-relaxed">
                  اسکولز ({institutes.length})
                </strong>
                <span className="text-[10px] sm:text-xs text-stone-500 leading-relaxed">ٹائم ٹیبل</span>
              </button>

              {/* Public Transport & Vans to Jhang */}
              <button
                onClick={() => setIsTransportModalOpen(true)}
                className="p-3 rounded-2xl bg-white border border-amber-300 shadow-sm flex flex-col items-center justify-center text-center gap-1 hover:bg-amber-50 transition active:scale-95 cursor-pointer min-h-[84px]"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Bus className="w-4 h-4 text-amber-800" />
                </div>
                <strong className="text-amber-950 text-xs sm:text-sm font-nastaliq leading-relaxed">
                  گاڑیاں ({transports.length})
                </strong>
                <span className="text-[10px] sm:text-xs text-stone-500 leading-relaxed">رتہ تا جھنگ</span>
              </button>

              {/* Hospitals & Medical Emergency Button */}
              <button
                onClick={() => setIsHospitalsModalOpen(true)}
                className="p-3 rounded-2xl bg-gradient-to-b from-red-50 to-rose-100 border-2 border-red-400 shadow-sm flex flex-col items-center justify-center text-center gap-1 hover:bg-red-100 transition active:scale-95 cursor-pointer relative min-h-[84px]"
              >
                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <HeartPulse className="w-4 h-4 animate-pulse" />
                </div>
                <strong className="text-red-950 text-xs sm:text-sm font-nastaliq leading-relaxed">
                  ہسپتال ({hospitals.length})
                </strong>
                <span className="text-[10px] sm:text-xs text-red-700 font-bold animate-pulse leading-relaxed">24/7 الرٹ</span>
              </button>

              {/* Mosque & School Management Login */}
              <button
                onClick={() => {
                  setSelectedMosqueForEdit(mosques[0] || null);
                  setEditingEntityType('mosque');
                  setIsTimetableModalOpen(true);
                }}
                className="col-span-2 sm:col-span-2 md:col-span-1 p-3 rounded-2xl bg-emerald-900/10 border border-emerald-500/60 shadow-sm flex flex-col items-center justify-center text-center gap-1 hover:bg-emerald-100/60 transition active:scale-95 cursor-pointer min-h-[84px]"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <strong className="text-emerald-950 text-xs sm:text-sm font-nastaliq leading-relaxed">
                  انتظامیہ لاگ ان
                </strong>
                <span className="text-[10px] sm:text-xs text-emerald-800 font-bold leading-relaxed">امام و پرنسپل</span>
              </button>
            </div>

            {/* Compact Live Mandi Rates & Community Guidelines Strip */}
            {mandiRates.length > 0 && (
              <div className="bg-white border border-emerald-200 rounded-2xl p-2.5 mb-3 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-800 text-amber-300 text-[11px] font-bold font-nastaliq shrink-0 flex items-center gap-1">
                  <span>🌾</span>
                  <span>منڈی ریٹ جھنگ:</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {mandiRates.map((rate) => (
                    <div
                      key={rate.id}
                      className="px-2.5 py-1 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-1.5 text-[11px] whitespace-nowrap font-nastaliq"
                    >
                      <span className="font-bold text-stone-800">{rate.cropNameUrdu}:</span>
                      <span className="font-bold text-emerald-700">
                        {rate.rateText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Religious Promotion Warning & Illiterate Help Banner */}
            <div className="space-y-2 mb-3">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-sm">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-base shrink-0">🚫</span>
                  <span className="font-bold text-amber-950 font-nastaliq text-[11px] sm:text-xs leading-relaxed">
                    مذہبی پروموشن اور فرقہ واریت سے پرہیز کریں۔ پورٹل صرف روزگار کے لیے ہے۔
                  </span>
                </div>
                <button
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-emerald-800 hover:underline font-bold text-[11px] shrink-0 cursor-pointer font-nastaliq px-2 py-1 rounded-lg bg-amber-100/70"
                >
                  اصول سنیں
                </button>
              </div>
            </div>

            {/* Categories Filter Buttons (Flex-wrap with 8px gap so buttons never collide) */}
            <div className="quick-search-container flex flex-wrap items-center gap-2 pb-2 mb-3">
              {/* Daily Wage Laborers & Available Today Toggle */}
              <button
                onClick={() => setOnlyAvailableWorkers((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition shadow-sm border cursor-pointer font-nastaliq flex items-center gap-1.5 min-h-[38px] ${
                  onlyAvailableWorkers
                    ? 'bg-amber-500 text-stone-950 border-amber-600 ring-2 ring-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${onlyAvailableWorkers ? 'bg-stone-950 animate-ping' : 'bg-emerald-600'}`} />
                <span>👷 آج دستیاب مزدور</span>
                {onlyAvailableWorkers && <span>✓</span>}
              </button>

              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition shadow-sm border cursor-pointer font-nastaliq min-h-[38px] ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cats.all}
              </button>
              {Object.entries(cats)
                .filter(([key]) => key !== 'all')
                .map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition shadow-sm border cursor-pointer font-nastaliq min-h-[38px] ${
                      selectedCategory === key
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>

            {/* Profiles Count Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 font-bold px-1 mb-2.5 font-nastaliq">
              <span>رتہ کلاں کاریگر و دکانیں ({Math.min(filteredProfiles.length, 16)})</span>
              <button
                onClick={() => setIsTermsModalOpen(true)}
                className="text-red-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>⚠️ خواتین کا نمبر ممنوع ہے</span>
              </button>
            </div>

            {/* Profiles Cards List (4x4 Responsive Grid — 16 Visible Profiles) */}
            {filteredProfiles.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-stone-300 space-y-3 my-4">
                <Search className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 font-nastaliq">
                  کوئی ہنر مند یا دکان نہیں ملی
                </h3>
                <p className="text-xs text-stone-500 font-nastaliq">
                  اگر مطلوبہ چیز موجود نہیں تو آپ خود گاؤں کے لیے کارڈ شامل کر سکتے ہیں۔
                </p>
                <button
                  onClick={() => {
                    setRegisterDefaultTab('profile');
                    setIsRegisterModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer font-nastaliq min-h-[40px]"
                >
                  + نیا کارڈ رجسٹر کریں
                </button>
              </div>
            ) : (
              <div className="profiles-grid-4x4 gap-1.5 sm:gap-3 lg:gap-4 items-stretch w-full">
                {filteredProfiles.slice(0, 16).map((profile) => renderProfileCard(profile))}
              </div>
            )}

            {/* Travel & Route Planner Section (In Body Area) */}
            <div id="route-planner-anchor" className="mt-8">
              <RoutePlannerSection lang={lang} />
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* COMPACT FOOTER: HELPLINE & COMPACT LEGAL LINKS                            */}
        {/* ========================================================================= */}
        <footer className="mt-4 bg-stone-900 text-stone-300 rounded-2xl p-3 sm:p-4 border-t-2 border-amber-500 shadow-xl space-y-2.5 text-xs">
          {/* Compact Admin & Helpline Bar */}
          <div className="bg-stone-950/90 border border-amber-400/60 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-nastaliq">
            <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-950" />
                </div>
                <span className="font-bold text-xs sm:text-sm text-amber-300 truncate">
                  مرکزی انتظامیہ و ہیلپ لائن
                </span>
              </div>

              <a
                href="tel:03270019099"
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 text-[11px] font-bold transition shadow-xs shrink-0"
                title="آفیشل ہیلپ لائن رتہ کلاں جھنگ"
              >
                <PhoneCall className="w-3 h-3 text-amber-200 shrink-0" />
                <span className="font-mono font-extrabold tracking-wide" dir="ltr">
                  0327-0019099
                </span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setIsAdminSupervisionRoute(true);
                  if (typeof window !== 'undefined') {
                    window.location.hash = '#admin';
                  }
                }}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer font-nastaliq shrink-0 active:scale-95 flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>ایڈمن لاگ ان</span>
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer font-nastaliq shrink-0 active:scale-95 flex items-center justify-center gap-1 border border-emerald-500"
              >
                <Lock className="w-3 h-3 shrink-0" />
                <span>ایڈمن پینل</span>
              </button>
              <a
                href={facebookPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 font-nastaliq shrink-0"
              >
                <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
                <span>فیس بک پیج</span>
              </a>
            </div>
          </div>

          {/* 3. Compact Community Notice */}
          <div className="bg-stone-800/80 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-[10px] text-amber-200 flex items-center gap-1.5 font-nastaliq">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              پورٹل پر کسی بھی قسم کی مذہبی پروموشن یا تفرقہ بازی سخت منع ہے۔ یہ پلیٹ فارم صرف رتہ کلاں کے شہریوں کے روزگار اور مدد کے لیے ہے۔
            </span>
          </div>

          {/* 4. Compact Footer Links: Privacy Policy, Terms & Emergency */}
          <div className="bg-stone-950/80 p-2 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-nastaliq">
            <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex-1">
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToFooterPage('privacy');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-emerald-600/80 transition active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">پرائیویسی پالیسی</span>
              </a>

              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToFooterPage('terms');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] flex items-center justify-center gap-1 border border-amber-300 transition active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                <span className="truncate">شرائط و ضوابط</span>
              </a>

              <a
                href="#emergency"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToFooterPage('emergency');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-red-400 transition active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="truncate">ایمرجنسی نمبرز</span>
              </a>
            </div>

            <div className="text-center sm:text-left text-[10px] text-stone-500 shrink-0 px-1">
              رتہ کلاں، جھنگ پورٹل © {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>

      {/* Floating "بول کر پوچھیں" Microphone Button on Every Main Screen */}
      <button
        type="button"
        onClick={() => {
          unlockAudioContext();
          setVoiceAskInitialQuestion('');
          setIsVoiceAskModalOpen(true);
        }}
        className="fixed bottom-[76px] md:bottom-6 left-2.5 sm:left-6 z-40 min-h-[46px] sm:min-h-[52px] bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white px-3.5 sm:px-4 py-2 rounded-full shadow-2xl border-2 border-amber-300 flex items-center gap-1.5 sm:gap-2 font-nastaliq font-extrabold text-xs sm:text-sm hover:scale-105 active:scale-95 transition cursor-pointer"
        title="بول کر پوچھیں (صوتی مددگار)"
        aria-label="بول کر پوچھیں"
      >
        <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
        <span>بول کر پوچھیں</span>
      </button>

      {/* Small, Non-Obstructive Clickable Floating Emergency Button (🚨 ایمرجنسی) */}
      <button
        onClick={() => navigateToFooterPage('emergency')}
        className="fixed bottom-[76px] md:bottom-6 right-2.5 sm:right-6 z-40 min-h-[46px] sm:min-h-[52px] bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white px-3 sm:px-3.5 py-2 rounded-full shadow-2xl border-2 border-white flex items-center gap-1.5 font-nastaliq font-bold text-xs hover:scale-105 active:scale-95 transition cursor-pointer"
        title="ایمرجنسی صفحہ کھولیں"
        aria-label="Emergency Page"
      >
        <span className="text-sm">🚨</span>
        <span className="text-[11px] font-bold text-white tracking-wide">ایمرجنسی</span>
      </button>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={mobileTab}
        onSelectTab={handleMobileNavSelect}
        onTriggerVoiceSearch={() => {
          unlockAudioContext();
          setVoiceAskInitialQuestion('');
          setIsVoiceAskModalOpen(true);
        }}
        isVoiceSearching={isVoiceSearching}
        unreadMessagesCount={totalUnreadCount}
        newsEventsCount={newsEvents.length}
        lang={lang}
      />

      {/* Main Slide-over Mobile Navigation Menu */}
      <MainMenuDrawer
        isOpen={isMainMenuOpen}
        onClose={() => setIsMainMenuOpen(false)}
        onNavigate={handleDrawerNavigate}
        currentLang={lang}
        onSetLang={setLang}
        unreadCount={totalUnreadCount}
        eventsCount={newsEvents.length}
      />

      {/* Voice Search Modal / Helper Dialog */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-emerald-600 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <Mic className="w-8 h-8 text-emerald-700 animate-bounce" />
            </div>

            <div>
              <h3 className="font-bold text-base font-nastaliq text-stone-900">
                {isVoiceSearching ? 'مائیکروفون آن ہے، بولیں...' : 'صوتی تلاش (Voice Search)'}
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-nastaliq">
                رتہ کلاں کے کسی بھی بھائی کا نام، ہنر، مسجد، سکول یا گاڑی کا نام بولیں یا نیچے سے منتخب کریں:
              </p>
            </div>

            {voiceTranscriptPreview && (
              <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-300 text-sm font-bold text-emerald-900">
                "{voiceTranscriptPreview}"
              </div>
            )}

            {/* Quick 1-tap keyword tags for guaranteed voice-less or voice-supported search */}
            <div className="space-y-2 text-right">
              <span className="text-[11px] font-bold text-stone-600 block font-nastaliq">
                فوری صوتی الفاظ (ایک کلک سے منتخب کریں):
              </span>
              <div className="quick-search-container flex flex-wrap gap-2 justify-center font-nastaliq">
                {[
                  'ڈاکٹر',
                  'الیکٹریشن',
                  'ٹریکٹر',
                  'مستری',
                  'کریانہ',
                  'درزی',
                  'جامع مسجد',
                  'سکول',
                  'جھنگ وین',
                  'دیہاڑی مزدور',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectQuickVoiceTag(tag)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold text-stone-800 border border-stone-300 transition shadow-sm cursor-pointer shrink-0"
                  >
                    🔊 {tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (voiceRecognizerRef.current) voiceRecognizerRef.current.stop();
                setIsVoiceSearching(false);
                setIsVoiceModalOpen(false);
              }}
              className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs cursor-pointer font-nastaliq"
            >
              بند کریں
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {/* 1. Village Mosques Modal */}
      <MosquesModal
        isOpen={isMosquesModalOpen}
        onClose={() => setIsMosquesModalOpen(false)}
        mosques={mosques}
        lang={lang}
        onRegisterMosque={() => {
          setRegisterDefaultTab('mosque');
          setIsRegisterModalOpen(true);
        }}
        onEditMosqueTimetable={(mosque) => {
          setSelectedMosqueForEdit(mosque);
          setEditingEntityType('mosque');
          setIsTimetableModalOpen(true);
        }}
      />

      {/* 2. Schools & Institutes Modal */}
      <InstitutesModal
        isOpen={isInstitutesModalOpen}
        onClose={() => setIsInstitutesModalOpen(false)}
        institutes={institutes}
        lang={lang}
        onRegisterInstitute={() => {
          setRegisterDefaultTab('institute');
          setIsRegisterModalOpen(true);
        }}
        onEditInstituteTimetable={(inst) => {
          setSelectedInstituteForEdit(inst);
          setEditingEntityType('institute');
          setIsTimetableModalOpen(true);
        }}
      />

      {/* 2b. AI Virtual School Modal (Nursery to 10th Matric) */}
      <AiSchoolModal
        isOpen={isAiSchoolModalOpen}
        onClose={() => setIsAiSchoolModalOpen(false)}
        lang={lang}
      />

      {/* 2c. Timetable Edit Modal (Mosques, Schools, Hospitals, Transports) */}
      <TimetableEditModal
        isOpen={isTimetableModalOpen}
        onClose={() => {
          setIsTimetableModalOpen(false);
          setSelectedMosqueForEdit(null);
          setSelectedInstituteForEdit(null);
          setSelectedHospitalForEdit(null);
          setSelectedTransportForEdit(null);
        }}
        entityType={editingEntityType}
        mosque={selectedMosqueForEdit}
        institute={selectedInstituteForEdit}
        hospital={selectedHospitalForEdit}
        transport={selectedTransportForEdit}
        onSaveMosque={handleSaveMosque}
        onSaveInstitute={handleSaveInstitute}
        onSaveHospital={handleSaveHospital}
        onSaveTransport={handleSaveTransport}
        lang={lang}
        activeSession={activeUserSession}
      />

      {/* 3. Transport Modal (Ratta Kallan to Jhang Vans & Buses) */}
      <TransportModal
        isOpen={isTransportModalOpen}
        onClose={() => setIsTransportModalOpen(false)}
        transports={transports}
        lang={lang}
        onRegisterTransport={() => {
          setRegisterDefaultTab('transport');
          setIsRegisterModalOpen(true);
        }}
        onEditTransport={handleEditTransport}
      />

      {/* 4. Village News Events Pop-up Modal */}
      <VillageNewsPopupModal
        isOpen={isNewsPopupOpen}
        onClose={() => setIsNewsPopupOpen(false)}
        events={newsEvents}
        lang={lang}
      />

      {/* 5. Unified Register Item Modal (Businesses, Mosques, Schools, Transports) */}
      <RegisterItemModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        defaultTab={registerDefaultTab}
        defaultMobile={currentUserPhone}
        lang={lang}
        existingProfiles={profiles}
        onSaveProfile={handleSaveProfile}
        onSaveMosque={handleSaveMosque}
        onSaveInstitute={handleSaveInstitute}
        onSaveTransport={handleSaveTransport}
      />

      {/* 5b. Add / Edit Profile Modal (with ownership credentials) */}
      <AddProfileModal
        isOpen={isAddProfileModalOpen}
        onClose={() => {
          setIsAddProfileModalOpen(false);
          setEditingProfileForModal(null);
        }}
        onSave={handleSaveProfile}
        defaultMobile={currentUserPhone}
        lang={lang}
        editingProfile={editingProfileForModal}
        existingProfiles={profiles}
      />

      {/* 5c. User Login, Super Admin & Password Reset via Email Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        profiles={profiles}
        onUpdateProfile={handleSaveProfile}
        activeSession={activeUserSession}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        adminCreds={adminCreds}
        onUpdateAdminCreds={handleUpdateAdminCreds}
        lang={lang}
        initialMode={authModalInitialMode}
        onOpenAdminEntrance={() => {
          setIsAuthModalOpen(false);
          setIsAdminSupervisionRoute(true);
          if (typeof window !== 'undefined') {
            window.location.hash = '#admin';
          }
        }}
      />

      {/* 5d. Profile Authorization Challenge Modal (Protects Edit & Delete) */}
      <ProfileAuthChallengeModal
        isOpen={isAuthChallengeOpen}
        onClose={() => {
          setIsAuthChallengeOpen(false);
          setAuthChallengeProfile(null);
        }}
        profile={authChallengeProfile}
        actionType={authChallengeAction}
        activeSession={activeUserSession}
        adminCreds={adminCreds}
        onAuthorized={handleAuthChallengeAuthorized}
        onOpenForgotPassword={handleOpenForgotPassword}
        lang={lang}
      />

      {/* 6. Terms Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        lang={lang}
      />

      {/* 7. Profile Details Modal */}
      <ProfileDetailsModal
        isOpen={Boolean(selectedProfile)}
        onClose={() => setSelectedProfile(null)}
        profile={selectedProfile}
        unreadCount={selectedProfile ? unreadCountsByProfileId[selectedProfile.id] || 0 : 0}
        onOpenInbox={handleOpenInboxForProfile}
        onOpenMessageModal={(p) => {
          setSelectedProfile(null);
          setMessageTargetProfile(p);
        }}
        onReportViolation={handleReportViolation}
        onEditProfile={handleRequestEditProfile}
        onDeleteProfile={handleRequestDeleteProfile}
        activeSession={activeUserSession}
        lang={lang}
      />

      {/* 8. Leave Message Modal */}
      <LeaveMessageModal
        isOpen={Boolean(messageTargetProfile)}
        onClose={() => setMessageTargetProfile(null)}
        targetProfile={messageTargetProfile}
        defaultSenderMobile={currentUserPhone}
        defaultSenderName={currentUserName}
        activeSession={activeUserSession}
        onSendMessage={handleSendMessage}
        lang={lang}
      />

      {/* 9. Inbox Modal */}
      <InboxModal
        isOpen={isInboxModalOpen}
        onClose={() => {
          setIsInboxModalOpen(false);
          setInboxPreselectedPhone('');
          setInboxInitialMessageId(null);
        }}
        messages={messages}
        initialSelectedMessageId={inboxInitialMessageId}
        prefilledMobile={inboxPreselectedPhone || currentUserPhone}
        activeSession={activeUserSession}
        profiles={profiles}
        onReplyDiscussion={handleReplyDiscussion}
        onReply={handleReplyMessage}
        onMarkMessageRead={handleMarkMessageRead}
        onRetrySendMessage={handleRetrySendMessage}
        onDeleteMessageForUser={handleDeleteMessageForUser}
        onUndoDeleteMessageForUser={handleUndoDeleteMessageForUser}
        onAdminDeleteMessage={handleDeleteMessage}
        onReportMessage={handleReportMessage}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
        isAdmin={activeUserSession?.type === 'admin'}
        lang={lang}
      />

      {/* 9b. Notification Center & Sound / Push Settings Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={userScopedNotifications}
        unreadIds={unreadNotificationIds}
        settings={notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
        onRequestPushPermission={() =>
          requestAndRegisterPushNotifications({
            session: activeUserSession,
            currentUserPhone,
            matchedProfileId: matchedUserProfile?.id || null,
          })
        }
        onSelectNotification={handleSelectNotificationItem}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteSingleNotification}
        onClearAllNotifications={handleClearAllNotifications}
      />

      {/* 10. Super Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        activeSession={activeUserSession}
        onAdminLoginSuccess={handleLoginSuccess}
        onOpenFullSupervision={() => {
          setIsAdminModalOpen(false);
          setIsAdminSupervisionRoute(true);
          if (typeof window !== 'undefined') {
            window.location.hash = '#admin';
          }
        }}
        profiles={profiles}
        messages={messages}
        deletedMessagesArchive={deletedMessagesArchive}
        onRestoreDeletedMessage={handleRestoreDeletedMessage}
        onPermanentDeleteArchivedMessage={handlePermanentDeleteArchivedMessage}
        announcements={announcements}
        newsEvents={newsEvents}
        mosques={mosques}
        institutes={institutes}
        transports={transports}
        hospitals={hospitals}
        alerts={adminAlerts}
        onResolveAlert={handleResolveAlert}
        onDeleteAlert={handleDeleteAlert}
        facebookPageUrl={facebookPageUrl}
        onUpdateFacebookPageUrl={(url) => {
          setFacebookPageUrl(url);
          savePortalSettingsToFirestore({ facebookPageUrl: url }).catch(() => {});
        }}
        villageBgImage={villageBgImage}
        onUpdateVillageBgImage={(img) => {
          setVillageBgImage(img);
          savePortalSettingsToFirestore({ villageBgImage: img }).catch(() => {});
        }}
        onToggleVerifyProfile={handleToggleVerifyProfile}
        onDeleteProfile={handleDeleteProfile}
        onSaveProfile={handleSaveProfile}
        onAddNewsEvent={handleAddNewsEvent}
        onUpdateNewsEvent={handleUpdateNewsEvent}
        onBannerImagesChanged={() => setBannerImagesVersion((v) => v + 1)}
        onDeleteNewsEvent={handleDeleteNewsEvent}
        onTogglePopupNewsEvent={handleTogglePopupNewsEvent}
        onUpdateMosqueCredentials={handleUpdateMosqueCredentials}
        onUpdateInstituteCredentials={handleUpdateInstituteCredentials}
        onSaveMosque={handleSaveMosque}
        onDeleteMosque={handleDeleteMosque}
        onSaveInstitute={handleSaveInstitute}
        onDeleteInstitute={handleDeleteInstitute}
        onSaveTransport={handleSaveTransport}
        onDeleteTransport={handleDeleteTransport}
        onSaveHospital={handleSaveHospital}
        onDeleteHospital={handleDeleteHospital}
        onDeleteMessage={handleDeleteMessage}
        onExportData={handleExportData}
        onImportData={handleImportData}
        lang={lang}
      />

      {/* 11. Hospitals & Emergency Medical Services Modal */}
      <HospitalsModal
        isOpen={isHospitalsModalOpen}
        onClose={() => setIsHospitalsModalOpen(false)}
        hospitals={hospitals}
        lang={lang}
        onEditHospital={handleEditHospital}
      />

      {/* 12. Community Emergency Help & Blood Donation Noticeboard */}
      <CommunityHelpNoticeboardModal
        isOpen={isHelpNoticeboardOpen}
        onClose={() => setIsHelpNoticeboardOpen(false)}
        lang={lang}
        activeSession={activeUserSession}
      />

      {/* 13. Ask by Voice ("بول کر پوچھیں") Modal for Elderly & Non-Readers */}
      <VoiceAskModal
        isOpen={isVoiceAskModalOpen}
        onClose={() => {
          setIsVoiceAskModalOpen(false);
          setVoiceAskInitialQuestion('');
        }}
        profiles={profiles}
        mosques={mosques}
        institutes={institutes}
        transports={transports}
        hospitals={hospitals}
        newsEvents={newsEvents}
        announcements={announcements}
        helpNotices={helpNotices}
        mandiRates={mandiRates}
        shelters={shelters}
        helpGuides={helpGuides}
        customKeywords={customKeywords}
        floodAlertStatus={floodAlertStatus}
        signedInUser={
          activeUserSession
            ? {
                id: activeUserSession.id,
                uid: activeUserSession.uid,
                name: activeUserSession.name,
                mobile: activeUserSession.mobile,
                email: activeUserSession.email,
                profileId: activeUserSession.profileId,
              }
            : null
        }
        userMessages={activeUserSession ? messages : []}
        initialLang={lang}
        initialQuestion={voiceAskInitialQuestion}
        onApplyToSearchBar={(q) => {
          setSearchQuery(q);
          setIsVoiceAskModalOpen(false);
        }}
      />
    </div>
  );
}
