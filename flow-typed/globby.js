/* @flow */
declare module 'globby' {
  declare type Pattern = string | Array<string>;

  declare type FastGlobOptions = {|
    cwd?: string,
    deep?: number | boolean,
    ignore?: Array<string>,
    dot?: boolean,
    stats?: number | boolean,
    onlyFiles?: boolean,
    onlyDirectories?: boolean,
    followSymlinkedDirectories?: boolean,
    unique?: boolean,
    markDirectories?: boolean,
    absolute?: boolean,
    nobrace?: boolean,
    brace?: boolean,
    noglobstar?: boolean,
    globstar?: boolean,
    noext?: boolean,
    extension?: boolean,
    nocase?: boolean,
    case?: boolean,
    matchBase?: boolean,
    transform?: Function,
  |};

  declare type GlobbyOptions = {|
    ...FastGlobOptions,
    expandDirectories?: boolean,
    gitignore?: boolean,
  |};

  declare export default {
    (
      patterns: Pattern,
      options?: GlobbyOptions,
    ): Promise<$ReadOnlyArray<string>>,
    sync(patterns: Pattern, options?: GlobbyOptions): $ReadOnlyArray<string>,
    generateGlobTasks(patterns: Pattern, options?: GlobbyOptions): boolean,
    hasMagic(patterns: Pattern, options?: GlobbyOptions): boolean,
    gitignore: {
      (options: Options): Promise<(path: string) => boolean>,
      sync(options: Options): (path: string) => boolean,
    },
  };
}
