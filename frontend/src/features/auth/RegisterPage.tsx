import React from 'react';
import { Link } from 'react-router';
import { CommitLogo } from '../../components/ui/CommitLogo';
import { RegisterForm } from './RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F4F3F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#24242A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <CommitLogo size="lg" className="mx-auto" />
        <h2 className="mt-3.5 text-2xl font-bold tracking-tight text-[#24242A]">
          Create Learner Account
        </h2>
        <p className="mt-1 text-xs text-[#777782] max-w-sm mx-auto leading-normal">
          Begin tracking your learning milestones and topic prerequisites with Commit
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-5 shadow-xs border border-[#E4E2DE] rounded-xl sm:px-8">
          <RegisterForm />

          <div className="mt-5 pt-4 border-t border-[#E4E2DE] text-center">
            <p className="text-xs text-[#777782]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#5557C8] hover:text-[#4446B4] hover:underline"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
