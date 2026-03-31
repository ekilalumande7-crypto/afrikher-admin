import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="p-10 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
