# 💳 Production-Ready Payment System - Complete Implementation Plan

**Last Updated:** 2025-11-24
**Status:** Planning Phase - Generic Transactions Table Approach
**Priority:** HIGH - Required for production

---

## 🎯 GOALS

Build a **production-ready payment system** that handles:
1. ✅ Ad campaign payments (one-time)
2. ✅ Subscription payments (recurring monthly/yearly)
3. ✅ Listing promotions (one-time boost payments)
4. ✅ Payment tracking & history
5. ✅ Refunds & cancellations
6. ✅ Failed payment handling
7. ✅ Multiple payment methods (Stripe, PayPal, Mock)
8. ✅ Subscription management (pause, cancel, upgrade/downgrade)

---

## 🔑 KEY DECISION: Generic Transactions Table

**Chosen Approach:** Single `transactions` table for ALL payment types

**Why?**
- ✅ Simpler financial reporting (all revenue in one table)
- ✅ Consistent refund/dispute handling
- ✅ One webhook handler for all payment types
- ✅ Easily extensible for future payment types (featured listings, banner ads, etc.)
- ✅ Pattern already proven in `user_subscription_transactions` table

---

## 📊 DATABASE SCHEMA

### **1. Transactions Table** (Universal Payment Tracking)

```sql
CREATE TYPE transaction_type AS ENUM (
  'user_subscription',
  'ad_campaign',
  'listing_promotion',
  'featured_listing',
  'banner_ad'
);

CREATE TYPE transaction_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM ('stripe', 'paypal', 'mock', 'bank_transfer');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Transaction Type & Reference (Polymorphic)
  transaction_type transaction_type NOT NULL,
  reference_id UUID NOT NULL, -- Points to campaign_id, subscription_id, listing_id, etc.

  -- User
  user_id UUID REFERENCES users(id) NOT NULL,

  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Payment Method
  payment_method payment_method NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',

  -- Provider Integration
  stripe_payment_intent_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  paypal_transaction_id VARCHAR(255),

  -- Provider Response (Full JSON from Stripe/PayPal)
  provider_metadata JSONB,

  -- Fee Tracking
  processing_fee DECIMAL(10, 2), -- What Stripe/PayPal charged us
  net_amount DECIMAL(10, 2),     -- What we actually received

  -- Refund Information
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10, 2) DEFAULT 0,
  refund_reason TEXT,
  stripe_refund_id VARCHAR(255),
  paypal_refund_id VARCHAR(255),

  -- Billing Period (for subscriptions only)
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,

  -- Renewal/Recurring Tracking
  is_renewal BOOLEAN DEFAULT false,
  parent_transaction_id UUID REFERENCES transactions(id),

  -- Additional Metadata (transaction-type specific data)
  metadata JSONB, -- Flexible field for campaign_name, plan_name, etc.

  -- Notes
  notes TEXT,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Failure Information
  failure_code VARCHAR(100),
  failure_message TEXT,

  -- Audit
  created_by UUID REFERENCES users(id),
  processed_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_transactions_type_ref ON transactions(transaction_type, reference_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_paid_at ON transactions(paid_at DESC);
CREATE INDEX idx_transactions_stripe_intent ON transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_paypal_order ON transactions(paypal_order_id);
```

---

### **2. Example Transactions**

**Ad Campaign Payment:**
```json
{
  "transaction_type": "ad_campaign",
  "reference_id": "campaign-uuid-123",
  "user_id": "client-uuid",
  "amount": 500.00,
  "currency": "USD",
  "payment_method": "stripe",
  "status": "completed",
  "stripe_payment_intent_id": "pi_stripe_xyz",
  "processing_fee": 14.50,
  "net_amount": 485.50,
  "metadata": {
    "campaign_name": "TechCorp Q1 Launch",
    "client_name": "TechCorp Solutions"
  }
}
```

**Subscription Payment:**
```json
{
  "transaction_type": "user_subscription",
  "reference_id": "subscription-uuid-456",
  "user_id": "user-uuid",
  "amount": 29.00,
  "currency": "USD",
  "payment_method": "stripe",
  "status": "completed",
  "billing_period_start": "2025-11-01",
  "billing_period_end": "2025-12-01",
  "is_renewal": true,
  "parent_transaction_id": "previous-payment-uuid",
  "metadata": {
    "plan_name": "Dealer Plan",
    "billing_cycle": "monthly"
  }
}
```

**Listing Promotion:**
```json
{
  "transaction_type": "listing_promotion",
  "reference_id": "listing-uuid-789",
  "user_id": "user-uuid",
  "amount": 10.00,
  "currency": "USD",
  "payment_method": "paypal",
  "status": "completed",
  "metadata": {
    "promotion_type": "boost_7_days",
    "listing_title": "2020 Toyota Camry"
  }
}
```

---

## 🔄 PAYMENT FLOWS

### **Flow 1: Ad Campaign Payment (One-Time)**

```
1. Admin creates campaign → status = PAYMENT_SENT
   ↓
2. Transaction record created:
   - transaction_type = 'ad_campaign'
   - reference_id = campaign.id
   - status = 'pending'
   ↓
3. Email sent with payment link
   ↓
4. Client opens /mock-payment/{campaignId}
   ↓
5. Client selects payment method (Stripe/PayPal/Mock)
   ↓
6. Payment processed:
   - SUCCESS → transaction.status = 'completed', campaign.status = 'PAID'
   - FAILURE → transaction.status = 'failed', retry allowed
   ↓
7. If PAID + ASAP → Campaign auto-activates
```

**Refund Flow:**
```
Admin refunds campaign:
1. Admin clicks "Refund" in campaign details
   ↓
2. Update transaction:
   - status = 'refunded' (or 'partially_refunded')
   - refunded_at = now()
   - refund_amount = amount
   - refund_reason = "reason text"
   ↓
3. Call Stripe/PayPal refund API
   ↓
4. Store refund ID in transaction
   ↓
5. Update campaign.status = 'CANCELLED' or 'REFUNDED'
   ↓
6. Email sent to client
```

---

### **Flow 2: Subscription Payment (Recurring)**

```
User upgrades to Dealer:
1. User selects plan on /pricing
   ↓
2. Create subscription record in user_subscriptions table
   ↓
3. Create initial transaction:
   - transaction_type = 'user_subscription'
   - reference_id = subscription.id
   - is_renewal = false
   ↓
4. User selects payment method
   ↓
5. Payment processed:
   - SUCCESS → User upgraded, subscription active
   - FAILURE → transaction.status = 'failed', retry
   ↓
6. Cron job runs daily:
   - Check subscriptions with next_billing_date = today
   - Create new transaction (is_renewal = true)
   - Charge customer
   - SUCCESS → Extend subscription
   - FAILURE → failed_payment_count++
```

---

### **Flow 3: Listing Promotion (Future Feature)**

```
User wants to boost listing:
1. User clicks "Boost Listing" on listing page
   ↓
2. Modal shows promotion options:
   - 7 days: $10
   - 14 days: $18
   - 30 days: $30
   ↓
3. Create transaction:
   - transaction_type = 'listing_promotion'
   - reference_id = listing.id
   - metadata = {promotion_type, duration}
   ↓
4. User pays → listing marked as "promoted"
   ↓
5. Cron job expires promotion after duration
```

---

## 🎨 BACKEND SERVICES

### **TransactionsService**
**File:** `src/transactions/transactions.service.ts`

```typescript
class TransactionsService {
  // Create transaction for any payment type
  async createTransaction(input: CreateTransactionInput): Promise<Transaction>

  // Process payment
  async processPayment(transactionId: string, method: PaymentMethod): Promise<Transaction>

  // Get transactions by type
  async getTransactionsByType(type: TransactionType, filters: Filters): Promise<Transaction[]>

  // Get transaction history for user
  async getUserTransactions(userId: string, filters: Filters): Promise<Transaction[]>

  // Get transaction by reference (e.g., get all payments for a campaign)
  async getTransactionsByReference(type: TransactionType, referenceId: string): Promise<Transaction[]>

  // Refund
  async refundTransaction(transactionId: string, input: RefundInput): Promise<Transaction>

  // Webhooks
  async handleStripeWebhook(event: Stripe.Event): Promise<void>
  async handlePayPalWebhook(event: PayPalEvent): Promise<void>

  // Financial Reports
  async getRevenueReport(startDate: Date, endDate: Date): Promise<RevenueReport>
  async getTotalRevenue(filters: RevenueFilters): Promise<number>
}
```

---

## 📊 IMPLEMENTATION ORDER

### **Phase 1: Rename & Migrate Existing Table** (2-3 hours)
1. ✅ Rename `user_subscription_transactions` → `transactions`
2. ✅ Add `transaction_type` ENUM column (default: 'user_subscription')
3. ✅ Rename `userSubscriptionId` → `reference_id`
4. ✅ Add indexes on `(transaction_type, reference_id)`
5. ✅ Update all existing services to use new table name

### **Phase 2: Update Ad Campaign Payment Flow** (3-4 hours)
1. ✅ Create transaction when campaign created
2. ✅ Update `confirmPayment` to update transaction status
3. ✅ Link transaction to campaign via `reference_id`
4. ✅ Test mock payment flow with transactions table

### **Phase 3: Stripe/PayPal Integration** (4-6 hours)
1. ✅ Integrate Stripe SDK
2. ✅ Integrate PayPal SDK
3. ✅ Implement payment webhooks
4. ✅ Test real payment processing

### **Phase 4: Refund System** (3-4 hours)
1. ✅ Implement refund service
2. ✅ Create refund modal in admin panel
3. ✅ Add refund functionality to campaigns
4. ✅ Test refund flow

### **Phase 5: Financial Reports** (2-3 hours)
1. ✅ Revenue dashboard
2. ✅ Transaction history view
3. ✅ Export functionality

### **Phase 6: Email Templates & Testing** (2-3 hours)
1. ✅ Update payment confirmation emails
2. ✅ Add refund confirmation emails
3. ✅ End-to-end testing

---

## 📝 TOTAL ESTIMATE: 16-23 HOURS

---

## ✅ COMPLETED TODAY (2025-11-24)

### Email System Fixes
1. ✅ Fixed email template structure (htmlContent = wrapper, textContent = message)
2. ✅ Updated EmailService to wrap textContent with htmlContent
3. ✅ Standardized all email variable names to `campaignReportLink`
4. ✅ Fixed all campaign email links to point to `/public/campaign-report/{token}`
5. ✅ Removed HTML wrapper file, defined inline in seeder
6. ✅ Ran seed refresh to update all email templates

### Payment System Planning
1. ✅ Identified payment tracking gap in ad campaigns
2. ✅ Reviewed existing `user_subscription_transactions` table structure
3. ✅ Decided on Generic Transactions Table approach
4. ✅ Designed unified transactions schema
5. ✅ Updated PAYMENT_SYSTEM_PLAN.md with new approach

---

## 🎯 NEXT STEPS

When ready to implement:
1. Create migration to rename table and add new fields
2. Update TransactionsService to handle all payment types
3. Integrate Stripe/PayPal for real payments
4. Build refund system
5. Create financial reports dashboard

**This unified approach will scale to all future payment types!**
