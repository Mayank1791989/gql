/* @flow */
import { type RulesProviderParams } from './types';
import QueryValidationContext, {
  type QueryValidationRule,
} from '../shared/QueryValidationContext';
import { type ValidationRules } from 'gql-shared/GQLValidate/types';

export default function getValidationRules(
  params: RulesProviderParams,
): ValidationRules<QueryValidationRule> {
  const config = params.context.getConfig();
  return {
    config: config.validate,
    createContext: (ast, typeInfo) => {
      const ValidationContext =
        config.validate.ValidationContext || QueryValidationContext;
      return new ValidationContext(
        params.context,
        params.queryDocument,
        typeInfo,
      );
    },
  };
}
