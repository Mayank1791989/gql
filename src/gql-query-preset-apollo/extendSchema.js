/* @flow */
import { dedent } from 'dentist';

type Options = {
  linkState: boolean,
};

const connectionDirective = dedent(`
  # direct Apollo Client to use a stable store key for paginated queries
  directive @connection(
    # store key for paginated queries
    key: String!,

    # list of query arguments to include in store key
    filter: [String]
  ) on FIELD
`);

const linkStateSchema = dedent(`
  # direct Apollo Client to resolve data from the Apollo cache instead of making a network request
  directive @client on FIELD
`);

export default function extendSchema(options: Options): () => string {
  return (): string => {
    return [connectionDirective, options.linkState ? linkStateSchema : null]
      .filter(Boolean)
      .join('\n\n');
  };
}
