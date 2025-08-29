import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Restaurant = Tables['restaurants']['Row'];

export interface RestaurantSearchResult extends Restaurant {
  distance_km?: number;
}

export interface RestaurantFilters {
  cuisine_types?: string[];
  price_range?: number[];
  location?: string;
  features?: string[];
  max_distance_km?: number;
}

export class RestaurantService {
  // Get all restaurants with basic filtering
  async getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .order('google_rating', { ascending: false });

      // Apply filters
      if (filters?.cuisine_types && filters.cuisine_types.length > 0) {
        query = query.overlaps('cuisine_types', filters.cuisine_types);
      }

      if (filters?.price_range && filters.price_range.length > 0) {
        query = query.in('price_range', filters.price_range);
      }

      if (filters?.location) {
        query = query.ilike('address', `%${filters.location}%`);
      }

      if (filters?.features && filters.features.length > 0) {
        query = query.overlaps('features', filters.features);
      }

      const { data: restaurants, error } = await query.limit(50);

      if (error) {
        console.error('Get restaurants error:', error);
        return [];
      }

      return restaurants || [];
    } catch (error) {
      console.error('Restaurant service error:', error);
      return [];
    }
  }

  // Search restaurants by name or cuisine
  async searchRestaurants(searchTerm: string, filters?: RestaurantFilters): Promise<Restaurant[]> {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,name_chinese.ilike.%${searchTerm}%,cuisine_types.cs.{${searchTerm}},address.ilike.%${searchTerm}%`);

      // Apply additional filters
      if (filters?.cuisine_types && filters.cuisine_types.length > 0) {
        query = query.overlaps('cuisine_types', filters.cuisine_types);
      }

      if (filters?.price_range && filters.price_range.length > 0) {
        query = query.in('price_range', filters.price_range);
      }

      if (filters?.features && filters.features.length > 0) {
        query = query.overlaps('features', filters.features);
      }

      const { data: restaurants, error } = await query
        .order('google_rating', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Search restaurants error:', error);
        return [];
      }

      return restaurants || [];
    } catch (error) {
      console.error('Search restaurants service error:', error);
      return [];
    }
  }

  // Get restaurants near a location (requires PostGIS functions)
  async getNearbyRestaurants(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 5,
    filters?: RestaurantFilters
  ): Promise<RestaurantSearchResult[]> {
    try {
      // Use the PostgreSQL function we created in the migration
      const { data: restaurants, error } = await supabase
        .rpc('nearby_restaurants', {
          lat: latitude,
          lng: longitude,
          radius_km: radiusKm
        });

      if (error) {
        console.error('Get nearby restaurants error:', error);
        return [];
      }

      let filteredRestaurants = restaurants || [];

      // Apply client-side filters since RPC doesn't support complex filtering
      if (filters?.cuisine_types && filters.cuisine_types.length > 0) {
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.cuisine_types && r.cuisine_types.some((cuisine: string) => 
            filters.cuisine_types!.includes(cuisine)
          )
        );
      }

      if (filters?.price_range && filters.price_range.length > 0) {
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.price_range && filters.price_range!.includes(r.price_range)
        );
      }

      if (filters?.features && filters.features.length > 0) {
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.features && r.features.some((feature: string) => 
            filters.features!.includes(feature)
          )
        );
      }

      return filteredRestaurants.slice(0, 20); // Limit results
    } catch (error) {
      console.error('Nearby restaurants service error:', error);
      return [];
    }
  }

  // Get restaurant by ID
  async getRestaurantById(id: string): Promise<Restaurant | null> {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get restaurant by ID error:', error);
        return null;
      }

      return restaurant;
    } catch (error) {
      console.error('Get restaurant by ID service error:', error);
      return null;
    }
  }

  // Get restaurant by Google Place ID
  async getRestaurantByPlaceId(placeId: string): Promise<Restaurant | null> {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('google_place_id', placeId)
        .single();

      if (error) {
        console.error('Get restaurant by place ID error:', error);
        return null;
      }

      return restaurant;
    } catch (error) {
      console.error('Get restaurant by place ID service error:', error);
      return null;
    }
  }

  // Get popular restaurants (by rating and features)
  async getPopularRestaurants(limit: number = 10): Promise<Restaurant[]> {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .gte('google_rating', 4.0)
        .order('google_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get popular restaurants error:', error);
        return [];
      }

      return restaurants || [];
    } catch (error) {
      console.error('Popular restaurants service error:', error);
      return [];
    }
  }

  // Get cuisine types for filtering
  async getCuisineTypes(): Promise<string[]> {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('cuisine_types');

      if (error) {
        console.error('Get cuisine types error:', error);
        return [];
      }

      // Extract unique cuisine types
      const cuisineSet = new Set<string>();
      restaurants?.forEach(r => {
        if (r.cuisine_types) {
          r.cuisine_types.forEach(cuisine => cuisineSet.add(cuisine));
        }
      });

      return Array.from(cuisineSet).sort();
    } catch (error) {
      console.error('Cuisine types service error:', error);
      return [];
    }
  }

  // Get available features for filtering
  async getFeatures(): Promise<string[]> {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('features');

      if (error) {
        console.error('Get features error:', error);
        return [];
      }

      // Extract unique features
      const featureSet = new Set<string>();
      restaurants?.forEach(r => {
        if (r.features) {
          r.features.forEach(feature => featureSet.add(feature));
        }
      });

      return Array.from(featureSet).sort();
    } catch (error) {
      console.error('Features service error:', error);
      return [];
    }
  }

  // Add a new restaurant (admin functionality)
  async addRestaurant(restaurantData: Partial<Restaurant>): Promise<{ success: boolean; restaurant?: Restaurant; error?: string }> {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .insert(restaurantData)
        .select()
        .single();

      if (error) {
        console.error('Add restaurant error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, restaurant };
    } catch (error) {
      console.error('Add restaurant service error:', error);
      return { success: false, error: 'Failed to add restaurant' };
    }
  }

  // Update restaurant information
  async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<{ success: boolean; restaurant?: Restaurant; error?: string }> {
    try {
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update restaurant error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, restaurant };
    } catch (error) {
      console.error('Update restaurant service error:', error);
      return { success: false, error: 'Failed to update restaurant' };
    }
  }

  // Format price range for display
  formatPriceRange(priceRange: number): string {
    const ranges = {
      1: '$',
      2: '$$', 
      3: '$$$',
      4: '$$$$'
    };
    return ranges[priceRange as keyof typeof ranges] || '$';
  }

  // Format features for display
  formatFeatures(features: string[], language: 'en' | 'zh' = 'en'): string[] {
    const featureTranslations: Record<string, { en: string; zh: string }> = {
      'michelin_star': { en: 'Michelin Star', zh: '米其林星級' },
      'michelin_three_star': { en: 'Michelin 3 Stars', zh: '米其林三星' },
      'affordable': { en: 'Affordable', zh: '實惠' },
      'queue': { en: 'Popular (Queue)', zh: '排隊熱點' },
      'local_favorite': { en: 'Local Favorite', zh: '當地人最愛' },
      'breakfast': { en: 'Breakfast', zh: '早餐' },
      'pineapple_bun': { en: 'Pineapple Bun', zh: '菠蘿包' },
      'luxury': { en: 'Luxury', zh: '奢華' },
      'private_rooms': { en: 'Private Rooms', zh: '私人房間' },
      'business_dining': { en: 'Business Dining', zh: '商務用餐' },
      'famous_roast_goose': { en: 'Famous Roast Goose', zh: '著名燒鵝' },
      'traditional': { en: 'Traditional', zh: '傳統' },
      'group_dining': { en: 'Group Dining', zh: '團體用餐' },
      'traditional_dim_sum': { en: 'Traditional Dim Sum', zh: '傳統點心' },
      'trolley_service': { en: 'Trolley Service', zh: '推車服務' },
      'large_groups': { en: 'Large Groups', zh: '大型團體' },
      '24_hours': { en: '24 Hours', zh: '24小時營業' },
      'hong_kong_milk_tea': { en: 'HK Milk Tea', zh: '港式奶茶' },
      'casual_dining': { en: 'Casual Dining', zh: '休閒用餐' },
      'famous_xiaolongbao': { en: 'Famous Xiaolongbao', zh: '著名小籠包' },
      'clean': { en: 'Clean', zh: '乾淨' },
      'consistent_quality': { en: 'Consistent Quality', zh: '品質穩定' },
      'wonton_noodles': { en: 'Wonton Noodles', zh: '雲吞麵' },
      'local_institution': { en: 'Local Institution', zh: '本地老字號' }
    };

    return features.map(feature => {
      const translation = featureTranslations[feature];
      return translation ? translation[language] : feature;
    });
  }

  // Get new restaurants (recently added)
  async getNewRestaurants(limit: number = 20) {
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get new restaurants error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, restaurants: restaurants || [] };
    } catch (error) {
      console.error('Get new restaurants service error:', error);
      return { success: false, error: 'Failed to load new restaurants' };
    }
  }

  // User favorites functionality
  async getUserFavorites(userId: string) {
    try {
      const { data: favorites, error } = await supabase
        .from('restaurant_favorites')
        .select(`
          restaurant_id,
          restaurants (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Get user favorites error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, favorites: favorites || [] };
    } catch (error) {
      console.error('Get user favorites service error:', error);
      return { success: false, error: 'Failed to load favorites' };
    }
  }

  async addFavorite(userId: string, restaurantId: string) {
    try {
      const { data, error } = await supabase
        .from('restaurant_favorites')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId
        })
        .select();

      if (error) {
        console.error('Add favorite error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, favorite: data?.[0] };
    } catch (error) {
      console.error('Add favorite service error:', error);
      return { success: false, error: 'Failed to add favorite' };
    }
  }

  async removeFavorite(userId: string, restaurantId: string) {
    try {
      const { error } = await supabase
        .from('restaurant_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('Remove favorite error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Remove favorite service error:', error);
      return { success: false, error: 'Failed to remove favorite' };
    }
  }
}