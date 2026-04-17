import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Оцифровщик реальности в 3D</h1>
          <p className="text-xl text-gray-600">
            Создание фотореалистичных 3D-копий объектов мебели и декора
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin">
            <Button size="lg">Войти</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline">
              Регистрация
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
