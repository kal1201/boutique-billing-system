import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('staff'),
  createdAt: text('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(),
  size: text('size'),
  color: text('color'),
  stock: integer('stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  costPrice: real('cost_price').notNull(),
  sellingPrice: real('selling_price').notNull(),
  gstPercent: real('gst_percent').notNull().default(0),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const bills = sqliteTable('bills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  items: text('items', { mode: 'json' }).notNull(),
  subtotal: real('subtotal').notNull(),
  discount: real('discount').notNull().default(0),
  gstAmount: real('gst_amount').notNull(),
  loyaltyPointsRedeemed: integer('loyalty_points_redeemed').notNull().default(0),
  loyaltyPointsEarned: integer('loyalty_points_earned').notNull().default(0),
  totalAmount: real('total_amount').notNull(),
  paymentMode: text('payment_mode').notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});

export const offers = sqliteTable('offers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  discountPercent: real('discount_percent'),
  discountAmount: real('discount_amount'),
  validFrom: text('valid_from'),
  validUntil: text('valid_until'),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
});