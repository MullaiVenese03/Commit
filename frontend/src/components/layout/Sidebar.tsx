import React from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  BarChart3,
  BookOpen,
  Clock,
  Compass,
  LayoutDashboard,
  LogOut,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CommitLogo } from '../ui/CommitLogo';
import { RoleBadge } from '../ui/RoleBadge';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { user, isMentor, logout } = useAuth();
  const location = useLocation();

  const learnerNav: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/goals', label: 'Study Goals', icon: Compass, end: false },
    { to: '/sessions', label: 'Study Sessions', icon: Clock, end: true },
    { to: '/progress', label: 'Progress & Analytics', icon: BarChart3, end: true },
  ];

  const mentorNav: NavItem[] = [
    { to: '/mentor', label: 'Mentor Dashboard', icon: LayoutDashboard, end: true },
    { to: '/mentor/learners', label: 'Learners Directory', icon: Users, end: false },
    { to: '/mentor/goals', label: 'Progress Monitoring', icon: BookOpen, end: true },
    { to: '/mentor/sessions', label: 'Study Sessions', icon: Clock, end: true },
    { to: '/mentor/settings', label: 'System Settings', icon: Sliders, end: true },
  ];

  const items = isMentor ? mentorNav : learnerNav;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 select-none ${
      isActive
        ? 'bg-[#5557C8]/10 text-[#5557C8] font-semibold'
        : 'text-[#777782] hover:bg-[#24242A]/5 hover:text-[#24242A]'
    }`;

  const renderContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full bg-[#ECEBE7] select-none">
      {/* Top Section: macOS Monogram Branding */}
      <div className="shrink-0 p-4 border-b border-[#E4E2DE] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CommitLogo size="md" />
          <div className="flex flex-col">
            <span className="font-semibold text-[#24242A] text-sm tracking-tight leading-tight">
              Commit
            </span>
            <span className="text-[10px] text-[#777782] font-medium leading-tight">
              {isMentor ? 'Mentor Console' : 'Academic Workspace'}
            </span>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 transition cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4 pointer-events-none" />
          </button>
        )}
      </div>

      {/* Middle Section: Flexible & Independently Scrollable Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#777782] px-3 py-1.5 select-none">
          {isMentor ? 'Cohort Management' : 'Study Navigation'}
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={isMobile ? onMobileClose : undefined}
              className={({ isActive }) => {
                const active =
                  isActive ||
                  (isMentor &&
                    item.to === '/mentor/goals' &&
                    location.pathname.startsWith('/goals'));
                return linkClasses({ isActive: active });
              }}
            >
              <Icon className="w-4 h-4 shrink-0 opacity-80 pointer-events-none" />
              <span className="pointer-events-none">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section: Bottom-Anchored Profile and Sign-Out */}
      <div className="shrink-0 p-3.5 border-t border-[#E4E2DE] bg-[#ECEBE7] space-y-3">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E4E2DE] flex items-center justify-center text-xs font-semibold text-[#24242A] shadow-2xs shrink-0 select-none">
              {getInitials(user.name)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-[#24242A] truncate leading-tight">
                  {user.name}
                </span>
                <RoleBadge role={user.role} className="shrink-0" />
              </div>
              <span className="text-[10px] text-[#777782] truncate leading-tight mt-0.5">
                {user.email}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (isMobile) onMobileClose();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#777782] hover:text-[#C45C5C] hover:bg-[#C45C5C]/10 border border-transparent hover:border-[#C45C5C]/20 transition-all cursor-pointer"
          aria-label="Sign out of Commit"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0 pointer-events-none" />
          <span className="pointer-events-none">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Stationary Fixed Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 h-[100dvh] flex-col justify-between z-30 bg-[#ECEBE7] border-r border-[#E4E2DE]">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-150"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#ECEBE7] flex flex-col justify-between shadow-2xl transform transition-transform duration-200 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </div>
    </>
  );
};
