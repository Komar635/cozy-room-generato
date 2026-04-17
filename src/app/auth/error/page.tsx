import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessages: Record<string, string> = {
    Configuration: 'Ошибка конфигурации сервера',
    AccessDenied: 'Доступ запрещён',
    Verification: 'Ошибка верификации',
    Default: 'Произошла ошибка при аутентификации',
  };

  const error = searchParams.error || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-600">Ошибка</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/auth/signin">
            <Button className="w-full">Попробовать снова</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
