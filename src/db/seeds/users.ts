import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

async function main() {
    const sampleUsers = [
        {
            name: 'Admin User',
            email: 'admin@dressbill.com',
            password: bcrypt.hashSync('admin123', 10),
            phone: '9876543210',
            role: 'admin',
            createdAt: new Date('2024-01-01').toISOString(),
        },
        {
            name: 'Staff Member',
            email: 'staff@dressbill.com',
            password: bcrypt.hashSync('staff123', 10),
            phone: '9876543211',
            role: 'staff',
            createdAt: new Date('2024-01-01').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});