/* @flow */
import { GraphQLSchema } from 'graphql/type';
// TEMP
import CodeGenerator from 'apollo-codegen/lib/utilities/CodeGenerator';
import { typeDeclarationForGraphQLType } from 'apollo-codegen/lib/flow/codeGeneration';

export function generateFlowTypes(schema: GraphQLSchema): string {
  const generator = new CodeGenerator({});

  generator.printOnNewline('/* @flow */');
  generator.printOnNewline('//  This file was automatically generated and should not be edited.');

  const typeMap = schema.getTypeMap();
  Object.keys(typeMap).forEach((name) => {
    const type = typeMap[name];
    typeDeclarationForGraphQLType(generator, type);
  });

  return generator.output;
}

export default generateFlowTypes;
