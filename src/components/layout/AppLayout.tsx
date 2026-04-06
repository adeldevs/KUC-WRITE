import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))]">
      <Navbar />
      {/* Content area with padding for fixed navbars */}
      <main className="md:pt-16 pb-24 md:pb-6 min-h-dvh">
        <Outlet />
      </main>
    </div>
  );
}
