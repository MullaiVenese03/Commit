export type Role = 'LEARNER' | 'MENTOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface MissingPrerequisite {
  id: string;
  title: string;
}

export interface TopicPrerequisiteRelation {
  id: string;
  topicId: string;
  prerequisiteTopicId: string;
  prerequisiteTopic?: {
    id: string;
    title: string;
    isCompleted: boolean;
  };
}

export interface TopicDependentRelation {
  id: string;
  topicId: string;
  prerequisiteTopicId: string;
  topic?: {
    id: string;
    title: string;
    isCompleted: boolean;
  };
}

export interface Topic {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  position: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isUnlocked: boolean;
  missingPrerequisites: MissingPrerequisite[];
  prerequisites?: TopicPrerequisiteRelation[];
  dependents?: TopicDependentRelation[];
  studySessions?: StudySession[];
  goal?: {
    id: string;
    title: string;
    learnerId?: string;
  };
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  learnerId: string;
  createdAt: string;
  updatedAt: string;
  topics?: Topic[];
  learner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface StudySession {
  id: string;
  learnerId: string;
  topicId: string;
  studyDate: string;
  minutes: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: string;
    title: string;
    goalId?: string;
    goal?: {
      id: string;
      title: string;
    };
  };
  learner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProgressOverview {
  totalGoals: number;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  completionPercentage: number;
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
}

export interface GoalProgressSummary {
  id: string;
  title: string;
  totalTopics: number;
  completedTopics: number;
  progressPercentage: number;
}

export interface ProgressResponse {
  learner: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  overview: ProgressOverview;
  goals: GoalProgressSummary[];
  recentSessions: StudySession[];
}

export interface LearnerSummary {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  totalGoals: number;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
  totalMinutes: number;
  totalHours: number;
}

export interface SystemSettings {
  id: string;
  minSessionMinutes: number;
  maxSessionMinutes: number;
  maxPrerequisitesPerTopic: number;
  createdAt: string;
  updatedAt: string;
  updatedById?: string | null;
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
  method?: string;
}
