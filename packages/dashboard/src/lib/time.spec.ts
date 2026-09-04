import { timeAgo, formatDuration } from './time';

describe('timeAgo', () => {
  it('renders recent timestamps in seconds and minutes', () => {
    expect(timeAgo(Date.now() - 30_000)).toBe('30s ago');
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe('5m ago');
  });

  it('rolls up into hours and days', () => {
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe('3h ago');
    expect(timeAgo(Date.now() - 4 * 86_400_000)).toBe('4d ago');
  });

  it('handles an invalid date without throwing', () => {
    expect(timeAgo('not-a-date')).toBe('—');
  });
});

describe('formatDuration', () => {
  it('uses ms below a second and seconds above it', () => {
    expect(formatDuration(0.4)).toBe('<1ms');
    expect(formatDuration(302)).toBe('302ms');
    expect(formatDuration(1500)).toBe('1.50s');
  });
});
