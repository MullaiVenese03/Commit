import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CommitLogo } from '../ui/CommitLogo';

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle }) => {
  const { isMentor } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-20 h-13 bg-[#ECEBE7] border-b border-[#E4E2DE] px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5">
        <CommitLogo size="sm" />
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#24242A] text-sm tracking-tight select-none">
            Commit
          </span>
          <span className="text-[11px] text-[#777782] font-medium border-l border-[#E4E2DE] pl-1.5 select-none">
            {isMentor ? 'Mentor' : 'Workspace'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="p-1.5 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 cursor-pointer transition active:scale-95"
        aria-label="Toggle navigation drawer"
      >
        <Menu className="w-5 h-5 pointer-events-none" />
      </button>
    </header>
  );
};
