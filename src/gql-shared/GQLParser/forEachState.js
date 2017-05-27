/* @flow */
import { type TokenState } from './types';

export default function forEachState(
  stack: TokenState,
  fn: (state: TokenState) => void,
): void {
  const reverseStateStack = [];
  let state = stack;
  while (state && state.kind) {
    reverseStateStack.push(state);
    state = state.prevState;
  }
  for (let i = reverseStateStack.length - 1; i >= 0; i -= 1) {
    fn(reverseStateStack[i]);
  }
}
