import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { useToast } from '@/presentation/components/Toast/ToastContext';
import styles from './Navbar.module.css';

interface NavbarProps {
  onSearch?: (query: string) => void;
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

export const Navbar = ({ onSearch, onNavigate, currentSection = 'inicio' }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const username = localStorage.getItem('movixy_username') || 'Usuario';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(prev => !prev);
  };

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch?.(query), 400);
  }, [onSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    onSearch?.('');
    setIsSearchActive(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') handleSearchClear();
  };

  const handleNavClick = (section: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate?.(section);
  };

  const getNavClass = (section: string) => {
    return currentSection === section ? styles.active : '';
  };

  const handleRefresh = async () => {
    setIsDropdownOpen(false);
    try {
      const client = new JellyfinApiClient();
      await client.refreshLibrary();
      addToast('success', 'Escaneo de biblioteca iniciado. Los nuevos archivos aparecerán pronto.');
    } catch (error) {
      console.error('Error refreshing library:', error);
      addToast('error', 'Error al escanear la biblioteca.');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    localStorage.removeItem('movixy_token');
    localStorage.removeItem('movixy_user_id');
    localStorage.removeItem('movixy_username');
    window.location.reload();
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Navegación principal">
      <div className={styles.left}>
        <h1 className={styles.logo} onClick={() => onNavigate?.('inicio')}>MOVIXY</h1>
        <ul className={styles.links}>
          <li className={getNavClass('inicio')} onClick={handleNavClick('inicio')}>Inicio</li>
          <li className={getNavClass('series')} onClick={handleNavClick('series')}>Series</li>
          <li className={getNavClass('movies')} onClick={handleNavClick('movies')}>Películas</li>
          <li className={getNavClass('novedades')} onClick={handleNavClick('novedades')}>Novedades</li>
          <li className={getNavClass('mylist')} onClick={handleNavClick('mylist')}>Mi lista</li>
        </ul>
      </div>
      <div className={styles.right}>
        <div className={`${styles.searchContainer} ${isSearchActive ? styles.active : ''}`}>
          <Search 
            className={styles.icon} 
            onClick={() => setIsSearchActive(!isSearchActive)}
            role="button"
            aria-label="Abrir búsqueda"
          />
          {isSearchActive && (
            <input
              type="text"
              placeholder="Títulos, personas, géneros"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              autoFocus
              className={styles.searchInput}
              aria-label="Buscar contenido"
            />
          )}
        </div>
        <span>Niños</span>
        <Bell className={styles.icon} aria-hidden="true" />
        <div className={styles.profileContainer} onClick={toggleDropdown}>
          <div className={styles.profile}>
            <User className={styles.icon} aria-hidden="true" />
            <span className={styles.username}>{username}</span>
          </div>
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <button onClick={handleRefresh} className={styles.logoutButton}>
                Escanear biblioteca
              </button>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Cerrar sesión en Movixy
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};