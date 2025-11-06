# DressBill - Boutique Billing System

A full-stack web application designed for women's clothing boutiques to manage inventory, billing, and daily reports.

## Features

### 🔐 Authentication & Authorization
- User registration and login with JWT authentication
- Role-based access control (Admin & Staff)
- Protected routes and secure API endpoints

### 📦 Inventory Management
- Complete CRUD operations for products
- Product details: name, SKU, category, price, cost price, stock, size, color
- Search and filter functionality
- Low stock alerts and tracking
- Auto-stock reduction on sales

### 💳 Point of Sale (POS) Billing
- Interactive product selection interface
- Real-time cart management
- GST calculation with custom rates
- Discount application
- Multiple payment modes (Cash, Card, UPI, Other)
- Printable invoice generation with store details
- Customer association (optional)

### 📊 Dashboard & Analytics
- Sales overview (daily, weekly, monthly)
- Revenue tracking and trends
- Sales analytics with interactive charts
- Top-selling products
- Payment method breakdown
- Low stock alerts

### 👥 Customer Management
- Customer database with contact information
- Purchase history tracking
- Total purchases calculation
- Customer search and filtering

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **Recharts** - Data visualization
- **React-to-Print** - Invoice printing

### Backend
- **Next.js API Routes** - RESTful API
- **Turso (SQLite)** - Database
- **Drizzle ORM** - Type-safe database client
- **Bearer Token** - Authentication
- **bcryptjs** - Password hashing

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Database credentials are pre-configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dressbill
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment variables**
   Database credentials are already configured in `.env` file. No additional setup needed!

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. Register a new account at `/register`
2. Use these demo accounts or create your own:
   - **Admin**: admin@dressbill.com / admin123
   - **Staff**: staff@dressbill.com / staff123

## Project Structure

```
dressbill/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── products/     # Product CRUD endpoints
│   │   │   ├── customers/    # Customer CRUD endpoints
│   │   │   ├── bills/        # Billing endpoints
│   │   │   └── dashboard/    # Analytics endpoints
│   │   ├── billing/          # POS billing interface
│   │   ├── customers/        # Customer management
│   │   ├── dashboard/        # Analytics dashboard
│   │   ├── inventory/        # Inventory management
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── Navbar.tsx        # Navigation bar
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── db/                    # Database
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── index.ts          # Database client
│   │   └── seeds/            # Database seeders
│   └── lib/                   # Utilities
│       ├── mongodb.ts        # MongoDB connection
│       ├── jwt.ts            # JWT utilities
│       ├── auth.ts           # Auth middleware
│       └── api.ts            # API client
├── public/                    # Static assets
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products (with filters)
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product by ID
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer with purchase history
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Bills
- `GET /api/bills` - Get all bills (with filters)
- `POST /api/bills` - Create bill (auto-reduces stock)
- `GET /api/bills/[id]` - Get bill by ID
- `DELETE /api/bills/[id]` - Delete bill

### Dashboard
- `GET /api/dashboard/stats` - Get analytics (daily/weekly/monthly)

## Features in Detail

### Inventory Management
- Add products with complete details including images
- Track stock levels with automatic alerts
- Search by name, SKU, or category
- Edit and delete products
- View low stock items

### POS Billing
- Quick product search and selection
- Add multiple items to cart
- Adjust quantities
- Apply GST and discounts
- Select payment method
- Optional customer association
- Generate and print invoices
- Auto-update inventory

### Dashboard
- Real-time sales metrics
- Interactive charts for trends
- Top-selling products
- Payment method analytics
- Low stock alerts
- Quick access to key actions

### Customer Management
- Store customer information
- Track purchase history
- View total purchases
- Search and filter customers
- Edit customer details

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected API routes
- Role-based access control
- Secure session management

## License

MIT

## Support

For support, please open an issue in the repository.