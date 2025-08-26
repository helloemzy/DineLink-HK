'use client';
import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign,
  Search,
  UtensilsCrossed
} from 'lucide-react';
import { EventService } from '../lib/events';
import { RestaurantService } from '../lib/restaurants';
import type { Database } from '../lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: any) => void;
  currentUserId: string;
  currentLanguage: 'en' | 'zh';
}

export default function CreateEventModal({ 
  isOpen, 
  onClose, 
  onEventCreated, 
  currentUserId,
  currentLanguage 
}: CreateEventModalProps) {
  const [step, setStep] = useState<'details' | 'restaurant' | 'confirmation'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<number>(8);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Restaurant selection
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const eventService = new EventService();
  const restaurantService = new RestaurantService();

  const getText = (key: string) => {
    const texts = {
      en: {
        createEvent: 'Create Event',
        eventDetails: 'Event Details',
        selectRestaurant: 'Select Restaurant',
        confirmation: 'Confirmation',
        eventName: 'Event Name',
        eventNamePlaceholder: 'Team dinner, Birthday celebration...',
        dateTime: 'Date & Time',
        maxAttendees: 'Max Attendees',
        estimatedCost: 'Estimated Cost per Person (HKD)',
        notes: 'Additional Notes',
        notesPlaceholder: 'Dietary restrictions, special requests...',
        privateEvent: 'Private Event',
        privateEventDesc: 'Only invited members can see this event',
        searchRestaurants: 'Search Restaurants',
        searchPlaceholder: 'Restaurant name, cuisine, location...',
        noRestaurantsFound: 'No restaurants found',
        selectThisRestaurant: 'Select This Restaurant',
        selectedRestaurant: 'Selected Restaurant',
        back: 'Back',
        next: 'Next',
        createEventButton: 'Create Event',
        cancel: 'Cancel',
        creating: 'Creating...',
        eventCreated: 'Event created successfully!',
        required: 'Required',
        people: 'people',
        popular: 'Popular',
        rating: 'Rating'
      },
      zh: {
        createEvent: '創建活動',
        eventDetails: '活動詳情',
        selectRestaurant: '選擇餐廳',
        confirmation: '確認',
        eventName: '活動名稱',
        eventNamePlaceholder: '團隊聚餐、生日慶祝...',
        dateTime: '日期與時間',
        maxAttendees: '最大參與人數',
        estimatedCost: '預估每人費用 (港幣)',
        notes: '額外備註',
        notesPlaceholder: '飲食限制、特殊要求...',
        privateEvent: '私人活動',
        privateEventDesc: '只有受邀成員可以看到此活動',
        searchRestaurants: '搜尋餐廳',
        searchPlaceholder: '餐廳名稱、菜系、地點...',
        noRestaurantsFound: '找不到餐廳',
        selectThisRestaurant: '選擇這間餐廳',
        selectedRestaurant: '已選餐廳',
        back: '返回',
        next: '下一步',
        createEventButton: '創建活動',
        cancel: '取消',
        creating: '創建中...',
        eventCreated: '活動創建成功！',
        required: '必填',
        people: '人',
        popular: '熱門',
        rating: '評分'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  // Load popular restaurants on mount
  useEffect(() => {
    const loadRestaurants = async () => {
      const popularRestaurants = await restaurantService.getPopularRestaurants(10);
      setRestaurants(popularRestaurants);
    };
    
    if (isOpen) {
      loadRestaurants();
    }
  }, [isOpen]);

  // Search restaurants
  useEffect(() => {
    const searchRestaurants = async () => {
      if (restaurantSearch.trim().length < 2) {
        const popularRestaurants = await restaurantService.getPopularRestaurants(10);
        setRestaurants(popularRestaurants);
        return;
      }

      setIsSearching(true);
      const results = await restaurantService.searchRestaurants(restaurantSearch);
      setRestaurants(results);
      setIsSearching(false);
    };

    const timeoutId = setTimeout(searchRestaurants, 300);
    return () => clearTimeout(timeoutId);
  }, [restaurantSearch]);

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !eventDateTime) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.createEvent({
        name: eventName,
        restaurant_name: selectedRestaurant?.name,
        restaurant_google_place_id: selectedRestaurant?.google_place_id || undefined,
        location: selectedRestaurant?.address,
        event_datetime: eventDateTime,
        estimated_cost: estimatedCost > 0 ? estimatedCost : undefined,
        max_attendees: maxAttendees,
        notes: notes.trim() || undefined,
        is_private: isPrivate
      }, currentUserId);

      if (result.success && result.event) {
        onEventCreated(result.event);
        resetForm();
        onClose();
      } else {
        setError(result.error || 'Failed to create event');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('details');
    setEventName('');
    setEventDateTime('');
    setMaxAttendees(8);
    setEstimatedCost(0);
    setNotes('');
    setIsPrivate(false);
    setSelectedRestaurant(null);
    setRestaurantSearch('');
    setError(null);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString(currentLanguage === 'zh' ? 'zh-HK' : 'en-HK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
          <h2 className="text-xl font-semibold text-gray-900">{getText('createEvent')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === 'details' ? 'text-red-500' : step === 'restaurant' || step === 'confirmation' ? 'text-green-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'details' ? 'bg-red-100' : 
                step === 'restaurant' || step === 'confirmation' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">{getText('eventDetails')}</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center ${step === 'restaurant' ? 'text-red-500' : step === 'confirmation' ? 'text-green-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'restaurant' ? 'bg-red-100' : 
                step === 'confirmation' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">{getText('selectRestaurant')}</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center ${step === 'confirmation' ? 'text-red-500' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'confirmation' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">{getText('confirmation')}</span>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Event Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('eventName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={getText('eventNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('dateTime')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={eventDateTime}
                  onChange={(e) => setEventDateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getText('maxAttendees')}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="2"
                      max="50"
                    />
                    <Users className="w-5 h-5 text-gray-400 ml-2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getText('estimatedCost')}
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="0"
                      step="50"
                    />
                    <DollarSign className="w-5 h-5 text-gray-400 ml-2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder={getText('notesPlaceholder')}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="private-event"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="private-event" className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{getText('privateEvent')}</div>
                  <div className="text-sm text-gray-500">{getText('privateEventDesc')}</div>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Restaurant Selection */}
          {step === 'restaurant' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('searchRestaurants')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={restaurantSearch}
                    onChange={(e) => setRestaurantSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={getText('searchPlaceholder')}
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {selectedRestaurant && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">{getText('selectedRestaurant')}</h4>
                      <p className="text-sm text-green-700">{selectedRestaurant.name}</p>
                      {selectedRestaurant.name_chinese && (
                        <p className="text-sm text-green-600">{selectedRestaurant.name_chinese}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedRestaurant(null)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4 text-gray-500">Searching...</div>
                ) : restaurants.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">{getText('noRestaurantsFound')}</div>
                ) : (
                  restaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedRestaurant?.id === restaurant.id
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-red-200 hover:bg-red-25'
                      }`}
                      onClick={() => setSelectedRestaurant(restaurant)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                          {restaurant.name_chinese && (
                            <p className="text-sm text-gray-600">{restaurant.name_chinese}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">{restaurant.address}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            {restaurant.google_rating && (
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="text-yellow-500">⭐</span>
                                <span className="ml-1">{restaurant.google_rating}</span>
                              </div>
                            )}
                            {restaurant.price_range && (
                              <div className="text-sm text-gray-600">
                                {restaurantService.formatPriceRange(restaurant.price_range)}
                              </div>
                            )}
                            {restaurant.cuisine_types && (
                              <div className="text-sm text-gray-500">
                                {restaurant.cuisine_types.slice(0, 2).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{eventName}</h4>
                  {eventDateTime && (
                    <p className="text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDateTime(eventDateTime)}
                    </p>
                  )}
                </div>

                {selectedRestaurant && (
                  <div>
                    <h5 className="font-medium text-gray-800">{selectedRestaurant.name}</h5>
                    {selectedRestaurant.name_chinese && (
                      <p className="text-sm text-gray-600">{selectedRestaurant.name_chinese}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {selectedRestaurant.address}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {maxAttendees} {getText('people')}
                  </div>
                  {estimatedCost > 0 && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      HK${estimatedCost}
                    </div>
                  )}
                </div>

                {notes && (
                  <div>
                    <p className="text-sm text-gray-600">{notes}</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {step !== 'details' && (
              <button
                onClick={() => setStep(step === 'confirmation' ? 'restaurant' : 'details')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {getText('back')}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              {getText('cancel')}
            </button>
            
            {step === 'confirmation' ? (
              <button
                onClick={handleCreateEvent}
                disabled={isLoading}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? getText('creating') : getText('createEventButton')}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (step === 'details') {
                    if (!eventName.trim() || !eventDateTime) {
                      setError('Please fill in all required fields');
                      return;
                    }
                    setError(null);
                    setStep('restaurant');
                  } else if (step === 'restaurant') {
                    setStep('confirmation');
                  }
                }}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                {getText('next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}