import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
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
      topicId: undefined, // Reset dependent topic filter
    });
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      topicId: e.target.value || undefined,
    });
  };

  const handleStartDateChange = (date: string) => {
    onChange({
      ...filters,
      startDate: date || undefined,
    });
  };

  const handleEndDateChange = (date: string) => {
    onChange({
      ...filters,
      endDate: date || undefined,
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
    <div className="bg-white p-4 rounded-xl border border-[#E4E2DE] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#24242A] uppercase tracking-wider select-none">
          <Filter className="w-3.5 h-3.5 text-[#5557C8]" />
          <span>Filter Study Sessions</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3 h-3 text-[#777782]" />}
            className="text-xs text-[#777782] hover:text-[#24242A]"
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

        <DatePicker
          label="From Date"
          value={filters.startDate ? filters.startDate.split('T')[0] : ''}
          onChange={handleStartDateChange}
        />

        <DatePicker
          label="To Date"
          value={filters.endDate ? filters.endDate.split('T')[0] : ''}
          onChange={handleEndDateChange}
        />
      </div>
    </div>
  );
};
