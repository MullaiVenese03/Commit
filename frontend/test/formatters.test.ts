import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  formatPercentage,
  getErrorMessage,
} from '../src/utils/formatters.ts';

describe('Formatters utility tests', () => {
  it('formats minutes into human readable hours and minutes', () => {
    assert.strictEqual(formatMinutes(0), '0m');
    assert.strictEqual(formatMinutes(45), '45m');
    assert.strictEqual(formatMinutes(60), '1h');
    assert.strictEqual(formatMinutes(90), '1h 30m');
    assert.strictEqual(formatMinutes(125), '2h 5m');
    assert.strictEqual(formatMinutes(-10), '0m');
  });

  it('formats percentages correctly bounded between 0 and 100', () => {
    assert.strictEqual(formatPercentage(0), '0%');
    assert.strictEqual(formatPercentage(45.6), '46%');
    assert.strictEqual(formatPercentage(100), '100%');
    assert.strictEqual(formatPercentage(150), '100%');
    assert.strictEqual(formatPercentage(-20), '0%');
  });

  it('formats dates consistently', () => {
    assert.strictEqual(formatDate(null), '-');
    assert.strictEqual(formatDate('invalid-date'), '-');
    const validDate = '2026-10-15T12:00:00.000Z';
    const result = formatDate(validDate);
    assert.ok(result.includes('2026') || result.includes('Oct'));
  });

  it('formats date and time', () => {
    assert.strictEqual(formatDateTime(null), '-');
    assert.strictEqual(formatDateTime('invalid-date'), '-');
    const validDate = '2026-10-15T14:30:00.000Z';
    const result = formatDateTime(validDate);
    assert.ok(result.length > 5);
  });

  it('extracts error messages from various error types', () => {
    assert.strictEqual(getErrorMessage(new Error('Sample error')), 'Sample error');
    assert.strictEqual(getErrorMessage('String error'), 'An unexpected error occurred.');
  });
});
