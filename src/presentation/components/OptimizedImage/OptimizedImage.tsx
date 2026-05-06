import { useState, type ImgHTMLAttributes } from 'react';
import { Film } from 'lucide-react';
import styles from './OptimizedImage.module.css';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * OptimizedImage — Componente premium de carga de imágenes.
 * 
 * Implementa:
 * 1. Blur-up effect: un placeholder borroso mientras carga.
 * 2. Responsive images: usa srcSet para cargar el tamaño justo según el dispositivo.
 * 3. Lazy loading por defecto: ahorra ancho de banda.
 * 4. Fallback: muestra un placeholder visual cuando no hay imagen disponible.
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  sizes = '(max-width: 768px) 100vw, 33vw', 
  priority = false, 
  ...rest 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // No image URL — render a styled placeholder immediately
  if (!src || hasError) {
    return (
      <div className={`${styles.imageWrapper} ${styles.loaded} ${className}`}>
        <div className={styles.noImage} aria-label={alt}>
          <Film size={32} />
        </div>
      </div>
    );
  }
  
  // Helper to generate optimized URLs preserving original params (like api_key)
  const getOptimizedUrl = (width: number, quality: number) => {
    try {
      // Handle absolute and relative URLs
      const url = new URL(src, window.location.origin);
      url.searchParams.set('maxWidth', width.toString());
      url.searchParams.set('quality', quality.toString());
      return url.toString();
    } catch {
      // Fallback for malformed URLs
      return src;
    }
  };

  const srcSet = `
    ${getOptimizedUrl(200, 60)} 200w,
    ${getOptimizedUrl(400, 70)} 400w,
    ${getOptimizedUrl(800, 80)} 800w,
    ${getOptimizedUrl(1280, 90)} 1280w
  `.trim();

  const placeholderUrl = getOptimizedUrl(20, 10);

  return (
    <div className={`${styles.imageWrapper} ${isLoaded ? styles.loaded : ''} ${className}`}>
      {/* Placeholder borroso (una versión minúscula de la imagen) */}
      <img
        src={placeholderUrl}
        className={styles.placeholder}
        aria-hidden="true"
        alt=""
      />
      
      {/* Imagen real */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={styles.mainImage}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;