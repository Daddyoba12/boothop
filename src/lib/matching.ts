/**
 * Shared matching rules.
 *
 * The TRAVELLER is the anchor: their flight is booked, so their date is fixed.
 * The sender's date is indicative, not binding — it can fall either side of the
 * flight and the pair is still matchable:
 *
 *   traveller flies 7 Nov, sender listed 5th or 6th  → match (parcel waits)
 *   traveller flies 7 Nov, sender listed 8th or 9th  → match (sender brings it forward)
 *
 * What binds is a single deadline: the agreement must be complete by end of
 * business on the day before departure. Nothing can be handed over after that,
 * whatever the two listed dates say.
 */

/** End of business on the day before departure. */
export const DEADLINE_HOUR = 18;

/**
 * Runway a new match needs to the deadline to be worth creating — accept → KYC
 * → payment → handover cannot be completed in less.
 */
export const MIN_RUNWAY_HOURS = 48;

export const hoursBetween = (
  from: string | number | Date,
  to:   string | number | Date,
): number => (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;

/**
 * The moment by which the agreement must be complete: DEADLINE_HOUR on the day
 * before departure.
 *
 * NOTE: computed in UTC. The rule is "local time at the departure city", but
 * `trips` stores only a city string and no timezone, so there is nothing to
 * localise against yet. For the Lagos/London corridor the offset is 0–1 hour so
 * this is near enough; it is NOT correct for distant routes. Localising it
 * properly needs a city→timezone mapping.
 */
export function agreementDeadline(departureDate: string): Date {
  const d = new Date(`${departureDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(DEADLINE_HOUR, 0, 0, 0);
  return d;
}

/** True when there is still enough runway to agree before departure. */
export function withinAgreementWindow(departureDate: string, now: Date = new Date()): boolean {
  return hoursBetween(now, agreementDeadline(departureDate)) >= MIN_RUNWAY_HOURS;
}
