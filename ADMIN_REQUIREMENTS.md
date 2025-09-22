# Syrian Marketplace Admin Dashboard Requirements

## 👥 User Management

- **View all users** - List with filters (role, status, registration date)
- **Create users** - Add new users with specific roles
- **Edit user profiles** - Change names, emails, roles, subscription plans
- **Activate/Deactivate users** - Suspend problematic users
- **Reset passwords** - Help users with login issues
- **View user activity** - See listing history, payments, etc.

## 🏷️ Category & Product Management

- **CRUD categories** - Cars, Electronics, Real Estate, etc.
- **Define category attributes** - For cars: brand, model, year, mileage, fuel type
- **Set attribute types** - Text, number, dropdown, multi-select, date
- **Configure attribute options** - Fuel types: Petrol, Diesel, Electric, Hybrid
- **Set validation rules** - Required fields, min/max values
- **Control display settings** - Show in filters, show in listings, show in search

## 📋 Listing Management

- **View all listings** - With filters by category, status, user, date
- **Moderate listings** - Approve/reject new listings
- **Edit listing status** - Active, Suspended, Sold, Expired
- **Delete inappropriate content** - Remove spam or illegal listings
- **Feature listings** - Promote quality listings

## 🛡️ Role & Permission Management

- **Create custom roles** - Editor, Moderator, Category Manager, etc.
- **Set granular permissions** - Can Editor delete listings? Can Moderator ban users?
- **Assign roles to users** - Promote users to moderators
- **Permission matrix** - Feature × Action (view/create/edit/delete)

## 💰 User Subscription Management

- **Create subscription plans** - Basic (5 listings), Dealer (20 listings), Business (unlimited)
- **Set plan features** - Photos per listing, priority placement, badges
- **Pricing management** - Monthly/yearly pricing
- **Upgrade/downgrade users** - Change user subscription levels
- **Monitor usage** - Track how many listings each user has used
- **Handle billing issues** - Refunds, failed payments

## 📢 Advertising System Management

### Ad Packages (What we sell to advertisers)

- **Banner packages** - Homepage banner, category banners
- **Featured listing packages** - Highlight specific listings
- **Sponsored placement** - Top of search results
- **Package pricing** - Duration and cost for each package type

### Ad Clients (Companies that advertise with us)

- **Client database** - Samsung, Audi, local dealerships
- **Contact information** - Emails, phone numbers, billing addresses
- **Client history** - Previous campaigns, spending, performance
- **Account management** - Credit limits, payment terms

### Ad Campaigns (Active advertising)

- **Create campaigns** - Client + Package + Duration + Creative assets
- **Campaign approval** - Review banner images, landing pages
- **Schedule campaigns** - Start/end dates, budget allocation
- **Monitor performance** - Views, clicks, conversions
- **Generate invoices** - Billing for completed campaigns

### Ad Performance & Reports

- **Campaign analytics** - Impressions, CTR, conversion rates
- **Client reports** - Weekly performance summaries
- **Revenue tracking** - Ad revenue vs marketplace subscription revenue

## 📊 Analytics & Business Intelligence

- **User analytics** - New registrations, active users, churn rate
- **Listing analytics** - New listings, categories popularity, success rate
- **Revenue analytics** - Subscription revenue, ad revenue, transaction fees

## 💸 Financial Management

- **Revenue dashboard** - Total revenue, breakdown by source
- **Payment processing** - Failed payments, refunds, chargebacks

## 🔍 System Administration

- **Audit logs** - Who did what when (security requirement)
- **Email templates** - Welcome emails, notifications, newsletters
- **Legal content** - Terms of service, privacy policy updates
- **Backup management** - Data backup status and restore

---

## 🎯 Admin Feature Mapping

Based on the requirements above, the admin dashboard should have these main feature modules:

1. **`users`** - User Management
2. **`categories`** - Category & Product Management
3. **`attributes`** - Category Attributes Management
4. **`listings`** - Listing Management & Moderation
5. **`roles`** - Role & Permission Management
6. **`user_subscriptions`** - User Subscription Plans
7. **`ad_packages`** - Advertising Packages
8. **`ad_clients`** - Advertising Clients
9. **`ad_campaigns`** - Campaign Management
10. **`ad_reports`** - Advertising Analytics
11. **`analytics`** - Platform Analytics
12. **`financial`** - Financial Management
13. **`audit_logs`** - System Audit
14. **`system`** - System Administration

## 📝 Implementation Notes

- Each feature should support CRUD operations where applicable
- Permission-based access control for each feature
- Arabic-first interface with proper RTL support
- Responsive design for mobile admin access
- Real-time updates where needed (campaign performance, user activity)
- Export functionality for reports and analytics