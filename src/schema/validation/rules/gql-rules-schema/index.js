/* @flow */
import { NoUnusedTypeDefinition } from './NoUnusedTypeDefinition';

export default {
  rules: [
    NoUnusedTypeDefinition,
  ],
  config: {
    NoUnusedTypeDefinition: 'warn',
  },
};
