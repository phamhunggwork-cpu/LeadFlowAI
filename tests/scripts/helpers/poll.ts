export interface PollResult<T> {
  done: boolean;
  value?: T;
  observed?: unknown;
}

export async function pollUntil<T>(
  label: string,
  probe: () => Promise<PollResult<T>>,
  options: { timeoutMs: number; intervalMs: number },
): Promise<T> {
  const deadline = Date.now() + options.timeoutMs;
  let lastObserved: unknown = null;

  while (Date.now() < deadline) {
    const res = await probe();
    if (res.done && res.value !== undefined) {
      return res.value;
    }
    lastObserved = res.observed ?? null;
    await new Promise((resolve) => setTimeout(resolve, options.intervalMs));
  }

  throw new Error(
    `[pollUntil] Timed out after ${options.timeoutMs}ms waiting for "${label}". Last observed DB state: ${JSON.stringify(lastObserved)}`,
  );
}
