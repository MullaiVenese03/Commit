-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEARNER', 'MENTOR');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'LEARNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" UUID NOT NULL,
    "learnerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicPrerequisite" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "prerequisiteTopicId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" UUID NOT NULL,
    "learnerId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "studyDate" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "minSessionMinutes" INTEGER NOT NULL DEFAULT 5,
    "maxSessionMinutes" INTEGER NOT NULL DEFAULT 480,
    "maxPrerequisitesPerTopic" INTEGER NOT NULL DEFAULT 5,
    "updatedById" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Goal_learnerId_idx" ON "Goal"("learnerId");

-- CreateIndex
CREATE INDEX "Topic_goalId_idx" ON "Topic"("goalId");

-- CreateIndex
CREATE INDEX "TopicPrerequisite_prerequisiteTopicId_idx" ON "TopicPrerequisite"("prerequisiteTopicId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicPrerequisite_topicId_prerequisiteTopicId_key" ON "TopicPrerequisite"("topicId", "prerequisiteTopicId");

-- CreateIndex
CREATE INDEX "StudySession_learnerId_studyDate_idx" ON "StudySession"("learnerId", "studyDate");

-- CreateIndex
CREATE INDEX "StudySession_topicId_idx" ON "StudySession"("topicId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPrerequisite" ADD CONSTRAINT "TopicPrerequisite_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPrerequisite" ADD CONSTRAINT "TopicPrerequisite_prerequisiteTopicId_fkey" FOREIGN KEY ("prerequisiteTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
