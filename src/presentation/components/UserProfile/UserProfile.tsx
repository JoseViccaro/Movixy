import { useState, useEffect } from 'react';
import { User, ChevronDown, LogOut, RefreshCw, Settings, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { useToast } from '@/presentation/components/Toast/ToastContext';
import styles from './UserProfile.module.css';
import { useDpadNavigation } from '@/presentation/hooks/useDpadNavigation';

interface UserProfileProps {
  userId: string;
  username: string;
  avatarUrl?: string;
  onLogout: () => void;
}

export const UserProfile = ({ userId, username, avatarUrl, onLogout }: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserSwitch, setShowUserSwitch] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; hasPassword: boolean }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasImage, setHasImage] = useState<boolean | null>(null);
  const [client, setClient] = useState<JellyfinApiClient | null>(null);
  const { addToast } = useToast();

  // Load client and check for user image
  useEffect(() => {
    const init = async () => {
      const apiClient = await JellyfinApiClient.create();
      setClient(apiClient);
      
      try {
        const profile = await apiClient.getUserProfile(userId);
        // Check if the user has a primary image tag
        setHasImage(!!(profile as unknown as { PrimaryImageTag?: string }).PrimaryImageTag);
      } catch {
        setHasImage(false);
      }
    };
    
    if (userId) init();
  }, [userId]);

  const userAvatarUrl = (userId && client) ? client.getUserImageUrl(userId) : avatarUrl;

  // D-pad navigation for the dropdown menu
  useDpadNavigation({
    enabled: isOpen,
    containerSelector: `.${styles.dropdown}`,
    onBack: () => setIsOpen(false),
  });

  const handleSwitchUser = (targetUserId: string, targetUsername: string) => {
    localStorage.setItem('movixy_user_id', targetUserId);
    localStorage.setItem('movixy_username', targetUsername);
    window.location.reload();
  };

  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (!client) return;
    setIsOpen(false);
    try {
      await client.refreshLibrary();
      addToast('info', 'Escaneo de biblioteca iniciado en el servidor...');
      
      // Invalidate frontend cache immediately and then 5 seconds later
      await queryClient.invalidateQueries();
      
      setTimeout(async () => {
        await queryClient.invalidateQueries();
        addToast('success', 'Catálogo actualizado.');
      }, 5000);
    } catch {
      addToast('error', 'Error al escanear la biblioteca.');
    }
  };

  const handleShowUserSwitch = async () => {
    if (!client) return;
    setShowUserSwitch(true);
    if (users.length === 0 && !isLoadingUsers) {
      setIsLoadingUsers(true);
      try {
        const publicUsers = await client.getPublicUsers();
        setUsers(publicUsers.map(u => ({ id: u.Id, name: u.Name, hasPassword: u.HasPassword })));
      } catch {
        console.error('Error loading public users');
      } finally {
        setIsLoadingUsers(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.profileButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-focusable="true"
      >
        <div className={styles.avatar}>
          {userId && hasImage && !imageError ? (
            <img 
              src={userAvatarUrl} 
              alt={`Avatar de ${username}`}
              className={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <User size={20} />
          )}
        </div>
        <span className={styles.username}>{username}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <div className={styles.avatarLarge}>
              {userId && hasImage && !imageError ? (
                <img 
                  src={userAvatarUrl} 
                  alt={`Avatar de ${username}`}
                  className={styles.avatarImageLarge}
                  onError={() => setImageError(true)}
                />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{username}</span>
              <span className={styles.userStatus}>En línea</span>
            </div>
          </div>

          <div className={styles.divider} />

          {!showUserSwitch ? (
            <>
              <button 
                className={styles.menuItem}
                onClick={handleShowUserSwitch}
                role="menuitem"
                data-focusable="true"
              >
                <Users size={18} />
                <span>Cambiar de usuario</span>
              </button>
              <button 
                className={styles.menuItem}
                onClick={handleRefresh}
                role="menuitem"
                data-focusable="true"
              >
                <RefreshCw size={18} />
                <span>Escanear biblioteca</span>
              </button>
              <button 
                className={styles.menuItem}
                role="menuitem"
                data-focusable="true"
              >
                <Settings size={18} />
                <span>Configuración</span>
              </button>
              <div className={styles.divider} />
              <button 
                className={`${styles.menuItem} ${styles.logout}`}
                onClick={onLogout}
                role="menuitem"
                data-focusable="true"
              >
                <LogOut size={18} />
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <>
              <button 
                className={`${styles.menuItem} ${styles.backItem}`}
                onClick={() => setShowUserSwitch(false)}
                role="menuitem"
                data-focusable="true"
              >
                ← Volver
              </button>
              <div className={styles.divider} />
              <div className={styles.userList}>
                {isLoadingUsers ? (
                  <div className={styles.loading}>Cargando usuarios...</div>
                ) : (
                  users.map(user => (
                    <button
                      key={user.id}
                      className={`${styles.userItem} ${user.id === userId ? styles.activeUser : ''}`}
                      onClick={() => handleSwitchUser(user.id, user.name)}
                      role="menuitem"
                      data-focusable="true"
                    >
                      <div className={styles.userItemAvatar}>
                        <User size={18} />
                      </div>
                      <span>{user.name}</span>
                      {user.id === userId && <span className={styles.currentBadge}>Actual</span>}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;