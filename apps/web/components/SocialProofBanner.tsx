'use client';
import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  MapPin,
  Sparkles,
  Crown
} from 'lucide-react';

interface SocialProofBannerProps {
  currentLanguage: 'en' | 'zh';
}

interface ActivityItem {
  id: string;
  type: 'event_created' | 'bill_split' | 'restaurant_shared' | 'user_joined';
  userName: string;
  restaurantName?: string;
  eventName?: string;
  amount?: number;
  location: string;
  timestamp: Date;
}

export default function SocialProofBanner({ currentLanguage }: SocialProofBannerProps) {
  const [stats, setStats] = useState({
    totalUsers: 1247,
    eventsThisWeek: 89,
    moneySaved: 15420,
    hotRestaurants: 3
  });
  
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'event_created',
      userName: 'Alex C.',
      restaurantName: 'Tim Ho Wan',
      eventName: 'Dim Sum Lunch',
      location: 'Central',
      timestamp: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      id: '2', 
      type: 'bill_split',
      userName: 'Sarah L.',
      restaurantName: 'Kam Wah Cafe',
      amount: 340,
      location: 'Tsim Sha Tsui',
      timestamp: new Date(Date.now() - 12 * 60 * 1000)
    },
    {
      id: '3',
      type: 'user_joined',
      userName: 'Mike W.',
      eventName: 'Hotpot Night',
      restaurantName: 'Haidilao',
      location: 'Causeway Bay',
      timestamp: new Date(Date.now() - 18 * 60 * 1000)
    }
  ]);

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

  const getText = (key: string) => {
    const texts = {
      en: {
        socialProof: 'Live Activity',
        totalUsers: 'Hong Kong users',
        eventsThisWeek: 'events this week',
        moneySaved: 'saved in bills',
        hotRestaurants: 'trending spots',
        justNow: 'just now',
        minutesAgo: 'min ago',
        created: 'created',
        split: 'split HK$',
        joined: 'joined',
        shared: 'shared',
        at: 'at',
        in: 'in',
        hotSpot: 'Hot Spot',
        growing: 'Growing Fast',
        popular: 'Popular'
      },
      zh: {
        socialProof: '即時動態',
        totalUsers: '香港用戶',
        eventsThisWeek: '本週活動',
        moneySaved: '帳單節省',
        hotRestaurants: '熱門餐廳',
        justNow: '剛剛',
        minutesAgo: '分鐘前',
        created: '創建了',
        split: '分攤了HK$',
        joined: '加入了',
        shared: '分享了',
        at: '在',
        in: '於',
        hotSpot: '熱點',
        growing: '快速增長',
        popular: '熱門'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  useEffect(() => {
    // Auto-rotate through recent activity
    const interval = setInterval(() => {
      setCurrentActivityIndex((prev) => (prev + 1) % recentActivity.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [recentActivity.length]);

  useEffect(() => {
    // Simulate real-time stats updates
    const statsInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        eventsThisWeek: prev.eventsThisWeek + Math.floor(Math.random() * 2),
        moneySaved: prev.moneySaved + Math.floor(Math.random() * 50)
      }));
    }, 10000);

    return () => clearInterval(statsInterval);
  }, []);

  const formatTimeAgo = (timestamp: Date) => {
    const minutesAgo = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60));
    
    if (minutesAgo < 1) {
      return getText('justNow');
    } else if (minutesAgo < 60) {
      return `${minutesAgo} ${getText('minutesAgo')}`;
    } else {
      const hoursAgo = Math.floor(minutesAgo / 60);
      return currentLanguage === 'zh' ? `${hoursAgo}小時前` : `${hoursAgo}h ago`;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const timeAgo = formatTimeAgo(activity.timestamp);
    
    switch (activity.type) {
      case 'event_created':
        return currentLanguage === 'zh' 
          ? `${activity.userName} ${getText('created')} "${activity.eventName}" ${getText('at')} ${activity.restaurantName} ${getText('in')} ${activity.location} • ${timeAgo}`
          : `${activity.userName} ${getText('created')} "${activity.eventName}" ${getText('at')} ${activity.restaurantName} ${getText('in')} ${activity.location} • ${timeAgo}`;
      
      case 'bill_split':
        return currentLanguage === 'zh'
          ? `${activity.userName} ${getText('split')}${activity.amount} ${getText('at')} ${activity.restaurantName} ${getText('in')} ${activity.location} • ${timeAgo}`
          : `${activity.userName} ${getText('split')}${activity.amount} ${getText('at')} ${activity.restaurantName} ${getText('in')} ${activity.location} • ${timeAgo}`;
      
      case 'user_joined':
        return currentLanguage === 'zh'
          ? `${activity.userName} ${getText('joined')} "${activity.eventName}" ${getText('at')} ${activity.restaurantName} ${getText('in')} ${activity.location} • ${timeAgo}`
          : `${activity.userName} ${getText('joined')} "${activity.eventName}" ${getText('at')} ${activity.restaurantName} ${getText('in')} ${activity.location} • ${timeAgo}`;
      
      default:
        return '';
    }
  };

  const currentActivity = recentActivity[currentActivityIndex];

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 mb-6">
      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-red-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-red-600">
              <Users className="w-4 h-4 mr-1" />
              <span className="font-semibold">{stats.totalUsers.toLocaleString()}</span>
              <span className="ml-1 text-xs">{getText('totalUsers')}</span>
            </div>
            
            <div className="flex items-center text-orange-600">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="font-semibold">{stats.eventsThisWeek}</span>
              <span className="ml-1 text-xs">{getText('eventsThisWeek')}</span>
            </div>
            
            <div className="flex items-center text-green-600">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-semibold">HK${stats.moneySaved.toLocaleString()}</span>
              <span className="ml-1 text-xs">{getText('moneySaved')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              {getText('hotSpot')}
            </span>
            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {getText('growing')}
            </span>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            {getText('socialProof')}
          </h3>
          
          <div className="flex items-center space-x-1">
            {recentActivity.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentActivityIndex ? 'bg-red-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-2 min-h-[20px]">
          <p className="text-sm text-gray-700 animate-fade-in">
            {getActivityText(currentActivity)}
          </p>
        </div>
      </div>

      {/* Hot Restaurants Ticker */}
      <div className="px-4 py-2 bg-gradient-to-r from-red-100 to-orange-100">
        <div className="flex items-center space-x-4 text-xs">
          <span className="font-medium text-red-700 flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            {getText('popular')}:
          </span>
          
          <div className="flex items-center space-x-3 text-gray-700">
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              Tim Ho Wan (Central)
            </span>
            <span>•</span>
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              Haidilao (TST)
            </span>
            <span>•</span>
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              Kam Wah Cafe (Mong Kok)
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}