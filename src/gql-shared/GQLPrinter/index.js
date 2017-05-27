/* @flow */
import {
  type GraphQLNamedType,
  type GraphQLField,
  type GraphQLArgument,
  type GraphQLInputField,
  type GraphQLDirective,
  type GraphQLEnumValue,
  type ASTNode,
} from 'graphql';

import { dedent } from 'dentist';

import {
  printType,
  printDirective,
  printDescription,
  printArgs,
  printFields,
} from './schemaPrinter';

import _memoize from 'gql-shared/memoize';

type Options = {|
  commentDescriptions?: boolean,
|};

export default class GQLPrinter {
  _options: Options;

  constructor(options: Options) {
    this._options = options;
  }

  printType = _memoize(
    (typeDefn: GraphQLNamedType): string => {
      if (typeDefn.astNode) {
        return printASTNode(
          typeDefn.astNode,
          typeDefn.description,
          this._options,
        );
      }
      return trimRightSpaces(printType(typeDefn, this._options));
    },
  );

  printField = _memoize(
    (fieldDefn: GraphQLField<any, any>): string => {
      if (fieldDefn.astNode) {
        return printASTNode(
          fieldDefn.astNode,
          fieldDefn.description,
          this._options,
        );
      }
      return trimRightSpaces(printField(fieldDefn, this._options));
    },
  );

  printInputField = _memoize(
    (fieldDefn: GraphQLInputField): string => {
      if (fieldDefn.astNode) {
        return printASTNode(
          fieldDefn.astNode,
          fieldDefn.description,
          this._options,
        );
      }
      return '';
    },
  );

  printArg = _memoize(
    (argDefn: GraphQLArgument): string => {
      if (argDefn.astNode) {
        return printASTNode(
          argDefn.astNode,
          argDefn.description,
          this._options,
        );
      }

      return dedent(printArg(argDefn, this._options));
    },
  );

  printDirective = _memoize(
    (directive: GraphQLDirective): string => {
      if (directive.astNode) {
        return printASTNode(
          directive.astNode,
          directive.description,
          this._options,
        );
      }

      // NOTE: for core directives astNode not present have to print type
      return trimRightSpaces(printDirective(directive, this._options));
    },
  );

  printEnumValue = _memoize(
    (value: GraphQLEnumValue): string => {
      if (value.astNode) {
        return printASTNode(value.astNode, value.description, this._options);
      }
      return '';
    },
  );

  printASTNode = (astNode: ASTNode): string => {
    return dedent(printASTNode(astNode, null, this._options));
  };
}

function printField(fieldDefn, options) {
  const type = {
    getFields() {
      return [fieldDefn];
    },
  };
  return printFields(options, type).trim();
}

function printArg(argDefn, options) {
  const argsStr = printArgs(options, [argDefn]).trim();
  return (
    argsStr
      // NOTE: first and last char is bracket in argsStr so removing
      .substr(1, argsStr.length - 2)
      .trim()
      .split('\n')
      .map(line => line.trim())
      .join('\n')
  );
}

function trimRightSpaces(str: string): string {
  return str
    .split('\n')
    .map(line => line.trimRight())
    .join('\n');
}

// exporting for tests
export function printASTNode(
  astNode: ASTNode,
  description: ?string,
  options: Options,
): string {
  let defnStr = '';
  if (astNode.loc && astNode.loc.source && astNode.loc.source.body) {
    defnStr = astNode.loc.source.body.substr(
      astNode.loc.start,
      astNode.loc.end - astNode.loc.start,
    );
  }

  if (astNode.description || !options.commentDescriptions) {
    return defnStr;
  }

  return `${printDescription(options, { description })}${defnStr}`;
}
