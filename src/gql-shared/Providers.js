/* @flow */
import { type GQLLocation, type GQLInfo, type GQLHint } from 'gql-shared/types';

type Provider<TParams, TResult> = (params: TParams) => TResult;
type DefnProvider<TParams> = Provider<TParams, $ReadOnlyArray<GQLLocation>>;
type InfoProvider<TParams> = Provider<TParams, $ReadOnlyArray<GQLInfo>>;
type HintsProvider<TParams> = Provider<TParams, $ReadOnlyArray<GQLHint>>;
type RefsProvider<TParams> = Provider<TParams, $ReadOnlyArray<GQLLocation>>;

export default class Providers<TParams> {
  _defnProviders: Array<DefnProvider<TParams>> = [];
  _infoProviders: Array<InfoProvider<TParams>> = [];
  _hintsProviders: Array<HintsProvider<TParams>> = [];
  _refsProviders: Array<RefsProvider<TParams>> = [];

  registerDefinitionProvider(provider: DefnProvider<TParams>) {
    this._defnProviders.push(provider);
  }

  provideDefinitions(params: TParams): $ReadOnlyArray<GQLLocation> {
    const defns = [];
    this._defnProviders.forEach(provider => {
      defns.push(...provider(params));
    });
    return defns;
  }

  registerInfoProvider(provider: InfoProvider<TParams>) {
    this._infoProviders.push(provider);
  }

  provideInfo(params: TParams): $ReadOnlyArray<GQLInfo> {
    const info = [];
    this._infoProviders.forEach(provider => {
      info.push(...provider(params));
    });
    return info;
  }

  registerHintsProvider(provider: HintsProvider<TParams>) {
    this._hintsProviders.push(provider);
  }

  provideHints(params: TParams): $ReadOnlyArray<GQLHint> {
    const hints = [];
    this._hintsProviders.forEach(provider => {
      hints.push(...provider(params));
    });
    return hints;
  }

  registerRefsProvider(provider: RefsProvider<TParams>) {
    this._refsProviders.push(provider);
  }

  provideRefs(params: TParams): $ReadOnlyArray<GQLLocation> {
    const refs = [];
    this._refsProviders.forEach(provider => {
      refs.push(...provider(params));
    });
    return refs;
  }
}
