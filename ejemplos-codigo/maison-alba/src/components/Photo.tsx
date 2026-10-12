import { IMAGES, photo, photoSet } from "../data/site";

type Props = {
  name: keyof typeof IMAGES;
  sizes: string;
  className?: string;
  eager?: boolean;
  /** Focal point, e.g. "50% 30%". */
  position?: string;
};

export function Photo({ name, sizes, className = "", eager = false, position = "50% 50%" }: Props) {
  const { id, alt } = IMAGES[name];
  return (
    <img
      src={photo(id, 1200)}
      srcSet={photoSet(id)}
      sizes={sizes}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      className={`h-full w-full object-cover ${className}`}
      style={{ objectPosition: position }}
    />
  );
}
