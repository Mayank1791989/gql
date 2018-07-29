/* @flow */
import packageJSON from '../../package.json';

export default function getPackageVersion() {
  return packageJSON.version;
}
