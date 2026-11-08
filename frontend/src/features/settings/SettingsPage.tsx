import React from 'react';
import { Sliders } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { SystemSettingsForm } from './SystemSettingsForm';

export const SettingsPage: React.FC = () => {
  const { isMentor } = useAuth();

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#E4E2DE]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5557C8] flex items-center gap-1 select-none">
            <Sliders className="w-3 h-3" />
            <span>Policy Governance</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#24242A] mt-0.5">
          System Settings
        </h1>
        <p className="text-xs text-[#777782] mt-1 max-w-2xl leading-normal">
          {isMentor
            ? 'Configure system-wide constraints for study session duration bounds and topic prerequisite thresholds.'
            : 'View system-wide study policies and prerequisite parameters configured by mentors.'}
        </p>
      </div>

      <Card
        title="Study Policy & Curriculum Parameters"
        subtitle={
          isMentor
            ? 'Adjust thresholds below. Validation ensures minimum session minutes remain strictly below maximum minutes.'
            : 'These parameters are enforced by the backend on all study logs and milestone relationships.'
        }
      >
        <SystemSettingsForm />
      </Card>
    </div>
  );
};
