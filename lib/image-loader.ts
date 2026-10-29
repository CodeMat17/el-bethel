"use client";

/**
 * next/image loader. Cloudinary resizes and converts photos on its CDN, so this
 * server never runs the built-in image optimizer (which is heavy on shared
 * hosting). Other sources (local files under /public) are served as they are.
 */
export default function cloudinaryLoader({ src, width }: { src: string; width: number }): string {
  const marker = "/image/upload/";
  const at = src.indexOf(marker);
  if (!src.startsWith("https://res.cloudinary.com/") || at < 0) return src;
  const transform = `f_auto,q_auto,c_limit,w_${width}`;
  const rest = src.slice(at + marker.length).replace(/^f_auto,q_auto\//, "");
  return `${src.slice(0, at + marker.length)}${transform}/${rest}`;
}
