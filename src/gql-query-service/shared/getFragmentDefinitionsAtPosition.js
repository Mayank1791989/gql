/* @flow */
import QueryContext from './QueryContext';
import { checkFragmentScopesDocument } from 'gql-shared/FragmentScope';
import { Source, type FragmentDefinitionNode } from 'graphql';
import runParser, { BREAK } from 'gql-shared/runParser';
import toOffset from 'gql-shared/toOffset';
import { type GQLPosition } from 'gql-shared/types';
import { getLocation } from 'graphql';

export default function getFragmentDefinitionsAtPosition(
  context: QueryContext,
  source: Source,
  position: GQLPosition,
  filterByName?: string,
): $ReadOnlyArray<FragmentDefinitionNode> {
  const allFragments = filterByName
    ? context.getFragments(filterByName)
    : context.getAllFragments();

  // console.log(allFragments);
  // filter out fragments of this file ... this file fragments will be extracted below from source
  // NOTE: its possible source passed is not saved file so its better to extract from passed
  // source
  const fragmentsFromOtherFiles = allFragments
    .filter(fragment => fragment.getFilePath() !== source.name)
    .map(fragment => fragment.getNode());

  // console.log(fragmentsFromOtherFiles);

  const fragmentsInSource = extractFragmentsFromSource(
    context,
    source,
    position,
    filterByName,
  );

  return [...fragmentsInSource, ...fragmentsFromOtherFiles];
}

function extractFragmentsFromSource(
  context: QueryContext,
  source: Source,
  position: GQLPosition,
  filterByName?: string,
): $ReadOnlyArray<FragmentDefinitionNode> {
  const isScopeDocument = checkFragmentScopesDocument(
    context.getConfig().fragmentScopes,
  );
  const offset = toOffset(source.body, position);

  let fragmentDefs = [];
  let fragmentDefStart = null;
  runParser(context.getParser(), source.body, (stream, state, style) => {
    // console.log({
    //   pos: stream.getCurrentPosition(),
    //   offset,
    //   isScopeDocument,
    //   kind: state.kind,
    //   state,
    //   fragmentDefs,
    //   style,
    // });

    // NOTE: if scope is document we will only consider fragments
    // defined in document in which 'position' lies
    if (isScopeDocument && state.kind === 'Document') {
      const pos = stream.getCurrentPosition();
      if (pos < offset && style === 'ws-start') {
        // reset fragments if we find new document and document
        // start position is less then 'position'
        fragmentDefs = [];
      } else if (pos > offset) {
        // document end found so we can break now
        return BREAK;
      }
    }

    // console.log(state.kind, state.name, state.type, filterByName);
    if (state.kind === 'FragmentDefinition') {
      // console.log({
      //   pos: stream.getCurrentPosition(),
      //   sot: stream.getStartOfToken(),
      //   offset,
      //   isScopeDocument,
      //   kind: state.kind,
      //   state,
      //   fragmentDefs,
      //   style,
      // });

      if (state.step === 0 && style === 'keyword') {
        // start of fragment
        fragmentDefStart = {
          start: stream.getStartOfToken(),
          end: stream.getCurrentPosition(),
        };
      }

      if (
        state.name &&
        state.type &&
        fragmentDefStart &&
        // if filterByName set then only include fragments matching name
        (!filterByName || state.name === filterByName)
      ) {
        fragmentDefs.push({
          kind: 'FragmentDefinition',
          name: {
            kind: 'Name',
            value: state.name,
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [],
          },
          typeCondition: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: state.type,
            },
          },
          // NOTE: below its hard to compute fragment definition end location
          // so currently using fragment on 'Type' as end location which will
          // work for now
          loc: {
            source,
            start: fragmentDefStart.start,
            end: stream.getCurrentPosition(),
            startToken: {
              start: fragmentDefStart.start,
              end: fragmentDefStart.end,
              ...getLocation(source, fragmentDefStart.start),
              value: 'fragment',
              kind: 'Name',
              prev: null,
              next: null,
            },
            endToken: {
              start: stream.getStartOfToken(),
              end: stream.getCurrentPosition(),
              ...getLocation(source, stream.getStartOfToken()),
              value: 'fragment',
              kind: 'Name',
              prev: null,
              next: null,
            },
          },
        });
        fragmentDefStart = null;
      }
    }
    return null;
  });

  return fragmentDefs;
}
