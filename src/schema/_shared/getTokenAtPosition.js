/* @flow */
import SchemaParser from './SchemaParser';
import _getTokenAtPosition from '../../shared/getTokenAtPosition';
import { type Position } from '../../shared/types';

export const getTokenAtPosition = (sourceText: string, position: Position) => {
  const parser = new SchemaParser();
  return _getTokenAtPosition(parser, sourceText, position);
};
export default getTokenAtPosition;
