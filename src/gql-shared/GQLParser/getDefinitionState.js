/* @flow */
import forEachState from './forEachState';

export default function getDefinitionState(tokenState: State): ?State {
  let definitionState = null;

  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
      case 'Mutation':
      case 'Subscription':
      case 'FragmentDefinition':
        definitionState = state;
        break;
      default:
        break;
    }
  });

  return definitionState;
}
