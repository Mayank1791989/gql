/* @flow */
import { GQLService, type GQLServiceOptions } from '../GQLService';
import watch from '../shared/watch';
import fs from 'fs';

jest.mock('fs');
jest.mock('../shared/watch');

export default function runGQLService(
  files: { [key: string]: string },
  config: GQLServiceOptions,
) {
  // $FlowDisableNextLine
  fs.__setMockFiles(files);
  const gql = new GQLService(config);
  setImmediate(() => {
    // $FlowDisableNextLine
    watch.__triggerChange();
  });
  return gql;
}
