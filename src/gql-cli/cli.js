#! /usr/bin/env node
/* @flow */
import yargs from 'yargs';
import GQLService from 'gql-service';
import { prettyPrintGQLErrors } from 'gql-shared/GQLError';

// eslint-disable-next-line playlyfe/flowtype-no-unused-expressions
yargs
  .usage('GQL Command-Line Interface.\nUsage: $0 [command]')
  .help('h')
  .alias('h', 'help')
  .command({
    command: 'check',
    desc: 'Check all files for errors.',
    builder: cmdYargs => {
      cmdYargs
        .option('ignore-query', {
          default: false,
          desc: 'Ignore errors from query',
        })
        .option('ignore-schema', {
          default: false,
          desc: 'Ingore errors from schema',
        });
    },
    handler: () => {
      try {
        const gqlService = new GQLService({ configDir: process.cwd() });
        gqlService.start().then(
          () => {
            const errors = gqlService.status();
            process.stdout.write(prettyPrintGQLErrors(errors));
            gqlService.stop();
            process.exit(errors.length > 0 ? 1 : 0);
          },
          err => {
            process.stderr.write(err);
            process.exit(1);
          },
        );
      } catch (err) {
        process.stdout.write(err.message);
        process.exit(1);
      }
    },
  }).argv;
