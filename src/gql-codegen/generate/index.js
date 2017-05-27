/* @flow */
import GQLWatcher from 'gql-watcher';
import invariant from 'invariant';

import GQLConfig from 'gql-config';
import GQLSchemaService from 'gql-schema-service';

import generateFlowTypes from './generateFlowTypes';
import generateSchemaJSON from './generateSchemaJSON';
import generateSchemaSDL, {
  type Options as SchemaSDLOptions,
} from './generateSchemaSDL';

import fs from 'fs';

type Target =
  | {|
      type: 'schemaFlow',
      outputPath?: string, // if true will write to disk also
    |}
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
};

async function generateFile(schema, target, graphQLOptions) {
  let content = '';
  switch (target.type) {
    case 'schemaFlow':
      content = await generateFlowTypes(schema);
      break;
    case 'schemaJSON':
      content = await generateSchemaJSON(schema);
      break;
    case 'schemaSDL':
      content = await generateSchemaSDL(schema, graphQLOptions);
      break;
    default:
      invariant(
        false,
        `expecting type to be oneof ['schemaFlow', 'schemaJSON', 'schemaGQL'] but got '${
          target.type
        }'.`,
      );
  }
  if (target.outputPath) {
    fs.writeFileSync(target.outputPath, content);
  }
  return content;
}

async function generate(params: Params): Promise<any> {
  const config = new GQLConfig(params.configOptions);
  const schemaService = new GQLSchemaService({
    config,
    watcher: new GQLWatcher({ watch: false }),
  });

  schemaService.onError(err => {
    throw err;
  });

  // start service
  await schemaService.start();

  const schema = schemaService.getGraphQLSchema();
  const targetContent = await Promise.all(
    params.targets.map(target =>
      generateFile(schema, target, config.getSchemaConfig().graphQLOptions),
    ),
  );

  return targetContent;
}

export default generate;
