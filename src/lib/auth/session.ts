import { getServerSession } from 'next-auth/next';
import { authOptions } from './nextauth';

/**
 * Получает текущую сессию пользователя на сервере
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Получает ID текущего пользователя или выбрасывает ошибку
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  
  if (!session || !session.user?.id) {
    throw new Error('Unauthorized');
  }
  
  return session.user.id;
}

/**
 * Проверяет, авторизован ли пользователь
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
