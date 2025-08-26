import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Notification = Tables['notifications']['Row'];
type NotificationInsert = Tables['notifications']['Insert'];

export interface CreateNotificationData {
  user_id: string;
  type: 'event_invitation' | 'event_update' | 'payment_request' | 'payment_received' | 'bill_split';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  // Create a new notification
  async createNotification(notificationData: CreateNotificationData): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          type: notificationData.type,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Create notification error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notification };
    } catch (error) {
      console.error('Notification service error:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  // Get user's notifications
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get notifications error:', error);
        return [];
      }

      return notifications || [];
    } catch (error) {
      console.error('Get notifications service error:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Mark notification as read error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark as read service error:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Mark all notifications as read error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark all as read service error:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Get unread count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Get unread count service error:', error);
      return 0;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete notification error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete notification service error:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  // Create event invitation notification
  async createEventInvitation(
    invitedUserId: string, 
    eventName: string, 
    organizerName: string, 
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.createNotification({
      user_id: invitedUserId,
      type: 'event_invitation',
      title: 'New Event Invitation',
      body: `${organizerName} invited you to join "${eventName}"`,
      data: {
        event_id: eventId,
        organizer_name: organizerName,
        event_name: eventName
      }
    });

    return { success: result.success, error: result.error };
  }

  // Create event update notification
  async createEventUpdate(
    memberUserIds: string[],
    eventName: string,
    updateMessage: string,
    eventId: string
  ): Promise<{ success: boolean; errors?: string[] }> {
    const results = await Promise.all(
      memberUserIds.map(userId => 
        this.createNotification({
          user_id: userId,
          type: 'event_update',
          title: 'Event Update',
          body: `"${eventName}": ${updateMessage}`,
          data: {
            event_id: eventId,
            event_name: eventName,
            update_message: updateMessage
          }
        })
      )
    );

    const errors = results.filter(r => !r.success).map(r => r.error || 'Unknown error');
    return { 
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Create payment request notification
  async createPaymentRequest(
    payerUserId: string,
    amount: number,
    currency: string,
    eventName: string,
    requesterId: string,
    requesterName: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.createNotification({
      user_id: payerUserId,
      type: 'payment_request',
      title: 'Payment Request',
      body: `${requesterName} is requesting ${currency}$${amount} for "${eventName}"`,
      data: {
        amount,
        currency,
        event_name: eventName,
        requester_id: requesterId,
        requester_name: requesterName
      }
    });

    return { success: result.success, error: result.error };
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = supabase
      .channel('user_notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          if (payload.new) {
            callback(payload.new as Notification);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => subscription.unsubscribe();
  }

  // Format notification time
  formatNotificationTime(sentAt: string, language: 'en' | 'zh' = 'en'): string {
    const date = new Date(sentAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (language === 'zh') {
      if (diffMins < 1) return '剛剛';
      if (diffMins < 60) return `${diffMins}分鐘前`;
      if (diffHours < 24) return `${diffHours}小時前`;
      if (diffDays < 30) return `${diffDays}天前`;
      return date.toLocaleDateString('zh-HK');
    } else {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-HK');
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type: string): string {
    const icons = {
      event_invitation: '🎉',
      event_update: '📅',
      payment_request: '💰',
      payment_received: '✅',
      bill_split: '🧾'
    };
    return icons[type as keyof typeof icons] || '📢';
  }
}