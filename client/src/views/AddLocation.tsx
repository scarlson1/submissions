import AddLocationComponent from 'elements/forms/AddLocation';
import { useSafeParams } from 'hooks';
import { PageMeta } from 'router';

export function AddLocation() {
  const { policyId } = useSafeParams(['policyId']);

  return (
    <>
      <PageMeta title={`iDemand - Add Location ${policyId}`} />
      <AddLocationComponent policyId={policyId} />
    </>
  );
}
