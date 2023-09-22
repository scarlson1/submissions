import { LocationsGrid } from 'elements/grids';
import { parentTypeCol } from 'modules/muiGrid';

export const AdminLocations = () => {
  return <LocationsGrid additionalColumns={[parentTypeCol]} />;
};
