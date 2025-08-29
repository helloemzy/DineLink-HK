'use client';
import { useState, useEffect } from 'react';
import { 
  X, 
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Heart,
  Star,
  ChevronRight,
  Share2
} from 'lucide-react';
import { EventService } from '../lib/events';
import type { DiningEventWithMembers } from '../lib/events';

interface JoinEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentLanguage: 'en' | 'zh';
  onEventJoined: (event: DiningEventWithMembers) => void;
}

export default function JoinEventModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentLanguage,
  onEventJoined
}: JoinEventModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<DiningEventWithMembers[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<DiningEventWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'weekend'>('all');

  const eventService = new EventService();

  const getText = (key: string) => {
    const texts = {
      en: {
        joinEvent: 'Join Event',
        searchPlaceholder: 'Search events or restaurants...',
        all: 'All Events',
        today: 'Today',
        weekend: 'This Weekend',
        noEvents: 'No events found',
        noEventsDesc: 'Be the first to create an event!',
        people: 'people',
        maxPeople: 'max',
        join: 'Join',
        joining: 'Joining...',
        close: 'Close',
        date: 'Date',
        time: 'Time',
        location: 'Location',
        organizer: 'Organizer',
        popular: 'Popular',
        trending: 'Trending',
        shareEvent: 'Share Event',
        getBonus: 'Get HK$5 bonus when 3+ friends join your shared events!'
      },
      zh: {
        joinEvent: '加入活動',
        searchPlaceholder: '搜尋活動或餐廳...',
        all: '所有活動',
        today: '今天',
        weekend: '本週末',
        noEvents: '找不到活動',
        noEventsDesc: '成為第一個創建活動的人！',
        people: '人',
        maxPeople: '最多',
        join: '加入',
        joining: '加入中...',
        close: '關閉',
        date: '日期',
        time: '時間',
        location: '地點',
        organizer: '組織者',
        popular: '熱門',
        trending: '趨勢',
        shareEvent: '分享活動',
        getBonus: '當3+朋友加入你分享的活動時，獲得HK$5獎勵！'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, events, selectedFilter]);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await eventService.getPublicEvents(currentUserId);
      if (result.success && result.events) {
        setEvents(result.events);
      } else {
        setError(result.error || 'Failed to load events');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekend = new Date(today);
    weekend.setDate(today.getDate() + (6 - today.getDay())); // Next Saturday

    if (selectedFilter === 'today') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate.toDateString() === today.toDateString();
      });
    } else if (selectedFilter === 'weekend') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        const dayOfWeek = eventDate.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      });
    }

    setFilteredEvents(filtered);
  };

  const handleJoinEvent = async (event: DiningEventWithMembers) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.joinEvent(event.id, currentUserId, 'confirmed');
      
      if (result.success) {
        onEventJoined(event);
        onClose();
        
        // Track viral event
        await eventService.trackViralEvent(currentUserId, 'event_join', {
          event_id: event.id,
          event_name: event.name,
          restaurant_name: event.restaurant_name
        });
      } else {
        setError(result.error || 'Failed to join event');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareEvent = async (event: DiningEventWithMembers) => {
    const shareText = currentLanguage === 'zh' 
      ? `快來加入我們在${event.restaurant_name}的聚餐！`
      : `Join us for dinner at ${event.restaurant_name}!`;
    
    const shareUrl = `https://dinelink.hk/join/${event.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: shareText,
          url: shareUrl
        });
        
        // Track viral share
        await eventService.trackViralShare(currentUserId, 'event', event.id, 'native_share', {
          event_name: event.name,
          restaurant_name: event.restaurant_name
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      window.open(whatsappUrl, '_blank');
      
      await eventService.trackViralShare(currentUserId, 'event', event.id, 'whatsapp', {
        event_name: event.name,
        restaurant_name: event.restaurant_name
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return currentLanguage === 'zh' ? '今天' : 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return currentLanguage === 'zh' ? '明天' : 'Tomorrow';
    } else {
      return date.toLocaleDateString(currentLanguage === 'zh' ? 'zh-HK' : 'en-HK');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(currentLanguage === 'zh' ? 'zh-HK' : 'en-HK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getText('joinEvent')}</h2>
            <p className="text-sm text-green-600 mt-1">
              <Heart className="w-4 h-4 inline mr-1" />
              {getText('getBonus')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={getText('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div className="flex space-x-2">
            {(['all', 'today', 'weekend'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getText(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={loadEvents}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">{getText('noEvents')}</p>
              <p className="text-sm text-gray-400">{getText('noEventsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{event.name}</h3>
                        {index < 3 && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                            {getText('popular')}
                          </span>
                        )}
                      </div>
                      {event.restaurant_name && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <UtensilsCrossed className="w-4 h-4 mr-1" />
                          {event.restaurant_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleShareEvent(event)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                      title={getText('shareEvent')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{formatTime(event.event_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {event.member_count} {getText('people')}
                        {event.max_attendees && ` / ${event.max_attendees} ${getText('maxPeople')}`}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      <span>{event.organizer_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {event.member_count > 5 && (
                        <span className="text-green-600 font-medium">
                          {getText('trending')} 🔥
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleJoinEvent(event)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isLoading ? getText('joining') : getText('join')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {getText('close')}
          </button>
        </div>
      </div>
    </div>
  );
}