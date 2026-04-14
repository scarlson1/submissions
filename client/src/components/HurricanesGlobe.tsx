import { Box, useTheme } from '@mui/material';
import createGlobe from 'cobe';
import { useCallback, useEffect, useRef } from 'react';

// TODO: DELETE ?? NOT USED

// ─── Types ────────────────────────────────────────────────────────────────────

type RGBTuple = [number, number, number];

interface HurricaneStorm {
  name: string;
  color: RGBTuple;
  category: number;
  /** Each point is [latitude, longitude] — same convention as cobe */
  points: [lat: number, lng: number][];
}

type BasinMode = 'all' | 'atlantic' | 'pacific';

// ─── Storm Track Data ─────────────────────────────────────────────────────────
// Points are [latitude, longitude] to match cobe's convention

const STORMS: Record<Exclude<BasinMode, 'all'>, HurricaneStorm[]> = {
  atlantic: [
    {
      name: 'Katrina',
      color: [0.89, 0.29, 0.29],
      category: 5,
      points: [
        [23.4, -85.1],
        [24.5, -84.0],
        [25.4, -82.6],
        [26.2, -80.5],
        [27.2, -89.6],
        [27.8, -90.5],
        [28.5, -89.2],
        [29.5, -89.6],
        [30.4, -89.1],
        [32.1, -88.5],
      ],
    },
    {
      name: 'Irma',
      color: [0.89, 0.29, 0.29],
      category: 5,
      points: [
        [16.1, -60.9],
        [17.0, -61.5],
        [18.5, -63.0],
        [20.2, -65.5],
        [21.4, -67.8],
        [22.6, -70.4],
        [23.4, -72.8],
        [24.3, -75.0],
        [25.6, -77.2],
        [26.8, -79.8],
        [29.0, -81.5],
        [31.2, -82.0],
      ],
    },
    {
      name: 'Harvey',
      color: [0.94, 0.62, 0.15],
      category: 4,
      points: [
        [17.5, -86.0],
        [18.6, -87.2],
        [20.0, -88.5],
        [21.4, -90.1],
        [23.0, -91.8],
        [24.5, -93.2],
        [26.0, -94.5],
        [27.4, -96.0],
        [28.2, -97.0],
      ],
    },
    {
      name: 'Sandy',
      color: [0.94, 0.62, 0.15],
      category: 2,
      points: [
        [14.0, -76.0],
        [16.0, -75.5],
        [18.5, -74.8],
        [21.0, -75.5],
        [23.6, -76.5],
        [25.8, -77.0],
        [28.0, -76.2],
        [30.4, -74.5],
        [32.8, -73.5],
        [35.0, -72.8],
        [37.6, -72.2],
        [40.0, -74.0],
      ],
    },
    {
      name: 'Dorian',
      color: [0.36, 0.79, 0.65],
      category: 5,
      points: [
        [14.5, -67.0],
        [16.2, -68.8],
        [17.8, -70.5],
        [19.0, -72.0],
        [20.5, -74.0],
        [21.8, -76.5],
        [23.2, -77.5],
        [25.5, -77.0],
        [26.8, -77.2],
        [28.2, -78.5],
        [29.8, -77.0],
        [32.2, -75.0],
      ],
    },
  ],
  pacific: [
    {
      name: 'Patricia',
      color: [0.89, 0.29, 0.29],
      category: 5,
      points: [
        [9.5, -100.0],
        [10.8, -101.5],
        [12.0, -102.8],
        [13.5, -103.5],
        [15.0, -104.0],
        [16.8, -104.5],
        [18.0, -104.8],
        [19.5, -105.2],
      ],
    },
    {
      name: 'Haiyan',
      color: [0.89, 0.29, 0.29],
      category: 5,
      points: [
        [6.5, 146.0],
        [7.8, 147.5],
        [8.5, 149.0],
        [9.0, 150.8],
        [9.8, 152.5],
        [10.5, 154.0],
        [11.0, 156.0],
        [11.2, 158.5],
        [11.5, 121.0],
        [12.2, 118.5],
        [13.5, 116.0],
      ],
    },
    {
      name: 'Tip',
      color: [0.94, 0.62, 0.15],
      category: 4,
      points: [
        [8.5, 138.0],
        [10.2, 140.5],
        [12.0, 143.0],
        [14.2, 145.5],
        [16.5, 147.8],
        [18.8, 150.0],
        [21.0, 152.0],
        [23.5, 152.5],
      ],
    },
    {
      name: 'Ioke',
      color: [0.36, 0.79, 0.65],
      category: 4,
      points: [
        [6.0, -165.0],
        [7.5, -167.2],
        [9.0, -168.8],
        [10.5, -170.5],
        [12.0, 175.0],
        [14.0, 173.0],
        [16.5, 171.5],
        [19.0, 170.0],
      ],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStorms(mode: BasinMode): HurricaneStorm[] {
  if (mode === 'all') return [...STORMS.atlantic, ...STORMS.pacific];
  return STORMS[mode];
}

/**
 * Builds the arcs array for cobe using its native format:
 *   { from: [lat, lng], to: [lat, lng], color?: RGBTuple }
 *
 * Animates a "front" along each storm's track, keeping a short trail visible.
 */
function buildArcs(storms: HurricaneStorm[], t: number) {
  const SPEED = 0.15;
  const TRAIL = 0.2;

  return storms.flatMap((storm, si) => {
    const offset = (si * 0.65) % 1;
    const localT = (t * SPEED + offset) % 1;
    const segCount = storm.points.length - 1;

    return storm.points.slice(0, -1).flatMap((pt, i) => {
      const segStart = i / segCount;
      const segEnd = (i + 1) / segCount;
      if (localT < segStart || localT > segEnd + TRAIL) return [];
      return [{ from: pt, to: storm.points[i + 1], color: storm.color }];
    });
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HurricaneGlobeProps {
  /** Logical size in CSS pixels. Defaults to 500. */
  size?: number;
  autoRotateSpeed?: number;
}

export function HurricaneGlobe({
  size = 500,
  autoRotateSpeed = 0.003,
}: HurricaneGlobeProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiRef = useRef(0.4);
  const thetaRef = useRef(0.15);
  const thetaOffsetRef = useRef(0);
  const animTRef = useRef(0);
  const pointerDownRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);

  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvasRef.current.offsetWidth;
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 640 ? 1.8 : 2,
    );

    // cobe's width/height are the raw canvas pixel dimensions
    // (i.e. logical size × devicePixelRatio)
    // const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    // const px = size * dpr;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      //   devicePixelRatio: window.devicePixelRatio || 1,
      width: width, // size, // px,
      height: width, // size, //px,
      //   phi: phiRef.current,
      //   theta: thetaRef.current,
      phi: 0,
      theta: 0.2,
      // 0 = light mode, 1 = dark mode
      dark: isDark ? 0.9 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      mapBaseBrightness: 0,
      // baseColor is the land/dot color — [0.3, 0.3, 0.3] is the official default
      baseColor: isDark ? [0.3, 0.3, 0.3] : [1, 1, 1],
      markerColor: isDark ? [1, 0.5, 1] : [0.3, 0.5, 1],
      glowColor: isDark ? [0.1, 0.1, 0.1] : [1, 1, 1],
      markers: [],
      arcs: [],
      // arcColor / arcWidth are the global defaults; per-arc color overrides these
      arcColor: [1, 0.5, 0.25],
      arcWidth: 0.5,
      arcHeight: 0.05,
      // @ts-ignore
      //   onRender(state) {
      //     animTRef.current += 0.004;
      //     if (!pointerDownRef.current) phiRef.current += autoRotateSpeed;
      //     state.phi = phiRef.current;
      //     state.theta = thetaRef.current;
      //     state.arcs = buildArcs(getStorms(modeRef.current), animTRef.current);
      //   },
      //   onRender(state) {
      //     animTRef.current += 0.004;
      //     if (!pointerDownRef.current) phiRef.current += autoRotateSpeed;
      //     state.phi = phiRef.current;
      //     state.theta = thetaRef.current;
      //     state.arcs = buildArcs(
      //       getStormsForMode(modeRef.current),
      //       animTRef.current,
      //     );
      //   },
    });

    let animationId: number;
    function animate() {
      //   const s = stateRef.current;
      //   if (s.autoRotate)
      phiRef.current += 0.003;
      globe.update({
        phi: 0 + phiRef.current + dragOffset.current.phi,
        theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        arcs: buildArcs(getStorms('all'), animTRef.current),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, isDark, autoRotateSpeed]);

  function renderFrame(state: any) {
    animTRef.current += 0.004;
    if (!pointerDownRef.current) phiRef.current += autoRotateSpeed;
    state.phi = phiRef.current;
    state.theta = thetaRef.current;
    state.arcs = buildArcs(getStorms('all'), animTRef.current);
  }

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      pointerDownRef.current = true;
      lastXRef.current = e.clientX;
      lastYRef.current = e.clientY;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!pointerDownRef.current) return;
      phiRef.current += (e.clientX - lastXRef.current) * 0.005;
      thetaRef.current = Math.max(
        -0.5,
        Math.min(
          0.8,
          thetaRef.current + (e.clientY - lastYRef.current) * 0.003,
        ),
      );
      lastXRef.current = e.clientX;
      lastYRef.current = e.clientY;
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    pointerDownRef.current = false;
  }, []);

  //   const legend = [
  //     { label: 'Category 4–5', color: 'rgb(227,75,75)' },
  //     { label: 'Category 2–3', color: 'rgb(239,159,39)' },
  //     { label: 'Tropical storm', color: 'rgb(93,202,165)' },
  //   ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size * Math.min(window.devicePixelRatio ?? 1, 2)}
        height={size * Math.min(window.devicePixelRatio ?? 1, 2)}
        // width={size}
        // height={size}
        style={{
          width: size,
          height: size,
          maxWidth: '100%',
          borderRadius: '50%',
          cursor: 'grab',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </Box>
  );
}
