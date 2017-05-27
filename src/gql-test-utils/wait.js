/* @flow */
export async function waitFor(
  condition: () => boolean,
  timeout?: number = 5000,
  interval?: number = 100,
): Promise<void> {
  // start timeout
  const id = setTimeout(() => {
    throw new Error('waitFor fn timed out');
  }, timeout);

  // wait for condition
  while (!condition()) {
    // eslint-disable-next-line no-await-in-loop
    await wait(interval);
  }

  // clear
  clearTimeout(id);
}

export const conditions = {
  mockFnCall: (mockFn: JestMockFn<any, any>) => {
    const currCalls = mockFn.mock.calls.length;
    return () => {
      return mockFn.mock.calls.length > currCalls;
    };
  },
};

export function wait(timeInMsec: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeInMsec);
  });
}
