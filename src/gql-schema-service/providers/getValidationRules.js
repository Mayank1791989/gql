/* @flow */
import { type RulesProviderParams } from './types';
import SchemaValidationContext from '../shared/SchemaValidationContext';
import { type ValidationRules } from 'gql-shared/GQLValidate/types';

export default function getValidationRules(
  params: RulesProviderParams,
): ValidationRules {
  const config = params.context.getConfig();
  return {
    config: config.validate,
    createContext: (ast, typeInfo) => {
      return new SchemaValidationContext(params.context, ast, typeInfo);
    },
  };
}
