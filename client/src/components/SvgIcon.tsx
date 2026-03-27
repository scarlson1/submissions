import { useDynamicSvgImport } from 'hooks/useDynamicSvgImport';

export interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
  iconName: string;
  wrapperStyle?: string;
  // svgProps?: React.SVGProps<SVGSVGElement>;
}

// TODO: handle loading

export function SvgIcon({ iconName, wrapperStyle, ...svgProps }: SvgIconProps) {
  const { loading, SvgIcon } = useDynamicSvgImport(iconName);

  return (
    <>
      {/* {loading && <div className='rounded-full bg-slate-400 animate-pulse h-8 w-8'></div>} */}
      {SvgIcon && (
        <div className={wrapperStyle}>
          <SvgIcon {...svgProps} />
        </div>
      )}
    </>
  );
}
