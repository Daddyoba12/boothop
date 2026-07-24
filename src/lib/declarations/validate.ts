export const PROOF_OF_OWNERSHIP_THRESHOLD =
  Number(process.env.PROOF_OF_OWNERSHIP_THRESHOLD ?? '250');

export const HIGH_RISK_POW_CATEGORIES =
  (process.env.PROOF_OF_OWNERSHIP_CATEGORIES ?? 'jewellery,electronics,antiques,art')
    .split(',').map(s => s.trim().toLowerCase());

export const DECLARATION_TEXT_VERSION = '1.0';

const VAGUE_DESCRIPTIONS = [
  'gift', 'stuff', 'personal belongings', 'package',
  'foodstuff', 'electronics', 'clothes',
];

export function validateDescription(desc: unknown): string | null {
  if (!desc || typeof desc !== 'string' || !desc.trim()) {
    return 'Detailed description is required.';
  }
  const t = desc.trim().toLowerCase();
  if (t.length < 20) {
    return 'Description must be at least 20 characters. Please describe your item specifically.';
  }
  if (VAGUE_DESCRIPTIONS.includes(t)) {
    return `"${desc.trim()}" is too vague. Please describe your item in full detail (e.g. "Nike Air Force 1 low, size UK 9, white, purchased 2024").`;
  }
  return null;
}

export function requiresProofOfOwnership(fields: Record<string, unknown>): boolean {
  if ((fields.declared_value as number ?? 0) > PROOF_OF_OWNERSHIP_THRESHOLD) return true;
  const cat = (fields.item_category as string ?? '').toLowerCase();
  return HIGH_RISK_POW_CATEGORIES.some(c => cat.includes(c));
}

export function validateSubmit(fields: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!fields.item_name || String(fields.item_name).trim().length < 2)
    errors.push('Item name is required.');
  if (!fields.item_category)
    errors.push('Item category is required.');
  if (fields.quantity == null || Number(fields.quantity) < 1)
    errors.push('Quantity must be at least 1.');
  if (fields.declared_value == null || Number(fields.declared_value) <= 0)
    errors.push('Declared value is required.');
  if (fields.declared_weight_kg == null || Number(fields.declared_weight_kg) <= 0)
    errors.push('Declared weight is required.');
  if (!fields.country_of_origin)
    errors.push('Country of origin is required.');

  const descError = validateDescription(fields.item_description);
  if (descError) errors.push(descError);

  if (fields.sender_owns_item == null)
    errors.push('Please confirm whether you own this item.');

  if (requiresProofOfOwnership(fields)) {
    if (!fields.proof_of_ownership_url && !fields.proof_of_ownership_explanation) {
      errors.push('Proof of ownership is required for this item. Please upload evidence or provide a written explanation.');
    }
  }

  if (!fields.ack_description_accurate)
    errors.push('Please confirm the description is complete and accurate.');
  if (!fields.ack_nothing_concealed)
    errors.push('Please confirm nothing has been concealed inside the item.');
  if (!fields.ack_complies_with_laws)
    errors.push('Please confirm the item complies with all applicable laws.');
  if (!fields.ack_may_be_reported)
    errors.push('Please acknowledge BootHop may reject, suspend or report suspicious activity.');
  if (!fields.ack_false_decl_consequences)
    errors.push('Please acknowledge the consequences of a false declaration.');
  if (!fields.ack_legally_responsible)
    errors.push('Please confirm you remain legally responsible for this declaration.');

  return errors;
}
