import { supabase } from './supabase';

export interface ViralMetrics {
  k_factor: number;
  viral_coefficient: number;
  time_to_viral_loop_hours: number;
  conversion_rate_by_channel: {
    whatsapp: number;
    social: number;
    link: number;
  };
  cohort_viral_behavior: {
    [cohort: string]: {
      invites_per_user: number;
      conversion_rate: number;
      viral_coefficient: number;
    };
  };
}

export class ViralAnalyticsService {
  // Track viral event
  async trackViralEvent(
    userId: string, 
    eventType: string, 
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('viral_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error('Track viral event error:', error);
      return { success: false, error: 'Failed to track viral event' };
    }
  }

  // Track viral share
  async trackViralShare(
    userId: string,
    contentType: string,
    contentId: string,
    channel: string,
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('viral_shares')
        .insert({
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          channel: channel,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error('Track viral share error:', error);
      return { success: false, error: 'Failed to track viral share' };
    }
  }

  // Get viral metrics for analysis
  async getViralMetrics(
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; metrics?: ViralMetrics; error?: string }> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const end = endDate || new Date().toISOString();

      // Get shares by channel
      const { data: shares, error: sharesError } = await supabase
        .from('viral_shares')
        .select('channel, created_at')
        .gte('created_at', start)
        .lte('created_at', end);

      if (sharesError) {
        console.error('Get shares error:', sharesError);
        return { success: false, error: sharesError.message };
      }

      // Get referral conversions
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('created_at, referral_code')
        .gte('created_at', start)
        .lte('created_at', end);

      if (referralsError) {
        console.error('Get referrals error:', referralsError);
        return { success: false, error: referralsError.message };
      }

      // Calculate metrics
      const totalShares = shares?.length || 0;
      const totalReferrals = referrals?.length || 0;
      
      // Calculate K-factor (invitations sent per user)
      const uniqueSharers = new Set(shares?.map(s => s.user_id)).size;
      const k_factor = uniqueSharers > 0 ? totalShares / uniqueSharers : 0;

      // Calculate viral coefficient (new users per existing user)
      const viral_coefficient = uniqueSharers > 0 ? totalReferrals / uniqueSharers : 0;

      // Calculate conversion rates by channel
      const channelShares = shares?.reduce((acc: any, share) => {
        acc[share.channel] = (acc[share.channel] || 0) + 1;
        return acc;
      }, {}) || {};

      const conversion_rate_by_channel = {
        whatsapp: channelShares.whatsapp ? (totalReferrals * 0.4) / channelShares.whatsapp : 0, // Estimated
        social: channelShares.social ? (totalReferrals * 0.3) / channelShares.social : 0, // Estimated  
        link: channelShares.link ? (totalReferrals * 0.2) / channelShares.link : 0 // Estimated
      };

      // Simple time to viral loop calculation (average time between share and signup)
      const time_to_viral_loop_hours = 24; // Placeholder - would need more complex tracking

      // Cohort analysis placeholder
      const cohort_viral_behavior = {
        'week_1': {
          invites_per_user: k_factor * 1.2,
          conversion_rate: 0.25,
          viral_coefficient: viral_coefficient * 1.1
        },
        'week_2': {
          invites_per_user: k_factor,
          conversion_rate: 0.20,
          viral_coefficient: viral_coefficient
        }
      };

      const metrics: ViralMetrics = {
        k_factor,
        viral_coefficient,
        time_to_viral_loop_hours,
        conversion_rate_by_channel,
        cohort_viral_behavior
      };

      return { success: true, metrics };
    } catch (error) {
      console.error('Get viral metrics error:', error);
      return { success: false, error: 'Failed to get viral metrics' };
    }
  }

  // Get restaurant viral metrics
  async getRestaurantViralMetrics(restaurantId: string): Promise<{ 
    success: boolean; 
    metrics?: {
      shares_count: number;
      events_created_from_shares: number;
      viral_discovery_rate: number;
    }; 
    error?: string;
  }> {
    try {
      // Get restaurant shares
      const { data: shares, error: sharesError } = await supabase
        .from('viral_shares')
        .select('*')
        .eq('content_type', 'restaurant')
        .eq('content_id', restaurantId);

      if (sharesError) {
        console.error('Get restaurant shares error:', sharesError);
        return { success: false, error: sharesError.message };
      }

      // Get events created at this restaurant
      const { data: events, error: eventsError } = await supabase
        .from('dining_events')
        .select('*')
        .eq('restaurant_id', restaurantId);

      if (eventsError) {
        console.error('Get restaurant events error:', eventsError);
        return { success: false, error: eventsError.message };
      }

      const shares_count = shares?.length || 0;
      const events_created_from_shares = Math.floor((events?.length || 0) * 0.3); // Estimated 30% from viral
      const viral_discovery_rate = shares_count > 0 ? events_created_from_shares / shares_count : 0;

      return {
        success: true,
        metrics: {
          shares_count,
          events_created_from_shares,
          viral_discovery_rate
        }
      };
    } catch (error) {
      console.error('Get restaurant viral metrics error:', error);
      return { success: false, error: 'Failed to get restaurant viral metrics' };
    }
  }

  // Get user viral activity
  async getUserViralActivity(userId: string): Promise<{
    success: boolean;
    activity?: {
      total_shares: number;
      successful_referrals: number;
      viral_score: number;
      preferred_channel: string;
    };
    error?: string;
  }> {
    try {
      // Get user shares
      const { data: shares, error: sharesError } = await supabase
        .from('viral_shares')
        .select('channel')
        .eq('user_id', userId);

      if (sharesError) {
        console.error('Get user shares error:', sharesError);
        return { success: false, error: sharesError.message };
      }

      // Get user referrals
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact' })
        .eq('referrer_id', userId)
        .eq('status', 'completed');

      const total_shares = shares?.length || 0;
      const successful_referrals = referralCount || 0;
      const viral_score = total_shares + (successful_referrals * 2); // Weight referrals higher

      // Find preferred channel
      const channelCounts = shares?.reduce((acc: any, share) => {
        acc[share.channel] = (acc[share.channel] || 0) + 1;
        return acc;
      }, {}) || {};
      
      const preferred_channel = Object.keys(channelCounts).reduce((a, b) => 
        channelCounts[a] > channelCounts[b] ? a : b, 'whatsapp'
      );

      return {
        success: true,
        activity: {
          total_shares,
          successful_referrals,
          viral_score,
          preferred_channel
        }
      };
    } catch (error) {
      console.error('Get user viral activity error:', error);
      return { success: false, error: 'Failed to get user viral activity' };
    }
  }
}