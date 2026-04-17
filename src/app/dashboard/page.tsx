import { UserMenu } from '@/components/auth/UserMenu';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Панель управления</h1>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Добро пожаловать!</h2>
          <p className="text-gray-600">
            Это защищённая страница. Только авторизованные пользователи могут её видеть.
          </p>
        </div>
      </main>
    </div>
  );
}
