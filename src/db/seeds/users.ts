import { db } from '../index';
import { users } from '../schema';
import bcrypt from 'bcryptjs';

export async function seedUsers() {
  console.log('🌱 Seeding users...');

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedStaffPassword = await bcrypt.hash('staff123', 10);

  await db.insert(users).values([
    {
      name: 'Admin User',
      email: 'admin@kalasiddhi.com',
      password: hashedAdminPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Staff User',
      email: 'staff@kalasiddhi.com',
      password: hashedStaffPassword,
      role: 'staff',
      createdAt: new Date().toISOString(),
    },
  ]);

  console.log('✅ Users seeded successfully');
}