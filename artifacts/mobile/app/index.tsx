import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

/**
 * The literal "/" route. Redirects straight to the appropriate
 * destination based on auth state, so a cold start or root URL never
 * lands on the tabs directly and never gets stuck bouncing between
 * guarded screens: authenticated users go to the "home" chooser
 * (Моя комната / Библиотека), unauthenticated users go to "login".
 */
export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  return <Redirect href={token ? '/home' : '/login'} />;
}
