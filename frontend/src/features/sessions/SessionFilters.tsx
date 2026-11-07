import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useGoals } from '../../hooks/useGoals';
import type { FilterSessionsParams } from '../../services/sessions.service';

interface SessionFiltersProps {
  filters: FilterSessionsParams;
  onChange: (newFilters: FilterSessionsParams) => void;
  onReset: () => void;
}

export const SessionFilters: React.FC<SessionFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const { data: goals = [] } = useGoals();

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const goalId = e.target.value || undefined;
    onChange({
      ...filters,
      goalId,
      topicId: undefined, // Reset topic when goal changes
    });
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      topicId: e.target.value || undefined,
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      startDate: e.target.value || undefined,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      endDate: e.target.value || undefined,
    });
  };

  const selectedGoal = goals.find((g) => g.id === filters.goalId);
  const availableTopics = selectedGoal
    ? selectedGoal.topics || []
    : goals.flatMap((g) => g.topics || []);

  const hasActiveFilters = !!(
    filters.goalId ||
    filters.topicId ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div className="bg-white p-4 rounded-lg border border-zinc-200/90 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Filter Study Sessions</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3 h-3 text-zinc-400" />}
            className="text-xs text-zinc-500 hover:text-zinc-900 h-7 px-2"
          >
            Reset Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Curriculum Goal"
          value={filters.goalId || ''}
          onChange={handleGoalChange}
          className="text-xs py-1"
        >
          <option value="">All Curricula</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </Select>

        <Select
          label="Topic Milestone"
          value={filters.topicId || ''}
          onChange={handleTopicChange}
          disabled={availableTopics.length === 0}
          className="text-xs py-1"
        >
          <option value="">
            {filters.goalId ? 'All Topics in Goal' : 'All Topics'}
          </option>
          {availableTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Select>

        <Input
          label="From Date"
          type="date"
          value={filters.startDate ? filters.startDate.split('T')[0] : ''}
          onChange={handleStartDateChange}
          className="text-xs py-1"
        />

        <Input
          label="To Date"
          type="date"
          value={filters.endDate ? filters.endDate.split('T')[0] : ''}
          onChange={handleEndDateChange}
          className="text-xs py-1"
        />
      </div>
    </div>
  );
};
