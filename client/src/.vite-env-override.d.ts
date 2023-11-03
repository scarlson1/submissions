// https://vitejs.dev/guide/features.html#client-types
import { FunctionComponent } from 'react';

declare module '*.svg' {
  const content: FunctionComponent<React.SVGProps<SVGElement>>;
  export default content;
}
