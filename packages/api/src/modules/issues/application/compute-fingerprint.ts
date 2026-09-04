import { createHash } from 'node:crypto';

/**
 * Groups events into the same issue when they share an exception type and
 * the top stack frame (the same rough shape Sentry starts from). Falls back
 * to the message when there's no stack trace (e.g. captureMessage calls).
 */
export function computeFingerprint(input: {
  exceptionType: string;
  stack: string;
  message: string;
}): string {
  const topFrame = input.stack
    .split('\n')
    .slice(1, 2)
    .map((line) => line.trim())
    .join('');

  const basis = topFrame ? `${input.exceptionType}:${topFrame}` : `${input.exceptionType}:${input.message}`;
  return createHash('sha1').update(basis).digest('hex');
}
