"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

const ALLOWED_REMOTE_HOSTS = new Set(["images.unsplash.com"]);

function normalizeImageSrc(src: string | null | undefined, fallbackSrc: string) {
  if (!src) return fallbackSrc;
  if (src.startsWith("/")) return src;
  if (src.startsWith("data:image/")) return src;
  if (src.startsWith("blob:")) return src;

  try {
    const url = new URL(src);

    // Reject known redirect/result pages instead of actual image assets.
    if (
      url.hostname === "www.google.com" ||
      url.hostname === "google.com" ||
      url.pathname.startsWith("/imgres")
    ) {
      return fallbackSrc;
    }

    if (!ALLOWED_REMOTE_HOSTS.has(url.hostname)) {
      return fallbackSrc;
    }

    return src;
  } catch {
    return fallbackSrc;
  }
}

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/food-placeholder.svg",
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(
    normalizeImageSrc(src, fallbackSrc)
  );

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
