import { spawn } from 'node:child_process';

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('🚀 Launching backend process from M:/Projects/Commit/backend...');
  const server = spawn('node', ['dist/main.js'], {
    cwd: 'M:/Projects/Commit/backend',
  });

  server.stderr.on('data', (d) => console.error('[backend error]', d.toString()));

  // Wait for server to start
  let started = false;
  server.stdout.on('data', (d) => {
    const text = d.toString();
    console.log(text.trim());
    if (text.includes('Nest application successfully started')) {
      started = true;
    }
  });

  for (let i = 0; i < 50; i++) {
    if (started) break;
    await wait(300);
  }

  // Double check health endpoint
  let healthy = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://127.0.0.1:3000/');
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch {
      // wait
    }
    await wait(300);
  }

  if (!healthy) {
    console.error('❌ Server failed to respond to health check');
    server.kill();
    process.exit(1);
  }

  console.log('✅ Backend server is live and accepting HTTP connections on port 3000\n');

  try {
    let passed = 0;
    let failed = 0;

    function assert(cond, name) {
      if (cond) {
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } else {
        console.error(`  ❌ FAIL: ${name}`);
        failed++;
      }
    }

    // 1. Learner Login
    console.log('--- 1. Authentication & Role Boundaries ---');
    const learnerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.mercer@commit.dev',
        password: 'Learner123!Pass',
      }),
    });
    assert(learnerLoginRes.status === 200, 'Learner login returns 200 OK');
    const learnerAuth = await learnerLoginRes.json();
    assert(learnerAuth.accessToken && learnerAuth.user.role === 'LEARNER', 'Learner login returns JWT token and LEARNER role');
    const learnerToken = learnerAuth.accessToken;

    // 2. Mentor Login
    const mentorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'marcus.vance@commit.dev',
        password: 'Mentor789!Pass',
      }),
    });
    assert(mentorLoginRes.status === 200, 'Mentor login returns 200 OK');
    const mentorAuth = await mentorLoginRes.json();
    assert(mentorAuth.accessToken && mentorAuth.user.role === 'MENTOR', 'Mentor login returns JWT token and MENTOR role');
    const mentorToken = mentorAuth.accessToken;

    // 3. Role Protection / Authorization Check
    const learnerMentorAccessRes = await fetch(`${BASE_URL}/mentor/learners`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(learnerMentorAccessRes.status === 403, 'Learner accessing mentor roster is rejected with 403 Forbidden');

    const learnerSettingsRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({ minSessionMinutes: 10 }),
    });
    assert(learnerSettingsRes.status === 403, 'Learner updating system settings is rejected with 403 Forbidden');

    // 4. Learner Goals & Topics CRUD + Prerequisite Logic
    console.log('\n--- 2. Goals, Topics, & Prerequisite State Machine ---');
    const createGoalRes = await fetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        title: 'End-to-End Test Curriculum',
        description: 'Automated integration verification goal',
      }),
    });
    assert(createGoalRes.status === 201, 'Learner can create a goal (201 Created)');
    const createdGoal = await createGoalRes.json();
    const goalId = createdGoal.id;

    // Create Topic A (Prerequisite)
    const createTopicARes = await fetch(`${BASE_URL}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        goalId,
        title: 'Topic A (Prerequisite)',
        position: 1,
      }),
    });
    assert(createTopicARes.status === 201, 'Created Topic A (201 Created)');
    const topicA = await createTopicARes.json();

    // Create Topic B (Dependent on A)
    const createTopicBRes = await fetch(`${BASE_URL}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        goalId,
        title: 'Topic B (Dependent)',
        position: 2,
        prerequisiteTopicIds: [topicA.id],
      }),
    });
    assert(createTopicBRes.status === 201, 'Created Topic B with Topic A prerequisite (201 Created)');
    const topicB = await createTopicBRes.json();

    // Fetch topics by goal and verify backend unlock calculation
    const goalTopicsRes = await fetch(`${BASE_URL}/topics/goal/${goalId}`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    const goalTopics = await goalTopicsRes.json();
    const fetchedA = goalTopics.find((t) => t.id === topicA.id);
    const fetchedB = goalTopics.find((t) => t.id === topicB.id);

    assert(fetchedA.isUnlocked === true, 'Topic A has no prerequisites and isUnlocked === true');
    assert(fetchedB.isUnlocked === false, 'Topic B has incomplete Topic A prerequisite and isUnlocked === false');
    assert(
      fetchedB.missingPrerequisites.some((p) => p.id === topicA.id),
      'Topic B lists Topic A in missingPrerequisites',
    );

    // Attempt to complete locked Topic B -> Backend must reject with 400
    const completeLockedRes = await fetch(`${BASE_URL}/topics/${topicB.id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(completeLockedRes.status === 400, 'Attempting to complete locked Topic B rejected with 400 Bad Request');

    // Complete Topic A -> should succeed
    const completeARes = await fetch(`${BASE_URL}/topics/${topicA.id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(completeARes.status === 200, 'Completing unlocked Topic A returns 200 OK');

    // Now Topic B should be unlocked
    const goalTopicsAfterA = await (
      await fetch(`${BASE_URL}/topics/goal/${goalId}`, {
        headers: { Authorization: `Bearer ${learnerToken}` },
      })
    ).json();
    const fetchedBAfterA = goalTopicsAfterA.find((t) => t.id === topicB.id);
    assert(fetchedBAfterA.isUnlocked === true, 'Topic B is now unlocked after Topic A completion');

    // Complete Topic B -> should succeed
    const completeBRes = await fetch(`${BASE_URL}/topics/${topicB.id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(completeBRes.status === 200, 'Completing unlocked Topic B returns 200 OK');

    // Reopen Topic A -> Backend cascades and resets dependent Topic B to incomplete!
    const reopenARes = await fetch(`${BASE_URL}/topics/${topicA.id}/reopen`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(reopenARes.status === 200, 'Reopening Topic A returns 200 OK');

    const goalTopicsAfterReopen = await (
      await fetch(`${BASE_URL}/topics/goal/${goalId}`, {
        headers: { Authorization: `Bearer ${learnerToken}` },
      })
    ).json();
    const fetchedBAfterReopen = goalTopicsAfterReopen.find((t) => t.id === topicB.id);
    assert(fetchedBAfterReopen.isCompleted === false, 'Reopening Topic A automatically reset Topic B to incomplete');
    assert(fetchedBAfterReopen.isUnlocked === false, 'Topic B is re-locked because prerequisite Topic A is incomplete again');

    // 5. Study Sessions Logging
    console.log('\n--- 3. Study Session Logging & Progress Tracking ---');
    const logSessionRes = await fetch(`${BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${learnerToken}`,
      },
      body: JSON.stringify({
        topicId: topicA.id,
        minutes: 45,
        studyDate: new Date().toISOString(),
        note: 'End-to-end integration session',
      }),
    });
    assert(logSessionRes.status === 201, 'Logged study session (201 Created)');
    const createdSession = await logSessionRes.json();
    assert(createdSession.minutes === 45, 'Logged session contains correct study duration');

    // Progress Overview
    const progressRes = await fetch(`${BASE_URL}/progress`, {
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(progressRes.status === 200, 'Learner progress overview returns 200 OK');
    const progressData = await progressRes.json();
    assert(typeof progressData.overview?.totalMinutes === 'number', 'Progress overview contains totalMinutes');

    // 6. Mentor Inspection & Settings
    console.log('\n--- 4. Mentor Inspection & System Settings ---');
    const mentorLearnersRes = await fetch(`${BASE_URL}/mentor/learners`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    assert(mentorLearnersRes.status === 200, 'Mentor learner roster returns 200 OK');
    const learnersList = await mentorLearnersRes.json();
    assert(Array.isArray(learnersList) && learnersList.length > 0, 'Learner roster contains learners');

    // Mentor view learner progress
    const learnerId = learnerAuth.user.id;
    const mentorLearnerProgressRes = await fetch(`${BASE_URL}/progress/${learnerId}`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    assert(mentorLearnerProgressRes.status === 200, 'Mentor view learner progress returns 200 OK');

    // Mentor update settings
    const updateSettingsRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mentorToken}`,
      },
      body: JSON.stringify({
        minSessionMinutes: 15,
        maxSessionMinutes: 480,
        maxPrerequisitesPerTopic: 5,
      }),
    });
    assert(updateSettingsRes.status === 200, 'Mentor can update system settings (200 OK)');

    // Clean up created test goal
    console.log('\n--- 5. Cleanup ---');
    const deleteGoalRes = await fetch(`${BASE_URL}/goals/${goalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${learnerToken}` },
    });
    assert(deleteGoalRes.status === 200 || deleteGoalRes.status === 204, 'Test goal deleted successfully');

    console.log(`\n========================================`);
    console.log(`E2E Verification Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    console.log('Shutting down backend process...');
    server.kill();
  }
}

run().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
