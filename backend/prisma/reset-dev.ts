import 'dotenv/config';
import { execSync } from 'child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}

// 1. Never operate against production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Error: Database reset is strictly forbidden in production (NODE_ENV=production).');
  process.exit(1);
}

// 2. Validate database name before executing destructive operations
let dbName = '';
try {
  const parsed = new URL(connectionString);
  dbName = parsed.pathname.replace(/^\//, '');
} catch {
  console.error('❌ Error: Failed to parse DATABASE_URL.');
  process.exit(1);
}

// Specifically reject test database or unexpected databases
if (dbName === 'commit_test_db') {
  console.error('❌ Error: Refusing to reset test database "commit_test_db" with development reset script.');
  process.exit(1);
}

if (dbName !== 'commit_db') {
  console.error(`❌ Error: Refusing to reset unexpected database "${dbName}". Only "commit_db" is permitted for development reset.`);
  process.exit(1);
}

// 3. Require explicit confirmation flag
const isConfirmed = process.argv.includes('--confirm') || process.env.CONFIRM_RESET === 'true';
if (!isConfirmed) {
  console.error('❌ Error: Database reset aborted. You must supply the "--confirm" flag or set CONFIRM_RESET=true.');
  console.error('Usage: npm run db:reset-dev -- --confirm');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function resetDevelopmentDatabase() {
  console.log(`⚠️  Resetting development database "${dbName}"...`);
  await prisma.$connect();

  await prisma.$transaction(async (tx) => {
    console.log('🧹 Purging development tables...');
    await tx.studySession.deleteMany({});
    await tx.topicPrerequisite.deleteMany({});
    await tx.topic.deleteMany({});
    await tx.goal.deleteMany({});
    await tx.systemSettings.deleteMany({});
    await tx.user.deleteMany({});
  });

  await prisma.$disconnect();

  console.log('🌱 Reseeding baseline demo records via npm run seed...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

  console.log('✅ Development database successfully reset and reseeded with baseline data.');
}

resetDevelopmentDatabase().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
