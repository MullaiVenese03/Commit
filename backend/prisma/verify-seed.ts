import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('🔍 Running Phase 1 Seed Verification Audit...\n');

  let passed = true;
  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      passed = false;
    }
  }

  await prisma.$connect();

  // 1. Verify Users & Roles
  console.log('1. User Accounts & Security:');
  const users = await prisma.user.findMany({ orderBy: { email: 'asc' } });
  assert(users.length >= 3, `Total user count is ${users.length} (expected at least 3)`);
  const learners = users.filter((u) => u.role === Role.LEARNER);
  const mentors = users.filter((u) => u.role === Role.MENTOR);
  assert(learners.length >= 2, `Learner count is ${learners.length} (expected at least 2)`);
  assert(mentors.length >= 1, `Mentor count is ${mentors.length} (expected at least 1)`);

  for (const user of users) {
    assert(
      user.passwordHash.startsWith('$argon2'),
      `User ${user.email} password is valid Argon2 hash (${user.passwordHash.substring(0, 28)}...)`
    );
  }

  // Verify sample password verification with Argon2
  const alex = users.find((u) => u.email === 'alex.mercer@commit.dev');
  if (alex) {
    const isAlexValid = await argon2.verify(alex.passwordHash, 'Learner123!Pass');
    const isAlexInvalid = await argon2.verify(alex.passwordHash, 'WrongPassword!');
    assert(isAlexValid && !isAlexInvalid, 'Argon2 password verification matches known demo credentials');
  }

  // 2. Verify System Settings
  console.log('\n2. Global System Settings:');
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'global' },
    include: { updatedBy: true },
  });
  assert(Boolean(settings), 'Global SystemSettings record exists with id="global"');
  if (settings) {
    assert(settings.minSessionMinutes === 5, `minSessionMinutes is 5 (got ${settings.minSessionMinutes})`);
    assert(settings.maxSessionMinutes === 480, `maxSessionMinutes is 480 (got ${settings.maxSessionMinutes})`);
    assert(settings.maxPrerequisitesPerTopic === 5, `maxPrerequisitesPerTopic is 5 (got ${settings.maxPrerequisitesPerTopic})`);
    assert(Boolean(settings.updatedBy), `Updated by mentor account (${settings.updatedBy?.name})`);
  }

  // 3. Verify Goals
  console.log('\n3. Study Goals:');
  const goals = await prisma.goal.findMany({
    include: { learner: true, topics: true },
    orderBy: { createdAt: 'asc' },
  });
  assert(goals.length === 3, `Goal count is ${goals.length} (expected exactly 3)`);
  for (const goal of goals) {
    assert(goal.learner.role === Role.LEARNER, `Goal "${goal.title}" is owned by learner ${goal.learner.email}`);
  }

  // 4. Verify Topics
  console.log('\n4. Topics:');
  const topics = await prisma.topic.findMany({
    include: {
      goal: true,
      prerequisites: { include: { prerequisiteTopic: true } },
      dependents: { include: { topic: true } },
    },
    orderBy: { title: 'asc' },
  });
  assert(topics.length === 12, `Topic count is ${topics.length} (expected exactly 12)`);

  // 5. Verify Prerequisites
  console.log('\n5. Prerequisite Structure & Constraints:');
  const prereqs = await prisma.topicPrerequisite.findMany({
    include: { topic: true, prerequisiteTopic: true },
  });
  console.log(`  Total prerequisite links: ${prereqs.length}`);

  let noPrereqsCount = 0;
  let onePrereqCount = 0;
  let multiPrereqCount = 0;
  let selfDependency = false;
  let crossGoalPrereq = false;

  for (const topic of topics) {
    const count = topic.prerequisites.length;
    if (count === 0) noPrereqsCount++;
    else if (count === 1) onePrereqCount++;
    else if (count > 1) multiPrereqCount++;

    for (const p of topic.prerequisites) {
      if (p.topicId === p.prerequisiteTopicId) {
        selfDependency = true;
      }
      if (p.prerequisiteTopic.goalId !== topic.goalId) {
        crossGoalPrereq = true;
      }
    }
  }

  assert(noPrereqsCount > 0, `Topics with NO prerequisites: ${noPrereqsCount} (expected > 0)`);
  assert(onePrereqCount > 0, `Topics with ONE prerequisite: ${onePrereqCount} (expected > 0)`);
  assert(multiPrereqCount > 0, `Topics with MULTIPLE prerequisites: ${multiPrereqCount} (expected > 0)`);
  assert(!selfDependency, 'No topic depends on itself (zero self-dependencies)');
  assert(!crossGoalPrereq, 'All prerequisites belong strictly to the same goal');

  // Cycle check (Topological Sort / DFS)
  let hasCycle = false;
  const adj = new Map<string, string[]>();
  for (const t of topics) adj.set(t.id, []);
  for (const p of prereqs) adj.get(p.topicId)?.push(p.prerequisiteTopicId);

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);
    for (const neighbor of adj.get(node) || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }
    inStack.delete(node);
    return false;
  }

  for (const t of topics) {
    if (!visited.has(t.id)) {
      if (dfs(t.id)) {
        hasCycle = true;
        break;
      }
    }
  }
  assert(!hasCycle, 'No prerequisite cycles exist (graph is a valid DAG)');

  // 6. Verify Study Sessions
  console.log('\n6. Study Sessions:');
  const sessions = await prisma.studySession.findMany({
    include: { learner: true, topic: { include: { goal: true } } },
    orderBy: { studyDate: 'asc' },
  });
  assert(sessions.length === 30, `Total session count is ${sessions.length} (expected exactly 30)`);

  let invalidLearnerMapping = false;
  let outOfRangeMinutes = false;
  let futureDate = false;

  const now = new Date();
  const sessionDates: Date[] = [];

  for (const s of sessions) {
    sessionDates.push(new Date(s.studyDate));
    // Verify session belongs to learner who owns the goal
    if (s.learnerId !== s.topic.goal.learnerId) {
      invalidLearnerMapping = true;
    }
    // Verify minutes range
    if (s.minutes < 5 || s.minutes > 480) {
      outOfRangeMinutes = true;
    }
    // Verify not in future
    if (new Date(s.studyDate).getTime() > now.getTime()) {
      futureDate = true;
    }
  }

  assert(!invalidLearnerMapping, 'All study sessions belong to the learner who owns the goal/topic');
  assert(!outOfRangeMinutes, 'All session durations fall within the configured 5 to 480 minute range');
  assert(!futureDate, 'No study session dates are in the future');

  // Verify Six-Week Distribution
  const minDate = sessionDates[0];
  const maxDate = sessionDates[sessionDates.length - 1];
  const daySpan = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekSpan = Math.ceil(daySpan / 7);

  console.log(`  Date Span: ${minDate.toISOString().slice(0, 10)} to ${maxDate.toISOString().slice(0, 10)} (${daySpan} days, ~${weekSpan} weeks)`);
  assert(daySpan >= 35 && daySpan <= 45, `Sessions cover a 6-week distribution span (${daySpan} days covered)`);

  // Count sessions per calendar week
  const weekBuckets = new Map<number, number>();
  for (const d of sessionDates) {
    const diffDays = Math.floor((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(diffDays / 7) + 1;
    weekBuckets.set(weekIndex, (weekBuckets.get(weekIndex) || 0) + 1);
  }
  assert(weekBuckets.size === 6, `Sessions are actively distributed across all 6 distinct weeks: ${Array.from(weekBuckets.entries()).map(([w, c]) => `Week ${w}: ${c}`).join(', ')}`);

  console.log('\n======================================================');
  if (passed) {
    console.log('🎉 ALL SEED VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME VERIFICATION CHECKS FAILED!');
    process.exit(1);
  }
}

verify()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
