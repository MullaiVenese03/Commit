import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col text-zinc-900 antialiased">
      <Navbar onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
