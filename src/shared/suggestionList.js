/* @ flow */
import leven from 'leven';

export default function suggestionList(
  input: string,
  options: Array<string>,
): Array<string> {
  const optionsByDistance = Object.create(null);
  const oLength = options.length;
  const inputThreshold = input.length / 2;
  for (let i = 0; i < oLength; i += 1) {
    const distance = leven(input, options[i]);
    const threshold = Math.max(inputThreshold, options[i].length / 2, 1);
    if (distance <= threshold) {
      optionsByDistance[options[i]] = distance;
    }
  }
  return Object.keys(optionsByDistance).sort(
    (a, b) => optionsByDistance[a] - optionsByDistance[b],
  );
}

