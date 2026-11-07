import React from 'react';
import { NavLink } from 'react-router';
import {
  BarChart3,
  BookOpen,
  Clock,
  Compass,
  LayoutDashboard,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { isMentor } = useAuth();

  const learnerNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/goals', label: 'Study Goals', icon: Compass },
    { to: '/sessions', label: 'Study Sessions', icon: Clock },
    { to: '/progress', label: 'Progress & Analytics', icon: BarChart3 },
  ];

  const mentorNav = [
    { to: '/mentor', label: 'Mentor Dashboard', icon: LayoutDashboard },
    { to: '/mentor/learners', label: 'Learners Directory', icon: Users },
    { to: '/mentor/goals', label: 'Learner Goals', icon: BookOpen },
    { to: '/mentor/sessions', label: 'All Sessions', icon: Clock },
    { to: '/mentor/settings', label: 'System Settings', icon: Sliders },
  ];

  const items = isMentor ? mentorNav : learnerNav;

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200/80">
      <div className="flex items-center justify-between p-4 border-b border-zinc-100 lg:hidden">
        <span className="font-semibold text-zinc-900 text-xs uppercase tracking-wider">
          {isMentor ? 'Mentor Workspace' : 'Learner Workspace'}
        </span>
        <button
          type="button"
          onClick={onMobileClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2 select-none">
          {isMentor ? 'Mentor Workspace' : 'Learner Workspace'}
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={linkClasses}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-80" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-medium text-zinc-500">Commit Academic</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>v1.0</span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:hidden shadow-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
