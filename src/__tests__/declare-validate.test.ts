import { describe, it, expect } from 'vitest';
import {
  validateDescription,
  requiresProofOfOwnership,
  validateSubmit,
} from '../lib/declarations/validate';

// ── validateDescription ───────────────────────────────────────────────────────

describe('validateDescription', () => {
  it('rejects null / empty / whitespace-only', () => {
    expect(validateDescription(null)).toBeTruthy();
    expect(validateDescription('')).toBeTruthy();
    expect(validateDescription('   ')).toBeTruthy();
    expect(validateDescription(undefined)).toBeTruthy();
  });

  it('rejects descriptions shorter than 20 chars', () => {
    expect(validateDescription('short')).toBeTruthy();
    expect(validateDescription('19 chars in here!!!')).toBeTruthy(); // 19
  });

  it('accepts descriptions at exactly 20 chars', () => {
    expect(validateDescription('12345678901234567890')).toBeNull(); // 20
  });

  it('rejects exact banned generic terms (case-insensitive)', () => {
    expect(validateDescription('gift')).toBeTruthy();
    expect(validateDescription('ELECTRONICS')).toBeTruthy();
    expect(validateDescription('Clothes')).toBeTruthy();
    expect(validateDescription('personal belongings')).toBeTruthy();
    expect(validateDescription('stuff')).toBeTruthy();
    expect(validateDescription('package')).toBeTruthy();
    expect(validateDescription('foodstuff')).toBeTruthy();
  });

  it('accepts specific descriptions that contain banned words as substrings', () => {
    expect(validateDescription('used electronics, Samsung Galaxy S21 with cracked screen')).toBeNull();
    expect(validateDescription('traditional Nigerian clothes, Aso-Oke fabric, new, unworn')).toBeNull();
    expect(validateDescription('birthday gift: personalised leather wallet from Marks & Spencer')).toBeNull();
  });

  it('accepts any description >= 20 chars that is not an exact banned term', () => {
    expect(validateDescription('Nike Air Force 1 Low, UK 10, white leather, worn twice')).toBeNull();
  });
});

// ── requiresProofOfOwnership ──────────────────────────────────────────────────

describe('requiresProofOfOwnership', () => {
  it('requires proof when declared_value > 250', () => {
    expect(requiresProofOfOwnership({ declared_value: 251, item_category: 'clothing' })).toBe(true);
    expect(requiresProofOfOwnership({ declared_value: 500, item_category: 'clothing' })).toBe(true);
    expect(requiresProofOfOwnership({ declared_value: 1000, item_category: 'clothing' })).toBe(true);
  });

  it('does not require proof when declared_value is exactly 250', () => {
    expect(requiresProofOfOwnership({ declared_value: 250, item_category: 'clothing' })).toBe(false);
  });

  it('does not require proof for low-value low-risk items', () => {
    expect(requiresProofOfOwnership({ declared_value: 50,  item_category: 'clothing' })).toBe(false);
    expect(requiresProofOfOwnership({ declared_value: 100, item_category: 'books'    })).toBe(false);
    expect(requiresProofOfOwnership({ declared_value: 0,   item_category: 'toys'     })).toBe(false);
  });

  it('requires proof for high-risk categories regardless of value', () => {
    expect(requiresProofOfOwnership({ declared_value: 10, item_category: 'jewellery'  })).toBe(true);
    expect(requiresProofOfOwnership({ declared_value: 10, item_category: 'electronics' })).toBe(true);
    expect(requiresProofOfOwnership({ declared_value: 10, item_category: 'antiques'   })).toBe(true);
    expect(requiresProofOfOwnership({ declared_value: 10, item_category: 'art'        })).toBe(true);
  });
});

// ── validateSubmit ────────────────────────────────────────────────────────────

const VALID_FIELDS = {
  item_name:                   'Nike Air Force 1 Low',
  item_category:               'clothing',
  quantity:                    1,
  declared_value:              120,
  declared_weight_kg:          1.2,
  declared_currency:           'GBP',
  country_of_origin:           'United States',
  item_description:            'Nike Air Force 1 Low, white leather, size UK 10, worn twice, bought at JD Sports 2023',
  sender_owns_item:            true,
  ack_description_accurate:    true,
  ack_nothing_concealed:       true,
  ack_complies_with_laws:      true,
  ack_may_be_reported:         true,
  ack_false_decl_consequences: true,
  ack_legally_responsible:     true,
};

describe('validateSubmit', () => {
  it('passes with fully valid fields', () => {
    expect(validateSubmit(VALID_FIELDS)).toHaveLength(0);
  });

  // Required field checks
  it('fails when item_name is missing', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, item_name: '' });
    expect(errors.some(e => /item name/i.test(e))).toBe(true);
  });

  it('fails when item_category is missing', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, item_category: undefined });
    expect(errors.some(e => /category/i.test(e))).toBe(true);
  });

  it('fails when quantity is 0', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, quantity: 0 });
    expect(errors.some(e => /quantity/i.test(e))).toBe(true);
  });

  it('fails when declared_value is 0', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, declared_value: 0 });
    expect(errors.some(e => /value/i.test(e))).toBe(true);
  });

  it('fails when declared_weight_kg is 0', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, declared_weight_kg: 0 });
    expect(errors.some(e => /weight/i.test(e))).toBe(true);
  });

  it('fails when country_of_origin is missing', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, country_of_origin: '' });
    expect(errors.some(e => /origin/i.test(e))).toBe(true);
  });

  // Vague description
  it('fails when description is vague (exact banned term)', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, item_description: 'clothes' });
    expect(errors.some(e => /vague|specific/i.test(e))).toBe(true);
  });

  it('fails when description is too short', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, item_description: 'short' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('passes with a description containing a banned word as substring', () => {
    const fields = { ...VALID_FIELDS, item_description: 'electronics: Sony WH-1000XM5 noise-cancelling headphones, black' };
    expect(validateSubmit(fields)).toHaveLength(0);
  });

  // Acknowledgements
  it('fails when ack_description_accurate is false', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, ack_description_accurate: false });
    expect(errors.some(e => /accurate/i.test(e))).toBe(true);
  });

  it('fails when ack_nothing_concealed is false', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, ack_nothing_concealed: false });
    expect(errors.some(e => /concealed/i.test(e))).toBe(true);
  });

  it('fails when ack_complies_with_laws is false', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, ack_complies_with_laws: false });
    expect(errors.some(e => /laws/i.test(e))).toBe(true);
  });

  it('fails when ack_may_be_reported is false', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, ack_may_be_reported: false });
    expect(errors.some(e => /reject.*suspend|suspicious/i.test(e))).toBe(true);
  });

  it('fails when ack_false_decl_consequences is false', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, ack_false_decl_consequences: false });
    expect(errors.some(e => /false declaration/i.test(e))).toBe(true);
  });

  it('fails when ack_legally_responsible is false', () => {
    const errors = validateSubmit({ ...VALID_FIELDS, ack_legally_responsible: false });
    expect(errors.some(e => /legally responsible/i.test(e))).toBe(true);
  });

  it('fails with all 6 errors when all acknowledgements missing', () => {
    const { ack_description_accurate, ack_nothing_concealed, ack_complies_with_laws,
            ack_may_be_reported, ack_false_decl_consequences, ack_legally_responsible, ...rest } = VALID_FIELDS;
    const errors = validateSubmit(rest);
    const ackErrors = errors.filter(e => /accurate|concealed|laws|suspicious|false declaration|legally/i.test(e));
    expect(ackErrors).toHaveLength(6);
  });

  // Sender ownership
  it('fails when sender_owns_item is not set', () => {
    const { sender_owns_item, ...rest } = VALID_FIELDS;
    const errors = validateSubmit(rest);
    expect(errors.some(e => /own/i.test(e))).toBe(true);
  });

  // Proof of ownership — value threshold
  it('requires proof of ownership when value > 250 with no proof provided', () => {
    const fields = { ...VALID_FIELDS, declared_value: 300, item_category: 'clothing' };
    const errors = validateSubmit(fields);
    expect(errors.some(e => /proof of ownership/i.test(e))).toBe(true);
  });

  it('passes when proof URL provided for high-value item', () => {
    const fields = { ...VALID_FIELDS, declared_value: 300, item_category: 'clothing',
                     proof_of_ownership_url: 'https://storage.example.com/receipt.jpg' };
    expect(validateSubmit(fields)).toHaveLength(0);
  });

  it('passes when explanation text provided instead of proof URL for high-value item', () => {
    const fields = { ...VALID_FIELDS, declared_value: 300, item_category: 'clothing',
                     proof_of_ownership_explanation: 'Gift from family — no receipt available' };
    expect(validateSubmit(fields)).toHaveLength(0);
  });

  // Proof of ownership — category threshold
  it('requires proof for jewellery regardless of value', () => {
    const fields = { ...VALID_FIELDS, declared_value: 50, item_category: 'jewellery' };
    const errors = validateSubmit(fields);
    expect(errors.some(e => /proof of ownership/i.test(e))).toBe(true);
  });

  it('requires proof for electronics regardless of value', () => {
    const fields = { ...VALID_FIELDS, declared_value: 50, item_category: 'electronics' };
    const errors = validateSubmit(fields);
    expect(errors.some(e => /proof of ownership/i.test(e))).toBe(true);
  });

  it('accepts explanation for high-risk category item', () => {
    const fields = { ...VALID_FIELDS, declared_value: 50, item_category: 'jewellery',
                     proof_of_ownership_explanation: 'Inherited — no documentation' };
    expect(validateSubmit(fields)).toHaveLength(0);
  });

  // Draft vs submit behaviour (documented difference)
  it('returns multiple errors for a partial/draft-like submission attempt', () => {
    // PUT (draft) does not run validateSubmit; POST (submit) does.
    // Submitting with only item_name set should produce many errors.
    const partialFields = { item_name: 'shoes', item_category: 'clothing' };
    expect(validateSubmit(partialFields).length).toBeGreaterThan(3);
  });
});
