/* @flow */
import GQLWatcher from 'gql-watcher';
import invariant from 'invariant';

import GQLConfig from 'gql-config';
import GQLSchemaService from 'gql-schema-service';

import generateSchemaJSON from './generateSchemaJSON';
import generateSchemaSDL, {
  type Options as SchemaSDLOptions,
} from './generateSchemaSDL';

import fs from 'fs';

type Target =
  | {|
      type: 'schemaJSON',
      outputPath?: string, // if true will write to disk also
    |}
  | {|
      type: 'schemaSDL',
      outputPath?: string, // if true will write to disk also
      options?: SchemaSDLOptions,
    |};

type Params = {
  configOptions: {| configDir: string |},
  targets: Array<Target>,
  emit?: boolean, // default true
  watch?: boolean,
};

export default function generate(
  params: Params,
  clb: (err: Error, content: $FixMe) => void,
) {
  const config = new GQLConfig(params.configOptions);
  const schemaService = new GQLSchemaService({
    config,
    watcher: new GQLWatcher({ watch: params.watch || false }),
  });

  schemaService.onChange(() => {
    generateTargetContent(
      schemaService.getGraphQLSchema(),
      params.targets,
      config.getSchemaConfig().graphQLOptions,
    ).then(targetContent => {
      clb(null, targetContent);
    });
  });

  schemaService.onError(err => {
    clb(err, null);
  });

  schemaService.start().catch(err => {
    clb(err, null);
  });
}

function generateTargetContent(schema, targets, graphQLOptions) {
  return Promise.all(
    targets.map(target => generateFile(schema, target, graphQLOptions)),
  );
}

async function generateFile(schema, target, graphQLOptions) {
  let content = '';
  switch (target.type) {
    case 'schemaJSON':
      content = await generateSchemaJSON(schema);
      break;
    case 'schemaSDL': {
      content = await generateSchemaSDL(
        schema,
        getSchemaSDLOptions(graphQLOptions),
      );
      break;
    }
    default:
      invariant(
        false,
        `expecting type to be oneof ['schemaJSON', 'schemaGQL'] but got '${
          target.type
        }'.`,
      );
  }
  if (target.outputPath) {
    fs.writeFileSync(target.outputPath, content);
  }
  return content;
}

function getSchemaSDLOptions(graphQLOptions): SchemaSDLOptions {
  if (graphQLOptions && 'commentDescriptions' in graphQLOptions) {
    return { commentDescriptions: graphQLOptions.commentDescriptions };
  }
  return Object.freeze({});
}
