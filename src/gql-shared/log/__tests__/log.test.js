/* @flow */
import log from '../log';

test('works', () => {
  const logger = log.getLogger('test');
  const mockOnLogHandler = jest.fn();
  log.onLog(mockOnLogHandler);

  logger.debug('test', 'mayank');
  logger.error('test', 'mayank');
  logger.info('info message');

  logger.time('test');
  logger.timeEnd('test');

  expect(mockOnLogHandler.mock.calls).toMatchSnapshot();
});
