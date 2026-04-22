import { useState, useEffect } from 'react';
import { Search, Bell, User } from 'lucide-react';
import styles from './Navbar.module.css';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.left}>
        <h1 className={styles.logo}>MOVIXY</h1>
        <ul className={styles.links}>
          <li>Home</li>
          <li>TV Shows</li>
          <li>Movies</li>
          <li>New & Popular</li>
          <li>My List</li>
        </ul>
      </div>
      <div className={styles.right}>
        <Search className={styles.icon} />
        <span>Kids</span>
        <Bell className={styles.icon} />
        <div className={styles.profile}>
          <User className={styles.icon} />
        </div>
      </div>
    </nav>
  );
};
