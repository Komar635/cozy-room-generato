import { SignUp } from '@/components/auth/SignUp';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <SignUp />
        
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Уже есть аккаунт? </span>
          <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
