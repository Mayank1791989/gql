/* @flow */
import { type TokenState } from '../types';

function printTokenState(state: ?TokenState): string {
  if (!state) {
    return '';
  }

  const { kind, step, prevState } = state;
  const prevStateStr = printTokenState(prevState);

  return `{ kind: ${String(kind)}, step: ${step} } ${prevStateStr}`;
}

export default printTokenState;
