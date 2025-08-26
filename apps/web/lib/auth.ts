import { supabase } from './supabase';
import type { User, AuthResponse } from '@supabase/supabase-js';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];

export type DineLinker = Tables['users']['Row'] & {
  auth_user?: User;
};

export class AuthService {
  // Send SMS verification code for Hong Kong numbers
  async sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Format phone number for Hong Kong (+852)
      const formattedPhone = phone.startsWith('852') ? `+${phone}` : `+852${phone}`;
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          shouldCreateUser: true,
          data: {
            phone: phone, // Store without country code for our users table
          }
        }
      });

      if (error) {
        console.error('SMS verification error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('SMS service error:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  // Verify SMS code and complete authentication
  async verifyCode(phone: string, token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const formattedPhone = phone.startsWith('852') ? `+${phone}` : `+852${phone}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token,
        type: 'sms'
      });

      if (error) {
        console.error('OTP verification error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true, user: data.user };
      }

      return { success: false, error: 'No user returned from verification' };
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, error: 'Failed to verify code' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<DineLinker | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      const profile = await this.getUserProfile(user.id);
      return profile;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get user profile from our custom users table
  async getUserProfile(userId: string): Promise<DineLinker | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Get user profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('User profile service error:', error);
      return null;
    }
  }

  // Create user profile (called after successful phone verification)  
  async createUserProfile(data: {
    user_id: string;
    phone: string;
    name: string;
    language?: string;
  }): Promise<{ success: boolean; profile?: DineLinker; error?: string }> {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .insert({
          id: data.user_id,
          phone: data.phone,
          name: data.name,
          language: data.language || 'en'
        })
        .select()
        .single();

      if (error) {
        console.error('Create user profile error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, profile };
    } catch (error) {
      console.error('Create profile service error:', error);
      return { success: false, error: 'Failed to create profile' };
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<Tables['users']['Update']>): Promise<DineLinker | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update user profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Update profile service error:', error);
      return null;
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Failed to sign out' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: DineLinker | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getUserProfile(session.user.id);
        callback(profile);
      } else {
        callback(null);
      }
    });
  }
}