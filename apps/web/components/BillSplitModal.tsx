'use client';
import { useState, useEffect } from 'react';
import { 
  X, 
  Plus,
  Minus,
  Calculator,
  Receipt,
  Users,
  DollarSign,
  Check,
  Clock,
  CreditCard,
  Upload,
  Share2,
  Heart,
  Trophy,
  MessageCircle,
  Copy
} from 'lucide-react';
import { BillService } from '../lib/bills';
import type { BillWithItems, BillSummary, CreateBillItemData } from '../lib/bills';
import type { DiningEventWithMembers } from '../lib/events';

interface BillSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DiningEventWithMembers | null;
  currentUserId: string;
  currentLanguage: 'en' | 'zh';
}

type Step = 'create' | 'items' | 'split' | 'summary' | 'viral_success';

export default function BillSplitModal({
  isOpen,
  onClose,
  event,
  currentUserId,
  currentLanguage
}: BillSplitModalProps) {
  const [step, setStep] = useState<Step>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bill creation data
  const [subtotal, setSubtotal] = useState<string>('');
  const [serviceChargeRate, setServiceChargeRate] = useState(10); // 10%
  const [tipAmount, setTipAmount] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  
  // Bill items
  const [billItems, setBillItems] = useState<CreateBillItemData[]>([]);
  const [newItem, setNewItem] = useState<CreateBillItemData>({
    name: '',
    name_chinese: '',
    price: 0,
    quantity: 1,
    category: '',
    is_shared: true
  });

  // Current bill data
  const [currentBill, setCurrentBill] = useState<BillWithItems | null>(null);
  const [billSummary, setBillSummary] = useState<BillSummary | null>(null);

  // Viral sharing state
  const [hasShared, setHasShared] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'whatsapp' | 'social' | null>(null);

  const billService = new BillService();

  const getText = (key: string) => {
    const texts = {
      en: {
        billSplitting: 'Bill Splitting',
        createBill: 'Create Bill',
        addItems: 'Add Items',
        splitBill: 'Split Bill',
        summary: 'Summary',
        subtotal: 'Subtotal',
        serviceCharge: 'Service Charge',
        tipAmount: 'Tip Amount',
        total: 'Total',
        receiptImage: 'Receipt Image',
        uploadReceipt: 'Upload Receipt',
        addItem: 'Add Item',
        itemName: 'Item Name',
        itemNameChinese: 'Chinese Name',
        price: 'Price',
        quantity: 'Quantity',
        category: 'Category',
        sharedItem: 'Shared Item',
        sharedItemDesc: 'Split equally among all members',
        personalItem: 'Personal Item',
        personalItemDesc: 'Assign to specific person',
        addToList: 'Add to List',
        removeItem: 'Remove Item',
        autoSplit: 'Auto Split',
        autoSplitDesc: 'Split all items equally',
        customSplit: 'Custom Split',
        finalizeBill: 'Finalize Bill',
        createPaymentRequests: 'Create Payment Requests',
        back: 'Back',
        next: 'Next',
        cancel: 'Cancel',
        close: 'Close',
        creating: 'Creating...',
        processing: 'Processing...',
        billCreated: 'Bill created successfully!',
        noItems: 'No items added yet',
        totalAmount: 'Total Amount',
        yourShare: 'Your Share',
        paid: 'Paid',
        pending: 'Pending',
        partial: 'Partially Paid',
        paymentStatus: 'Payment Status',
        requestPayment: 'Request Payment',
        markAsPaid: 'Mark as Paid',
        hkd: 'HKD',
        viralSuccess: 'Success! Bill Split Complete',
        shareSuccess: 'Share Your DineLink Experience',
        shareSuccessDesc: 'Help friends discover easier group dining',
        shareWhatsApp: 'Share on WhatsApp',
        shareLink: 'Copy Link',
        shareSocial: 'Share on Social Media',
        viralMessage: 'Just split a HK${amount} bill with {count} friends using DineLink! No more awkward money conversations 🎉',
        shareReward: 'Get HK$10 credit when friends sign up!',
        skipSharing: 'Maybe Later',
        thankYou: 'Thanks for sharing!',
        viralBonus: 'Viral Bonus Earned!',
        continueWithoutSharing: 'Continue Without Sharing',
        easyBillSplit: 'Easy Bill Splitting',
        groupDiningMadeSimple: 'Group dining made simple with DineLink'
      },
      zh: {
        billSplitting: '帳單分攤',
        createBill: '創建帳單',
        addItems: '添加項目',
        splitBill: '分攤帳單',
        summary: '摘要',
        subtotal: '小計',
        serviceCharge: '服務費',
        tipAmount: '小費',
        total: '總計',
        receiptImage: '收據圖片',
        uploadReceipt: '上傳收據',
        addItem: '添加項目',
        itemName: '項目名稱',
        itemNameChinese: '中文名稱',
        price: '價格',
        quantity: '數量',
        category: '類別',
        sharedItem: '共享項目',
        sharedItemDesc: '在所有成員之間平分',
        personalItem: '個人項目',
        personalItemDesc: '指定給特定人員',
        addToList: '添加到列表',
        removeItem: '移除項目',
        autoSplit: '自動分攤',
        autoSplitDesc: '將所有項目平分',
        customSplit: '自訂分攤',
        finalizeBill: '確認帳單',
        createPaymentRequests: '創建付款請求',
        back: '返回',
        next: '下一步',
        cancel: '取消',
        close: '關閉',
        creating: '創建中...',
        processing: '處理中...',
        billCreated: '帳單創建成功！',
        noItems: '尚未添加項目',
        totalAmount: '總金額',
        yourShare: '您的份額',
        paid: '已付款',
        pending: '待付款',
        partial: '部分付款',
        paymentStatus: '付款狀態',
        requestPayment: '請求付款',
        markAsPaid: '標記為已付款',
        hkd: '港幣',
        viralSuccess: '成功！帳單分攤完成',
        shareSuccess: '分享您的 DineLink 體驗',
        shareSuccessDesc: '幫助朋友發現更輕鬆的群組用餐',
        shareWhatsApp: '在 WhatsApp 分享',
        shareLink: '複製連結',
        shareSocial: '在社交媒體分享',
        viralMessage: '剛剛用 DineLink 與 {count} 位朋友分攤了 HK${amount} 的帳單！不再有尷尬的金錢對話 🎉',
        shareReward: '朋友註冊時獲得 HK$10 積分！',
        skipSharing: '稍後再說',
        thankYou: '感謝分享！',
        viralBonus: '病毒式推薦獎勵已獲得！',
        continueWithoutSharing: '不分享並繼續',
        easyBillSplit: '輕鬆分帳',
        groupDiningMadeSimple: 'DineLink 讓群組用餐變得簡單'
      }
    };
    return texts[currentLanguage][key as keyof typeof texts['en']] || texts.en[key as keyof typeof texts['en']];
  };

  // Calculate totals
  const calculatedTotals = billService.calculateTotals(
    parseFloat(subtotal) || 0,
    serviceChargeRate / 100,
    0 // No tax in HK for restaurants
  );
  const finalTotal = calculatedTotals.total_amount + (parseFloat(tipAmount) || 0);

  // Add item to list
  const handleAddItem = () => {
    if (!newItem.name.trim() || newItem.price <= 0) {
      setError('Please enter item name and valid price');
      return;
    }

    setBillItems(prev => [...prev, { ...newItem }]);
    setNewItem({
      name: '',
      name_chinese: '',
      price: 0,
      quantity: 1,
      category: '',
      is_shared: true
    });
    setError(null);
  };

  // Remove item from list
  const handleRemoveItem = (index: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  // Create bill
  const handleCreateBill = async () => {
    if (!event || !subtotal || parseFloat(subtotal) <= 0) {
      setError('Please enter a valid subtotal');
      return;
    }

    if (billItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create the bill
      const billResult = await billService.createBill({
        event_id: event.id,
        restaurant_id: undefined, // Could be linked to restaurant
        subtotal: calculatedTotals.subtotal,
        service_charge: calculatedTotals.service_charge,
        tax_amount: calculatedTotals.tax_amount,
        tip_amount: parseFloat(tipAmount) || 0,
        total_amount: finalTotal,
        currency: 'HKD',
        receipt_image_url: receiptImage || undefined
      }, currentUserId);

      if (!billResult.success || !billResult.bill) {
        setError(billResult.error || 'Failed to create bill');
        return;
      }

      // Add items to the bill
      const itemsResult = await billService.addBillItems(billResult.bill.id, billItems);
      if (!itemsResult.success) {
        setError(itemsResult.error || 'Failed to add items to bill');
        return;
      }

      // Load the full bill details
      const detailsResult = await billService.getBillDetails(billResult.bill.id, currentUserId);
      if (detailsResult.success && detailsResult.bill) {
        setCurrentBill(detailsResult.bill);
        setStep('split');
      }

    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto split the bill
  const handleAutoSplit = async () => {
    if (!currentBill || !event) return;

    setIsLoading(true);
    setError(null);

    try {
      const memberIds = event.members
        .filter(m => m.status === 'confirmed')
        .map(m => m.user_id);

      const result = await billService.autoSplitBill(currentBill.id, memberIds);
      
      if (result.success) {
        // Load bill summary
        const summaryResult = await billService.getBillSummary(currentBill.id, currentUserId);
        if (summaryResult.success) {
          setBillSummary(summaryResult.summary || null);
          setStep('summary');
        }
      } else {
        setError(result.error || 'Failed to split bill');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize the bill
  const handleFinalizeBill = async () => {
    if (!currentBill) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await billService.finalizeBill(currentBill.id, currentUserId);
      if (result.success) {
        // Move to viral success step instead of closing immediately
        setStep('viral_success');
      } else {
        setError(result.error || 'Failed to finalize bill');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Viral sharing functions
  const handleShare = async (method: 'link' | 'whatsapp' | 'social') => {
    if (!event || !billSummary) return;

    const shareText = getText('viralMessage')
      .replace('{amount}', billSummary.bill.total_amount.toFixed(2))
      .replace('{count}', (billSummary.user_totals.length - 1).toString());
    
    const shareUrl = `${window.location.origin}/?ref=${currentUserId}`;
    const fullShareText = `${shareText}\n\nTry DineLink: ${shareUrl}`;

    try {
      switch (method) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(fullShareText)}`, '_blank');
          break;
        case 'social':
          if (navigator.share) {
            await navigator.share({
              title: getText('easyBillSplit'),
              text: shareText,
              url: shareUrl
            });
          } else {
            // Fallback to copy link
            await navigator.clipboard.writeText(fullShareText);
          }
          break;
        case 'link':
          await navigator.clipboard.writeText(fullShareText);
          break;
      }

      setHasShared(true);
      setShareMethod(method);
      
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Reset form when closing
  const handleClose = () => {
    setStep('create');
    setSubtotal('');
    setTipAmount('');
    setBillItems([]);
    setCurrentBill(null);
    setBillSummary(null);
    setError(null);
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{getText('billSplitting')}</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {(['create', 'items', 'split', 'summary', 'viral_success'] as Step[]).map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-red-100 text-red-500' :
                  ['create', 'items', 'split', 'summary', 'viral_success'].indexOf(step) > index ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && <div className="w-6 h-px bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Create Bill */}
          {step === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('subtotal')} (HKD) *
                </label>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('serviceCharge')} ({serviceChargeRate}%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">{serviceChargeRate}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  HK${calculatedTotals.service_charge.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('tipAmount')} (HKD)
                </label>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{getText('total')}</span>
                  <span>HK${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getText('receiptImage')}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{getText('uploadReceipt')}</p>
                  <input
                    type="url"
                    value={receiptImage}
                    onChange={(e) => setReceiptImage(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Items */}
          {step === 'items' && (
            <div className="space-y-4">
              {/* Add new item form */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">{getText('addItem')}</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getText('itemName')} *
                      </label>
                      <input
                        type="text"
                        value={newItem.name}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Dish name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getText('itemNameChinese')}
                      </label>
                      <input
                        type="text"
                        value={newItem.name_chinese}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name_chinese: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="中文名稱"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getText('price')} (HKD) *
                      </label>
                      <input
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {getText('quantity')}
                      </label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={newItem.is_shared}
                          onChange={() => setNewItem(prev => ({ ...prev, is_shared: true }))}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                        />
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{getText('sharedItem')}</div>
                          <div className="text-xs text-gray-500">{getText('sharedItemDesc')}</div>
                        </div>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!newItem.is_shared}
                          onChange={() => setNewItem(prev => ({ ...prev, is_shared: false }))}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                        />
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">{getText('personalItem')}</div>
                          <div className="text-xs text-gray-500">{getText('personalItemDesc')}</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleAddItem}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {getText('addToList')}
                  </button>
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {billItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{getText('noItems')}</p>
                  </div>
                ) : (
                  billItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.name_chinese && (
                          <p className="text-sm text-gray-600">{item.name_chinese}</p>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>HK${item.price.toFixed(2)}</span>
                          <span>×</span>
                          <span>{item.quantity}</span>
                          <span>=</span>
                          <span className="font-medium">HK${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.is_shared ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {item.is_shared ? getText('sharedItem') : getText('personalItem')}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Split Bill */}
          {step === 'split' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{getText('splitBill')}</h3>
                <p className="text-sm text-gray-600">
                  {event.member_count} {getText('totalAmount')}: HK${finalTotal.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleAutoSplit}
                  disabled={isLoading}
                  className="flex items-center justify-center px-6 py-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  {isLoading ? getText('processing') : getText('autoSplit')}
                </button>
                <p className="text-center text-sm text-gray-500">{getText('autoSplitDesc')}</p>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 'summary' && billSummary && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{getText('summary')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{getText('subtotal')}</span>
                    <span>HK${billSummary.bill.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{getText('serviceCharge')}</span>
                    <span>HK${billSummary.bill.service_charge?.toFixed(2) || '0.00'}</span>
                  </div>
                  {billSummary.bill.tip_amount && billSummary.bill.tip_amount > 0 && (
                    <div className="flex justify-between">
                      <span>{getText('tipAmount')}</span>
                      <span>HK${billSummary.bill.tip_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>{getText('total')}</span>
                    <span>HK${billSummary.bill.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* User breakdown */}
              <div className="space-y-3">
                {billSummary.user_totals.map((userTotal) => (
                  <div key={userTotal.user_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{userTotal.user_name}</h4>
                      <p className="text-sm text-gray-500">+852{userTotal.user_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">HK${userTotal.total_amount.toFixed(2)}</p>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        userTotal.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        userTotal.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getText(userTotal.payment_status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Viral Success */}
          {step === 'viral_success' && (
            <div className="text-center space-y-6">
              {!hasShared ? (
                <>
                  {/* Success celebration */}
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Trophy className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{getText('viralSuccess')}</h3>
                      <p className="text-gray-600">{getText('groupDiningMadeSimple')}</p>
                    </div>
                  </div>

                  {/* Viral sharing invitation */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{getText('shareSuccess')}</h4>
                      <p className="text-sm text-gray-600 mb-4">{getText('shareSuccessDesc')}</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 text-yellow-500 mr-2" />
                          <p className="text-sm text-yellow-700 font-medium">{getText('shareReward')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Share buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {getText('shareWhatsApp')}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleShare('link')}
                          className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {getText('shareLink')}
                        </button>
                        <button
                          onClick={() => handleShare('social')}
                          className="flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          {getText('shareSocial')}
                        </button>
                      </div>

                      <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        {getText('continueWithoutSharing')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // Thank you for sharing
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">{getText('thankYou')}</h3>
                    <p className="text-gray-600">{getText('viralBonus')}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-700">
                        HK$10 referral credit pending
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {step !== 'create' && (
              <button
                onClick={() => {
                  if (step === 'items') setStep('create');
                  else if (step === 'split') setStep('items');
                  else if (step === 'summary') setStep('split');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                {getText('back')}
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              {getText('cancel')}
            </button>
            
            {step === 'create' && (
              <button
                onClick={() => setStep('items')}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                {getText('next')}
              </button>
            )}
            
            {step === 'items' && (
              <button
                onClick={handleCreateBill}
                disabled={isLoading || billItems.length === 0}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? getText('creating') : getText('createBill')}
              </button>
            )}

            {step === 'summary' && (
              <button
                onClick={handleFinalizeBill}
                disabled={isLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? getText('processing') : getText('finalizeBill')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}