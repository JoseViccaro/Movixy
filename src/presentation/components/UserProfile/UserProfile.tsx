import { useState } from 'react';
import { User, ChevronDown, LogOut, RefreshCw, Settings, Users } from 'lucide-react';
import { JellyfinApiClient } from '@/data/sources/jellyfin-api.client';
import { useToast } from '@/presentation/components/Toast/ToastContext';
import styles from './UserProfile.module.css';

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
  const { addToast } = useToast();
  const client = new JellyfinApiClient();

  const userAvatarUrl = avatarUrl || client.getUserImageUrl(userId);

  const handleSwitchUser = (targetUserId: string, targetUsername: string) => {
    localStorage.setItem('movixy_user_id', targetUserId);
    localStorage.setItem('movixy_username', targetUsername);
    window.location.reload();
  };

  const handleRefresh = async () => {
    setIsOpen(false);
    try {
      await client.refreshLibrary();
      addToast('success', 'Escaneo de biblioteca iniciado. Los nuevos archivos aparecerán pronto.');
    } catch {
      addToast('error', 'Error al escanear la biblioteca.');
    }
  };

  const handleShowUserSwitch = async () => {
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
      >
        <div className={styles.avatar}>
          {userId ? (
            <img 
              src={userAvatarUrl} 
              alt={`Avatar de ${username}`}
              className={styles.avatarImage}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
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
              {userId ? (
                <img 
                  src={userAvatarUrl} 
                  alt={`Avatar de ${username}`}
                  className={styles.avatarImageLarge}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
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
              >
                <Users size={18} />
                <span>Cambiar de usuario</span>
              </button>
              <button 
                className={styles.menuItem}
                onClick={handleRefresh}
                role="menuitem"
              >
                <RefreshCw size={18} />
                <span>Escanear biblioteca</span>
              </button>
              <button 
                className={styles.menuItem}
                role="menuitem"
              >
                <Settings size={18} />
                <span>Configuración</span>
              </button>
              <div className={styles.divider} />
              <button 
                className={`${styles.menuItem} ${styles.logout}`}
                onClick={onLogout}
                role="menuitem"
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