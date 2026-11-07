import React from 'react';
import { Link } from 'react-router';
import { RegisterForm } from './RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center text-white font-bold text-lg shadow-2xs">
          C
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-zinc-950">
          Create Learner Account
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Begin tracking your learning milestones and topic prerequisites
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-5 shadow-2xs border border-zinc-200/90 rounded-lg sm:px-8">
          <RegisterForm />

          <div className="mt-5 pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
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
