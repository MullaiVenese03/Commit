import React from 'react';
import { Check, Lock } from 'lucide-react';

interface PrerequisiteBadgeProps {
  title: string;
  isCompleted?: boolean;
}

export const PrerequisiteBadge: React.FC<PrerequisiteBadgeProps> = ({
  title,
  isCompleted = false,
}) => {
  return (
    <span
      title={`Prerequisite: ${title} (${isCompleted ? 'Satisfied' : 'Pending'})`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border select-none transition-colors ${
        isCompleted
          ? 'bg-[#278568]/12 text-[#278568] border-[#278568]/25'
          : 'bg-[#F8F7F4] text-[#777782] border-[#E4E2DE]'
      }`}
    >
      {isCompleted ? (
        <Check className="w-3 h-3 text-[#278568] shrink-0" />
      ) : (
        <Lock className="w-3 h-3 text-[#777782] shrink-0" />
      )}
      <span className="truncate max-w-[180px]">{title}</span>
    </span>
  );
};
