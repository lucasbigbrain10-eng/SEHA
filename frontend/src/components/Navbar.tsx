'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, User as UserIcon, LogOut } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/contexts/AuthContext';

function NavbarContent() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <Link href={isAuthenticated ? '/dashboard' : '/'} className="group transition-opacity hover:opacity-90">
        <Logo size="md" />
      </Link>

      <nav className="flex items-center gap-4">
        {!isAuthenticated ? (
          <>
            <Link
              href="/login"
              className={`text-xs font-semibold tracking-wide uppercase px-3 py-2 transition ${
                pathname === '/login'
                  ? 'text-[#AF6A28]'
                  : 'text-[#6B6158] hover:text-[#1E1713]'
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-xs font-semibold tracking-wider uppercase px-4 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white transition shadow-xs"
            >
              Criar conta
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className={`text-xs font-semibold tracking-wide uppercase px-3 py-2 transition ${
                pathname === '/dashboard'
                  ? 'text-[#AF6A28] border-b-2 border-[#AF6A28]'
                  : 'text-[#6B6158] hover:text-[#1E1713]'
              }`}
            >
              Meus hábitos
            </Link>
            <Link
              href="/habitos/novo"
              className="text-xs font-semibold tracking-wider uppercase px-4 py-2.5 rounded-lg bg-[#AF6A28] hover:bg-[#975A22] text-white transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo hábito
            </Link>
            <div className="h-4 w-px bg-[#E4DED4] mx-1"></div>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#EAE3D6] border border-[#DDD5C7] flex items-center justify-center text-[#70665D]" title={user?.email}>
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#1E1713] hidden sm:inline max-w-[120px] truncate">
                {user?.nome?.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                title="Sair da conta"
                className="text-[#998E82] hover:text-[#8B3A22] p-1.5 rounded-lg hover:bg-[#EAE3D6] transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="border-b border-[#E4DED4] bg-[#F6F3EC]/95 backdrop-blur-md sticky top-0 z-50">
      <Suspense fallback={<div className="h-20" />}>
        <NavbarContent />
      </Suspense>
    </header>
  );
}
