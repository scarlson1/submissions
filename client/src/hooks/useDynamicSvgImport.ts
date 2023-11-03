import { useEffect, useRef, useState } from 'react';

export function useDynamicSvgImport(iconName: string) {
  const importedIconRef = useRef<React.FC<React.SVGProps<SVGElement>>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    setLoading(true);
    const importSvgIcon = async (): Promise<void> => {
      try {
        // have to give absolute path while importing the icon
        console.log(`loading img: ${iconName}`);
        const result = await import(`../assets/images/${iconName}.svg?react`); // .ReactComponent; // svgr provides ReactComponent for svg url
        console.log('IMPORT:', result);
        importedIconRef.current = result.ReactComponent;
      } catch (err) {
        setError(err);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    importSvgIcon();
  }, [iconName]);

  useEffect(() => {
    console.log('img: ', importedIconRef.current);
  }, [loading]);

  return { error, loading, SvgIcon: importedIconRef.current };
}
