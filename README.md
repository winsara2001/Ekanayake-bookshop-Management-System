# 📚 Ekanayake Book Shop Management System

A full-stack online bookshop management system built with **React**, **Vite**, **Supabase**, and **PostgreSQL**. This application supports multiple user roles including Customers, Admins, Inventory Managers, and Sales Managers — each with role-based access control and dedicated dashboards.

---

## 🚀 Features

### Customer Features
- Browse and search books by title, author, or category
- View detailed book information
- Add books to cart and wishlist
- Place orders with checkout
- Track order history and order details
- Manage account profile
- Loyalty points system

### Admin Features
- Dashboard with key business metrics
- Manage books (add, edit, delete)
- Manage categories and authors
- Manage users and customer accounts
- View and manage all orders
- Process payments
- Manage suppliers
- Create and manage purchase orders
- Configure loyalty programs
- Generate sales reports

### Inventory Manager Features
- Inventory dashboard
- Manage book stock and inventory levels
- Stock adjustment with audit history
- Manage suppliers
- Create and track purchase orders
- Receive books against purchase orders

### Sales Manager Features
- Sales dashboard
- View and manage orders
- Generate sales reports

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 19, React Router v7          |
| Build Tool   | Vite                                |
| Backend/DB   | Supabase (PostgreSQL)               |
| Auth         | Supabase Authentication             |
| Styling      | Vanilla CSS                         |
| Icons        | React Icons                         |
| Date Utils   | date-fns                            |
| Testing      | Vitest                              |

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- A **Supabase** project ([https://supabase.com](https://supabase.com))

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/winsara2001/Ekanayake-bookshop-Management-System.git
cd Ekanayake-bookshop-Management-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ **Important:** Never commit the `.env` file. It is already included in `.gitignore`.

You can find these values in your Supabase project dashboard under **Settings → API**.

### 4. Set Up the Database

Run the SQL migration files located in `supabase/migrations/` in order on your Supabase SQL Editor:

| Order | Migration File | Description |
|-------|---------------|-------------|
| 1 | `01_create_customer_profiles.sql` | Customer profiles and RLS policies |
| 2 | `02_inventory_management.sql` | Inventory tracking and stock management |
| 3 | `03_orders_and_cart.sql` | Orders, cart, and order items |
| 4 | `04_order_status_and_cancellation.sql` | Order status workflow and cancellation |
| 5 | `05_suppliers_management.sql` | Supplier CRUD and management |
| 6 | `06_purchase_orders.sql` | Purchase order creation and tracking |
| 7 | `07_purchase_order_receiving.sql` | Receiving books against purchase orders |
| 8 | `08_loyalty_management.sql` | Customer loyalty points system |
| 9 | `09_fix_adjust_book_stock_inventory_manager_role.sql` | Role-based stock adjustment fix |
| 10 | `10_remove_duplicate_place_customer_order.sql` | Remove duplicate order function |
| 11 | `11_fix_catalogue_rls_roles.sql` | Fix catalogue RLS for staff roles |

### 5. Run the Application

```bash
npm run dev
```

The application will start at `http://localhost:5173`.

---

## 📁 Project Structure

```
Ekanayake-bookshop-Management-System/
├── public/                     # Static assets (favicon, icons)
├── src/
│   ├── assets/                 # Images and media files
│   ├── components/             # Reusable UI components
│   │   ├── Navbar/             # Navigation bar
│   │   ├── Footer/             # Footer
│   │   ├── Hero/               # Hero banner
│   │   ├── BookCard/           # Book display card
│   │   ├── CategoryCard/       # Category display card
│   │   ├── Sidebar/            # Admin sidebar navigation
│   │   ├── PurchaseOrders/     # Purchase order components
│   │   ├── Suppliers/          # Supplier management components
│   │   └── ...
│   ├── context/                # React Context providers
│   │   ├── AuthContext.jsx     # Authentication state management
│   │   ├── CartContext.jsx     # Shopping cart state management
│   │   └── WishlistContext.jsx # Wishlist state management
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Layout components for each role
│   │   ├── AdminLayout.jsx
│   │   ├── InventoryManagerLayout.jsx
│   │   └── SalesManagerLayout.jsx
│   ├── lib/
│   │   └── supabase.js         # Supabase client initialization
│   ├── pages/                  # Page components (30 modules)
│   │   ├── Home/               # Landing page
│   │   ├── Shop/               # Book browsing page
│   │   ├── BookDetails/        # Single book details
│   │   ├── Cart/               # Shopping cart
│   │   ├── Checkout/           # Order checkout
│   │   ├── Orders/             # Customer order history
│   │   ├── Account/            # Customer account & loyalty
│   │   ├── AdminDashboard/     # Admin dashboard
│   │   ├── AdminBooks/         # Book management (CRUD)
│   │   ├── AdminOrders/        # Order management
│   │   ├── Inventory/          # Stock management
│   │   └── ...
│   ├── routes/                 # Protected route guards
│   │   ├── AdminRoute.jsx
│   │   ├── CustomerRoute.jsx
│   │   ├── InventoryManagerRoute.jsx
│   │   └── SalesManagerRoute.jsx
│   ├── services/               # Supabase API service layer
│   │   ├── bookService.js
│   │   ├── orderService.js
│   │   ├── inventoryService.js
│   │   ├── purchaseOrderService.js
│   │   ├── loyaltyService.js
│   │   └── ...
│   ├── utils/                  # Utility functions
│   ├── App.jsx                 # Root component with routing
│   ├── App.css                 # Global styles
│   └── main.jsx                # Application entry point
├── supabase/
│   ├── migrations/             # SQL migration files (11 files)
│   └── functions/              # Supabase Edge Functions
├── .env                        # Environment variables (not committed)
├── .gitignore
├── package.json
├── vite.config.js
└── index.html
```

---

## 👥 User Roles & Access

| Role | Access Level | Dashboard Route |
|------|-------------|-----------------|
| **Customer** | Browse, purchase, track orders, loyalty | `/` (public pages) |
| **Admin** | Full system access | `/admin/dashboard` |
| **Inventory Manager** | Stock, suppliers, purchase orders | `/inventory/dashboard` |
| **Sales Manager** | Orders, sales reports | `/sales/dashboard` |

### Security
- **Row Level Security (RLS)** is enforced on all database tables
- Role-based route protection using React route guards
- Supabase Authentication handles user sessions
- Environment variables keep API keys secure

---

## 🧪 Running Tests

```bash
npm run test
```

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev Server | `npm run dev` | Start development server |
| Build | `npm run build` | Build for production |
| Preview | `npm run preview` | Preview production build |
| Test | `npm run test` | Run test suite |

---

## 🗄️ Database Schema Overview

The system uses **11 sequential migrations** that build the following core tables:

- **customer_profiles** — Customer account details and preferences
- **books** — Book catalogue with stock tracking
- **categories** & **authors** — Book classification
- **orders** & **order_items** — Customer order processing
- **cart_items** — Shopping cart persistence
- **suppliers** — Supplier information management
- **purchase_orders** & **purchase_order_items** — Procurement workflow
- **inventory_adjustments** — Stock audit trail
- **loyalty_tiers** & **loyalty_transactions** — Customer rewards program

All tables are secured with **PostgreSQL Row Level Security (RLS)** policies.

---

## 📄 License

This project was developed as a university assignment.

---

## 👨‍💻 Author

**Winsara Ekanayake**

- GitHub: [@winsara2001](https://github.com/winsara2001)
