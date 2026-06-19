import React from "react";

export default function CardFrameOverlay({ frame, className = "" }) {
  if (!frame?.image_url) return null;
  return (
    <img
      src={frame.image_url}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`absolute inset-0 z-20 w-full h-full object-fill pointer-events-none select-none ${className}`}
    />
  );
}
