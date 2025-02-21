import { Datum1D } from '../../types/data1d/Datum1D';

/**
 *
 * @param {Object} datum1d
 * @param {number} [shiftValue=0]
 */

export const id = 'shiftX';
export const name = 'Shift X';

export function apply(datum1D: Datum1D, shiftValue = 0) {
  datum1D.data.x = datum1D.data.x.map((val) => val + shiftValue);
}

export function isApplicable() {
  return true;
}

export function reduce(previousValue, newValue) {
  return {
    once: true,
    reduce: previousValue + newValue,
  };
}
