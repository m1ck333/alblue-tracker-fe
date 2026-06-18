/**
 * Localised month-count label. Serbian has three plural forms (1 mesec /
 * 2-4 meseca / 5+ meseci with the usual 11-14 edge cases); English has
 * two. Used by the payments tables so the cell mirrors what the user
 * typed in the "Trajanje pretplate (broj meseci)" form field.
 */
export function formatMonths(months: number, locale = 'sr'): string {
  const n = Math.abs(Math.round(months));

  if (locale.startsWith('sr')) {
    const lastTwo = n % 100;
    const lastOne = n % 10;
    const isTeen = lastTwo >= 11 && lastTwo <= 14;
    let word: string;
    if (!isTeen && lastOne === 1) word = 'mesec';
    else if (!isTeen && lastOne >= 2 && lastOne <= 4) word = 'meseca';
    else word = 'meseci';
    return `${n} ${word}`;
  }

  return n === 1 ? `${n} month` : `${n} months`;
}
