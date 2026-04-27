import type { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

export const OptimizedImage = ({ src, alt, className, sizes = '(max-width: 768px) 100vw, 33vw', priority = false, ...rest }: OptimizedImageProps) => {
  const baseUrl = src.replace(/maxWidth=\d+/, '').replace('?', '?');
  
  const srcSet = `
    ${baseUrl}maxWidth=200&quality=70 200w,
    ${baseUrl}maxWidth=400&quality=80 400w,
    ${baseUrl}maxWidth=600&quality=85 600w,
    ${baseUrl}maxWidth=800&quality=90 800w,
    ${baseUrl}maxWidth=1280&quality=90 1280w
  `.trim();

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...rest}
    />
  );
};

export default OptimizedImage;