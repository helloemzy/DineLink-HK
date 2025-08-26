'use client';
import { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus,
  Phone,
  Check,
  Clock,
  Trash2,
  Crown,
  Shield,
  Calculator,
  Receipt
} from 'lucide-react';
import { EventService } from '../lib/events';
import { NotificationService } from '../lib/notifications';
import type { DiningEventWithMembers } from '../lib/events';

interface EventMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DiningEventWithMembers | null;
  currentUserId: string;
  currentUserName: string;
  currentLanguage: 'en' | 'zh';
  onEventUpdated: () => void;
  onShowBillSplit?: () => void;
}

export default function EventMemberModal({
  isOpen,
  onClose,
  event,
  currentUserId,
  currentUserName,
  currentLanguage,
  onEventUpdated,
  onShowBillSplit
}: EventMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'co_organizer'>('member');

  const eventService = new EventService();
  const notificationService = new NotificationService();

  const getText = (key: string) => {
    const texts = {
      en: {
        eventMembers: 'Event Members',
        inviteMember: 'Invite Member',
        phoneNumber: 'Phone Number',
        phonePlaceholder: 'Hong Kong mobile number',
        role: 'Role',
        member: 'Member',
        coOrganizer: 'Co-Organizer',
        organizer: 'Organizer',
        invited: 'Invited',
        confirmed: 'Confirmed',
        declined: 'Declined',
        sendInvite: 'Send Invite',
        cancel: 'Cancel',
        close: 'Close',
        inviting: 'Inviting...',
        noMembers: 'No members yet',
        inviteSuccess: 'Invitation sent successfully',
        joinEvent: 'Join Event',
        declineEvent: 'Decline Event',
        leaveEvent: 'Leave Event',
        removeMember: 'Remove Member',
        confirm: 'Confirm',
        people: 'people',
        splitBill: 'Split Bill',
        splitBillDesc: 'Divide the bill among members'
      },
      zh: {
        eventMembers: '活動成員',
        inviteMember: '邀請成員',
        phoneNumber: '電話號碼',
        phonePlaceholder: '香港手機號碼',
        role: '角色',
        member: '成員',
        coOrganizer: '共同組織者',
        organizer: '組織者',
        invited: '已邀請',
        confirmed: '已確認',
        declined: '已拒絕',
        sendInvite: '發送邀請',
        cancel: '取消',
        close: '關閉',
        inviting: '邀請中...',
        noMembers: '暫無成員',
        inviteSuccess: '邀請發送成功',
        joinEvent: '加入活動',
        declineEvent: '拒絕活動',
        leaveEvent: '離開活動',
        removeMember: '移除成員',
        confirm: '確認',
        people: '人',
        splitBill: '分攤帳單',
        splitBillDesc: '在成員之間分攤帳單'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  const isOrganizer = event?.organizer_id === currentUserId;
  const currentUserMembership = event?.members.find(m => m.user_id === currentUserId);

  const handleInviteMember = async () => {
    if (!event || !invitePhone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    // Validate Hong Kong phone number
    if (!invitePhone.match(/^[6-9]\d{7}$/)) {
      setError('Please enter a valid Hong Kong mobile number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.inviteMember(
        event.id,
        {
          phone: invitePhone,
          role: inviteRole
        },
        currentUserId
      );

      if (result.success) {
        // Create notification for invited user
        await notificationService.createEventInvitation(
          '', // We don't have the user ID here, the backend handles this
          event.name,
          currentUserName,
          event.id
        );

        setInvitePhone('');
        setShowInviteForm(false);
        onEventUpdated();
        
        // Show success message
        setError(null);
      } else {
        setError(result.error || 'Failed to invite member');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = async (response: 'confirmed' | 'declined') => {
    if (!event) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.joinEvent(event.id, currentUserId, response);
      
      if (result.success) {
        onEventUpdated();
        if (response === 'confirmed') {
          setError(null);
        }
      } else {
        setError(result.error || 'Failed to update event status');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!event) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.leaveEvent(event.id, currentUserId);
      
      if (result.success) {
        onEventUpdated();
        onClose();
      } else {
        setError(result.error || 'Failed to leave event');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'co_organizer':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      case 'invited':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="w-4 h-4" />;
      case 'declined':
        return <X className="w-4 h-4" />;
      case 'invited':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getText('eventMembers')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {event.member_count} {getText('people')}
              {event.max_attendees && ` / ${event.max_attendees}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Current user actions */}
          {currentUserMembership?.status === 'invited' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-3">You've been invited to join this event</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleJoinEvent('confirmed')}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {getText('joinEvent')}
                </button>
                <button
                  onClick={() => handleJoinEvent('declined')}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {getText('declineEvent')}
                </button>
              </div>
            </div>
          )}

          {/* Organizer actions */}
          {isOrganizer && (
            <div className="mb-4 space-y-3">
              {!showInviteForm ? (
                <>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    {getText('inviteMember')}
                  </button>
                  
                  {onShowBillSplit && (
                    <button
                      onClick={onShowBillSplit}
                      className="w-full flex items-center justify-center px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <Calculator className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{getText('splitBill')}</div>
                        <div className="text-sm text-green-600">{getText('splitBillDesc')}</div>
                      </div>
                    </button>
                  )}
                </>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getText('phoneNumber')}
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          +852
                        </span>
                        <input
                          type="tel"
                          value={invitePhone}
                          onChange={(e) => setInvitePhone(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder={getText('phonePlaceholder')}
                          maxLength={8}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getText('role')}
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'member' | 'co_organizer')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="member">{getText('member')}</option>
                        <option value="co_organizer">{getText('coOrganizer')}</option>
                      </select>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setShowInviteForm(false);
                          setInvitePhone('');
                          setError(null);
                        }}
                        className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        {getText('cancel')}
                      </button>
                      <button
                        onClick={handleInviteMember}
                        disabled={isLoading || !invitePhone.trim()}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? getText('inviting') : getText('sendInvite')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Members list */}
          <div className="space-y-3">
            {event.members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{getText('noMembers')}</p>
              </div>
            ) : (
              event.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(member.role)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user.name}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500">
                          <Phone className="w-3 h-3 inline mr-1" />
                          +852{member.user.phone}
                        </p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {getStatusIcon(member.status)}
                          <span className="ml-1">{getText(member.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {isOrganizer && member.user_id !== currentUserId && (
                      <button
                        onClick={() => {
                          // TODO: Implement remove member
                          console.log('Remove member:', member.user_id);
                        }}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                        title={getText('removeMember')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Leave event option for non-organizers */}
          {!isOrganizer && currentUserMembership && currentUserMembership.status === 'confirmed' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLeaveEvent}
                disabled={isLoading}
                className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {getText('leaveEvent')}
              </button>
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