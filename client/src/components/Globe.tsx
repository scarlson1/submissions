'use client';

import { Box } from '@mui/material';
import createGlobe, { type Marker } from 'cobe';
import { useCallback, useEffect, useRef, useState } from 'react';

// const pulseMarkers = [
//   { id: 'pulse-1', location: [51.51, -0.13] as [number, number], delay: 0 },
//   { id: 'pulse-2', location: [40.71, -74.01] as [number, number], delay: 0.5 },
//   { id: 'pulse-3', location: [35.68, 139.65] as [number, number], delay: 1 },
//   { id: 'pulse-4', location: [-33.87, 151.21] as [number, number], delay: 1.5 },
// ];

export function Globe({
  //   height,
  //   width,
  autoRotate: autoRotateInit = false,
  markers = [],
}: {
  //   height: number;
  //   width: number;
  autoRotate?: boolean;
  markers?: (Marker & { delay: number })[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const [preset, setPreset] = useState<string>('default'); // keyof typeof playgroundPresets
  const [markerPreset, setMarkerPreset] = useState<string>('World Cities'); // keyof typeof markerPresets
  const [phi, setPhi] = useState(0);
  const [theta, setTheta] = useState(0.2);
  const [dark, setDark] = useState(0);
  const [diffuse, setDiffuse] = useState(1.2);
  const [mapSamples, setMapSamples] = useState(16000);
  const [mapBrightness, setMapBrightness] = useState(6);
  const [mapBaseBrightness, setMapBaseBrightness] = useState(0);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [markerSize, setMarkerSize] = useState(0.04);
  const [markerElevation, setMarkerElevation] = useState(0);
  const [showArcs, setShowArcs] = useState(true);
  const [arcHeight, setArcHeight] = useState(0.25);
  const [arcWidth, setArcWidth] = useState(0.4);
  const [autoRotate, setAutoRotate] = useState(() => autoRotateInit);

  const stateRef = useRef({
    phi,
    theta,
    dark,
    diffuse,
    mapSamples,
    mapBrightness,
    mapBaseBrightness,
    scale,
    offsetX,
    offsetY,
    markerSize,
    markerElevation,
    showArcs,
    arcHeight,
    arcWidth,
    autoRotate,
    baseColor: [1, 1, 1] as [number, number, number], // playgroundPresets.default.baseColor,
    markerColor: [0.3, 0.5, 1] as [number, number, number], // playgroundPresets.default.markerColor,
    markers: markers, // markerPresets['World Cities'].markers,
    arcs: [], // markerPresets['World Cities'].arcs,
    glowColor: [1, 1, 1] as [number, number, number], // playgroundPresets.default.glowColor,
  });

  useEffect(() => {
    stateRef.current = {
      phi,
      theta,
      dark,
      diffuse,
      mapSamples,
      mapBrightness,
      mapBaseBrightness,
      scale,
      offsetX,
      offsetY,
      markerSize,
      markerElevation,
      showArcs,
      arcHeight,
      arcWidth,
      autoRotate,
      baseColor: [1, 1, 1] as [number, number, number], // playgroundPresets[preset].baseColor,
      markerColor: [0.3, 0.5, 1] as [number, number, number], // playgroundPresets[preset].markerColor,
      glowColor: [1, 1, 1] as [number, number, number], // playgroundPresets[preset].glowColor,
      markers: markers, // markerPresets[markerPreset].markers,
      arcs: [], // markerPresets[markerPreset].arcs,
    };
  }, [
    phi,
    theta,
    dark,
    diffuse,
    mapSamples,
    mapBrightness,
    mapBaseBrightness,
    scale,
    offsetX,
    offsetY,
    markerSize,
    markerElevation,
    showArcs,
    arcHeight,
    arcWidth,
    autoRotate,
    preset,
    markerPreset,
  ]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.offsetWidth;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 640 ? 1.8 : 2,
    );

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width: width,
      height: width,
      phi: 0,
      theta: 0.2,
      dark: 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [0.3, 0.5, 1],
      glowColor: [1, 1, 1],
      markers: stateRef.current.markers.map((m) => ({ ...m, size: 0.04 })),
      arcs: stateRef.current.arcs,
      arcColor: [0.3, 0.5, 1],
      arcWidth: 0.4,
      arcHeight: 0.25,
    });

    let animationId: number;
    function animate() {
      const s = stateRef.current;
      if (s.autoRotate) {
        phiRef.current += 0.003;
      }
      globe.update({
        phi: s.phi + phiRef.current + dragOffset.current.phi,
        theta: s.theta + thetaOffsetRef.current + dragOffset.current.theta,
        scale: s.scale,
        offset: [s.offsetX, s.offsetY],
        dark: s.dark,
        diffuse: s.diffuse,
        mapSamples: s.mapSamples,
        mapBrightness: s.mapBrightness,
        mapBaseBrightness: s.mapBaseBrightness,
        baseColor: s.baseColor,
        markerColor: s.markerColor,
        glowColor: s.glowColor,
        markerElevation: s.markerElevation,
        markers: s.markers.map((m) => ({ ...m, size: s.markerSize })),
        arcs: s.showArcs ? s.arcs : [],
        arcHeight: s.arcHeight,
        arcWidth: s.arcWidth,
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();

    globeRef.current = globe;
    setTimeout(
      () => canvasRef.current && (canvasRef.current.style.opacity = '1'),
    );
    return () => {
      cancelAnimationFrame(animationId);
      globe.destroy();
    };
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x;
      const deltaY = e.clientY - pointerInteracting.current.y;
      dragOffset.current = {
        phi: deltaX / 150,
        theta: deltaY / 300,
      };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      //   className='showcase-phase-item'
      style={{ aspectRatio: 1, position: 'relative' }}
    >
      <Box
        // className='showcase-phase-globe'
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          userSelect: 'none',
          contain: 'layout style',
        }}
      >
        {/* <svg width='0' height='0' style={{ position: 'absolute' }}>
          <defs>
            <filter id='sticker-outline'>
              <feMorphology
                in='SourceAlpha'
                result='Dilated'
                operator='dilate'
                radius='2'
              />
              <feFlood floodColor='#ffffff' result='OutlineColor' />
              <feComposite
                in='OutlineColor'
                in2='Dilated'
                operator='in'
                result='Outline'
              />
              <feMerge>
                <feMergeNode in='Outline' />
                <feMergeNode in='SourceGraphic' />
              </feMerge>
            </filter>
          </defs>
        </svg> */}
        <canvas
          // component='canvas'
          className='showcase-phase-canvas'
          //   className='playground-canvas'
          ref={canvasRef}
          style={{
            height: '100%',
            width: '100%',
            opacity: 0,
            transition: 'opacity 0.5s',
            cursor: 'grab',
            touchAction: 'none',
          }}
          //   sx={{ height: '100%', width: '100%' }}
          onPointerDown={(e) => {
            pointerInteracting.current = { x: e.clientX, y: e.clientY };
            if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
          }}
        />
        {markers.map((m) => (
          <Box
            key={m.id}
            className='showcase-pulse'
            sx={{
              position: 'absolute',
              bottom: 'anchor(center)',
              left: 'anchor(center)',
              translate: '-50% 50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              transition: 'opacity 0.4s, filter 0.4s',
              positionAnchor: `--cobe-${m.id}`,
              opacity: `var(--cobe-visible-${m.id}, 0)`,
              filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
              '--delay': `${m.delay}s`,
            }}
            // style={
            //   {
            //     positionAnchor: `--cobe-${m.id}`,
            //     opacity: `var(--cobe-visible-${m.id}, 0)`,
            //     filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
            //     '--delay': `${m.delay}s`,
            //   } as React.CSSProperties
            // }
          >
            <Box
              component='span'
              className='showcase-pulse-ring'
              sx={{
                position: 'absolute',
                inset: 0,
                border: (theme) => `2px solid ${theme.palette.primary.main}`,
                borderRadius: '50%',
                opacity: 0,
                animation: 'pulse-expand 2s ease-out infinite',
                animationDelay: '0s', // 'var(--delay, 0s)',
                '@keyframes pulse-expand': {
                  '0%': { transform: 'scale(0.3)', opacity: 0.8 },
                  '100%': { transform: 'scale(1.5)', opacity: 0 },
                },
              }}
            />
            <Box
              component='span'
              className='showcase-pulse-ring'
              sx={{
                position: 'absolute',
                inset: 0,
                border: (theme) => `2px solid ${theme.palette.primary.main}`,
                borderRadius: '50%',
                opacity: 0,
                animation: 'pulse-expand 2s ease-out infinite',
                animationDelay: '0.5s', // 'var(--delay, 0s)',
                '@keyframes pulse-expand': {
                  '0%': { transform: 'scale(0.3)', opacity: 0.8 },
                  '100%': { transform: 'scale(1.5)', opacity: 0 },
                },
              }}
            />
            <Box
              component='span'
              sx={{
                width: '8px',
                height: '8px',
                background: (theme) => theme.palette.primary.main, // var(--ink),
                borderRadius: '50%',
                boxShadow: (theme) =>
                  `0 0 0 3px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.primary.main}`,
              }}
              className='showcase-pulse-dot'
            />
            {/* <span className='showcase-pulse-ring' />
            <span className='showcase-pulse-ring' />
            <span className='showcase-pulse-dot' /> */}
          </Box>
        ))}
      </Box>
    </div>
  );

  //   return (
  //     <div
  //       //   className='showcase-phase-item'
  //       style={{ aspectRatio: 1, position: 'relative' }}
  //     >
  //       <Box
  //         // className='showcase-phase-globe'
  //         sx={{
  //           width: '100%',
  //           height: '100%',
  //           position: 'relative',
  //           userSelect: 'none',
  //           contain: 'layout style',
  //         }}
  //       >
  //         <svg width='0' height='0' style={{ position: 'absolute' }}>
  //           <defs>
  //             <filter id='sticker-outline'>
  //               <feMorphology
  //                 in='SourceAlpha'
  //                 result='Dilated'
  //                 operator='dilate'
  //                 radius='2'
  //               />
  //               <feFlood floodColor='#ffffff' result='OutlineColor' />
  //               <feComposite
  //                 in='OutlineColor'
  //                 in2='Dilated'
  //                 operator='in'
  //                 result='Outline'
  //               />
  //               <feMerge>
  //                 <feMergeNode in='Outline' />
  //                 <feMergeNode in='SourceGraphic' />
  //               </feMerge>
  //             </filter>
  //           </defs>
  //         </svg>
  //         <canvas
  //           // component='canvas'
  //           // className='showcase-phase-canvas'
  //           className='playground-canvas'
  //           ref={canvasRef}
  //           style={{ height: '100%', width: '100%', opacity: 0, transition: 'opacity 0.5s',
  //             cursor: 'grab',
  //             touchAction: 'none' }}
  //           //   sx={{ height: '100%', width: '100%' }}
  //           onPointerDown={(e) => {
  //             pointerInteracting.current = { x: e.clientX, y: e.clientY };
  //             if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  //           }}
  //         />
  //         {markers.map((m) => (
  //           <Box
  //             key={m.id}
  //             // className='showcase-pulse'
  //             sx={{
  //               position: 'absolute',
  //               bottom: 'anchor(center)',
  //               left: 'anchor(center)',
  //               translate: '-50% 50%',
  //               width: '20px',
  //               height: '20px',
  //               display: 'flex',
  //               alignItems: 'center',
  //               justifyContent: 'center',
  //               pointerEvents: 'none',
  //               transition: 'opacity 0.4s, filter 0.4s',
  //               positionAnchor: `--cobe-${m.id}`,
  //               opacity: `var(--cobe-visible-${m.id}, 0)`,
  //               filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
  //               '--delay': `${m.delay}s`,
  //             }}
  //             // style={
  //             //   {
  //             //     positionAnchor: `--cobe-${m.id}`,
  //             //     opacity: `var(--cobe-visible-${m.id}, 0)`,
  //             //     filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
  //             //     '--delay': `${m.delay}s`,
  //             //   } as React.CSSProperties
  //             // }
  //           >
  //             <Box
  //               component='span'
  //               sx={{
  //                 position: 'absolute',
  //                 inset: 0,
  //                 border: (theme) => `1px solid ${theme.palette.primary.main}`,
  //                 borderRadius: '50%',
  //                 opacity: 0,
  //                 animation: 'pulse-expand 2s ease-out infinite',
  //                 animationDelay: '0s', // 'var(--delay, 0s)',
  //                 '@keyframes pulse-expand': {
  //                   '0%': { transform: 'scale(0.3)', opacity: 0.8 },
  //                   '100%': { transform: 'scale(1.5)', opacity: 0 },
  //                 },
  //               }}
  //             />
  //             <Box
  //               component='span'
  //               sx={{
  //                 position: 'absolute',
  //                 inset: 0,
  //                 border: (theme) => `2px solid ${theme.palette.primary.main}`,
  //                 borderRadius: '50%',
  //                 opacity: 0,
  //                 animation: 'pulse-expand 2s ease-out infinite',
  //                 animationDelay: '0.5s', // 'var(--delay, 0s)',
  //                 '@keyframes pulse-expand': {
  //                   '0%': { transform: 'scale(0.3)', opacity: 0.8 },
  //                   '100%': { transform: 'scale(1.5)', opacity: 0 },
  //                 },
  //               }}
  //             />
  //             <Box
  //               component='span'
  //               sx={{
  //                 width: '4px',
  //                 height: '4px',
  //                 background: (theme) => theme.palette.primary.main, // var(--ink),
  //                 borderRadius: '50%',
  //                 boxShadow: (theme) =>
  //                   `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.primary.main}`,
  //               }}
  //               className='showcase-pulse-dot'
  //             />
  //             {/* <span className='showcase-pulse-ring' />
  //             <span className='showcase-pulse-ring' />
  //             <span className='showcase-pulse-dot' /> */}
  //           </Box>
  //         ))}
  //       </Box>
  //     </div>
  //   );
}
