import { PageMeta } from 'components';
import AddLocationComponent from 'elements/forms/AddLocation';
import { useSafeParams } from 'hooks';

export function AddLocation() {
  const { policyId } = useSafeParams(['policyId']);

  return (
    <>
      <PageMeta title={`iDemand - Add Location ${policyId}`} />
      <AddLocationComponent policyId={policyId} />
    </>
  );
}
