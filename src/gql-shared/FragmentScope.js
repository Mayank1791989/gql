/* @flow */
import uuidv4 from 'uuid/v4';

export opaque type FragmentScope: string = string;

export const FRAGMENT_SCOPE = Object.freeze({
  document: 'document',
});

export function checkFragmentScopesGlobal(
  scopes: Array<FragmentScope>,
): boolean {
  return Boolean(
    scopes.find(scope => scope.toLowerCase().startsWith('global')),
  );
}

export function checkFragmentScopesDocument(
  scopes: Array<FragmentScope>,
): boolean {
  return Boolean(
    scopes.find(scope => scope.toLowerCase().startsWith('document')),
  );
}

export function validateFragmentScopes(scopes: Array<FragmentScope>): ?Error {
  // console.log('validate scopes @TODO', scopes);
  // scopes.forEach((scope) => {
  // });
  // TODOu
}

export function normalizeFragmentScopes(
  scopes: ?Array<FragmentScope>,
): Array<FragmentScope> {
  if (!scopes) {
    return [FRAGMENT_SCOPE.document];
  }
  return scopes.map(scope => {
    if (!checkFragmentScopesGlobal([scope])) {
      return scope;
    }
    return addUniqueIdIfMissing(scope);
  });
}

function addUniqueIdIfMissing(scope) {
  const [, id] = scope.split(':');
  if (id) {
    return scope;
  }
  return `${scope}:${uuidv4()}`;
}
