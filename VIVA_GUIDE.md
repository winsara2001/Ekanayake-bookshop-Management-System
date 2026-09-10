# Ekanayake Book Shop — Viva Demonstration Guide

## System Roles

- **Customer**: Registers through the storefront. Can browse books, maintain a wishlist, place orders, and manage loyalty points.
- **Inventory Manager**: Dedicated backend staff. Responsible for catalogue management (books, authors, categories), inventory adjustments, and the complete purchase order (PO) workflow including receiving.
- **Sales Manager**: Dedicated backend staff. Responsible for processing customer orders (Pending → Confirmed → Ready for Collection → Completed) and confirming Pay at Shop payments.
- **Admin**: Superuser. Has access to all staff functionalities, plus exclusive access to user management, supplier deactivation, PO approval, and global loyalty program configuration.
- **Supplier (External)**: An external entity. Suppliers do NOT log into the system; they are managed as data entities by the Inventory Manager.

---

## Epic 1 — Book Catalogue & Inventory Management

**Main Functions:**
- Book, Category, and Author CRUD operations.
- Dedicated Inventory Management dashboard.
- Stock adjustments with immutable transaction history.

**CRUD Mapping:**
- **CREATE**: Add Book (Inventory Manager/Admin)
- **READ**: View/Search Books (All Users, including public)
- **UPDATE**: Edit Book details (Inventory Manager/Admin)
- **DELETE equivalent**: Deactivate Book (soft delete)

**Key Business Rule:**
Book stock is strictly protected and **cannot become negative**. Attempting an adjustment that results in negative stock is rejected securely at the database level (`check_stock_non_negative`).

**Integration:**
- Orders (`ORDER_SALE`) reduce inventory.
- Order Cancellations (`ORDER_CANCEL_RESTORE`) increase inventory.
- Purchase Receipts (`PURCHASE_RECEIPT`) increase inventory.

**Demo Flow:**
1. Login as **Inventory Manager**.
2. Add a new book or edit an existing one.
3. Perform a manual stock adjustment (Add and Remove).
4. View the generated inventory history.
5. Demonstrate a book triggering the "Low Stock" warning threshold.

---

## Epic 2 — Customer Account & Loyalty Management

**Main Functions & CRUD:**
- Customer profile update.
- Wishlist (add / read / remove).
- Loyalty account viewing and transaction history.
- Admin loyalty settings management (earn rate, redeem value, program toggle).

**Key Business Rule:**
Loyalty points are automatically awarded *only* when an order's status reaches **COMPLETED**. Cancelled orders do not earn points.

**Security Measure:**
Customers can *view* their point balance but cannot directly edit `loyalty_accounts` or `loyalty_transactions`. Redeeming points requires placing an order via a secure `SECURITY DEFINER` RPC.

**Demo Flow:**
1. Navigate to the Customer **Account** dashboard.
2. View the Wishlist and remove/add an item.
3. Switch to the **Loyalty Points** tab to show current balance and history.
4. Go to **Checkout** and redeem a portion of points (e.g. 10 points).
5. Login as **Sales Manager** to progress the order to `COMPLETED`.
6. Return to Customer Account to show the newly generated `EARN` transaction in history.

---

## Epic 3 — Cart, Orders & Payments

**Main Functions & CRUD:**
- Cart management (add / read / update quantity / remove).
- Order creation (Checkout) and order details retrieval.
- Order status updates via Sales workflow.
- Customer-initiated cancellation for `PENDING` orders.

**Key Business Rule:**
Customers cannot order more copies of a book than are currently in stock.

**Integrations:**
- Generates `ORDER_SALE` (Epic 1)
- Generates `ORDER_CANCEL_RESTORE` on cancellation (Epic 1)
- Calculates and applies loyalty points (Epic 2)

**Demo Flow:**
1. Customer adds books to the Cart and proceeds to Checkout.
2. Place the order using a payment method (Mock Card or Pay at Shop).
3. Demonstrate atomic stock deduction (`ORDER_SALE`).
4. Login as **Sales Manager**, open the new order, and process it (`PENDING` → `CONFIRMED` → `READY_FOR_COLLECTION`).
5. Change to `COMPLETED`.
6. Alternatively, demonstrate order cancellation restoring the stock (`ORDER_CANCEL_RESTORE`) and returning spent loyalty points.

**Sales Reporting Demonstration:**
1. Login as Sales Manager or Admin.
2. Open **Sales Reports**.
3. Select **Last 30 Days**.
4. Show total completed orders and total revenue.
5. Show status breakdown and payment-method breakdown.
6. Show top-selling books.
7. Export CSV or Print.

*Explain:* "Reports are generated from existing order, order item and payment data. Only completed orders contribute to sales revenue."

---

## Epic 4 — Supplier & Purchasing Management

**Main Functions & CRUD:**
- **Supplier CRUD**: Add / view / edit / deactivate (Admin only).
- **PO CRUD**: Create Draft / read / edit / cancel.

**Key Business Rule:**
Approving a Purchase Order does **NOT** increase inventory stock. Stock only increases during the *Receiving* process.

**Receiving Integrations:**
- Generates `PURCHASE_RECEIPT` (Epic 1) when items are physically received.

**Demo Flow:**
1. Login as **Inventory Manager** and view suppliers.
2. Create a new **Purchase Order** (Draft).
3. Login as **Admin** to **Approve** the PO.
4. Login back as **Inventory Manager** and perform a **Partial Receipt** (e.g., receive 5 out of 10 items).
5. Check inventory to show the stock increase by exactly 5.
6. Check inventory history to show the `PURCHASE_RECEIPT` transaction.
7. Receive the remaining items to transition the PO to `RECEIVED`.

---

## Final Viva Checklist (Pre-Demonstration)

Before beginning the viva, ensure the following steps are confirmed:

- [ ] **Supabase Project is Online:** Verify the database and Auth services are responsive.
- [ ] **Internet Connection:** Stable connection for cloud database access.
- [ ] **Test Accounts Verified:** Know the passwords for your Admin, Sales Manager, Inventory Manager, and Customer test accounts.
- [ ] **Browser Prepared:** Logged out initially; optionally open in multiple Incognito windows for cross-role testing.
- [ ] **Email Constraints:** If demonstrating registration, be aware of Supabase's strict email rate limit (do not spam the endpoint; use pre-made accounts).
- [ ] **Active Supplier Exists:** Ensure at least one supplier is marked Active.
- [ ] **Stock Levels Configured:** Ensure you have books with stock, and at least one book triggering "Low Stock".
- [ ] **Loyalty Points Pre-loaded:** Ensure your demo customer has some initial loyalty points for the redemption demo.
- [ ] **PO States Prepared:** Pre-create a Draft PO and an Approved PO to save time.
- [ ] **Build Success:** `npm run build` succeeds locally, confirming code integrity.
