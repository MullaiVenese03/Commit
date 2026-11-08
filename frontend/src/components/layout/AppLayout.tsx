import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#24242A] flex flex-col antialiased">
      {/* Mobile-only header bar with drawer toggle trigger */}
      <Navbar onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)} />

      {/* Stationary Sidebar (Fixed on Desktop, Drawer on Mobile) */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Workspace: offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
