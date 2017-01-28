/* @flow */
import { type TokenState } from './types';

function printTokenState(state: TokenState): string {
  if (!state) { return ''; }
  return `{ kind: ${state.kind}, step: ${state.step} } ${printTokenState(state.prevState)}`;
}

export default printTokenState;
