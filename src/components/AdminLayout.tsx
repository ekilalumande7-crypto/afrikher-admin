import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0A0A0A]">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMenu={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8 xl:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
