/* @flow */
export function getDefinitionState(tokenState: State): ?State {
  forEachState(tokenState, state => {
    switch (state.kind) {
      case 'Query':
      case 'ShortQuery':
      case 'Mutation':
      case 'Subscription':
      case 'FragmentDefinition':
        return state;
      default:
        return null;
    }
  });
}
