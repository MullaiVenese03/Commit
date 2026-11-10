import React, { useState } from 'react';
import { Clock, Target } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useUpdateWeeklyTarget } from '../../hooks/useProgress';
import {
  formatHoursAndMinutes,
  getErrorMessage,
  getLocalTodayDate,
} from '../../utils/formatters';

export interface EditWeeklyTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargetMinutes: number;
}

const PRESETS = [
  { label: '5 hours', minutes: 300 },
  { label: '10 hours (Default)', minutes: 600 },
  { label: '15 hours', minutes: 900 },
  { label: '20 hours', minutes: 1200 },
];

export const EditWeeklyTargetModal: React.FC<EditWeeklyTargetModalProps> = ({
  isOpen,
  onClose,
  currentTargetMinutes,
}) => {
  const updateMutation = useUpdateWeeklyTarget();

  const [inputMode, setInputMode] = useState<'hoursMinutes' | 'totalMinutes'>('hoursMinutes');
  const [hours, setHours] = useState<number>(() => Math.floor(currentTargetMinutes / 60));
  const [minutes, setMinutes] = useState<number>(() => currentTargetMinutes % 60);
  const [totalMinutesInput, setTotalMinutesInput] = useState<number>(currentTargetMinutes);
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const calculateTarget = (): number => {
    if (inputMode === 'totalMinutes') {
      return totalMinutesInput;
    }
    return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  };

  const validateTarget = (target: number): string | null => {
    if (isNaN(target) || target === null || target === undefined) {
      return 'Please enter a valid study duration.';
    }
    if (!Number.isInteger(target)) {
      return 'Target minutes must be a whole number.';
    }
    if (target < 60) {
      return 'Weekly target must be at least 1 hour (60 minutes).';
    }
    if (target > 4200) {
      return 'Weekly target cannot exceed 70 hours (4,200 minutes).';
    }
    return null;
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.trim() === '') {
      setHours(NaN);
      setClientError('Please enter a valid study duration.');
      return;
    }
    const val = Number(raw);
    setHours(val);
    const newTotal = val * 60 + (isNaN(minutes) ? 0 : minutes);
    setTotalMinutesInput(newTotal);
    setClientError(validateTarget(newTotal));
    setServerError(null);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.trim() === '') {
      setMinutes(NaN);
      setClientError('Please enter a valid study duration.');
      return;
    }
    const val = Number(raw);
    setMinutes(val);
    const newTotal = (isNaN(hours) ? 0 : hours) * 60 + val;
    setTotalMinutesInput(newTotal);
    setClientError(validateTarget(newTotal));
    setServerError(null);
  };

  const handleTotalMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.trim() === '') {
      setTotalMinutesInput(NaN);
      setClientError('Please enter a valid study duration.');
      return;
    }
    const val = Number(raw);
    setTotalMinutesInput(val);
    if (!isNaN(val)) {
      setHours(Math.floor(val / 60));
      setMinutes(Math.floor(val % 60));
    }
    setClientError(validateTarget(val));
    setServerError(null);
  };

  const handlePresetSelect = (presetMinutes: number) => {
    setTotalMinutesInput(presetMinutes);
    setHours(Math.floor(presetMinutes / 60));
    setMinutes(presetMinutes % 60);
    setClientError(validateTarget(presetMinutes));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMinutes = calculateTarget();
    const error = validateTarget(finalMinutes);

    if (error) {
      setClientError(error);
      return;
    }

    if (updateMutation.isPending) return;

    setServerError(null);

    try {
      await updateMutation.mutateAsync({
        payload: { targetMinutes: finalMinutes },
        today: getLocalTodayDate(),
      });
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const currentCalculated = calculateTarget();

  return (
    <Modal
      isOpen={isOpen}
      onClose={updateMutation.isPending ? () => {} : onClose}
      title="Edit Weekly Study Target"
      description="Set your personal weekly study commitment (Monday – Sunday)."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="edit-target-form">
        {serverError && (
          <Alert variant="error" title="Update Failed">
            {serverError}
          </Alert>
        )}

        {/* Current target info panel */}
        <div className="p-3 bg-[#F8F7F4] rounded-lg border border-[#E4E2DE] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#777782]">
            <Target className="w-4 h-4 text-[#5557C8]" />
            <span>Current target:</span>
          </div>
          <span className="font-bold text-[#24242A] tabular-nums">
            {formatHoursAndMinutes(currentTargetMinutes)} ({currentTargetMinutes} mins)
          </span>
        </div>

        {/* Mode selector: Hours & Minutes vs Total Minutes */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-[#24242A]">Input format:</span>
          <div className="inline-flex p-0.5 bg-[#ECEBE7] rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setInputMode('hoursMinutes')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                inputMode === 'hoursMinutes'
                  ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                  : 'text-[#777782] hover:text-[#24242A]'
              }`}
            >
              Hours & Minutes
            </button>
            <button
              type="button"
              onClick={() => setInputMode('totalMinutes')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                inputMode === 'totalMinutes'
                  ? 'bg-white text-[#24242A] font-semibold shadow-xs'
                  : 'text-[#777782] hover:text-[#24242A]'
              }`}
            >
              Total Minutes
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-[11px] font-semibold text-[#777782] uppercase tracking-wider mb-1.5">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((p) => {
              const isSelected = currentCalculated === p.minutes;
              return (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => handlePresetSelect(p.minutes)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEEEFC] border-[#5557C8] text-[#5557C8] font-semibold'
                      : 'bg-white border-[#E4E2DE] text-[#24242A] hover:bg-[#F8F7F4]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input fields based on mode */}
        {inputMode === 'hoursMinutes' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hours"
              type="number"
              min={0}
              max={70}
              value={isNaN(hours) ? '' : hours}
              onChange={handleHoursChange}
              disabled={updateMutation.isPending}
              required
            />
            <Input
              label="Minutes"
              type="number"
              min={0}
              max={59}
              step={5}
              value={isNaN(minutes) ? '' : minutes}
              onChange={handleMinutesChange}
              disabled={updateMutation.isPending}
              required
            />
          </div>
        ) : (
          <Input
            label="Total Weekly Target Minutes"
            type="number"
            min={60}
            max={4200}
            step={15}
            value={isNaN(totalMinutesInput) ? '' : totalMinutesInput}
            onChange={handleTotalMinutesChange}
            helperText="Enter a value between 60 (1 hour) and 4,200 (70 hours)"
            disabled={updateMutation.isPending}
            required
          />
        )}

        {/* Validation error display */}
        {clientError && (
          <p className="text-xs text-[#C45C5C] font-medium" role="alert">
            {clientError}
          </p>
        )}

        {/* Live calculated target summary */}
        <div className="flex items-center justify-between p-3 bg-[#EEEEFC]/50 rounded-lg border border-[#5557C8]/20 text-xs">
          <span className="text-[#5557C8] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            New Commitment:
          </span>
          <span className="font-bold text-[#24242A] tabular-nums">
            {formatHoursAndMinutes(currentCalculated)} ({currentCalculated} mins)
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E4E2DE]">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending || !!clientError}
          >
            Save Target
          </Button>
        </div>
      </form>
    </Modal>
  );
};
