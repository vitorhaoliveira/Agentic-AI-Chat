import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';

export const UserProfile = memo(function UserProfile() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="border-t border-gray-800/50 pt-3 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-8 w-8 rounded-full bg-[#4169E1] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-gray-300 truncate">
          {user?.username}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        title={t('chat.logout')}
        className="text-gray-400 hover:text-white hover:bg-gray-700/50 flex-shrink-0"
        aria-label="Logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
});

