import React from 'react';
import { LogOut, Menu, Shield, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle }) => {
  const { user, isMentor, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs">
            C
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-950 text-sm tracking-tight">Commit</span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-400 border-l border-zinc-200 pl-2">
              Academic Tracker
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            <Badge
              variant={isMentor ? 'accent' : 'neutral'}
              size="sm"
              icon={isMentor ? <Shield className="w-3 h-3 text-blue-600" /> : <User className="w-3 h-3 text-zinc-500" />}
            >
              {isMentor ? 'Mentor' : 'Learner'}
            </Badge>

            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-zinc-200/80">
              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700 select-none">
                {getInitials(user.name)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-zinc-400 truncate max-w-[140px]">{user.email}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
              className="text-zinc-500 hover:text-rose-600 hover:bg-rose-50/60"
              title="Sign Out"
            >
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
