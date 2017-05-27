/* @flow */
import { type QueryPreset } from 'gql-config/types';
import apolloGraphQLPreset from 'gql-query-preset-apollo-graphql';
import invariant from 'invariant';

export type Options = {|
  linkState: boolean,
|};

export default function queryPresetApollo(options: Options): QueryPreset {
  const basePreset = apolloGraphQLPreset(options);
  invariant(basePreset.validate, 'Expecting validate to be present');

  return {
    ...basePreset,

    parser: [
      'gql-query-parser-embedded-queries',
      {
        start: 'gql`',
        end: '`',
      },
    ],

    parserOptions: {
      allowDocumentInterpolation: true,
    },

    validate: {
      ...basePreset.validate,
      config: {
        ...basePreset.validate.config,
        // [no need: js imports will take care of it]
        NoUnusedFragments: 'off',
      },
    },
  };
}
