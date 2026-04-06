import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutGrid, User, MessageSquare, LogOut } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { getInitials } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Feed' },
  { to: '/messages', icon: MessageSquare, label: 'Chats' },
];

// Desktop includes Profile as a text link; mobile uses the avatar "Me" tab instead
const DESKTOP_NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Feed' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/messages', icon: MessageSquare, label: 'Chats' },
];

export default function Navbar() {
  const { dbUser, firebaseUser, logout } = useAuth();
  const photoURL = firebaseUser?.photoURL;
  const displayName = dbUser?.fullName || firebaseUser?.displayName || 'User';

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-40 h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.9)] backdrop-blur-md items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(263_70%_55%)] to-[hsl(220_70%_55%)] flex items-center justify-center">
            <span className="text-white font-black text-sm">U</span>
          </div>
          <span className="font-black text-lg tracking-tight">
            Uni<span className="gradient-text">Gig</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {DESKTOP_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">{displayName}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{dbUser?.department || 'Student'}</p>
          </div>
          <Avatar className="w-9 h-9 cursor-pointer">
            <AvatarImage src={photoURL || ''} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <button
            id="nav-logout-btn"
            onClick={logout}
            className="p-2 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--secondary))] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(var(--background)/0.95)] backdrop-blur-lg border-t border-[hsl(var(--border))] safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[hsl(var(--accent))]' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* Profile avatar on mobile nav */}
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-1 px-5 py-2"
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={photoURL || ''} />
              <AvatarFallback className="text-[10px]">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">Me</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}
