const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Checking database...');
    
    // Check if users table exists and has data
    const users = await prisma.user.findMany();
    console.log(`📊 Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Creating demo users...');
      await createDemoUsers();
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function createDemoUsers() {
  const bcrypt = require('bcryptjs');
  
  const demoUsers = [
    { email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { email: 'manager@example.com', password: 'manager123', role: 'Manager' },
    { email: 'viewer@example.com', password: 'viewer123', role: 'Viewer' },
  ];

  for (const userData of demoUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      },
    });
    console.log(`✅ Created user: ${userData.email}`);
  }
}

testDatabase();