import React from 'react';
import { GraduationCap, Shield } from 'lucide-react';

export interface RoleBadgeProps {
  role?: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  const isMentor = role === 'MENTOR';

  if (isMentor) {
    return (
      <span
        className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-semibold tracking-tight bg-[#EAF5F0] text-[#1E6B53] border border-[#278568]/25 shadow-2xs select-none ${className}`}
        aria-label="Role: Mentor"
      >
        <Shield className="w-2.5 h-2.5 text-[#278568] shrink-0 pointer-events-none" aria-hidden="true" />
        <span className="pointer-events-none">Mentor</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-semibold tracking-tight bg-[#EEEEFC] text-[#4446B4] border border-[#5557C8]/25 shadow-2xs select-none ${className}`}
      aria-label="Role: Learner"
    >
      <GraduationCap className="w-2.5 h-2.5 text-[#5557C8] shrink-0 pointer-events-none" aria-hidden="true" />
      <span className="pointer-events-none">Learner</span>
    </span>
  );
};
