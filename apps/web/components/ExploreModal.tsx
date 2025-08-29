'use client';
import { useState, useEffect } from 'react';
import { 
  X, 
  Search,
  MapPin,
  Star,
  Heart,
  Clock,
  DollarSign,
  Users,
  ChevronRight,
  Share2,
  Plus,
  Trophy,
  Utensils
} from 'lucide-react';
import { RestaurantService } from '../lib/restaurants';
import { EventService } from '../lib/events';

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  address: string;
  rating: number;
  price_range: number;
  image_url?: string;
  latitude: number;
  longitude: number;
  popular_dishes?: string[];
  opening_hours?: any;
  phone?: string;
}

interface ExploreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentLanguage: 'en' | 'zh';
  onCreateEventForRestaurant: (restaurant: Restaurant) => void;
}

export default function ExploreModal({
  isOpen,
  onClose,
  currentUserId,
  currentLanguage,
  onCreateEventForRestaurant
}: ExploreModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'popular' | 'new' | 'nearby' | 'dimsum'>('popular');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const restaurantService = new RestaurantService();
  const eventService = new EventService();

  const getText = (key: string) => {
    const texts = {
      en: {
        exploreRestaurants: 'Explore Restaurants',
        searchPlaceholder: 'Search restaurants, cuisine, location...',
        popular: 'Popular',
        new: 'New',
        nearby: 'Nearby',
        dimsum: 'Dim Sum',
        noRestaurants: 'No restaurants found',
        noRestaurantsDesc: 'Try adjusting your search or filters',
        createEvent: 'Create Event',
        share: 'Share',
        addFavorite: 'Add to Favorites',
        removeFavorite: 'Remove from Favorites',
        close: 'Close',
        priceRange: 'Price Range',
        rating: 'Rating',
        distance: 'Distance',
        openNow: 'Open Now',
        closed: 'Closed',
        shareRestaurant: 'Share Restaurant',
        viralBonus: 'Get HK$20 when 3+ friends create events at restaurants you shared!',
        trending: 'Trending',
        hotspot: 'Hot Spot',
        groupFavorite: 'Group Favorite'
      },
      zh: {
        exploreRestaurants: '探索餐廳',
        searchPlaceholder: '搜尋餐廳、菜式、位置...',
        popular: '熱門',
        new: '新店',
        nearby: '附近',
        dimsum: '點心',
        noRestaurants: '找不到餐廳',
        noRestaurantsDesc: '請嘗試調整搜尋或篩選條件',
        createEvent: '創建活動',
        share: '分享',
        addFavorite: '加入收藏',
        removeFavorite: '移除收藏',
        close: '關閉',
        priceRange: '價格範圍',
        rating: '評分',
        distance: '距離',
        openNow: '現在營業',
        closed: '已關門',
        shareRestaurant: '分享餐廳',
        viralBonus: '當3+朋友在你分享的餐廳創建活動時，獲得HK$20！',
        trending: '趨勢',
        hotspot: '熱點',
        groupFavorite: '團體最愛'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  useEffect(() => {
    if (isOpen) {
      loadRestaurants();
      loadFavorites();
    }
  }, [isOpen, selectedFilter]);

  useEffect(() => {
    filterRestaurants();
  }, [searchTerm, restaurants]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      switch (selectedFilter) {
        case 'popular':
          result = await restaurantService.getPopularRestaurants();
          break;
        case 'new':
          result = await restaurantService.getNewRestaurants();
          break;
        case 'nearby':
          // Get user location and load nearby restaurants
          result = await restaurantService.getNearbyRestaurants(22.3193, 114.1694, 10); // Default HK coords
          break;
        case 'dimsum':
          result = await restaurantService.searchRestaurants({
            cuisine_type: 'Dim Sum',
            location: 'Hong Kong'
          });
          break;
        default:
          result = await restaurantService.getPopularRestaurants();
      }
      
      if (result.success && result.restaurants) {
        setRestaurants(result.restaurants);
      } else {
        setError(result.error || 'Failed to load restaurants');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavorites = async () => {
    // Load user's favorite restaurants
    try {
      const result = await restaurantService.getUserFavorites(currentUserId);
      if (result.success && result.favorites) {
        setFavorites(new Set(result.favorites.map(f => f.restaurant_id)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const filterRestaurants = () => {
    let filtered = restaurants;

    if (searchTerm) {
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleCreateEvent = async (restaurant: Restaurant) => {
    onCreateEventForRestaurant(restaurant);
    onClose();
    
    // Track viral event
    await eventService.trackViralEvent(currentUserId, 'restaurant_event_create', {
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      cuisine_type: restaurant.cuisine_type
    });
  };

  const handleShareRestaurant = async (restaurant: Restaurant) => {
    const shareText = currentLanguage === 'zh' 
      ? `看看這家很棒的${restaurant.cuisine_type}餐廳！`
      : `Check out this amazing ${restaurant.cuisine_type} restaurant!`;
    
    const shareUrl = `https://dinelink.hk/restaurant/${restaurant.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `${shareText} - ${restaurant.name}`,
          url: shareUrl
        });
        
        // Track viral share
        await eventService.trackViralShare(currentUserId, 'restaurant', restaurant.id, 'native_share', {
          restaurant_name: restaurant.name,
          cuisine_type: restaurant.cuisine_type
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${restaurant.name} - ${shareUrl}`)}`;
      window.open(whatsappUrl, '_blank');
      
      await eventService.trackViralShare(currentUserId, 'restaurant', restaurant.id, 'whatsapp', {
        restaurant_name: restaurant.name,
        cuisine_type: restaurant.cuisine_type
      });
    }
  };

  const toggleFavorite = async (restaurant: Restaurant) => {
    try {
      const isFavorited = favorites.has(restaurant.id);
      
      if (isFavorited) {
        await restaurantService.removeFavorite(currentUserId, restaurant.id);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(restaurant.id);
          return newFavorites;
        });
      } else {
        await restaurantService.addFavorite(currentUserId, restaurant.id);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.add(restaurant.id);
          return newFavorites;
        });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getPriceRangeText = (priceRange: number) => {
    return '$'.repeat(Math.min(priceRange, 4));
  };

  const getRestaurantBadge = (restaurant: Restaurant, index: number) => {
    if (index < 3) return { text: getText('trending'), color: 'bg-red-100 text-red-600' };
    if (restaurant.rating >= 4.5) return { text: getText('hotspot'), color: 'bg-orange-100 text-orange-600' };
    if (favorites.has(restaurant.id)) return { text: getText('groupFavorite'), color: 'bg-green-100 text-green-600' };
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getText('exploreRestaurants')}</h2>
            <p className="text-sm text-green-600 mt-1">
              <Trophy className="w-4 h-4 inline mr-1" />
              {getText('viralBonus')}
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
          
          <div className="flex space-x-2 overflow-x-auto">
            {(['popular', 'new', 'nearby', 'dimsum'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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

        {/* Restaurants List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={loadRestaurants}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Retry
              </button>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">{getText('noRestaurants')}</p>
              <p className="text-sm text-gray-400">{getText('noRestaurantsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant, index) => {
                const badge = getRestaurantBadge(restaurant, index);
                const isFavorited = favorites.has(restaurant.id);
                
                return (
                  <div key={restaurant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                          {badge && (
                            <span className={`px-2 py-1 text-xs rounded-full ${badge.color}`}>
                              {badge.text}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center mb-1">
                          <Utensils className="w-4 h-4 mr-1" />
                          {restaurant.cuisine_type}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {restaurant.address}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleFavorite(restaurant)}
                          className={`p-2 rounded-full hover:bg-gray-100 ${
                            isFavorited ? 'text-red-500' : 'text-gray-400'
                          }`}
                          title={isFavorited ? getText('removeFavorite') : getText('addFavorite')}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleShareRestaurant(restaurant)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                          title={getText('shareRestaurant')}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                        <span>{restaurant.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>{getPriceRangeText(restaurant.price_range)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-green-600">{getText('openNow')}</span>
                      </div>
                    </div>

                    {restaurant.popular_dishes && restaurant.popular_dishes.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Popular dishes:</p>
                        <div className="flex flex-wrap gap-1">
                          {restaurant.popular_dishes.slice(0, 3).map((dish, dishIndex) => (
                            <span 
                              key={dishIndex}
                              className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600"
                            >
                              {dish}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {index < 5 && (
                          <span className="text-orange-600 font-medium">
                            Popular this week 📈
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCreateEvent(restaurant)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {getText('createEvent')}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
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