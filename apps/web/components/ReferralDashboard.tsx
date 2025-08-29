'use client';
import { useState, useEffect } from 'react';
import { 
  X,
  Gift, 
  Users, 
  DollarSign,
  Share2,
  Copy,
  MessageCircle,
  Crown,
  Trophy,
  Heart,
  Star,
  CheckCircle,
  Clock,
  Plus,
  Target
} from 'lucide-react';
import { ReferralService } from '../lib/referrals';

interface ReferralDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentLanguage: 'en' | 'zh';
}

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: {
    current: number;
    nextTier: number;
    percentage: number;
  };
}

interface Referral {
  id: string;
  referredUser: {
    name: string;
    joinDate: string;
    status: 'pending' | 'active' | 'churned';
  };
  earnings: {
    signup: number;
    eventActivity: number;
    billSplitting: number;
    total: number;
  };
  milestones: {
    signedUp: boolean;
    firstEvent: boolean;
    firstBillSplit: boolean;
    firstShare: boolean;
  };
}

export default function ReferralDashboard({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentLanguage
}: ReferralDashboardProps) {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 7,
    totalEarnings: 284,
    pendingEarnings: 65,
    referralCode: 'DINE7K2M',
    tier: 'silver',
    progress: { current: 7, nextTier: 10, percentage: 70 }
  });

  const [referrals, setReferrals] = useState<Referral[]>([
    {
      id: '1',
      referredUser: { name: 'Sarah L.', joinDate: '2025-01-20', status: 'active' },
      earnings: { signup: 20, eventActivity: 15, billSplitting: 25, total: 60 },
      milestones: { signedUp: true, firstEvent: true, firstBillSplit: true, firstShare: false }
    },
    {
      id: '2', 
      referredUser: { name: 'Mike W.', joinDate: '2025-01-18', status: 'active' },
      earnings: { signup: 20, eventActivity: 15, billSplitting: 25, total: 60 },
      milestones: { signedUp: true, firstEvent: true, firstBillSplit: true, firstShare: true }
    }
  ]);

  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'share'>('overview');
  const [copied, setCopied] = useState(false);

  const referralService = new ReferralService();

  const getText = (key: string) => {
    const texts = {
      en: {
        referralProgram: 'Referral Program',
        yourReferralCode: 'Your Referral Code',
        totalEarned: 'Total Earned',
        pendingRewards: 'Pending Rewards',
        activeReferrals: 'Active Referrals',
        currentTier: 'Current Tier',
        nextTier: 'Next Tier',
        progress: 'Progress',
        overview: 'Overview',
        referrals: 'My Referrals',
        share: 'Share & Earn',
        shareReferralCode: 'Share Your Code',
        copyCode: 'Copy Code',
        shareWhatsApp: 'Share on WhatsApp',
        shareSocial: 'Share on Social Media',
        howItWorks: 'How It Works',
        step1: 'Share your code with friends',
        step2: 'They sign up using your code',
        step3: 'You both earn HK$20!',
        step4: 'Earn more as they use DineLink',
        culturalMessage: 'Share the joy of group dining with your friends! 分享團體用餐的樂趣！',
        guanxiBonus: 'Relationship Bonus',
        moreActive: 'The more active your friends, the more you both earn',
        bronze: 'Bronze Member',
        silver: 'Silver Member', 
        gold: 'Gold Member',
        platinum: 'Platinum Ambassador',
        tierBenefit: 'Tier Benefit',
        bronzeBenefit: 'Standard rewards',
        silverBenefit: '+10% bonus on all earnings',
        goldBenefit: '+20% bonus + exclusive events',
        platinumBenefit: '+30% bonus + VIP support',
        signupBonus: 'Signup Bonus',
        activityBonus: 'Activity Bonus',
        billSplitBonus: 'Bill Split Bonus',
        totalEarnings: 'Total Earnings',
        pending: 'Pending',
        active: 'Active',
        joined: 'Joined',
        milestones: 'Milestones',
        signedUp: 'Signed up',
        firstEvent: 'First event',
        firstBillSplit: 'First bill split',
        firstShare: 'First share',
        shareMessage: 'Join me on DineLink - the easiest way to organize group dining in Hong Kong! Use my code {code} and we both get HK$20. No more awkward bill splitting! 🍽️',
        shareMessageZh: '加入我使用 DineLink - 香港最簡單的團體用餐組織方式！使用我的代碼 {code}，我們都能獲得 HK$20。不再有尷尬的分帳！🍽️',
        copied: 'Copied!',
        close: 'Close',
        inviteFriends: 'Invite Friends',
        earnTogether: 'Earn Together',
        buildRelationships: 'Build Stronger Relationships',
        culturalNote: 'In Hong Kong culture, sharing good experiences strengthens relationships',
        faceValue: 'Give your friends "face" by introducing them to DineLink',
        harmoniousDining: 'Create harmonious group dining experiences'
      },
      zh: {
        referralProgram: '推薦計劃',
        yourReferralCode: '您的推薦代碼',
        totalEarned: '總收入',
        pendingRewards: '待發放獎勵',
        activeReferrals: '活躍推薦',
        currentTier: '當前等級',
        nextTier: '下一等級',
        progress: '進度',
        overview: '概覽',
        referrals: '我的推薦',
        share: '分享賺錢',
        shareReferralCode: '分享您的代碼',
        copyCode: '複製代碼',
        shareWhatsApp: '在 WhatsApp 分享',
        shareSocial: '在社交媒體分享',
        howItWorks: '如何運作',
        step1: '與朋友分享您的代碼',
        step2: '他們使用您的代碼註冊',
        step3: '你們都獲得 HK$20！',
        step4: '他們使用 DineLink 時您獲得更多',
        culturalMessage: '與朋友分享團體用餐的樂趣！Share the joy with friends!',
        guanxiBonus: '關係獎勵',
        moreActive: '朋友越活躍，你們賺得越多',
        bronze: '青銅會員',
        silver: '白銀會員',
        gold: '黃金會員', 
        platinum: '白金大使',
        tierBenefit: '等級福利',
        bronzeBenefit: '標準獎勵',
        silverBenefit: '所有收入 +10% 獎勵',
        goldBenefit: '+20% 獎勵 + 專屬活動',
        platinumBenefit: '+30% 獎勵 + VIP 支援',
        signupBonus: '註冊獎勵',
        activityBonus: '活動獎勵',
        billSplitBonus: '分帳獎勵',
        totalEarnings: '總收入',
        pending: '待定',
        active: '活躍',
        joined: '加入',
        milestones: '里程碑',
        signedUp: '已註冊',
        firstEvent: '首次活動',
        firstBillSplit: '首次分帳',
        firstShare: '首次分享',
        shareMessage: '加入我使用 DineLink - 香港最簡單的團體用餐組織方式！使用我的代碼 {code}，我們都能獲得 HK$20。不再有尷尬的分帳！🍽️',
        shareMessageZh: '加入我使用 DineLink - 香港最簡單的團體用餐組織方式！使用我的代碼 {code}，我們都能獲得 HK$20。不再有尷尬的分帳！🍽️',
        copied: '已複製！',
        close: '關閉',
        inviteFriends: '邀請朋友',
        earnTogether: '一起賺錢',
        buildRelationships: '建立更強的關係',
        culturalNote: '在香港文化中，分享好體驗能加強關係',
        faceValue: '通過介紹 DineLink 給朋友們「面子」',
        harmoniousDining: '創造和諧的團體用餐體驗'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferral = async (method: 'whatsapp' | 'social') => {
    const message = getText('shareMessage').replace('{code}', stats.referralCode);
    const shareUrl = `${window.location.origin}/?ref=${stats.referralCode}`;
    const fullMessage = `${message}\n\n${shareUrl}`;

    try {
      switch (method) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
          break;
        case 'social':
          if (navigator.share) {
            await navigator.share({
              title: 'Join DineLink',
              text: message,
              url: shareUrl
            });
          } else {
            await navigator.clipboard.writeText(fullMessage);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
          break;
      }

      // Track viral share
      await referralService.trackReferralShare(currentUserId, method, {
        referral_code: stats.referralCode,
        message_type: 'referral_invitation'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="w-5 h-5 text-purple-500" />;
      case 'gold': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'silver': return <Star className="w-5 h-5 text-gray-400" />;
      default: return <Target className="w-5 h-5 text-orange-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-purple-500 to-pink-500';
      case 'gold': return 'from-yellow-400 to-orange-500';  
      case 'silver': return 'from-gray-400 to-gray-600';
      default: return 'from-orange-400 to-red-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative">
          <div className={`bg-gradient-to-r ${getTierColor(stats.tier)} p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getTierIcon(stats.tier)}
                <div>
                  <h2 className="text-xl font-semibold">{getText('referralProgram')}</h2>
                  <p className="text-white/80">{getText(stats.tier)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">HK${stats.totalEarnings}</p>
                <p className="text-white/80 text-sm">{getText('totalEarned')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                <p className="text-white/80 text-sm">{getText('activeReferrals')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">HK${stats.pendingEarnings}</p>
                <p className="text-white/80 text-sm">{getText('pendingRewards')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['overview', 'referrals', 'share'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === tab
                  ? 'text-red-600 border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {getText(tab)}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Tier Progress */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{getText('progress')}</span>
                  <span className="text-sm text-gray-500">
                    {stats.progress.current}/{stats.progress.nextTier} referrals
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`bg-gradient-to-r ${getTierColor(stats.tier)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${stats.progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {stats.progress.nextTier - stats.progress.current} more to reach {getText('gold')}
                </p>
              </div>

              {/* Cultural Messaging */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Heart className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900 mb-2">{getText('buildRelationships')}</h3>
                    <p className="text-sm text-red-700 mb-2">{getText('culturalNote')}</p>
                    <p className="text-sm text-red-600">{getText('faceValue')}</p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{getText('howItWorks')}</h3>
                <div className="space-y-3">
                  {[
                    { step: 'step1', icon: Share2, color: 'bg-blue-100 text-blue-600' },
                    { step: 'step2', icon: Users, color: 'bg-green-100 text-green-600' },
                    { step: 'step3', icon: Gift, color: 'bg-purple-100 text-purple-600' },
                    { step: 'step4', icon: DollarSign, color: 'bg-orange-100 text-orange-600' }
                  ].map(({ step, icon: Icon, color }, index) => (
                    <div key={step} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-700">{getText(step)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{getText('inviteFriends')}</p>
                </div>
              ) : (
                referrals.map((referral) => (
                  <div key={referral.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{referral.referredUser.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{getText('joined')} {new Date(referral.referredUser.joinDate).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(referral.referredUser.status)}`}>
                            {getText(referral.referredUser.status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+HK${referral.earnings.total}</p>
                        <p className="text-xs text-gray-500">{getText('totalEarnings')}</p>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="flex items-center space-x-4 text-xs">
                      {Object.entries(referral.milestones).map(([milestone, completed]) => (
                        <div key={milestone} className={`flex items-center space-x-1 ${completed ? 'text-green-600' : 'text-gray-400'}`}>
                          {completed ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{getText(milestone)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div>
                          <p className="font-medium">+HK${referral.earnings.signup}</p>
                          <p className="text-gray-500">{getText('signupBonus')}</p>
                        </div>
                        <div>
                          <p className="font-medium">+HK${referral.earnings.eventActivity}</p>
                          <p className="text-gray-500">{getText('activityBonus')}</p>
                        </div>
                        <div>
                          <p className="font-medium">+HK${referral.earnings.billSplitting}</p>
                          <p className="text-gray-500">{getText('billSplitBonus')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Referral Code */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-4">{getText('yourReferralCode')}</h3>
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl font-mono font-bold text-gray-900">{stats.referralCode}</span>
                    <button
                      onClick={copyReferralCode}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && <p className="text-sm text-green-600 mt-2">{getText('copied')}</p>}
                </div>
              </div>

              {/* Cultural Share Message */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700 mb-2">{getText('culturalMessage')}</p>
                <div className="flex items-center justify-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-900">{getText('earnTogether')}</span>
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
              </div>

              {/* Share Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => shareReferral('whatsapp')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {getText('shareWhatsApp')}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyReferralCode}
                    className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {getText('copyCode')}
                  </button>
                  
                  <button
                    onClick={() => shareReferral('social')}
                    className="flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {getText('shareSocial')}
                  </button>
                </div>
              </div>

              {/* Guanxi Bonus Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Trophy className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">{getText('guanxiBonus')}</h4>
                    <p className="text-sm text-yellow-700">{getText('moreActive')}</p>
                  </div>
                </div>
              </div>
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