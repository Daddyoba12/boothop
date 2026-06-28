import type { RawFlightOffer, SearchParams } from '../types';

export interface BFIProvider {
  readonly name: string;
  search(params: SearchParams): Promise<RawFlightOffer[]>;
  isAvailable(): Promise<boolean>;
}
