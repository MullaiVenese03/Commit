import React, { useState } from 'react';
import { Link } from 'react-router';
import { BookOpen, GraduationCap, Shield } from 'lucide-react';
import { CommitLogo } from '../../components/ui/CommitLogo';
import { LoginForm } from './LoginForm';

export const LoginPage: React.FC = () => {
  const [demoCreds, setDemoCreds] = useState<{ email: string; pass: string }>({
    email: '',
    pass: '',
  });

  return (
    <div className="min-h-screen bg-[#F4F3F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#24242A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <CommitLogo size="lg" className="mx-auto" />
        <h2 className="mt-3.5 text-2xl font-bold tracking-tight text-[#24242A]">
          Sign in to Commit
        </h2>
        <p className="mt-1 text-xs text-[#777782] max-w-sm mx-auto leading-normal">
          Academic progress tracker with verified topic prerequisites and study consistency analytics
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-5 shadow-xs border border-[#E4E2DE] rounded-xl sm:px-8">
          <LoginForm
            initialEmail={demoCreds.email}
            initialPassword={demoCreds.pass}
          />

          <div className="mt-5 pt-4 border-t border-[#E4E2DE] text-center">
            <p className="text-xs text-[#777782]">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#5557C8] hover:text-[#4446B4] hover:underline"
              >
                Register as a Learner
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials restricted to Development Mode */}
          {import.meta.env.DEV && (
            <div className="mt-5 pt-4 border-t border-[#E4E2DE]">
              <span className="block text-[10px] font-semibold text-[#777782] uppercase tracking-wider mb-2 select-none">
                Development Evaluation Accounts
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
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-[#E4E2DE] bg-[#F8F7F4] hover:bg-[#ECEBE7] text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap className="w-3.5 h-3.5 text-[#278568] shrink-0" />
                    <span className="text-xs font-medium text-[#24242A] truncate">
                      Alex Mercer (Learner)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#777782] font-mono">Select</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDemoCreds({
                      email: 'samantha.reed@commit.dev',
                      pass: 'Learner456!Pass',
                    })
                  }
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-[#E4E2DE] bg-[#F8F7F4] hover:bg-[#ECEBE7] text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-[#5557C8] shrink-0" />
                    <span className="text-xs font-medium text-[#24242A] truncate">
                      Samantha Reed (Learner)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#777782] font-mono">Select</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDemoCreds({
                      email: 'marcus.vance@commit.dev',
                      pass: 'Mentor789!Pass',
                    })
                  }
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-[#E4E2DE] bg-[#F8F7F4] hover:bg-[#ECEBE7] text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="w-3.5 h-3.5 text-[#5557C8] shrink-0" />
                    <span className="text-xs font-medium text-[#24242A] truncate">
                      Marcus Vance (Mentor)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#777782] font-mono">Select</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
