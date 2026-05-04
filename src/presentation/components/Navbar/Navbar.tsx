import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { UserProfile } from '@/presentation/components/UserProfile/UserProfile';
import { secureStorage } from '@/core/utils/secure-storage';
import styles from './Navbar.module.css';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

const NAV_ITEMS = [
  { path: '/', label: 'Inicio', section: 'inicio' },
  { path: '/series', label: 'Series', section: 'series' },
  { path: '/movies', label: 'Películas', section: 'movies' },
  { path: '/new', label: 'Novedades', section: 'novedades' },
  { path: '/mylist', label: 'Mi lista', section: 'mylist' },
] as const;

export const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userId = localStorage.getItem('movixy_user_id') || '';
  const username = localStorage.getItem('movixy_username') || 'Usuario';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleNavClick = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentSection = (): string => {
    const path = location.pathname;
    const item = NAV_ITEMS.find(i => i.path === path);
    return item?.section || 'inicio';
  };

  const getNavClass = (section: string) => {
    return getCurrentSection() === section ? styles.active : '';
  };

  const handleLogout = () => {
    secureStorage.clearToken();
    localStorage.removeItem('movixy_user_id');
    localStorage.removeItem('movixy_username');
    navigate('/login', { replace: true });
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Navegación principal">
      <div className={styles.left}>
        <h1
          className={styles.logo}
          onClick={() => navigate('/')}
          data-focusable="true"
          tabIndex={0}
        >
          MOVIXY
        </h1>
        <ul className={styles.links}>
          {NAV_ITEMS.map((item) => (
            <li
              key={item.section}
              className={getNavClass(item.section)}
              onClick={handleNavClick(item.path)}
              data-focusable="true"
              tabIndex={0}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.right}>
        <div className={`${styles.searchContainer} ${isSearchActive ? styles.active : ''}`}>
          <Search
            className={styles.icon}
            onClick={() => setIsSearchActive(!isSearchActive)}
            role="button"
            aria-label="Abrir búsqueda"
            data-focusable="true"
            tabIndex={0}
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
        <UserProfile
          userId={userId}
          username={username}
          onLogout={handleLogout}
        />
      </div>
    </nav>
  );
};

export default Navbar;