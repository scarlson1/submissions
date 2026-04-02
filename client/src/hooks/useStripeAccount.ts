import { useSuspenseQuery } from '@tanstack/react-query';
import { functionsInstance } from 'api';

const fetchStripeAccount = async (orgId: string) => {
  const { data } = await functionsInstance.get(`/stripe/account/${orgId}`);
  return data;
};

export const useStripeAccount = (orgId: string) => {
  return useSuspenseQuery({
    queryKey: ['stripe', orgId, 'accountDetails'],
    queryFn: () => fetchStripeAccount(orgId),
  });
};

// interface Account {
//   id: string;

//   object: 'account';

//   business_profile?: Stripe.Account.BusinessProfile | null;

//   business_type?: Account.BusinessType | null;

//   capabilities?: Account.Capabilities;

//   charges_enabled: boolean;

//   company?: Account.Company;

//   controller?: Account.Controller;

//   country?: string;

//   created?: number;

//   default_currency?: string;

//   deleted?: void;

//   details_submitted: boolean;

//   email: string | null;

//   external_accounts?: ApiList<Stripe.ExternalAccount>;

//   future_requirements?: Account.FutureRequirements;

//   individual?: Person

//   metadata?: Stripe.Metadata;

//   payouts_enabled: boolean;

//   requirements?: Account.Requirements;

//   settings?: Account.Settings | null;

//   tos_acceptance?: Account.TosAcceptance;

//   type: Account.Type;
// }
