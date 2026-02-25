import { ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  webpSrc?: string;
  fallbackSrc: string;
  alt: string;
}

/**
 * Renders a <picture> element with WebP source and original fallback.
 * Usage:
 *   import heroWebp from "@/assets/hero.jpg?format=webp";
 *   import heroFallback from "@/assets/hero.jpg";
 *   <OptimizedImage webpSrc={heroWebp} fallbackSrc={heroFallback} alt="Hero" />
 */
export function OptimizedImage({
  webpSrc,
  fallbackSrc,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <picture>
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img src={fallbackSrc} alt={alt} {...props} />
    </picture>
  );
}
