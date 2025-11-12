import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api-client';

export function LoginForm() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.login({ username, password });

      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        navigate('/chat');
      } else {
        // Handle specific error codes
        if (response.code === 'INVALID_CREDENTIALS') {
          setError(t('login.errors.invalidCredentials'));
        } else if (response.code === 'VALIDATION_ERROR') {
          setError(t('login.errors.validationError'));
        } else if (response.code === 'NETWORK_ERROR') {
          setError(t('login.errors.networkError'));
        } else {
          setError(response.error || t('login.errors.loginFailed'));
        }
      }
    } catch (err) {
      setError(t('login.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23]">
      <div className="w-full max-w-md">
        {/* Dark Card */}
        <div className="bg-[#1a1a2e]/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-700/50">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('login.title')}
            </h1>
            <p className="text-sm text-gray-400">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">
                {t('login.username.label')}
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.username.placeholder')}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-[#0f0f23] border border-gray-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                {t('login.password.label')}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.password.placeholder')}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-[#0f0f23] border border-gray-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full py-3 bg-[#4169E1] hover:bg-[#3559d1] text-white font-medium rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? t('login.button.signingIn') : t('login.button.login')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

