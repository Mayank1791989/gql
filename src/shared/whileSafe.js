/* @flow */
type Params = {
  condition: () => boolean,
  call: () => void,
  logOnInfiniteLoop?: () => void,
};

const whileSafe = (params: Params, maxIterations: number = 50) => {
  let iterationsCount = 0;
  while (params.condition()) {
    iterationsCount += 1;
    if (iterationsCount > maxIterations) {
      if (params.logOnInfiniteLoop) {
        console.log('================ infiniteLoop detected (start) ======================');
        // $FlowDisableNextLine
        params.logOnInfiniteLoop();
        console.log('================ infiniteLoop detected (end) ======================');
      }
      break;
    }
    params.call();
  }
};

export default whileSafe;
