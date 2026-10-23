/**
 * Shared matching rules.
 *
 * The TRAVELLER is the anchor: their flight is booked, so their date is fixed.
 * The sender's listed date is NOT material. It may fall either side of the
 * flight and the pair is still matchable:
 *
 *   traveller flies 7 Nov, sender listed 5th or 6th → goods are already there
 *   traveller flies 7 Nov, sender listed 8th or 9th → goods are brought forward
 *
 * Exactly one thing binds: the connect must happen by END OF BUSINESS on the
 * day before travel. That is the whole rule. There is no proximity window, no
 * minimum lead time, and no requirement that the sender's date sit before the
 * flight.
 */

import { timezoneForCity, zonedHourToUtc } from './timezones';

/** End of business on the day before departure. */
export const DEADLINE_HOUR = 18;

export const hoursBetween = (
  from: string | number | Date,
  to:   string | number | Date,
): number => (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;

/** The day before departure, as YYYY-MM-DD. */
function dayBefore(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * The moment the connect must be complete by: 18:00 on the day before
 * departure, in the TRAVELLER'S LOCAL TIME at their departure city.
 *
 * `departureCity` is the traveller's from_city, e.g. "Lagos, Nigeria". The zone
 * is inferred from it (see timezones.ts); an unrecognised city falls back to
 * UTC and logs a warning.
 */
export function agreementDeadline(departureDate: string, departureCity = ''): Date {
  const zone = timezoneForCity(departureCity);
  return zonedHourToUtc(dayBefore(departureDate), DEADLINE_HOUR, zone);
}

/**
 * The only timing gate: is there still time to connect before 6pm, traveller's
 * local time, on the day before travel?
 */
export function beforeAgreementDeadline(
  departureDate: string,
  departureCity = '',
  now: Date = new Date(),
): boolean {
  return now.getTime() < agreementDeadline(departureDate, departureCity).getTime();
}
