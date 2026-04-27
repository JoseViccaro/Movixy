import { useState, type ImgHTMLAttributes } from 'react';
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
  
  // Limpiamos la URL para generar el srcSet (asumiendo formato de Jellyfin)
  const baseUrl = src.split('?')[0] + '?';
  
  const srcSet = `
    ${baseUrl}maxWidth=200&quality=60 200w,
    ${baseUrl}maxWidth=400&quality=70 400w,
    ${baseUrl}maxWidth=800&quality=80 800w,
    ${baseUrl}maxWidth=1280&quality=90 1280w
  `.trim();

  return (
    <div className={`${styles.imageWrapper} ${isLoaded ? styles.loaded : ''} ${className}`}>
      {/* Placeholder borroso (una versión minúscula de la imagen) */}
      <img
        src={`${baseUrl}maxWidth=20&quality=10`}
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
        {...rest}
      />
    </div>
  );
};

export default OptimizedImage;