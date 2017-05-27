/* @flow */
import { GraphQLError } from 'graphql';
import { type TypeSchemaResolverValidationRule } from '../types';

export default function ProvidedRequiredResolvers(): TypeSchemaResolverValidationRule {
  return {
    type: 'Schema',
    create(context) {
      return {
        ScalarTypeDefinition: node => checkScalar(context, node),
        DirectiveDefinition: node => checkDirective(context, node),
        ObjectTypeDefinition: node => checkMutation(context, node),
        ObjectTypeExtension: node => checkMutation(context, node),
      };
    },
  };

  function checkScalar(context, node) {
    // console.log('checkSacal', node);
    const typeName = node.name.value;
    const resolvers = context.getResolvers().find(typeName, null);
    // console.log(JSON.stringify(resolvers, null, 2));
    if (resolvers.length === 0) {
      context.reportError(new GraphQLError(missingScalarResolver(), node.name));
    }
  }

  function checkDirective(context, node) {
    const typeName = node.name.value;
    const resolvers = context.getResolvers().find(typeName, null);
    if (resolvers.length === 0) {
      context.reportError(
        new GraphQLError(missingDirectiveResolver(), node.name),
      );
    }
  }

  function checkMutation(context, node) {
    const typeName = node.name.value;
    if (typeName !== 'Mutation') {
      return;
    }

    const { fields } = node;
    if (!fields) {
      return;
    }

    fields.forEach(field => {
      const fieldName = field.name.value;
      const resolvers = context.getResolvers().find(typeName, fieldName);
      if (resolvers.length === 0) {
        context.reportError(
          new GraphQLError(missingMutationFieldResolver(), field),
        );
      }
    });
  }
}

function missingScalarResolver() {
  return 'Missing scalar resolver';
}

function missingDirectiveResolver() {
  return 'Missing directive resolver';
}

function missingMutationFieldResolver() {
  return 'Missing field resolver';
}
