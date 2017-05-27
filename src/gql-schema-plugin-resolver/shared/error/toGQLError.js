/* @flow */
import GQLResolverError from './GQLResolverError';
import { type GQLErrorSeverity, type GQLError } from 'gql-shared/GQLError';

export default function toGQLError(
  error: GQLResolverError,
  severity: GQLErrorSeverity,
): GQLError {
  return {
    message: error.message,
    severity,
    locations: error.locations,
  };
}
