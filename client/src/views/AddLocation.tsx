import AddLocationComponent from 'elements/forms/AddLocation';
import { useSafeParams } from 'hooks';

export function AddLocation() {
  const { policyId } = useSafeParams(['policyId']);

  return <AddLocationComponent policyId={policyId} />;
}
