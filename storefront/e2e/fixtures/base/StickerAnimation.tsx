"use client";
import React, { useEffect, useRef, useState } from "react";

const STICKER_SIZE = 300;
const CURSOR_SIZE = 100;

interface StickerProps {
  initialX: number;
  initialY: number;
  initialRotation: number;
  src?: string;
  customStyle?: React.CSSProperties;
  /** Brush size used to "rip" the sticker */
  scratchRadius?: number;
}

const DraggableSticker: React.FC<StickerProps> = ({
  initialX,
  initialY,
  initialRotation,
  src,
  customStyle,
  scratchRadius = 6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTouchScratching = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  // Flag to indicate if this sticker has been scratched already.
  const hasScratched = useRef(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  // Add cursor state tracking
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || canvasInitialized || !src) return;
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      setCanvasInitialized(true);
    };
  }, [canvasInitialized, src]);

  // Check if we're on a touch device
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setCursorVisible(!isTouchDevice);
  }, []);

  /**
   * Because the sticker's wrapper is rotated, we need to convert the pointer's
   * screen coordinates into the unrotated (local) canvas coordinates.
   */
  const getPointerCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    // Get the parent (the unrotated container) and compute its center in viewport coordinates.
    const parent = canvas.parentElement;
    let centerX: number, centerY: number;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      centerX = (parentRect.left + parentRect.right) / 2;
      centerY = (parentRect.top + parentRect.bottom) / 2;
    } else {
      // Fallback: use the canvas bounding rect (not ideal when rotated)
      const rect = canvas.getBoundingClientRect();
      centerX = (rect.left + rect.right) / 2;
      centerY = (rect.top + rect.bottom) / 2;
    }

    // Get the pointer's client coordinates.
    let clientX: number, clientY: number;
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0]!;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = 0;
      clientY = 0;
    }

    // Calculate the difference between the pointer and the center.
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Inverse rotate by the CSS rotation angle.
    const angleRad = (initialRotation * Math.PI) / 180;
    const cos = Math.cos(-angleRad);
    const sin = Math.sin(-angleRad);
    const localDx = dx * cos - dy * sin;
    const localDy = dx * sin + dy * cos;

    // Map the pointer to the canvas's coordinate system (which is always 300×300)
    return {
      x: STICKER_SIZE / 2 + localDx,
      y: STICKER_SIZE / 2 + localDy,
    };
  };

  // Helper to draw a random eggshell fragment
  const drawEggShellFragmentForContext = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    baseRadius: number,
    scratched: boolean
  ) => {
    const numSides = Math.floor(Math.random() * 3) + 3; // 3 to 5 sides
    ctx.beginPath();
    for (let i = 0; i < numSides; i++) {
      const angle = (i / numSides) * 2 * Math.PI;
      const randomFactor =
        scratched ? 0.7 + Math.random() * 0.3 : 0.7 + Math.random() * 0.6;
      const radius = baseRadius * randomFactor;
      const vx = cx + Math.cos(angle) * radius;
      const vy = cy + Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(vx, vy);
      } else {
        ctx.lineTo(vx, vy);
      }
    }
    ctx.closePath();
    ctx.fill();
  };

  /**
   * Draws scratch fragments on this sticker's canvas and propagates
   * the effect to any underlying sticker canvases.
   */
  const handleScratch = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPointerCoords(e);

    if (!hasScratched.current) {
      hasScratched.current = true;
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineCap = "round";
    ctx.lineWidth = scratchRadius;

    if (lastPos.current) {
      const start = lastPos.current;
      const dx = x - start.x;
      const dy = y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const fragmentsCount = hasScratched.current
        ? Math.max(5, Math.ceil(dist / 3))
        : Math.max(3, Math.ceil(dist / 10));
      for (let i = 0; i <= fragmentsCount; i++) {
        const t = i / fragmentsCount;
        const offsetRange = hasScratched.current ? scratchRadius : scratchRadius * 2;
        const fragX =
          start.x + dx * t + (Math.random() - 0.5) * offsetRange;
        const fragY =
          start.y + dy * t + (Math.random() - 0.5) * offsetRange;
        drawEggShellFragmentForContext(ctx, fragX, fragY, scratchRadius, hasScratched.current);
      }
    } else {
      drawEggShellFragmentForContext(ctx, x, y, scratchRadius, hasScratched.current);
    }
    lastPos.current = { x, y };

    // Propagate the scratch to any underlying sticker canvases.
    const clientX =
      "touches" in e && e.touches.length > 0 && e.touches[0]
        ? e.touches[0].clientX
        : "clientX" in e
        ? e.clientX
        : 0;
    const clientY =
      "touches" in e && e.touches.length > 0 && e.touches[0]
        ? e.touches[0].clientY
        : "clientY" in e
        ? e.clientY
        : 0;

    const elements = document.elementsFromPoint(clientX, clientY);
    elements.forEach((el) => {
      if (
        el instanceof HTMLCanvasElement &&
        el !== canvas &&
        el.classList.contains("sticker-canvas")
      ) {
        const rect = el.getBoundingClientRect();
        const rotationAttr = el.getAttribute("data-rotation");
        const rotation = rotationAttr ? parseFloat(rotationAttr) : 0;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;
        const angleRad = (rotation * Math.PI) / 180;
        const cos = Math.cos(-angleRad);
        const sin = Math.sin(-angleRad);
        const localX = rect.width / 2 + dx * cos - dy * sin;
        const localY = rect.height / 2 + dx * sin + dy * cos;

        const otherCtx = el.getContext("2d");
        if (otherCtx) {
          otherCtx.globalCompositeOperation = "destination-out";
          otherCtx.fillStyle = "rgba(0, 0, 0, 1)";
          otherCtx.strokeStyle = "rgba(0,0,0,1)";
          otherCtx.lineCap = "round";
          otherCtx.lineWidth = scratchRadius;
          drawEggShellFragmentForContext(otherCtx, localX, localY, scratchRadius, true);
        }
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleScratch(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    lastPos.current = null;
    handleScratch(e);
  };

  const handleMouseLeave = () => {
    lastPos.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (touch && touch.clientY > 10) {
      e.preventDefault();
      isTouchScratching.current = true;
      lastPos.current = null;
      handleScratch(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (touch && touch.clientY > 10 && isTouchScratching.current) {
      e.preventDefault();
      handleScratch(e);
    }
  };

  const handleTouchEnd = () => {
    isTouchScratching.current = false;
    lastPos.current = null;
  };

  return (
    <div
      className="sticker-wrapper overflow-hidden"
      style={{
        position: "absolute",
        left: initialX,
        top: initialY,
        transform: `rotate(${initialRotation}deg)`,
        width: "300px",
        height: "300px",
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        ...customStyle,
      }}
    >
      {src && (
        <div
          className="sticker-bg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "300px",
            height: "300px",
            backgroundColor: "#151719",
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        className="sticker-canvas"
        data-rotation={initialRotation}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "300px",
          height: "300px",
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          cursor: `url('/egg-cursor.png') 25 25, crosshair`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <style jsx>{`
        .sticker-wrapper {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

type StickerData = StickerProps & { type: "image" };

const StickerAnimation: React.FC = () => {
  const [stickerData, setStickerData] = useState<StickerData[]>([]);

  const stickerImages = [
    "https://stickerninja.com/wp-content/themes/sticker-ninja/dist/images/homepage/moon-goat-stardust_2bb822c7.png",
    "https://lf16-tiktok-web.tiktokcdn-us.com/obj/tiktok-web-tx/ies/tiktok/sticker-set-creation/static/media/11_tlyg2_wow.a92a29054b0b2274fe22.png",
    "https://mystickermania.com/cdn/stickers/k-pop/stray-kids-leebit-joy-512x512.png",
    "https://cdn-icons-png.flaticon.com/256/7503/7503960.png",
    "https://stickerjunkie.com/cdn/shop/files/8.png?v=1709079312&width=3375",
    "https://images.squarespace-cdn.com/content/v1/636a29dd528a3039b1547b7d/5eadcd98-7049-4035-b415-3b0361445227/Sticker-Kowloon-Bustle.png"
  ];

  useEffect(() => {
    const containerWidth = window.innerWidth; // 100vw
    const containerHeight = window.innerHeight * 0.8; // 80vh
    const stickerSize = 300; // The sticker's width/height

    const isMobile = window.innerWidth < 768;
    const numInstances = isMobile ? 1 : 5;

    const data: StickerData[] = stickerImages.flatMap((src) =>
      Array.from({ length: numInstances }).map(() => {
        let initialX: number, initialY: number;
        if (isMobile) {
          // Position based on the center so distribution is more even
          initialX = Math.random() * containerWidth - stickerSize / 2;
          initialY = Math.random() * containerHeight - stickerSize / 2;
        } else {
          // Ensure the entire sticker is visible on desktop
          initialX = Math.random() * Math.max(0, containerWidth - stickerSize);
          initialY = Math.random() * Math.max(0, containerHeight - stickerSize);
        }
        return {
          type: "image",
          initialX,
          initialY,
          initialRotation: Math.random() * 360,
          src,
        };
      })
    );
    setStickerData(data);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch && touch.clientY > 10) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch && touch.clientY > 10) {
      e.preventDefault();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "80vh",
        overflow: "hidden", // Clip stickers that extend beyond bounds
        marginBottom: "5vh",
        touchAction: "pan-y", // Allow vertical scrolling
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {stickerData.map((sticker, index) => (
        <DraggableSticker
          key={index}
          initialX={sticker.initialX}
          initialY={sticker.initialY}
          initialRotation={sticker.initialRotation}
          src={sticker.src}
          customStyle={sticker.customStyle}
          scratchRadius={6}
        />
      ))}
    </div>
  );
};

export default StickerAnimation;
