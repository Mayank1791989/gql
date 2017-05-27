/* @flow */
export default function extendSchema(): string {
  return `
    directive @relay(
      # Marks this fragment spread as being deferrable such that it loads after other portions of the view.
      deferrable: Boolean,

      # Marks a connection field as containing nodes without 'id' fields. This is used to silence the warning when diffing connections.
      isConnectionWithoutNodeID: Boolean,

      # Marks a fragment as intended for pattern matching (as opposed to fetching). Used in Classic only.
      pattern: Boolean,

      # Marks a fragment as being backed by a GraphQLList.
      plural: Boolean,

      # Marks a fragment spread which should be unmasked if provided false
      mask: Boolean = true,

      # Selectively pass variables down into a fragment. Only used in Classic.
      variables: [String!],
    ) on FRAGMENT_DEFINITION | FRAGMENT_SPREAD | INLINE_FRAGMENT | FIELD

    directive @connection(
      # String that serves as a unique identifier for the connection under the parent field type. A good practice could be <ComponentName>_<fieldName | fieldAlias>
      key: String!,

      # Array of strings that belong to the set of argument variables defined for the connection field (e.g. orderBy, searchTerm, etc). The values for the variables specified in this array will be used alongside the user-supplied key to uniquely identify a connection. If filters is not provided, by default Relay will use the set of all of the arguments the connection field takes, excluding pagination specific arguments (i.e. first/last, after/before)
      filters: [String]
    ) on FIELD
  `;
}
