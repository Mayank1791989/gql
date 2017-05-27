/* @flow */
export default function mockImportModule(
  moduleName: string,
  mockFactory: () => $FixMe,
) {
  jest.doMock('import-from', () => {
    return function importFrom(dir, moduleID) {
      if (moduleID === moduleName) {
        return mockFactory();
      }
      const importFromActual = jest.requireActual('import-from');
      return importFromActual(dir, moduleID);
    };
  });
}
