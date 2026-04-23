import styles from './Skeleton.module.css';

interface SkeletonProps {
  type: 'card' | 'hero';
}

export const Skeleton = ({ type }: SkeletonProps) => {
  return <div className={`${styles.skeleton} ${styles[type]}`}></div>;
};
