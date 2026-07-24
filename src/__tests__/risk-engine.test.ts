import { describe, it, expect } from 'vitest';
import { scoreRisk } from '@/lib/risk/engine';

describe('scoreRisk — hard rejects', () => {
  it('rejects weapons', () => {
    const r = scoreRisk({ contains_weapons: true });
    expect(r.classification).toBe('REJECTED');
    expect(r.score).toBe(100);
  });

  it('rejects hazardous materials', () => {
    const r = scoreRisk({ contains_hazardous: true });
    expect(r.classification).toBe('REJECTED');
    expect(r.score).toBe(100);
  });

  it('rejects chemical substances', () => {
    const r = scoreRisk({ contains_chemical: true });
    expect(r.classification).toBe('REJECTED');
    expect(r.score).toBe(100);
  });
});

describe('scoreRisk — MANUAL_REVIEW floor triggers', () => {
  it('currency alone → MANUAL_REVIEW', () => {
    const r = scoreRisk({ contains_currency: true });
    expect(r.classification).toBe('MANUAL_REVIEW');
    expect(r.score).toBeGreaterThanOrEqual(56);
    expect(r.flags).toContain('currency');
  });

  it('powder alone → MANUAL_REVIEW', () => {
    const r = scoreRisk({ contains_powder: true });
    expect(r.classification).toBe('MANUAL_REVIEW');
    expect(r.flags).toContain('powder');
  });

  it('sender_owns_item false → MANUAL_REVIEW', () => {
    const r = scoreRisk({ sender_owns_item: false });
    expect(r.classification).toBe('MANUAL_REVIEW');
    expect(r.flags).toContain('third-party item');
  });
});

describe('scoreRisk — STANDARD_REVIEW', () => {
  it('electronics + value £800 → STANDARD_REVIEW', () => {
    const r = scoreRisk({ contains_electronics: true, declared_value: 800 });
    expect(r.classification).toBe('STANDARD_REVIEW');
    expect(r.score).toBeGreaterThanOrEqual(16);
    expect(r.score).toBeLessThan(56);
  });

  it('modified item alone → STANDARD_REVIEW', () => {
    const r = scoreRisk({ item_modified: true });
    expect(r.classification).toBe('STANDARD_REVIEW');
    expect(r.flags).toContain('item modified');
  });

  it('medication alone → STANDARD_REVIEW', () => {
    const r = scoreRisk({ contains_medication: true });
    expect(r.classification).toBe('STANDARD_REVIEW');
  });

  it('jewellery + value £400 → STANDARD_REVIEW', () => {
    const r = scoreRisk({ contains_jewellery: true, declared_value: 400 });
    expect(r.classification).toBe('STANDARD_REVIEW');
  });
});

describe('scoreRisk — CLEARED', () => {
  it('safe low-value item → CLEARED', () => {
    const r = scoreRisk({ item_name: 'Trainers', declared_value: 80 });
    expect(r.classification).toBe('CLEARED');
    expect(r.score).toBeLessThan(16);
  });

  it('clothing with no flags → CLEARED', () => {
    const r = scoreRisk({ contains_clothing: true, declared_value: 50 });
    expect(r.classification).toBe('CLEARED');
  });
});

describe('scoreRisk — score cap', () => {
  it('score never reaches 100 via accumulation alone', () => {
    // currency+high-value now triggers EXTERNAL_VERIFICATION_REQUIRED (early return).
    // Use powder as the MANUAL_REVIEW floor trigger instead — verifies score cap without hitting EVR.
    const r = scoreRisk({
      contains_powder:      true,
      contains_medication:  true,
      contains_jewellery:   true,
      contains_battery:     true,
      item_modified:        true,
      declared_value:       6000,
    });
    expect(r.score).toBeLessThanOrEqual(99);
    expect(r.classification).toBe('MANUAL_REVIEW');
  });
});

describe('scoreRisk — compound flags', () => {
  it('currency + modified → MANUAL_REVIEW with elevated score', () => {
    const r = scoreRisk({ contains_currency: true, item_modified: true });
    expect(r.classification).toBe('MANUAL_REVIEW');
    expect(r.score).toBeGreaterThan(60);
  });

  it('seller_owns_item false + high value → MANUAL_REVIEW', () => {
    const r = scoreRisk({ sender_owns_item: false, declared_value: 3000 });
    expect(r.classification).toBe('MANUAL_REVIEW');
  });
});
