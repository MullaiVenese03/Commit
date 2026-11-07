import React, { useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, GraduationCap, Shield } from 'lucide-react';
import { LoginForm } from './LoginForm';

export const LoginPage: React.FC = () => {
  const [demoCreds, setDemoCreds] = useState<{ email: string; pass: string }>({
    email: '',
    pass: '',
  });

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center text-white font-bold text-lg shadow-2xs">
          C
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-zinc-950">
          Sign in to Commit
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Structured prerequisite tracking & study progress analytics
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-5 shadow-2xs border border-zinc-200/90 rounded-lg sm:px-8">
          <LoginForm
            initialEmail={demoCreds.email}
            initialPassword={demoCreds.pass}
          />

          <div className="mt-5 pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Register as a Learner
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <span className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 select-none">
              Quick Demo Accounts (Evaluation)
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() =>
                  setDemoCreds({
                    email: 'alex.mercer@commit.dev',
                    pass: 'Learner123!Pass',
                  })
                }
                className="w-full flex items-center justify-between p-2 rounded border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    Alex Mercer (Learner)
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Fill</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDemoCreds({
                    email: 'samantha.reed@commit.dev',
                    pass: 'Learner456!Pass',
                  })
                }
                className="w-full flex items-center justify-between p-2 rounded border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    Samantha Reed (Learner)
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Fill</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDemoCreds({
                    email: 'marcus.vance@commit.dev',
                    pass: 'Mentor789!Pass',
                  })
                }
                className="w-full flex items-center justify-between p-2 rounded border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-100 hover:border-zinc-300 text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    Marcus Vance (Mentor)
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Fill</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
