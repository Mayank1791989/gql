/* @flow */
/**
 * This scrips will remove all npm/defns which we override with custom defs (present in root)
 * will fix flow using npm/defns instead our custom provide defns
 */

import fs from 'fs-extra';
import path from 'path';
import invariant from 'invariant';

const flowTypedPath = path.join(process.cwd(), 'flow-typed');
const flowTypedNpmPath = path.join(flowTypedPath, 'npm');

if (!fs.pathExistsSync(flowTypedPath)) {
  console.error(`FlowTypedPath: '${flowTypedPath}' doesnt exists`);
  process.exit(1);
}
if (!fs.pathExistsSync(flowTypedNpmPath)) {
  console.error(`FlowTypedNpmPath: '${flowTypedPath}' doesnt exists`);
  process.exit(1);
}

function readFilesInDir(dir: string) {
  return fs.readdirSync(dir).filter(file => {
    // filter dir
    const stat = fs.statSync(path.join(dir, file));
    return stat.isFile();
  });
}

function readCustomDefs(dir: string) {
  return fs
    .readdirSync(dir)
    .map(file => {
      if (file === 'npm') {
        // ignore npm dir
        return null;
      }
      // filter dir
      const stat = fs.statSync(path.join(dir, file));
      if (!stat.isFile()) {
        return `${file}.js`; // to add support for custom definition as dir
      }
      return file;
    })
    .filter(Boolean);
}

function getModuleName(npmDefFilename: string): string {
  // name is of form moduleName_vx.x.x.js
  const [moduleName] = npmDefFilename.split('_');
  invariant(
    moduleName,
    `could not able to extract moduleName from ${npmDefFilename}`,
  );
  return moduleName;
}

const customDefs = readCustomDefs(flowTypedPath);
const npmDefs = readFilesInDir(path.join(flowTypedNpmPath));

function isCustomDefPresent(moduleName: string): boolean {
  return Boolean(
    customDefs.find(filename => path.basename(filename, '.js') === moduleName),
  );
}

// delete npm files
Promise.all(
  npmDefs.reduce((acc, defFilename) => {
    const moduleName = getModuleName(defFilename);
    if (isCustomDefPresent(moduleName)) {
      acc.push(
        fs
          .remove(path.join(flowTypedNpmPath, defFilename))
          .then(() => defFilename),
      );
    }
    return acc;
  }, []),
).then(files => {
  if (files.length > 0) {
    console.log('Deleted npm defs \n', files);
  }
});
