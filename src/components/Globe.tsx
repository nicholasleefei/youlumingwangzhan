import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import countriesTopo from "world-atlas/countries-110m.json";

type CountrySale = {
  countryName: string;
  salesVolume: number;
};

type Props = {
  className?: string;
  accent?: string;
  ocean?: string;
  land?: string;
  graticule?: string;
  highlight?: string;
  borders?: string;
  rotateSpeed?: number;
  interactive?: boolean;
  minScale?: number;
  maxScale?: number;
  countrySales?: CountrySale[];
};

const DEFAULTS = {
  accent: "#FF7E00",
  ocean: "rgba(14, 14, 16, 0.92)",
  land: "rgba(255, 255, 255, 0.20)",
  graticule: "rgba(255, 126, 0, 0.24)",
  highlight: "rgba(255, 126, 0, 0.98)",
  borders: "rgba(255, 255, 255, 0.55)",
  rotateSpeed: 0.018,
  minScale: 0.72,
  maxScale: 1.25,
} as const;

function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getCountryIdByName(name: string, countries: any[]) {
  name = name.toLowerCase().trim();
  for (const c of countries) {
    const cname = (c.properties?.name || "").toLowerCase().trim();
    if (cname === name) return c.id;
    if (cname.includes(name) || name.includes(cname)) return c.id;
  }
  return null;
}

function getCountryNameById(id: string, countries: any[]) {
  for (const c of countries) {
    if (c.id === id) return c.properties?.name || null;
  }
  return null;
}

function getCountryCenter(country: any): [number, number] {
  const coords = country.geometry?.coordinates;
  if (!coords) return [0, 0];

  let sumLon = 0;
  let sumLat = 0;
  let count = 0;

  function processRings(rings: any): void {
    for (const ring of rings) {
      if (ring.length > 0 && Array.isArray(ring[0]) && ring[0].length >= 2 && typeof ring[0][0] === "number") {
        for (const [lon, lat] of ring) {
          sumLon += lon;
          sumLat += lat;
          count++;
        }
      } else {
        processRings(ring);
      }
    }
  }

  processRings(coords);

  if (count === 0) return [0, 0];
  return [sumLon / count, sumLat / count];
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function Globe(props: Props) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const baseRadiusRef = useRef<number>(0);
  const scaleFactorRef = useRef<number>(props.maxScale ?? DEFAULTS.maxScale);
  const rotateRef = useRef<[number, number, number]>([0, -18, 0]);
  const draggingRef = useRef(false);
  const lastPtrRef = useRef<{ x: number; y: number } | null>(null);
  const lastInteractAtRef = useRef<number>(0);
  const hoveredCountryIdRef = useRef<string | null>(null);

  const autoCarouselIndexRef = useRef(0);
  const lastCarouselAtRef = useRef(0);
  const currentAutoCountryIdRef = useRef<string | null>(null);
  const displayedCountryRef = useRef<{ name: string; sales: number } | null>(null);
  const targetRotationRef = useRef<[number, number, number] | null>(null);
  const rotationTransitionStartRef = useRef<number>(0);
  const rotationStartRef = useRef<[number, number, number]>([0, -18, 0]);

  const colors = useMemo(
    () => ({
      accent: props.accent ?? DEFAULTS.accent,
      ocean: props.ocean ?? DEFAULTS.ocean,
      land: props.land ?? DEFAULTS.land,
      graticule: props.graticule ?? DEFAULTS.graticule,
      highlight: props.highlight ?? DEFAULTS.highlight,
      borders: props.borders ?? DEFAULTS.borders,
    }),
    [props.accent, props.ocean, props.land, props.graticule, props.highlight, props.borders]
  );

  const rotateSpeed = props.rotateSpeed ?? DEFAULTS.rotateSpeed;
  const interactive = props.interactive ?? true;
  const minScale = props.minScale ?? DEFAULTS.minScale;
  const maxScale = props.maxScale ?? DEFAULTS.maxScale;
  const [userControlEnabled, setUserControlEnabled] = useState(false);

  const canUserInteract = interactive && userControlEnabled;

  const countriesFeature = useMemo(() => {
    const topo: any = countriesTopo as any;
    const obj = topo.objects?.countries;
    return obj ? (feature(topo, obj) as any) : null;
  }, []);

  const sortedSales = useMemo(() => {
    if (!props.countrySales || props.countrySales.length === 0) return [];
    return [...props.countrySales].sort((a, b) => b.salesVolume - a.salesVolume);
  }, [props.countrySales]);

  const bordersMesh = useMemo(() => {
    const topo: any = countriesTopo as any;
    const obj = topo.objects?.countries;
    if (!obj) return null;
    return mesh(topo, obj, (a: any, b: any) => a !== b) as any;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const projection = geoOrthographic();
    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    function resize() {
      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h };

      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const maxR = Math.min(w, h) / 2;
      const r = Math.floor(maxR / (props.maxScale ?? DEFAULTS.maxScale));
      baseRadiusRef.current = r;
      const sf = scaleFactorRef.current;
      projection.translate([w / 2, h / 2]).scale(r * sf);
    }

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);

    let rot = 0;
    function render() {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      const cx = w / 2;
      const cy = h / 2;
      const glowR = Math.min(w, h) * 0.62;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      g.addColorStop(0, colors.graticule);
      g.addColorStop(0.55, "rgba(255, 255, 255, 0.06)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      const now = Date.now();
      const [lambda, phi, gamma] = rotateRef.current;
      const canAutoRotate = now - lastInteractAtRef.current > 1600;
      const canCarousel = now - lastInteractAtRef.current > 2000;

      // 处理旋转过渡动画
      if (targetRotationRef.current) {
        const transitionDuration = 1500; // 1.5秒过渡时间
        const elapsed = now - rotationTransitionStartRef.current;
        const progress = Math.min(elapsed / transitionDuration, 1);
        const eased = easeOutCubic(progress);

        const [startLambda, startPhi, startGamma] = rotationStartRef.current;
        const [targetLambda, targetPhi, targetGamma] = targetRotationRef.current;

        const newLambda = startLambda + (targetLambda - startLambda) * eased;
        const newPhi = startPhi + (targetPhi - startPhi) * eased;
        const newGamma = startGamma + (targetGamma - startGamma) * eased;

        rotateRef.current = [newLambda, newPhi, newGamma];
        projection.rotate([newLambda, newPhi, newGamma]);

        if (progress >= 1) {
          targetRotationRef.current = null;
        }
      } else {
        // 只有在没有过渡动画时才自动旋转
        if (canAutoRotate) {
          rot += rotateSpeed;
        }
        const currentLambda = lambda + rot;
        projection.rotate([currentLambda, phi, gamma]);
      }

      if (canCarousel && sortedSales.length > 0 && !hoveredCountryIdRef.current) {
        if (now - lastCarouselAtRef.current > 3000) {
          autoCarouselIndexRef.current = (autoCarouselIndexRef.current + 1) % sortedSales.length;
          lastCarouselAtRef.current = now;
        }
        const sale = sortedSales[autoCarouselIndexRef.current];
        if (countriesFeature) {
          const id = getCountryIdByName(sale.countryName, countriesFeature.features);
          currentAutoCountryIdRef.current = id;
          displayedCountryRef.current = { name: sale.countryName, sales: sale.salesVolume };

          // 如果找到了国家，计算其中心点并设置旋转目标
          if (id) {
            const country = countriesFeature.features.find((c: any) => c.id === id);
            if (country) {
              const [lon, lat] = getCountryCenter(country);
              targetRotationRef.current = [-lon, -lat, 0];
              rotationStartRef.current = [...rotateRef.current];
              rotationTransitionStartRef.current = now;
            }
          }
        }
      } else {
        currentAutoCountryIdRef.current = null;
        if (hoveredCountryIdRef.current && countriesFeature) {
          const name = getCountryNameById(hoveredCountryIdRef.current, countriesFeature.features);
          if (name) {
            const sale = sortedSales.find((s) => {
              const sName = s.countryName.toLowerCase().trim();
              const cName = name.toLowerCase().trim();
              return sName === cName || sName.includes(cName) || cName.includes(sName);
            });
            displayedCountryRef.current = { name, sales: sale?.salesVolume || 0 };

            // 如果找到了国家，计算其中心点并设置旋转目标
            const country = countriesFeature.features.find((c: any) => c.id === hoveredCountryIdRef.current);
            if (country) {
              const [lon, lat] = getCountryCenter(country);
              targetRotationRef.current = [-lon, -lat, 0];
              rotationStartRef.current = [...rotateRef.current];
              rotationTransitionStartRef.current = now;
            }
          }
        } else if (!canCarousel) {
          displayedCountryRef.current = null;
          targetRotationRef.current = null;
        }
      }

      ctx.beginPath();
      path({ type: "Sphere" } as any);
      ctx.fillStyle = colors.ocean;
      ctx.fill();

      ctx.beginPath();
      path(graticule as any);
      ctx.strokeStyle = colors.graticule;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      if (countriesFeature) {
        for (const country of countriesFeature.features) {
          ctx.beginPath();
          path(country);
          const isHovered = hoveredCountryIdRef.current === country.id;
          const isAutoCarousel = currentAutoCountryIdRef.current === country.id;
          if (isHovered || isAutoCarousel) {
            ctx.fillStyle = colors.highlight;
          } else {
            ctx.fillStyle = colors.land;
          }
          ctx.fill();
        }
      }

      if (bordersMesh) {
        ctx.beginPath();
        path(bordersMesh);
        ctx.strokeStyle = colors.borders;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      ctx.beginPath();
      path({ type: "Sphere" } as any);
      ctx.strokeStyle = colors.graticule;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (rot > 180) rot = -180;
      rafRef.current = window.requestAnimationFrame(render);
    }

    rafRef.current = window.requestAnimationFrame(render);

    function clamp(n: number, a: number, b: number) {
      return Math.min(b, Math.max(a, n));
    }

    function onPointerDown(e: PointerEvent) {
      if (!interactive) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const r = baseRadiusRef.current * scaleFactorRef.current;
      
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r * r) {
        return;
      }
      
      draggingRef.current = true;
      lastPtrRef.current = { x: e.clientX, y: e.clientY };
      lastInteractAtRef.current = Date.now();
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!interactive) return;
      lastInteractAtRef.current = Date.now();

      if (draggingRef.current) {
        const last = lastPtrRef.current;
        if (!last) return;
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        lastPtrRef.current = { x: e.clientX, y: e.clientY };

        const { w, h } = sizeRef.current;
        const dragScale = 180 / Math.max(320, Math.min(w, h));
        const [lambda, phi, gamma] = rotateRef.current;
        const nextLambda = lambda + dx * dragScale;
        const nextPhi = clamp(phi - dy * dragScale, -70, 70);
        rotateRef.current = [nextLambda, nextPhi, gamma];
      } else {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const [lon, lat] = projection.invert([x, y]) || [0, 0];

        let foundId: string | null = null;
        if (countriesFeature) {
          for (const country of countriesFeature.features) {
            const coords = country.geometry?.coordinates;
            if (!coords) continue;

            function checkRings(rings: any): boolean {
              for (const ring of rings) {
                if (ring.length > 0 && Array.isArray(ring[0]) && ring[0].length >= 2 && typeof ring[0][0] === "number") {
                  if (pointInPolygon([lon, lat], ring as [number, number][])) return true;
                } else {
                  if (checkRings(ring)) return true;
                }
              }
              return false;
            }

            if (checkRings(coords)) {
              foundId = country.id;
              break;
            }
          }
        }
        hoveredCountryIdRef.current = foundId;
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (!interactive) return;
      draggingRef.current = false;
      lastPtrRef.current = null;
      lastInteractAtRef.current = Date.now();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        return;
      }
    }

    function onPointerLeave() {
      hoveredCountryIdRef.current = null;
    }

    function onWheel(e: WheelEvent) {
      if (!interactive) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const r = baseRadiusRef.current * scaleFactorRef.current;
      
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > r * r) {
        return;
      }
      
      e.preventDefault();
      const delta = e.deltaY;
      const step = delta > 0 ? -0.06 : 0.06;
      const next = clamp(scaleFactorRef.current + step, minScale, maxScale);
      scaleFactorRef.current = next;
      projection.scale(baseRadiusRef.current * next);
      lastInteractAtRef.current = Date.now();
    }

    if (canUserInteract) {
      canvas.style.touchAction = "none";
      canvas.style.cursor = "grab";
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerLeave);
      canvas.addEventListener("wheel", onWheel, { passive: false });
    }

    return () => {
      ro.disconnect();
      if (canUserInteract) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("wheel", onWheel as any);
      }
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [bordersMesh, colors, countriesFeature, canUserInteract, maxScale, minScale, rotateSpeed, sortedSales]);

  const [displayedCountry, setDisplayedCountry] = useState<{ name: string; sales: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedCountry(displayedCountryRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, [props.countrySales]);

  return (
    <div className={props.className} style={{ pointerEvents: 'auto' }}>
      <div className="relative h-full w-full">
        <canvas ref={canvasRef} className="h-full w-full border-none outline-none !pointer-events-auto" style={{ pointerEvents: 'auto' }} />
        {displayedCountry ? (
          <div className="pointer-events-none absolute top-4 right-4 rounded-xl border border-black/10 bg-white/85 px-4 py-2 text-sm text-black/70 backdrop-blur">
            <div className="text-xs">{t('home.globe.country')}</div>
            <div className="font-medium text-black">{displayedCountry.name}</div>
            <div className="mt-1 text-xs">{t('home.globe.sales')}</div>
            <div className="font-semibold text-black">{displayedCountry.sales.toLocaleString()}</div>
          </div>
        ) : null}
        <button
          onClick={() => setUserControlEnabled(!userControlEnabled)}
          className={`absolute bottom-4 right-4 rounded-full border px-4 py-2 text-xs backdrop-blur transition-all ${
            userControlEnabled
              ? 'bg-[rgba(255,126,0,0.16)] border-[rgba(255,126,0,0.55)] text-[#FF7E00]'
              : 'bg-bg-card/80 border-border text-text-secondary hover:bg-bg-card hover:text-text-primary'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          {userControlEnabled ? '🖐️ 已开启控制' : '🔒 开启控制'}
        </button>
      </div>
    </div>
  );
}
