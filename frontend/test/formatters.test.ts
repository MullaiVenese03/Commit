import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  formatPercentage,
  getErrorMessage,
} from '../src/utils/formatters.ts';

describe('Formatters utility tests', () => {
  it('formats minutes into human readable hours and minutes', () => {
    expect(formatMinutes(0)).toBe('0m');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(125)).toBe('2h 5m');
    expect(formatMinutes(-10)).toBe('0m');
  });

  it('formats percentages correctly bounded between 0 and 100', () => {
    expect(formatPercentage(0)).toBe('0%');
    expect(formatPercentage(45.6)).toBe('46%');
    expect(formatPercentage(100)).toBe('100%');
    expect(formatPercentage(150)).toBe('100%');
    expect(formatPercentage(-20)).toBe('0%');
  });

  it('formats dates consistently', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('invalid-date')).toBe('-');
    const validDate = '2026-10-15T12:00:00.000Z';
    const result = formatDate(validDate);
    expect(result.includes('2026') || result.includes('Oct')).toBe(true);
  });

  it('formats date and time', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('invalid-date')).toBe('-');
    const validDate = '2026-10-15T14:30:00.000Z';
    const result = formatDateTime(validDate);
    expect(result.length).toBeGreaterThan(5);
  });

  it('extracts error messages from various error types', () => {
    expect(getErrorMessage(new Error('Sample error'))).toBe('Sample error');
    expect(getErrorMessage('String error')).toBe('An unexpected error occurred.');
  });
});
