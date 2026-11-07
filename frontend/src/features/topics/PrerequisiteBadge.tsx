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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border select-none ${
        isCompleted
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
      }`}
    >
      {isCompleted ? (
        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
      ) : (
        <Lock className="w-3 h-3 text-zinc-400 shrink-0" />
      )}
      <span className="truncate max-w-[180px]">{title}</span>
    </span>
  );
};
