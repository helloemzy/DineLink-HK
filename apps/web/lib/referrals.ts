import { supabase } from './supabase';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  is_active: boolean;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  signup_reward_amount: number;
  total_rewards_earned: number;
  created_at: string;
  completed_at?: string;
}

export interface ReferralReward {
  id: string;
  referral_id: string;
  user_id: string;
  reward_type: 'signup' | 'first_event' | 'first_bill_split' | 'activity_bonus';
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
}

export interface ReferralStats {
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_progress: {
    current: number;
    next_tier_requirement: number;
    percentage: number;
  };
}

export class ReferralService {
  // Generate unique referral code
  async generateReferralCode(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Generate unique 8-character code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const { data, error } = await supabase
        .from('user_referral_codes')
        .insert({
          user_id: userId,
          code: code,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // If code already exists, try again
        if (error.code === '23505') {
          return this.generateReferralCode(userId);
        }
        console.error('Generate referral code error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, code: data.code };
    } catch (error) {
      console.error('Generate referral code service error:', error);
      return { success: false, error: 'Failed to generate referral code' };
    }
  }

  // Get user's referral code
  async getUserReferralCode(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      const { data: existingCode, error } = await supabase
        .from('user_referral_codes')
        .select('code')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No code exists, generate one
          return this.generateReferralCode(userId);
        }
        console.error('Get referral code error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, code: existingCode.code };
    } catch (error) {
      console.error('Get referral code service error:', error);
      return { success: false, error: 'Failed to get referral code' };
    }
  }

  // Create referral when someone signs up with code
  async createReferral(
    referrerCode: string, 
    newUserId: string
  ): Promise<{ success: boolean; referral?: Referral; error?: string }> {
    try {
      // Find referrer by code
      const { data: codeData, error: codeError } = await supabase
        .from('user_referral_codes')
        .select('user_id')
        .eq('code', referrerCode)
        .eq('is_active', true)
        .single();

      if (codeError) {
        console.error('Invalid referral code:', codeError);
        return { success: false, error: 'Invalid referral code' };
      }

      const referrerId = codeData.user_id;

      // Don't allow self-referral
      if (referrerId === newUserId) {
        return { success: false, error: 'Cannot refer yourself' };
      }

      // Create referral record
      const { data: referral, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referee_id: newUserId,
          referral_code: referrerCode,
          status: 'pending',
          signup_reward_amount: 20, // HK$20 for both parties
          total_rewards_earned: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Create referral error:', error);
        return { success: false, error: error.message };
      }

      // Create signup rewards for both parties
      await this.createReferralReward(referral.id, referrerId, 'signup', 20);
      await this.createReferralReward(referral.id, newUserId, 'signup', 20);

      return { success: true, referral };
    } catch (error) {
      console.error('Create referral service error:', error);
      return { success: false, error: 'Failed to create referral' };
    }
  }

  // Create referral reward
  async createReferralReward(
    referralId: string,
    userId: string, 
    rewardType: 'signup' | 'first_event' | 'first_bill_split' | 'activity_bonus',
    amount: number
  ): Promise<{ success: boolean; reward?: ReferralReward; error?: string }> {
    try {
      const { data: reward, error } = await supabase
        .from('referral_rewards')
        .insert({
          referral_id: referralId,
          user_id: userId,
          reward_type: rewardType,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Create referral reward error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, reward };
    } catch (error) {
      console.error('Create referral reward service error:', error);
      return { success: false, error: 'Failed to create referral reward' };
    }
  }

  // Get referral stats for user
  async getReferralStats(userId: string): Promise<{ success: boolean; stats?: ReferralStats; error?: string }> {
    try {
      // Get referral count
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact' })
        .eq('referrer_id', userId)
        .eq('status', 'completed');

      // Get total earnings
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('referral_rewards')
        .select('amount, status')
        .eq('user_id', userId);

      if (rewardsError) {
        console.error('Get referral rewards error:', rewardsError);
        return { success: false, error: rewardsError.message };
      }

      const totalEarnings = rewardsData
        ?.filter(r => r.status === 'paid')
        .reduce((sum, reward) => sum + reward.amount, 0) || 0;

      const pendingEarnings = rewardsData
        ?.filter(r => r.status === 'pending')
        .reduce((sum, reward) => sum + reward.amount, 0) || 0;

      // Determine tier based on referral count
      let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      let nextTierRequirement = 5;

      if ((referralCount || 0) >= 25) {
        tier = 'platinum';
        nextTierRequirement = 50; // Next milestone
      } else if ((referralCount || 0) >= 10) {
        tier = 'gold';
        nextTierRequirement = 25;
      } else if ((referralCount || 0) >= 5) {
        tier = 'silver';
        nextTierRequirement = 10;
      }

      const tierProgress = {
        current: referralCount || 0,
        next_tier_requirement: nextTierRequirement,
        percentage: Math.min(((referralCount || 0) / nextTierRequirement) * 100, 100)
      };

      const stats: ReferralStats = {
        total_referrals: referralCount || 0,
        total_earnings: totalEarnings,
        pending_earnings: pendingEarnings,
        tier,
        tier_progress: tierProgress
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Get referral stats service error:', error);
      return { success: false, error: 'Failed to get referral stats' };
    }
  }

  // Get user's referrals with details
  async getUserReferrals(userId: string): Promise<{ success: boolean; referrals?: any[]; error?: string }> {
    try {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:referee_id (
            name,
            created_at,
            phone
          ),
          referral_rewards (
            reward_type,
            amount,
            status
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get user referrals error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, referrals: referrals || [] };
    } catch (error) {
      console.error('Get user referrals service error:', error);
      return { success: false, error: 'Failed to get referrals' };
    }
  }

  // Track referral share events for analytics
  async trackReferralShare(
    userId: string, 
    shareMethod: string, 
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('viral_shares')
        .insert({
          user_id: userId,
          content_type: 'referral',
          content_id: metadata.referral_code || 'unknown',
          channel: shareMethod,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error('Track referral share error:', error);
      return { success: false, error: 'Failed to track share' };
    }
  }

  // Process referral milestone (when referee completes actions)
  async processReferralMilestone(
    refereeId: string,
    milestoneType: 'first_event' | 'first_bill_split',
    amount: number = 15
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find referral record for this referee
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_id', refereeId)
        .eq('status', 'pending')
        .single();

      if (referralError) {
        // No referral found, that's okay
        return { success: true };
      }

      // Check if milestone reward already exists
      const { data: existingReward } = await supabase
        .from('referral_rewards')
        .select('id')
        .eq('referral_id', referral.id)
        .eq('reward_type', milestoneType)
        .single();

      if (existingReward) {
        // Already rewarded for this milestone
        return { success: true };
      }

      // Create milestone rewards for both referrer and referee
      const referrerAmount = amount;
      const refereeAmount = amount * 0.5; // 50% for referee

      await this.createReferralReward(referral.id, referral.referrer_id, milestoneType, referrerAmount);
      await this.createReferralReward(referral.id, referral.referee_id, milestoneType, refereeAmount);

      return { success: true };
    } catch (error) {
      console.error('Process referral milestone error:', error);
      return { success: false, error: 'Failed to process milestone' };
    }
  }

  // Complete referral (mark as completed after signup rewards)
  async completeReferral(referralId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (error) {
        console.error('Complete referral error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Complete referral service error:', error);
      return { success: false, error: 'Failed to complete referral' };
    }
  }
}