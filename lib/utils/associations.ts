/**
 * lib/utils/associations.ts
 * Association name normalizer and credential validator for global freight networks.
 * Normalizes 'WCA', 'W.C.A.', 'W C A', 'WCA World' to canonical 'WCA'.
 */

import { AssociationMembership } from '@/lib/types';

export const CANONICAL_ASSOCIATIONS: Record<string, { name: string; fullName: string; logo?: string }> = {
  WCA: { name: 'WCA', fullName: 'World Cargo Alliance' },
  FIATA: { name: 'FIATA', fullName: 'International Federation of Freight Forwarders Associations' },
  IATA: { name: 'IATA', fullName: 'International Air Transport Association' },
  AEO: { name: 'AEO', fullName: 'Authorized Economic Operator (Customs)' },
  MTO: { name: 'MTO', fullName: 'Multimodal Transport Operator' },
  FFFAI: { name: 'FFFAI', fullName: 'Federation of Freight Forwarders Associations in India' },
  BAPLIE: { name: 'BAPLIE', fullName: 'BAPLIE Data Maintenance Group' },
};

/**
 * Normalizes any free-form string to a canonical association key if matched
 */
export function normalizeAssociationName(input: string): string {
  if (!input) return '';
  const cleaned = input
    .replace(/[.\s\-_/]/g, '')
    .toUpperCase()
    .trim();

  if (cleaned.startsWith('WCA')) return 'WCA';
  if (cleaned.startsWith('FIATA')) return 'FIATA';
  if (cleaned.startsWith('IATA')) return 'IATA';
  if (cleaned.startsWith('AEO')) return 'AEO';
  if (cleaned.startsWith('MTO')) return 'MTO';
  if (cleaned.startsWith('FFFAI')) return 'FFFAI';

  return input.trim();
}

/**
 * Validates and normalizes an association membership entry
 */
export function validateMembership(
  associationRaw: string,
  membershipNumber: string,
  validTill: string
): AssociationMembership {
  const canonical = normalizeAssociationName(associationRaw);
  const isValidDate = !isNaN(new Date(validTill).getTime());
  const isNotExpired = isValidDate && new Date(validTill).getTime() > Date.now();

  return {
    id: `assoc_${canonical}_${Date.now()}`,
    association: canonical,
    canonicalName: canonical,
    membershipNumber: membershipNumber.trim().toUpperCase(),
    validTill,
    verified: isNotExpired && membershipNumber.trim().length >= 3,
  };
}
