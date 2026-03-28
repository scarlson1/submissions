import { z } from 'zod';
import { LicenseOwner, LicenseType, State } from '../enums.js';
import { Address, BaseMetadata, Phone, Timestamp } from './common.js';

// from api:
// export interface License {
//   state: string;
//   ownerType: LicenseOwner;
//   licenseType: LicenseType;
//   surplusLinesProducerOfRecord: boolean;
//   licenseNumber: string;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   SLAssociationMembershipRequired?: boolean;
// }

// from functions:
// export interface License extends BaseDoc {
//   state: State;
//   ownerType: LicenseOwner;
//   licensee: string;
//   licenseType: LicenseType;
//   surplusLinesProducerOfRecord: boolean;
//   licenseNumber: string;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   SLAssociationMembershipRequired?: boolean;
//   address?: Address | null;
//   phone?: string | null;
// }

export const License = z.object({
  state: State,
  ownerType: LicenseOwner,
  licensee: z.string().min(2),
  licenseType: LicenseType,
  surplusLinesProducerOfRecord: z.boolean(),
  licenseNumber: z.string().min(4),
  effectiveDate: Timestamp,
  expirationDate: Timestamp.nullable(),
  SLAssociationMembershipRequired: z.boolean().optional(),
  address: Address.nullable(),
  phone: Phone.optional().nullable(),
  metadata: BaseMetadata,
});
export type License = z.infer<typeof License>;
