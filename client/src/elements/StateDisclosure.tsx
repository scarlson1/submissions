import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, CollectionReference, limit, query, where } from 'firebase/firestore';

import { useConfirmation } from 'modules/components/ConfirmationService';
import { COLLECTIONS, Disclosure, Product } from 'common';
import { generateHTML } from '@tiptap/react';
import { EDITOR_EXTENSION_DEFAULTS } from 'hooks';

export interface StateDisclosureProps {
  state: string;
  product?: Product;
  buttonText?: string;
  textProps?: TypographyProps;
}

export const StateDisclosure: React.FC<StateDisclosureProps> = ({
  state,
  product,
  buttonText = 'state disclosure',
  textProps,
}) => {
  const firestore = useFirestore();
  const modal = useConfirmation();

  const disclosuresCol = collection(
    firestore,
    COLLECTIONS.DISCLOSURES
  ) as CollectionReference<Disclosure>;

  // TODO: is there only over one? use state abbreviation as uid? or add where type === 'flood state disclosure'
  const q = useMemo(() => {
    const constraints = [where('state', '==', state)];
    if (product) constraints.push(where('products', 'array-contains', product));
    return query(disclosuresCol, ...constraints, limit(1));
  }, [state, product, disclosuresCol]);
  const { status, data } = useFirestoreCollectionData(q, { idField: 'id', suspense: false });

  const [disclosureHTML, setDisclosureHTML] = useState<any>(null);

  useEffect(() => {
    if (!data || !data[0]) return;

    const jsonContent = data[0].content;
    if (!jsonContent) return;

    const content = generateHTML(jsonContent, EDITOR_EXTENSION_DEFAULTS);
    setDisclosureHTML(content);
  }, [data]);

  const showModal = useCallback(
    async (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (!disclosureHTML) return;

      await modal({
        catchOnCancel: false,
        variant: 'info',
        title: `State Disclosure - ${state}`,
        description: (() => <div dangerouslySetInnerHTML={{ __html: disclosureHTML }} />)(),
        // description: disclosure,
        dialogContentProps: { dividers: true },
        dialogProps: { maxWidth: 'sm' },
      });
    },
    [modal, disclosureHTML, state] // disclosure
  );

  if (status === 'loading') return null;
  if (!data || !disclosureHTML) return null;

  return (
    <Typography sx={{ display: 'inline-flex' }} component='span' {...textProps} onClick={showModal}>
      {buttonText}
    </Typography>
  );
};

// const getHelperText = (state: string) => {
//   switch (state) {
//     case 'AZ':
//       return (
//         <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
//           Pursuant to Arizona Revised Statutes Section 20-401.1, Sub-Section B, Paragraph 1, this
//           policy is issued by an insurer that does not possess a certificate of authority from the
//           Director of the Arizona Department of Insurance and Financial Institutions. If the insurer
//           that issued this policy becomes insolvent, insureds or claimants will not be eligible for
//           insurance guaranty fund protection pursuant to Arizona Revised Statutes Title 20.
//         </Typography>
//       );
//     case 'FL':
//       return (
//         <>
//           <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
//             THIS INSURANCE IS ISSUED PURSUANT TO THE FLORIDA SURPLUS LINES LAW. PERSONS INSURED BY
//             SURPLUS LINES CARRIERS DO NOT HAVE THE PROTECTION OF THE FLORIDA INSURANCE GUARANTY ACT
//             TO THE EXTENT OF ANY RIGHT OF RECOVERY FOR THE OBLIGATION OF AN INSOLVENT UNLICENSED
//             INSURER.
//           </Typography>
//           <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
//             SURPLUS LINES INSURERS POLICY RATES AND FORMS ARE NOT APPROVED BY ANY FLORIDA REGULATORY
//             AGENCY.
//           </Typography>
//           <Typography>
//             F.S. 627.715 (8) If the applicant discontinues coverage under the National Flood
//             Insurance Program which is provided at a subsidized rate, the full risk rate for flood
//             insurance may apply to the property if the applicant later seeks to reinstate coverage
//             under the National Flood Insurance Program.
//           </Typography>
//         </>
//       );
//     case 'ID':
//       return (
//         <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
//           THIS SURPLUS LINE CONTRACT IS ISSUED PURSUANT TO THE IDAHO INSURANCE LAWS BY AN INSURER
//           NOT LICENSED BY THE IDAHO DEPARTMENT OF INSURANCE. THERE IS NO COVERAGE PROVIDED FOR
//           SURPLUS LINE INSURANCE BY EITHER THE IDAHO INSURANCE GUARANTY ASSOCIATION OR BY THE IDAHO
//           LIFE AND HEALTH INSURANCE GUARANTY ASSOCIATION.
//         </Typography>
//       );
//     case 'IL':
//       return (
//         <Typography sx={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>
//           THIS CONTRACT IS ISSUED, PURSUANT TO SECTION 445 OF THE ILLINOIS INSURANCE CODE BY A
//           COMPANY NOT AUTHORIZED AND LICENSE TO TRANSACT BUSINESS IN ILLINOIS AND AS SUCH IS NOT
//           COVERED BY THE ILLINOIS INSURANCE GUARANTY FUND
//         </Typography>
//       );
//     case 'LA':
//       return (
//         <>
//           <Typography
//             sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'red' }}
//           >
//             NOTICE
//           </Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'red' }}>
//             This insurance policy is delivered as surplus line coverage under the Louisiana
//             Insurance Code.
//           </Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'red' }}>
//             In the event of insolvency of the company issuing this contract, the policyholder or
//             claimant is not covered by the Louisiana Insurance Guaranty Association or the Louisiana
//             Life and Health Insurance Guaranty Association, which guarantees only specific types of
//             policies issued by insurance companies authorized to do business in Louisiana.
//           </Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'red' }}>
//             This surplus lines policy has been procured by the following licensed Louisiana surplus
//             lines broker:{' '}
//           </Typography>
//           <Typography
//             sx={{ fontSize: 12, fontWeight: 600, color: 'red', textDecoration: 'underline', mt: 3 }}
//           >
//             Ronald Carlson
//           </Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'red' }}>
//             Signature of Licensed Louisiana Surplus Lines Broker or Authorized Representative
//           </Typography>
//           <Typography
//             sx={{ fontSize: 12, fontWeight: 600, color: 'red', textDecoration: 'underline', mt: 3 }}
//           >
//             Ronald Carlson
//           </Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'red' }}>
//             Printed Name of Licensed Louisiana Surplus Lines Broker
//           </Typography>
//         </>
//       );
//     case 'MI':
//       return (
//         <Typography
//           sx={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', color: 'red' }}
//         >
//           This insurance has been placed with an insurer that is not licensed by the state of
//           Michigan. In case of insolvency, payment of claims may not be guaranteed.
//         </Typography>
//       );
//     case 'MN':
//       return (
//         <>
//           <Typography sx={{ fontSize: 12, pb: 2 }}>
//             Pursuant to Minnesota Statute § 60A.207.
//           </Typography>
//           <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
//             THIS INSURANCE IS ISSUED PURSUANT TO THE MINNESOTA SURPLUS LINES INSURANCE ACT. THE
//             INSURER IS AN ELIGIBLE SURPLUS LINES INSURER BUT IS NOT OTHERWISE LICENSED BY THE STATE
//             OF MINNESOTA. IN CASE OF INSOLVENCY, PAYMENT OF CLAIMS IS NOT GUARANTEED.
//           </Typography>
//         </>
//       );
//     case 'MO':
//       return (
//         <Typography sx={{ fontSize: 10, fontWeight: 600 }}>
//           Pursuant to Missouri Statute § 384.036. This is evidence of insurance procured and
//           developed under the Missouri Surplus Lines Laws. It is NOT covered by the Missouri
//           Insurance Guaranty Association. This insurer is not licensed by the state of Missouri and
//           is not subject to its supervision.
//         </Typography>
//       );
//     case 'MS':
//       return (
//         <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary' }}>
//           NOTE: This insurance policy is issued pursuant to Mississippi law covering surplus lines
//           insurance. The company issuing the policy is not licensed by the State of Mississippi, but
//           is authorized to do business in Mississippi as a nonadmitted company. The policy is not
//           protected by the Mississippi Insurance Guaranty Association in the event of the insurer’s
//           insolvency.
//         </Typography>
//       );
//     case 'NC':
//       return (
//         <Typography
//           sx={{ fontSize: 12, fontWeight: 600, color: 'red', textDecoration: 'underline' }}
//         >
//           The insurance company with which this coverage has been placed is not licensed by the
//           State of North Carolina and is not subject to its supervision. In the event of the
//           insolvency of the insurance company, losses under this policy will not be paid by any
//           State insurance guaranty or solvency fund.
//         </Typography>
//       );
//     case 'OH':
//       return (
//         <>
//           <Typography sx={{ fontSize: 12, pb: 2 }}>Pursuant to Ohio Statute § 3905. </Typography>
//           <Typography sx={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase' }}>
//             THE INSURANCE HEREBY EVIDENCED IS WRITTEN BY AN APPROVED NON-LICENSED INSURER IN THE
//             STATE OF OHIO AND IS NOT COVERED IN CASE OF INSOLVENCY BY THE OHIO INSURANCE GUARANTY
//             ASSOCIATION.
//           </Typography>
//         </>
//       );
//     case 'OK':
//       return (
//         <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
//           This Policy is not subject to the protection of any guaranty association in the event of
//           liquidation or receivership of the surplus lines insurer.
//         </Typography>
//       );
//     case 'PA':
//       return (
//         <Typography sx={{ fontSize: 10, fontWeight: 600 }}>
//           The insurer which has issued this insurance is not licensed by the Pennsylvania Insurance
//           Department and is subject to limited regulation. This insurance is NOT covered by the
//           Pennsylvania Property and Casualty Insurance Guaranty Association.
//         </Typography>
//       );
//     case 'SC':
//       return (
//         <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
//           This company has been approved by the director or his designee of the South Carolina
//           Department of Insurance to write business in this State as an eligible surplus lines
//           insurer, but it is not afforded guaranty fund protection.
//         </Typography>
//       );
//     case 'TN':
//       return (
//         <>
//           <Typography sx={{ fontSize: 12 }}>Pursuant to Tennessee Statute § 56-14-107.</Typography>
//           <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
//             This insurance contract is with an insurer not licensed to transact insurance in this
//             state and is issued and delivered as a surplus lines coverage pursuant to the Tennessee
//             insurance statutes.
//           </Typography>
//         </>
//       );
//     case 'TX':
//       return (
//         <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
//           This insurance contract is with an insurer not licensed to transact insurance in this
//           state and is issued and delivered as surplus line coverage under the Texas insurance
//           statutes. The Texas Department of Insurance does not audit the finances or review the
//           solvency of the surplus lines insurer providing this coverage, and the insurer is not a
//           member of the property and casualty insurance guaranty association created under Chapter
//           462, Insurance Code. Chapter 225, Insurance Code, requires payment of a 4.85% (+ stamping
//           fee of .15% (.0015) percent tax on gross premium.
//         </Typography>
//       );
//     case 'VA':
//       return (
//         <>
//           <Typography sx={{ fontSize: 12, pb: 2 }}>
//             Pursuant to Missouri Statute § 384.036.
//           </Typography>
//           <Typography sx={{ fontSize: 10, fontWeight: 600 }}>
//             This is evidence of insurance procured and developed under the Missouri Surplus Lines
//             Laws. It is NOT covered by the Missouri Insurance Guaranty Association. This insurer is
//             not licensed by the state of Missouri and is not subject to its supervision.
//           </Typography>
//         </>
//       );
//     case 'WI':
//       return (
//         <Typography sx={{ fontWeight: 600, fontSize: 12 }}>
//           This insurance contract is with an insurer which has not obtained a certificate of
//           authority to transact regular insurance business in the state of Wisconsin and is issued
//           and delivered as a surplus line coverage pursuant to s. 618.41 of the Wisconsin Statutes.
//           Section 618.43(1), Wisconsin Statutes, requires payment by the policyholder of 3% tax on
//           gross premium.
//         </Typography>
//       );
//     case 'WV':
//       return (
//         <Typography
//           sx={{ color: 'red', fontSize: 16, fontWeight: 600, textTransform: 'uppercase' }}
//         >
//           THIS COMPANY IS NOT LICENSED TO DO BUSINESS IN WEST VIRGINIA AND IS NOT SUBJECT TO THE
//           WEST VIRGINIA INSURANCE GUARANTY ACT.
//         </Typography>
//       );
//     default:
//       return null;
//   }
// };
