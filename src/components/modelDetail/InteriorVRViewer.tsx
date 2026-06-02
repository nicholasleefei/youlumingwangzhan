import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";

type Props = {
  label: string;
  images: string[];
  variant?: "card" | "plain";
};

export default function InteriorVRViewer({ label, images, variant = "card" }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Pannellum CSS
    if (!document.getElementById("pannellum-css")) {
      const link = document.createElement("link");
      link.id = "pannellum-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      document.head.appendChild(link);
    }
    
    // Load Pannellum JS if not already loaded
    const loadPannellum = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.pannellum) {
          resolve();
          return;
        }
        
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pannellum"));
        document.body.appendChild(script);
      });
    };

    let isMounted = true;

    loadPannellum().then(() => {
      if (!isMounted || !containerRef.current) return;
      
      // Clean up previous viewer
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      
      if (!images || images.length < 6) {
        setError(t("model.panoramaInsufficient"));
        return;
      }
      
      setError(null);
      
      try {
        // Find front, back, left, right, up, down based on typical URL patterns if possible
        // The downloader saves them as 0, 1, 2, 3, 4, 5 corresponding to f, b, l, r, u, d
        // f=front, b=back, l=left, r=right, u=up, d=down
        // Pannellum multires cube map expects: [front, right, back, left, up, down]
        // But for simple cubeMap: [front, right, back, left, up, down] or similar.
        
        // Based on downloader: f=0, b=1, l=2, r=3, u=4, d=5
        // Pannellum expected order for cubemap: [front, right, back, left, up, down]
        // Which maps to indices: [0, 3, 1, 2, 4, 5]
        
        const cubeMapImages = [
          images[0], // front
          images[3], // right
          images[1], // back
          images[2], // left
          images[4], // up
          images[5]  // down
        ];
        
        viewerRef.current = window.pannellum.viewer(containerRef.current, {
          type: "cubemap",
          cubeMap: cubeMapImages,
          autoLoad: true,
          showControls: false,
          compass: false,
          mouseZoom: true,
          draggable: true
        });
      } catch (err: any) {
        console.error("Pannellum init error:", err);
        setError(t("model.panoramaLoadFailed"));
      }
    }).catch(err => {
      if (isMounted) setError(t("model.panoramaLoadFailed"));
    });

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [images]);

  const reset = () => {
    if (viewerRef.current) {
      viewerRef.current.setPitch(0);
      viewerRef.current.setYaw(0);
      viewerRef.current.setHfov(100);
    }
  };

  const viewer = (
    <div
      className={
        variant === "plain"
          ? "relative aspect-[16/9] md:aspect-[3/2] bg-zinc-950/0"
          : "relative aspect-[16/9] bg-zinc-950/5"
      }
    >
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">{error}</div>
      ) : (
        <div ref={containerRef} className="h-full w-full" />
      )}
      <button
        type="button"
        onClick={reset}
        disabled={!images || images.length < 6 || !!error}
        className={
          variant === "plain"
            ? "absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-700 backdrop-blur hover:bg-white disabled:opacity-50"
            : "hidden"
        }
      >
        <RotateCcw className="h-4 w-4" />
        {t("model.resetView")}
      </button>
      {images && images.length >= 6 && !error ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs text-zinc-700 backdrop-blur">
          {t("model.dragToLookAround")}
        </div>
      ) : null}
    </div>
  );

  if (variant === "plain") return viewer;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 truncate">{label}</div>
          <div className="mt-0.5 text-xs text-zinc-500">{t("model.d3PanoramaInterior")}</div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!images || images.length < 6 || !!error}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {t("model.resetView")}
        </button>
      </div>
      {viewer}
    </div>
  );
}

// Add TS declaration for window.pannellum
declare global {
  interface Window {
    pannellum: any;
  }
}
