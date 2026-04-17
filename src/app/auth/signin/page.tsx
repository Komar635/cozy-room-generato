import { SignIn } from '@/components/auth/SignIn';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <SignIn />
        
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Нет аккаунта? </span>
          <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
