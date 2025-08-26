import { supabase } from './supabase';
import { NotificationService } from './notifications';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Bill = Tables['bills']['Row'];
type BillInsert = Tables['bills']['Insert'];
type BillUpdate = Tables['bills']['Update'];
type BillItem = Tables['bill_items']['Row'];
type BillItemInsert = Tables['bill_items']['Insert'];
type ItemAssignment = Tables['item_assignments']['Row'];
type ItemAssignmentInsert = Tables['item_assignments']['Insert'];
type Payment = Tables['payments']['Row'];
type PaymentInsert = Tables['payments']['Insert'];

export interface BillWithItems extends Bill {
  bill_items: Array<BillItem & {
    assignments: Array<ItemAssignment & {
      user: { name: string; phone: string };
    }>;
  }>;
  restaurant?: { name: string; name_chinese?: string };
  event?: { name: string };
}

export interface CreateBillData {
  event_id: string;
  restaurant_id?: string;
  subtotal: number;
  service_charge?: number;
  tax_amount?: number;
  tip_amount?: number;
  total_amount: number;
  currency?: string;
  receipt_image_url?: string;
}

export interface CreateBillItemData {
  name: string;
  name_chinese?: string;
  price: number;
  quantity?: number;
  category?: string;
  is_shared?: boolean;
}

export interface BillSummary {
  bill: BillWithItems;
  user_totals: Array<{
    user_id: string;
    user_name: string;
    user_phone: string;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    payment_status: 'paid' | 'partial' | 'pending';
  }>;
  total_paid: number;
  total_pending: number;
}

export class BillService {
  private notificationService = new NotificationService();

  // Create a new bill for an event
  async createBill(billData: CreateBillData, createdById: string): Promise<{ success: boolean; bill?: Bill; error?: string }> {
    try {
      const { data: bill, error } = await supabase
        .from('bills')
        .insert({
          ...billData,
          created_by: createdById,
          status: 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Create bill error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, bill };
    } catch (error) {
      console.error('Bill service error:', error);
      return { success: false, error: 'Failed to create bill' };
    }
  }

  // Add items to a bill
  async addBillItems(billId: string, items: CreateBillItemData[]): Promise<{ success: boolean; items?: BillItem[]; error?: string }> {
    try {
      const itemsWithBillId = items.map(item => ({
        ...item,
        bill_id: billId
      }));

      const { data: billItems, error } = await supabase
        .from('bill_items')
        .insert(itemsWithBillId)
        .select();

      if (error) {
        console.error('Add bill items error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, items: billItems };
    } catch (error) {
      console.error('Add bill items service error:', error);
      return { success: false, error: 'Failed to add bill items' };
    }
  }

  // Assign items to users (for splitting)
  async assignItemToUsers(
    billItemId: string, 
    assignments: Array<{ user_id: string; portion: number }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the item price
      const { data: billItem, error: itemError } = await supabase
        .from('bill_items')
        .select('price, quantity')
        .eq('id', billItemId)
        .single();

      if (itemError || !billItem) {
        return { success: false, error: 'Bill item not found' };
      }

      // Calculate amounts based on portions
      const totalItemCost = billItem.price * (billItem.quantity || 1);
      const assignmentsWithAmounts = assignments.map(assignment => ({
        bill_item_id: billItemId,
        user_id: assignment.user_id,
        portion: assignment.portion,
        amount: totalItemCost * assignment.portion
      }));

      // Delete existing assignments for this item
      await supabase
        .from('item_assignments')
        .delete()
        .eq('bill_item_id', billItemId);

      // Insert new assignments
      const { error } = await supabase
        .from('item_assignments')
        .insert(assignmentsWithAmounts);

      if (error) {
        console.error('Assign item error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Assign item service error:', error);
      return { success: false, error: 'Failed to assign item' };
    }
  }

  // Get bill with full details
  async getBillDetails(billId: string, userId: string): Promise<{ success: boolean; bill?: BillWithItems; error?: string }> {
    try {
      const { data: bill, error } = await supabase
        .from('bills')
        .select(`
          *,
          restaurant:restaurants (name, name_chinese),
          event:dining_events (name),
          bill_items (
            *,
            assignments:item_assignments (
              *,
              user:users (name, phone)
            )
          )
        `)
        .eq('id', billId)
        .single();

      if (error) {
        console.error('Get bill details error:', error);
        return { success: false, error: error.message };
      }

      // Check if user has access to this bill (through event membership)
      const { data: eventMember } = await supabase
        .from('event_members')
        .select('user_id')
        .eq('event_id', bill.event_id)
        .eq('user_id', userId)
        .single();

      const { data: event } = await supabase
        .from('dining_events')
        .select('organizer_id')
        .eq('id', bill.event_id)
        .single();

      const hasAccess = eventMember || event?.organizer_id === userId;
      if (!hasAccess) {
        return { success: false, error: 'Access denied to this bill' };
      }

      return { success: true, bill: bill as BillWithItems };
    } catch (error) {
      console.error('Get bill details service error:', error);
      return { success: false, error: 'Failed to get bill details' };
    }
  }

  // Get bill summary with payment status
  async getBillSummary(billId: string, userId: string): Promise<{ success: boolean; summary?: BillSummary; error?: string }> {
    try {
      const billResult = await this.getBillDetails(billId, userId);
      if (!billResult.success || !billResult.bill) {
        return { success: false, error: billResult.error };
      }

      const bill = billResult.bill;

      // Get all payments for this bill
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('bill_id', billId);

      if (paymentsError) {
        console.error('Get payments error:', paymentsError);
        return { success: false, error: paymentsError.message };
      }

      // Calculate user totals
      const userTotals = new Map<string, {
        user_id: string;
        user_name: string;
        user_phone: string;
        total_amount: number;
        paid_amount: number;
      }>();

      // Initialize user totals from assignments
      bill.bill_items.forEach(item => {
        item.assignments.forEach(assignment => {
          if (!userTotals.has(assignment.user_id)) {
            userTotals.set(assignment.user_id, {
              user_id: assignment.user_id,
              user_name: assignment.user.name,
              user_phone: assignment.user.phone,
              total_amount: 0,
              paid_amount: 0
            });
          }
          const userTotal = userTotals.get(assignment.user_id)!;
          userTotal.total_amount += assignment.amount;
        });
      });

      // Add payments to user totals
      payments?.forEach(payment => {
        if (payment.status === 'completed' && userTotals.has(payment.payer_id)) {
          const userTotal = userTotals.get(payment.payer_id)!;
          userTotal.paid_amount += payment.amount;
        }
      });

      // Convert to array and calculate status
      const userTotalsArray = Array.from(userTotals.values()).map(userTotal => ({
        ...userTotal,
        pending_amount: Math.max(0, userTotal.total_amount - userTotal.paid_amount),
        payment_status: (userTotal.paid_amount >= userTotal.total_amount ? 'paid' : 
                        userTotal.paid_amount > 0 ? 'partial' : 'pending') as 'paid' | 'partial' | 'pending'
      }));

      const totalPaid = userTotalsArray.reduce((sum, user) => sum + user.paid_amount, 0);
      const totalPending = userTotalsArray.reduce((sum, user) => sum + user.pending_amount, 0);

      const summary: BillSummary = {
        bill,
        user_totals: userTotalsArray,
        total_paid: totalPaid,
        total_pending: totalPending
      };

      return { success: true, summary };
    } catch (error) {
      console.error('Get bill summary service error:', error);
      return { success: false, error: 'Failed to get bill summary' };
    }
  }

  // Create a payment request
  async createPaymentRequest(
    billId: string,
    payerId: string,
    recipientId: string,
    amount: number,
    paymentMethod: string,
    requesterId: string
  ): Promise<{ success: boolean; payment?: Payment; error?: string }> {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          bill_id: billId,
          payer_id: payerId,
          recipient_id: recipientId,
          amount: amount,
          currency: 'HKD',
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Create payment request error:', error);
        return { success: false, error: error.message };
      }

      // Get requester and bill details for notification
      const { data: requester } = await supabase
        .from('users')
        .select('name')
        .eq('id', requesterId)
        .single();

      const { data: bill } = await supabase
        .from('bills')
        .select('event:dining_events(name)')
        .eq('id', billId)
        .single();

      // Send notification to payer
      if (requester && bill?.event) {
        await this.notificationService.createPaymentRequest(
          payerId,
          amount,
          'HKD',
          bill.event.name,
          requesterId,
          requester.name
        );
      }

      return { success: true, payment };
    } catch (error) {
      console.error('Create payment request service error:', error);
      return { success: false, error: 'Failed to create payment request' };
    }
  }

  // Mark payment as completed
  async completePayment(
    paymentId: string,
    userId: string,
    transactionId?: string,
    paymentProofUrl?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user is the payer
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('payer_id')
        .eq('id', paymentId)
        .single();

      if (paymentError || payment?.payer_id !== userId) {
        return { success: false, error: 'Unauthorized to complete this payment' };
      }

      const { error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transactionId,
          payment_proof_url: paymentProofUrl,
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        console.error('Complete payment error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Complete payment service error:', error);
      return { success: false, error: 'Failed to complete payment' };
    }
  }

  // Get event bills
  async getEventBills(eventId: string, userId: string): Promise<Bill[]> {
    try {
      // Check if user has access to event
      const { data: eventMember } = await supabase
        .from('event_members')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      const { data: event } = await supabase
        .from('dining_events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      const hasAccess = eventMember || event?.organizer_id === userId;
      if (!hasAccess) {
        return [];
      }

      const { data: bills, error } = await supabase
        .from('bills')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get event bills error:', error);
        return [];
      }

      return bills || [];
    } catch (error) {
      console.error('Get event bills service error:', error);
      return [];
    }
  }

  // Auto-split bill equally among members
  async autoSplitBill(billId: string, memberIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: billItems, error } = await supabase
        .from('bill_items')
        .select('id, price, quantity, is_shared')
        .eq('bill_id', billId);

      if (error || !billItems) {
        return { success: false, error: 'Failed to get bill items' };
      }

      // Clear existing assignments
      await supabase
        .from('item_assignments')
        .delete()
        .in('bill_item_id', billItems.map(item => item.id));

      // Split shared items equally, assign personal items to single users
      for (const item of billItems) {
        if (item.is_shared) {
          // Split equally among all members
          const portionPerMember = 1 / memberIds.length;
          const assignments = memberIds.map(userId => ({
            user_id: userId,
            portion: portionPerMember
          }));
          
          await this.assignItemToUsers(item.id, assignments);
        } else {
          // Assign to first member (could be enhanced with UI selection)
          await this.assignItemToUsers(item.id, [
            { user_id: memberIds[0], portion: 1.0 }
          ]);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Auto split bill service error:', error);
      return { success: false, error: 'Failed to auto-split bill' };
    }
  }

  // Finalize bill (make it ready for payments)
  async finalizeBill(billId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify user has permission to finalize (bill creator or event organizer)
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('created_by, event_id')
        .eq('id', billId)
        .single();

      if (billError || !bill) {
        return { success: false, error: 'Bill not found' };
      }

      const { data: event } = await supabase
        .from('dining_events')
        .select('organizer_id')
        .eq('id', bill.event_id)
        .single();

      const hasPermission = bill.created_by === userId || event?.organizer_id === userId;
      if (!hasPermission) {
        return { success: false, error: 'Unauthorized to finalize this bill' };
      }

      const { error } = await supabase
        .from('bills')
        .update({ status: 'finalized' })
        .eq('id', billId);

      if (error) {
        console.error('Finalize bill error:', error);
        return { success: false, error: error.message };
      }

      // TODO: Send notifications to all users about finalized bill

      return { success: true };
    } catch (error) {
      console.error('Finalize bill service error:', error);
      return { success: false, error: 'Failed to finalize bill' };
    }
  }

  // Format currency amount
  formatAmount(amount: number, currency: string = 'HKD'): string {
    const currencySymbols = {
      'HKD': 'HK$',
      'USD': '$',
      'CNY': '¥'
    };
    
    const symbol = currencySymbols[currency as keyof typeof currencySymbols] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }

  // Calculate service charge and tax (Hong Kong standard)
  calculateTotals(subtotal: number, serviceChargeRate: number = 0.10, taxRate: number = 0): {
    subtotal: number;
    service_charge: number;
    tax_amount: number;
    total_amount: number;
  } {
    const service_charge = Math.round(subtotal * serviceChargeRate * 100) / 100;
    const tax_amount = Math.round(subtotal * taxRate * 100) / 100;
    const total_amount = subtotal + service_charge + tax_amount;

    return {
      subtotal,
      service_charge,
      tax_amount,
      total_amount
    };
  }

  // Get payment methods for Hong Kong
  getPaymentMethods(language: 'en' | 'zh' = 'en'): Array<{ value: string; label: string }> {
    const methods = {
      'bank_transfer': { en: 'Bank Transfer', zh: '銀行轉帳' },
      'fps': { en: 'FPS (Fast Payment System)', zh: '轉數快' },
      'payme': { en: 'PayMe', zh: 'PayMe' },
      'alipay_hk': { en: 'AlipayHK', zh: '支付寶香港' },
      'wechat_pay_hk': { en: 'WeChat Pay HK', zh: '微信支付香港' },
      'cash': { en: 'Cash', zh: '現金' }
    };

    return Object.entries(methods).map(([value, labels]) => ({
      value,
      label: labels[language]
    }));
  }
}