"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MapPin, 
  Calendar, 
  UtensilsCrossed,
  Phone,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';
import { EventService } from '../lib/events';
import { RestaurantService } from '../lib/restaurants';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import type { DiningEventWithMembers } from '../lib/events';
import CreateEventModal from '../components/CreateEventModal';
import EventMemberModal from '../components/EventMemberModal';
import BillSplitModal from '../components/BillSplitModal';
import JoinEventModal from '../components/JoinEventModal';
import ExploreModal from '../components/ExploreModal';
import SocialProofBanner from '../components/SocialProofBanner';


type DiningEvent = {
  id: string;
  name: string;
  restaurant: string;
  datetime: string;
  groupSize: number;
  status: 'upcoming' | 'active' | 'completed';
  location: string;
  cuisine: string;
  estimatedCost: number;
};

type UserProfile = {
  id: string;
  name: string;
  phone: string;
  language: 'en' | 'zh';
  cultural_profile: {
    hierarchyComfort: 'high' | 'medium' | 'low';
    paymentStyle: 'traditional' | 'modern' | 'mixed';
  };
};

export default function DineLinkHome() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<DiningEvent[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'zh'>('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'verification' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userName, setUserName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEventMemberModal, setShowEventMemberModal] = useState(false);
  const [showBillSplitModal, setShowBillSplitModal] = useState(false);
  const [showJoinEventModal, setShowJoinEventModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DiningEventWithMembers | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  
  const authService = new AuthService();
  const eventService = new EventService();
  const restaurantService = new RestaurantService();
  
  const router = useRouter();
  
  // Cultural text content
  const getText = (key: string) => {
    const texts = {
      en: {
        welcome: "Welcome to DineLink",
        subtitle: "Hong Kong's smartest group dining coordinator",
        createEvent: "Create Event",
        joinEvent: "Join Event", 
        exploreRestaurants: "Explore",
        upcomingEvents: "Upcoming Events",
        trendingRestaurants: "Trending in HK",
        getStarted: "Get Started",
        phoneNumber: "Hong Kong Phone Number",
        enterPhone: "Enter your HK mobile number",
        sendCode: "Send Code",
        verificationCode: "Verification Code",
        enterCode: "Enter the 6-digit code",
        verify: "Verify",
        setupProfile: "Setup Profile",
        yourName: "Your Name",
        enterName: "Enter your full name",
        complete: "Complete Setup",
        quickActions: "Quick Actions",
        continueDining: "Continue where you left off",
        discoverNew: "Discover new dining experiences"
      },
      zh: {
        welcome: "歡迎使用 DineLink",
        subtitle: "香港最智能的群組用餐協調平台",
        createEvent: "創建活動",
        joinEvent: "加入活動",
        exploreRestaurants: "探索",
        upcomingEvents: "即將到來的活動", 
        trendingRestaurants: "香港熱門餐廳",
        getStarted: "開始使用",
        phoneNumber: "香港電話號碼",
        enterPhone: "輸入您的香港手機號碼",
        sendCode: "發送驗證碼",
        verificationCode: "驗證碼",
        enterCode: "輸入6位數驗證碼",
        verify: "驗證",
        setupProfile: "設定個人資料",
        yourName: "您的姓名",
        enterName: "輸入您的全名",
        complete: "完成設定",
        quickActions: "快速操作",
        continueDining: "繼續您的用餐計劃",
        discoverNew: "探索新的用餐體驗"
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };
  
  // Authentication functions
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.match(/^[6-9]\d{7}$/)) {
      showToast('Please enter a valid Hong Kong mobile number', 'error');
      return;
    }
    
    setIsLoading(true);
    const result = await authService.sendVerificationCode(phoneNumber);
    setIsLoading(false);
    
    if (result.success) {
      showToast('Verification code sent to your phone', 'success');
      setAuthStep('verification');
    } else {
      showToast(result.error || 'Failed to send verification code', 'error');
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      showToast('Please enter the 6-digit verification code', 'error');
      return;
    }
    
    setIsLoading(true);
    const result = await authService.verifyCode(phoneNumber, verificationCode);
    setIsLoading(false);
    
    if (result.success && result.user) {
      setUser(result.user);
      
      // Check if user profile exists
      const profile = await authService.getUserProfile(result.user.id);
      if (profile) {
        setUserProfile(profile);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        showToast(`Welcome back, ${profile.name}!`, 'success');
      } else {
        // Need to create profile
        setAuthStep('profile');
        showToast('Phone verified! Please complete your profile.', 'success');
      }
    } else {
      showToast(result.error || 'Invalid verification code', 'error');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    
    if (!user) return;
    
    setIsLoading(true);
    const result = await authService.createUserProfile({
      user_id: user.id,
      name: userName,
      phone: phoneNumber,
      language: currentLanguage
    });
    setIsLoading(false);
    
    if (result.success && result.profile) {
      setUserProfile(result.profile);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      showToast(`Welcome to DineLink, ${userName}!`, 'success');
    } else {
      showToast(result.error || 'Failed to create profile', 'error');
    }
  };

  // Format time for display with Hong Kong timezone  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return currentLanguage === 'zh' ? '剛剛' : 'Just now';
    if (diffMins < 60) return currentLanguage === 'zh' ? `${diffMins}分鐘前` : `${diffMins}m ago`;
    if (diffHours < 24) return currentLanguage === 'zh' ? `${diffHours}小時前` : `${diffHours}h ago`;
    if (diffDays < 30) return currentLanguage === 'zh' ? `${diffDays}天前` : `${diffDays}d ago`;
    
    return date.toLocaleDateString(currentLanguage === 'zh' ? 'zh-HK' : 'en-HK');
  };

  // Handler for when user joins an event
  const handleEventJoined = async (event: DiningEventWithMembers) => {
    // Refresh user's events
    if (user && userProfile) {
      showToast(
        currentLanguage === 'zh' 
          ? `已成功加入 "${event.name}"！` 
          : `Successfully joined "${event.name}"!`,
        'success'
      );
      loadUserEvents(); // Refresh events list
      setShowJoinEventModal(false);
    }
  };

  // Handler for creating event from restaurant exploration
  const handleCreateEventForRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setShowExploreModal(false);
    setShowCreateEventModal(true);
  };

  // Sample data for demonstration
  const sampleEvents: DiningEvent[] = [
    {
      id: '1',
      name: 'Team Dinner',
      restaurant: 'Tim Ho Wan',
      datetime: '2025-01-28T19:30:00',
      groupSize: 6,
      status: 'upcoming',
      location: 'Central',
      cuisine: 'Dim Sum',
      estimatedCost: 180
    },
    {
      id: '2', 
      name: 'Birthday Celebration',
      restaurant: 'Mott 32',
      datetime: '2025-01-30T20:00:00',
      groupSize: 8,
      status: 'upcoming',
      location: 'Central',
      cuisine: 'Modern Chinese',
      estimatedCost: 350
    }
  ];

  const trendingRestaurants = [
    { name: 'Tim Ho Wan', cuisine: 'Dim Sum', rating: 4.5, priceRange: '$' },
    { name: 'Mott 32', cuisine: 'Modern Chinese', rating: 4.7, priceRange: '$$$' },
    { name: 'Kam Wah Cafe', cuisine: 'Cha Chaan Teng', rating: 4.3, priceRange: '$' },
    { name: 'Lung King Heen', cuisine: 'Cantonese', rating: 4.9, priceRange: '$$$$' }
  ];

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    setEvents([]);
    showToast('Logged out successfully', 'success');
  };

  const loadUserEventsForUser = async (currentUser: User) => {
    try {
      const userEvents = await eventService.getUserEvents(currentUser.id);
      // Convert to the expected format for the UI
      const formattedEvents = userEvents.map(event => ({
        id: event.id,
        name: event.name,
        restaurant: event.restaurant_name || 'Restaurant TBD',
        datetime: event.event_datetime,
        groupSize: event.member_count || 1,
        status: 'upcoming' as const,
        location: event.location || 'Location TBD',
        cuisine: 'Various', // Could derive from restaurant data
        estimatedCost: event.estimated_cost || 0
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadUserEvents = () => {
    if (user) {
      loadUserEventsForUser(user);
    }
  };

  const handleEventCreated = (newEvent: any) => {
    showToast(`Event "${newEvent.name}" created successfully!`, 'success');
    loadUserEvents(); // Refresh events list
  };

  const handleEventClick = async (eventId: string) => {
    if (!user) return;
    
    try {
      const result = await eventService.getEventDetails(eventId, user.id);
      if (result.success && result.event) {
        setSelectedEvent(result.event);
        setShowEventMemberModal(true);
      } else {
        showToast(result.error || 'Failed to load event details', 'error');
      }
    } catch (error) {
      showToast('Failed to load event details', 'error');
    }
  };

  const handleEventUpdated = () => {
    loadUserEvents();
    // Refresh selected event if it's still open
    if (selectedEvent && user) {
      eventService.getEventDetails(selectedEvent.id, user.id).then(result => {
        if (result.success && result.event) {
          setSelectedEvent(result.event);
        }
      });
    }
  };

  const handleShowBillSplit = () => {
    setShowEventMemberModal(false);
    setShowBillSplitModal(true);
  };



  // Initialize component and check auth status
  useEffect(() => {
    async function initializeAuth() {
      try {
        // Check current session
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUser(user);
          
          // Get user profile
          const profile = await authService.getUserProfile(user.id);
          if (profile) {
            setUserProfile(profile);
            setCurrentLanguage(profile.language);
            setIsAuthenticated(true);
            
            // Load user's real events
            loadUserEventsForUser(user);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const profile = await authService.getUserProfile(session.user.id);
          if (profile) {
            setUserProfile(profile);
            setCurrentLanguage(profile.language);
            setIsAuthenticated(true);
            loadUserEventsForUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setIsAuthenticated(false);
          setEvents([]);
        }
      }
    );
    
    // Auto-detect language based on browser settings
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.includes('zh')) {
      setCurrentLanguage('zh');
    }

    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('DineLink SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('DineLink SW registration failed: ', registrationError);
          });
      });
    }

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // Render authentication modal
  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          {authStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{getText('getStarted')}</h2>
                <p className="text-gray-600">{getText('enterPhone')}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('phoneNumber')}
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    +852
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : getText('sendCode')}
              </button>
            </form>
          )}

          {authStep === 'verification' && (
            <form onSubmit={handleVerificationSubmit}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{getText('verificationCode')}</h2>
                <p className="text-gray-600">{getText('enterCode')}</p>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-center text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : getText('verify')}
              </button>
            </form>
          )}

          {authStep === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{getText('setupProfile')}</h2>
                <p className="text-gray-600">{getText('enterName')}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('yourName')}
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={currentLanguage === 'zh' ? '陳大文' : 'John Chan'}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : getText('complete')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading DineLink...</p>
        </div>
      </div>
    );
  }

  // Main JSX render
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Language Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-1 shadow-lg">
              <button
                onClick={() => setCurrentLanguage('en')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentLanguage === 'en' ? 'bg-red-500 text-white' : 'text-gray-600'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setCurrentLanguage('zh')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentLanguage === 'zh' ? 'bg-red-500 text-white' : 'text-gray-600'
                }`}
              >
                中文
              </button>
            </div>
          </div>

          {/* Logo and Welcome */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              DineLink
            </h1>
            <p className="text-xl text-gray-600 font-light">
              {getText('subtitle')}
            </p>
          </div>

          {/* Get Started Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-red-600 transition-colors shadow-lg"
          >
            {getText('getStarted')}
          </button>

          {/* Features Preview */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <Users className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="font-semibold text-gray-800">{getText('createEvent')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentLanguage === 'zh' ? '輕鬆組織群組聚餐' : 'Easy group coordination'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <MapPin className="w-8 h-8 text-red-500 mb-2" />
              <h3 className="font-semibold text-gray-800">{getText('exploreRestaurants')}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentLanguage === 'zh' ? '發現香港美食' : 'Discover HK dining'}
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Modal */}
        {renderAuthModal()}
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Social Proof Banner */}
      <SocialProofBanner 
        currentLanguage={currentLanguage}
        currentUserId={user?.id}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">DineLink</h1>
                <p className="text-xs text-gray-500">{currentLanguage === 'zh' ? `你好，${userProfile?.name}` : `Hello, ${userProfile?.name}`}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'zh' : 'en')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Globe className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{getText('quickActions')}</h2>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setShowCreateEventModal(true)}
              className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Users className="w-6 h-6 text-red-500 mb-2" />
              <span className="text-sm font-medium text-red-700">{getText('createEvent')}</span>
            </button>
            <button 
              onClick={() => setShowJoinEventModal(true)}
              className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <Calendar className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-orange-700">{getText('joinEvent')}</span>
            </button>
            <button 
              onClick={() => setShowExploreModal(true)}
              className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <MapPin className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-blue-700">{getText('exploreRestaurants')}</span>
            </button>
          </div>
        </div>

        {/* Social Proof Banner */}
        <SocialProofBanner currentLanguage={currentLanguage} />

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{getText('upcomingEvents')}</h2>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{currentLanguage === 'zh' ? '還沒有即將到來的活動' : 'No upcoming events'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
                  onClick={() => handleEventClick(event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.restaurant} • {event.location}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{new Date(event.datetime).toLocaleDateString(currentLanguage === 'zh' ? 'zh-HK' : 'en-HK')}</span>
                        <span className="mx-2">•</span>
                        <Users className="w-3 h-3 mr-1" />
                        <span>{event.groupSize} {currentLanguage === 'zh' ? '人' : 'people'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">HK${event.estimatedCost}</span>
                      <p className="text-xs text-gray-500">{currentLanguage === 'zh' ? '估計' : 'est.'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Restaurants */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{getText('trendingRestaurants')}</h2>
          <div className="space-y-3">
            {trendingRestaurants.map((restaurant, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-gray-500">{restaurant.cuisine} • {restaurant.priceRange}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">⭐ {restaurant.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast Messages */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {user && userProfile && (
        <CreateEventModal
          isOpen={showCreateEventModal}
          onClose={() => setShowCreateEventModal(false)}
          onEventCreated={handleEventCreated}
          currentUserId={user.id}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Event Member Modal */}
      {user && userProfile && (
        <EventMemberModal
          isOpen={showEventMemberModal}
          onClose={() => {
            setShowEventMemberModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          currentUserId={user.id}
          currentUserName={userProfile.name}
          currentLanguage={currentLanguage}
          onEventUpdated={handleEventUpdated}
          onShowBillSplit={handleShowBillSplit}
        />
      )}

      {/* Bill Split Modal */}
      {user && userProfile && (
        <BillSplitModal
          isOpen={showBillSplitModal}
          onClose={() => {
            setShowBillSplitModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          currentUserId={user.id}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Join Event Modal */}
      {user && userProfile && (
        <JoinEventModal
          isOpen={showJoinEventModal}
          onClose={() => setShowJoinEventModal(false)}
          currentUserId={user.id}
          currentUserName={userProfile.name}
          currentLanguage={currentLanguage}
          onEventJoined={handleEventJoined}
        />
      )}

      {/* Explore Modal */}
      {user && userProfile && (
        <ExploreModal
          isOpen={showExploreModal}
          onClose={() => setShowExploreModal(false)}
          currentUserId={user.id}
          currentLanguage={currentLanguage}
          onCreateEventForRestaurant={handleCreateEventForRestaurant}
        />
      )}
    </div>
  );
}
