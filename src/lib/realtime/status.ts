// Polling fallback (RW4.1): queries poll every 15 s only while the realtime
// channel is not connected. Module state, read by the QueryClient defaults.

export const POLL_MS = 15_000;

let live = false;

/** Returns true when the value changed. */
export function setRealtimeLive(value: boolean): boolean {
  if (live === value) return false;
  live = value;
  return true;
}

export function pollInterval(): number | false {
  return live ? false : POLL_MS;
}
