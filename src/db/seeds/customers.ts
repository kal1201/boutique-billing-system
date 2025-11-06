import { db } from '@/db';
import { customers } from '@/db/schema';

async function main() {
    const sampleCustomers = [
        {
            name: 'Priya Sharma',
            phone: '9876543210',
            email: 'priya.sharma@gmail.com',
            address: '123 MG Road, Bangalore',
            loyaltyPoints: 450,
            createdAt: new Date('2024-07-15').toISOString(),
        },
        {
            name: 'Anjali Patel',
            phone: '8765432109',
            email: null,
            address: '45 Park Street, Kolkata',
            loyaltyPoints: 320,
            createdAt: new Date('2024-08-20').toISOString(),
        },
        {
            name: 'Sneha Reddy',
            phone: '7654321098',
            email: 'sneha.reddy@gmail.com',
            address: '67 Nehru Place, Delhi',
            loyaltyPoints: 180,
            createdAt: new Date('2024-09-05').toISOString(),
        },
        {
            name: 'Kavita Singh',
            phone: '9988776655',
            email: null,
            address: null,
            loyaltyPoints: 95,
            createdAt: new Date('2024-10-10').toISOString(),
        },
        {
            name: 'Ritu Gupta',
            phone: '8877665544',
            email: 'ritu.gupta@gmail.com',
            address: '234 Brigade Road, Bangalore',
            loyaltyPoints: 275,
            createdAt: new Date('2024-08-28').toISOString(),
        },
        {
            name: 'Pooja Verma',
            phone: '7766554433',
            email: null,
            address: '89 Linking Road, Mumbai',
            loyaltyPoints: 420,
            createdAt: new Date('2024-07-22').toISOString(),
        },
        {
            name: 'Neha Kumar',
            phone: '9655443322',
            email: 'neha.kumar@gmail.com',
            address: null,
            loyaltyPoints: 155,
            createdAt: new Date('2024-11-03').toISOString(),
        },
        {
            name: 'Meera Desai',
            phone: '8544332211',
            email: null,
            address: '456 MG Road, Pune',
            loyaltyPoints: 380,
            createdAt: new Date('2024-09-18').toISOString(),
        },
        {
            name: 'Deepa Joshi',
            phone: '7433221100',
            email: 'deepa.joshi@gmail.com',
            address: '78 Commercial Street, Bangalore',
            loyaltyPoints: 210,
            createdAt: new Date('2024-10-25').toISOString(),
        },
        {
            name: 'Swati Mehta',
            phone: '9322110099',
            email: null,
            address: null,
            loyaltyPoints: 65,
            createdAt: new Date('2024-11-12').toISOString(),
        }
    ];

    await db.insert(customers).values(sampleCustomers);
    
    console.log('✅ Customers seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});