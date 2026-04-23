import { useState, useEffect } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import styles from './Navbar.module.css';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar = ({ onSearch }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const username = localStorage.getItem('movixy_username') || 'Usuario';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleLogout = () => {
    localStorage.removeItem('movixy_token');
    localStorage.removeItem('movixy_user_id');
    localStorage.removeItem('movixy_username');
    window.location.reload();
  };

  const handleRefresh = async () => {
    try {
      const client = new JellyfinApiClient();
      await client.refreshLibrary();
      alert('Escaneo de biblioteca iniciado. Los nuevos archivos aparecerán pronto.');
    } catch (error) {
      console.error('Error refreshing library:', error);
    }
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.left}>
        <h1 className={styles.logo}>MOVIXY</h1>
        <ul className={styles.links}>
          <li className={styles.active}>Inicio</li>
          <li>Series</li>
          <li>Películas</li>
          <li>Novedades populares</li>
          <li>Mi lista</li>
        </ul>
      </div>
      <div className={styles.right}>
        <div className={`${styles.searchContainer} ${isSearchActive ? styles.active : ''}`}>
          <Search 
            className={styles.icon} 
            onClick={() => setIsSearchActive(!isSearchActive)} 
          />
          {isSearchActive && (
            <input
              type="text"
              placeholder="Títulos, personas, géneros"
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
              className={styles.searchInput}
            />
          )}
        </div>
        <span>Niños</span>
        <Bell className={styles.icon} />
        <div className={styles.profileContainer}>
          <div className={styles.profile}>
            <User className={styles.icon} />
            <span className={styles.username}>{username}</span>
          </div>
          <div className={styles.dropdown}>
            <button onClick={handleRefresh} className={styles.logoutButton}>
              Escanear biblioteca
            </button>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Cerrar sesión en Movixy
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
