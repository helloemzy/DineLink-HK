import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type DiningEvent = Tables['dining_events']['Row'];
type DiningEventInsert = Tables['dining_events']['Insert'];
type DiningEventUpdate = Tables['dining_events']['Update'];
type EventMember = Tables['event_members']['Row'];
type EventMemberInsert = Tables['event_members']['Insert'];

export interface DiningEventWithMembers extends DiningEvent {
  organizer: {
    id: string;
    name: string;
    phone: string;
  };
  members: Array<{
    id: string;
    user_id: string;
    status: string;
    role: string;
    user: {
      name: string;
      phone: string;
    };
  }>;
  member_count: number;
}

export interface CreateEventData {
  name: string;
  restaurant_name?: string;
  restaurant_google_place_id?: string;
  location?: string;
  event_datetime: string;
  estimated_cost?: number;
  max_attendees?: number;
  notes?: string;
  is_private?: boolean;
}

export interface InviteMemberData {
  phone: string;
  role?: 'member' | 'co_organizer';
  dietary_restrictions?: string[];
}

export class EventService {
  // Create a new dining event
  async createEvent(eventData: CreateEventData, organizerId: string): Promise<{ success: boolean; event?: DiningEvent; error?: string }> {
    try {
      const { data: event, error } = await supabase
        .from('dining_events')
        .insert({
          ...eventData,
          organizer_id: organizerId,
          status: 'planning'
        })
        .select()
        .single();

      if (error) {
        console.error('Create event error:', error);
        return { success: false, error: error.message };
      }

      // Add organizer as a member with 'organizer' role
      const { error: memberError } = await supabase
        .from('event_members')
        .insert({
          event_id: event.id,
          user_id: organizerId,
          status: 'confirmed',
          role: 'organizer'
        });

      if (memberError) {
        console.error('Add organizer as member error:', memberError);
        // Event created but organizer not added as member - this is recoverable
      }

      return { success: true, event };
    } catch (error) {
      console.error('Event service error:', error);
      return { success: false, error: 'Failed to create event' };
    }
  }

  // Get user's events (as organizer or member)
  async getUserEvents(userId: string): Promise<DiningEventWithMembers[]> {
    try {
      const { data: events, error } = await supabase
        .from('dining_events')
        .select(`
          *,
          organizer:users!organizer_id (
            id, name, phone
          ),
          event_members (
            id, user_id, status, role, dietary_restrictions,
            user:users (name, phone)
          )
        `)
        .or(`organizer_id.eq.${userId},id.in.(${await this.getUserEventIds(userId)})`)
        .order('event_datetime', { ascending: true });

      if (error) {
        console.error('Get user events error:', error);
        return [];
      }

      return (events || []).map(event => ({
        ...event,
        members: event.event_members || [],
        member_count: (event.event_members || []).length
      }));
    } catch (error) {
      console.error('Get user events service error:', error);
      return [];
    }
  }

  // Helper to get event IDs where user is a member
  private async getUserEventIds(userId: string): Promise<string> {
    try {
      const { data: memberships, error } = await supabase
        .from('event_members')
        .select('event_id')
        .eq('user_id', userId);

      if (error || !memberships) return '';
      
      return memberships.map(m => m.event_id).join(',') || '';
    } catch (error) {
      return '';
    }
  }

  // Get a specific event with full details
  async getEventDetails(eventId: string, userId: string): Promise<{ success: boolean; event?: DiningEventWithMembers; error?: string }> {
    try {
      const { data: event, error } = await supabase
        .from('dining_events')
        .select(`
          *,
          organizer:users!organizer_id (
            id, name, phone
          ),
          event_members (
            id, user_id, status, role, dietary_restrictions,
            user:users (name, phone)
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Get event details error:', error);
        return { success: false, error: error.message };
      }

      // Check if user has access to this event
      const isOrganizer = event.organizer_id === userId;
      const isMember = event.event_members?.some((m: any) => m.user_id === userId);
      
      if (!isOrganizer && !isMember && event.is_private) {
        return { success: false, error: 'Access denied to private event' };
      }

      const eventWithMembers: DiningEventWithMembers = {
        ...event,
        members: event.event_members || [],
        member_count: (event.event_members || []).length
      };

      return { success: true, event: eventWithMembers };
    } catch (error) {
      console.error('Event details service error:', error);
      return { success: false, error: 'Failed to get event details' };
    }
  }

  // Update an event (only organizer)
  async updateEvent(eventId: string, updates: DiningEventUpdate, userId: string): Promise<{ success: boolean; event?: DiningEvent; error?: string }> {
    try {
      // Verify user is the organizer
      const { data: existingEvent, error: checkError } = await supabase
        .from('dining_events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      if (checkError || existingEvent?.organizer_id !== userId) {
        return { success: false, error: 'Only the organizer can update this event' };
      }

      const { data: event, error } = await supabase
        .from('dining_events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Update event error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, event };
    } catch (error) {
      console.error('Update event service error:', error);
      return { success: false, error: 'Failed to update event' };
    }
  }

  // Delete an event (only organizer)
  async deleteEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user is the organizer
      const { data: existingEvent, error: checkError } = await supabase
        .from('dining_events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      if (checkError || existingEvent?.organizer_id !== userId) {
        return { success: false, error: 'Only the organizer can delete this event' };
      }

      const { error } = await supabase
        .from('dining_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Delete event error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete event service error:', error);
      return { success: false, error: 'Failed to delete event' };
    }
  }

  // Invite member to event by phone number
  async inviteMember(eventId: string, inviteData: InviteMemberData, organizerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user is the organizer
      const { data: existingEvent, error: checkError } = await supabase
        .from('dining_events')
        .select('organizer_id, max_attendees')
        .eq('id', eventId)
        .single();

      if (checkError || existingEvent?.organizer_id !== organizerId) {
        return { success: false, error: 'Only the organizer can invite members' };
      }

      // Check if event is at capacity
      if (existingEvent.max_attendees) {
        const { count } = await supabase
          .from('event_members')
          .select('*', { count: 'exact' })
          .eq('event_id', eventId);

        if (count && count >= existingEvent.max_attendees) {
          return { success: false, error: 'Event is at maximum capacity' };
        }
      }

      // Find user by phone number
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', inviteData.phone)
        .single();

      if (userError || !user) {
        return { success: false, error: 'User not found with this phone number' };
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('event_members')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { success: false, error: 'User is already a member of this event' };
      }

      // Add member to event
      const { error: addError } = await supabase
        .from('event_members')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'invited',
          role: inviteData.role || 'member',
          dietary_restrictions: inviteData.dietary_restrictions
        });

      if (addError) {
        console.error('Add member error:', addError);
        return { success: false, error: addError.message };
      }

      // TODO: Send notification to invited user

      return { success: true };
    } catch (error) {
      console.error('Invite member service error:', error);
      return { success: false, error: 'Failed to invite member' };
    }
  }

  // Join an event (respond to invitation)
  async joinEvent(eventId: string, userId: string, response: 'confirmed' | 'declined'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('event_members')
        .update({ status: response })
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.error('Join event error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Join event service error:', error);
      return { success: false, error: 'Failed to update event status' };
    }
  }

  // Leave an event
  async leaveEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is the organizer
      const { data: event, error: checkError } = await supabase
        .from('dining_events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      if (checkError) {
        return { success: false, error: 'Event not found' };
      }

      if (event.organizer_id === userId) {
        return { success: false, error: 'Organizers cannot leave their own events. Please delete the event instead.' };
      }

      const { error } = await supabase
        .from('event_members')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.error('Leave event error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Leave event service error:', error);
      return { success: false, error: 'Failed to leave event' };
    }
  }

  // Get public events (for discovery)
  async getPublicEvents(limit: number = 10): Promise<DiningEventWithMembers[]> {
    try {
      const { data: events, error } = await supabase
        .from('dining_events')
        .select(`
          *,
          organizer:users!organizer_id (
            id, name, phone
          ),
          event_members (
            id, user_id, status, role,
            user:users (name, phone)
          )
        `)
        .eq('is_private', false)
        .eq('status', 'planning')
        .gte('event_datetime', new Date().toISOString())
        .order('event_datetime', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Get public events error:', error);
        return [];
      }

      return (events || []).map(event => ({
        ...event,
        members: event.event_members || [],
        member_count: (event.event_members || []).length
      }));
    } catch (error) {
      console.error('Get public events service error:', error);
      return [];
    }
  }

  // Search events by restaurant or location
  async searchEvents(query: string, userId?: string): Promise<DiningEventWithMembers[]> {
    try {
      let queryBuilder = supabase
        .from('dining_events')
        .select(`
          *,
          organizer:users!organizer_id (
            id, name, phone
          ),
          event_members (
            id, user_id, status, role,
            user:users (name, phone)
          )
        `)
        .or(`restaurant_name.ilike.%${query}%,location.ilike.%${query}%,name.ilike.%${query}%`)
        .gte('event_datetime', new Date().toISOString())
        .order('event_datetime', { ascending: true })
        .limit(20);

      // If no user provided, only show public events
      if (!userId) {
        queryBuilder = queryBuilder.eq('is_private', false);
      }

      const { data: events, error } = await queryBuilder;

      if (error) {
        console.error('Search events error:', error);
        return [];
      }

      return (events || []).map(event => ({
        ...event,
        members: event.event_members || [],
        member_count: (event.event_members || []).length
      }));
    } catch (error) {
      console.error('Search events service error:', error);
      return [];
    }
  }

  // Subscribe to real-time event updates
  subscribeToEventUpdates(eventId: string, callback: (event: DiningEventWithMembers) => void) {
    // Subscribe to event changes
    const eventSubscription = supabase
      .channel('event_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'dining_events',
          filter: `id=eq.${eventId}`
        }, 
        async (payload) => {
          // Re-fetch full event details when changes occur
          const result = await this.getEventDetails(eventId, ''); // Will need user context
          if (result.success && result.event) {
            callback(result.event);
          }
        }
      )
      .subscribe();

    // Subscribe to member changes
    const memberSubscription = supabase
      .channel('member_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'event_members',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Re-fetch full event details when member changes occur
          const result = await this.getEventDetails(eventId, '');
          if (result.success && result.event) {
            callback(result.event);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      eventSubscription.unsubscribe();
      memberSubscription.unsubscribe();
    };
  }
}