/* @flow */
import importFrom from 'import-from';

// To support both 'module.exports' and 'export default'
function interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

export default function importModule(moduleID: string, dir: string) {
  const mod = importFrom(dir, moduleID);
  return interopRequireDefault(mod).default;
}
