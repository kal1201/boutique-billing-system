import { db } from '@/db';
import { bills, users, customers, products } from '@/db/schema';

async function main() {
    // Query existing data from database
    const existingUsers = await db.select().from(users).limit(1);
    const existingCustomers = await db.select().from(customers).limit(3);
    const existingProducts = await db.select().from(products).limit(10);

    if (existingUsers.length === 0) {
        throw new Error('No users found in database. Please seed users first.');
    }

    if (existingProducts.length === 0) {
        throw new Error('No products found in database. Please seed products first.');
    }

    const userId = existingUsers[0].id;
    
    // Create bills with real data from database
    const sampleBills = [
        {
            invoiceNumber: 'DB2025-001',
            customerId: existingCustomers.length > 0 ? existingCustomers[0].id : null,
            customerName: existingCustomers.length > 0 ? existingCustomers[0].name : 'Rajni Kapoor',
            customerPhone: existingCustomers.length > 0 ? existingCustomers[0].phone : '9988776655',
            items: JSON.stringify([
                {
                    productId: existingProducts[0].id,
                    productName: existingProducts[0].name,
                    quantity: 2,
                    price: existingProducts[0].sellingPrice,
                    total: existingProducts[0].sellingPrice * 2
                },
                {
                    productId: existingProducts[1].id,
                    productName: existingProducts[1].name,
                    quantity: 1,
                    price: existingProducts[1].sellingPrice,
                    total: existingProducts[1].sellingPrice * 1
                }
            ]),
            subtotal: (existingProducts[0].sellingPrice * 2) + (existingProducts[1].sellingPrice * 1),
            discount: 0,
            gstAmount: ((existingProducts[0].sellingPrice * 2) + (existingProducts[1].sellingPrice * 1)) * (existingProducts[0].gstPercent / 100),
            totalAmount: ((existingProducts[0].sellingPrice * 2) + (existingProducts[1].sellingPrice * 1)) + (((existingProducts[0].sellingPrice * 2) + (existingProducts[1].sellingPrice * 1)) * (existingProducts[0].gstPercent / 100)),
            paymentMode: 'Cash',
            createdBy: userId,
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            invoiceNumber: 'DB2025-002',
            customerId: existingCustomers.length > 1 ? existingCustomers[1].id : null,
            customerName: existingCustomers.length > 1 ? existingCustomers[1].name : 'Sunita Rao',
            customerPhone: existingCustomers.length > 1 ? existingCustomers[1].phone : '9988776656',
            items: JSON.stringify([
                {
                    productId: existingProducts[2].id,
                    productName: existingProducts[2].name,
                    quantity: 1,
                    price: existingProducts[2].sellingPrice,
                    total: existingProducts[2].sellingPrice * 1
                },
                {
                    productId: existingProducts[3].id,
                    productName: existingProducts[3].name,
                    quantity: 3,
                    price: existingProducts[3].sellingPrice,
                    total: existingProducts[3].sellingPrice * 3
                }
            ]),
            subtotal: (existingProducts[2].sellingPrice * 1) + (existingProducts[3].sellingPrice * 3),
            discount: 200,
            gstAmount: (((existingProducts[2].sellingPrice * 1) + (existingProducts[3].sellingPrice * 3)) - 200) * (existingProducts[2].gstPercent / 100),
            totalAmount: (((existingProducts[2].sellingPrice * 1) + (existingProducts[3].sellingPrice * 3)) - 200) + ((((existingProducts[2].sellingPrice * 1) + (existingProducts[3].sellingPrice * 3)) - 200) * (existingProducts[2].gstPercent / 100)),
            paymentMode: 'UPI',
            createdBy: userId,
            createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            invoiceNumber: 'DB2025-003',
            customerId: existingCustomers.length > 2 ? existingCustomers[2].id : null,
            customerName: existingCustomers.length > 2 ? existingCustomers[2].name : 'Meera Sharma',
            customerPhone: existingCustomers.length > 2 ? existingCustomers[2].phone : '9988776657',
            items: JSON.stringify([
                {
                    productId: existingProducts[4].id,
                    productName: existingProducts[4].name,
                    quantity: 2,
                    price: existingProducts[4].sellingPrice,
                    total: existingProducts[4].sellingPrice * 2
                }
            ]),
            subtotal: existingProducts[4].sellingPrice * 2,
            discount: 0,
            gstAmount: (existingProducts[4].sellingPrice * 2) * (existingProducts[4].gstPercent / 100),
            totalAmount: (existingProducts[4].sellingPrice * 2) + ((existingProducts[4].sellingPrice * 2) * (existingProducts[4].gstPercent / 100)),
            paymentMode: 'Card',
            createdBy: userId,
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            invoiceNumber: 'DB2025-004',
            customerId: null,
            customerName: 'Rajni Kapoor',
            customerPhone: '9988776655',
            items: JSON.stringify([
                {
                    productId: existingProducts[5].id,
                    productName: existingProducts[5].name,
                    quantity: 1,
                    price: existingProducts[5].sellingPrice,
                    total: existingProducts[5].sellingPrice * 1
                },
                {
                    productId: existingProducts[6].id,
                    productName: existingProducts[6].name,
                    quantity: 2,
                    price: existingProducts[6].sellingPrice,
                    total: existingProducts[6].sellingPrice * 2
                }
            ]),
            subtotal: (existingProducts[5].sellingPrice * 1) + (existingProducts[6].sellingPrice * 2),
            discount: 100,
            gstAmount: (((existingProducts[5].sellingPrice * 1) + (existingProducts[6].sellingPrice * 2)) - 100) * (existingProducts[5].gstPercent / 100),
            totalAmount: (((existingProducts[5].sellingPrice * 1) + (existingProducts[6].sellingPrice * 2)) - 100) + ((((existingProducts[5].sellingPrice * 1) + (existingProducts[6].sellingPrice * 2)) - 100) * (existingProducts[5].gstPercent / 100)),
            paymentMode: 'Cash',
            createdBy: userId,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            invoiceNumber: 'DB2025-005',
            customerId: null,
            customerName: 'Sunita Rao',
            customerPhone: '9988776656',
            items: JSON.stringify([
                {
                    productId: existingProducts[7].id,
                    productName: existingProducts[7].name,
                    quantity: 3,
                    price: existingProducts[7].sellingPrice,
                    total: existingProducts[7].sellingPrice * 3
                }
            ]),
            subtotal: existingProducts[7].sellingPrice * 3,
            discount: 0,
            gstAmount: (existingProducts[7].sellingPrice * 3) * (existingProducts[7].gstPercent / 100),
            totalAmount: (existingProducts[7].sellingPrice * 3) + ((existingProducts[7].sellingPrice * 3) * (existingProducts[7].gstPercent / 100)),
            paymentMode: 'Wallet',
            createdBy: userId,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
    ];

    await db.insert(bills).values(sampleBills);
    
    console.log('✅ Bills seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});