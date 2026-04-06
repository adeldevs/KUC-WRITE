import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Loader2, PenLine, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, isLoading } = useAuth();
  const [signing, setSigning] = useState(false);

  const handleSignIn = async () => {
    setSigning(true);
    try {
      await signInWithGoogle();
    } catch {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden px-6">
      {/* Ambient glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[hsl(263_70%_40%/0.15)] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-[hsl(220_70%_40%/0.12)] blur-[80px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo area */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[hsl(263_70%_55%)] to-[hsl(220_70%_55%)] flex items-center justify-center shadow-2xl shadow-[hsl(263_70%_40%/0.4)] animate-pulse-glow">
            <PenLine className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-[hsl(var(--foreground))] mb-1">
              Uni<span className="gradient-text">Gig</span>
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm font-medium">
              The marketplace for handwritten work
            </p>
          </div>
        </div>

        {/* Features teaser */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { icon: '✍️', label: 'Post Gigs' },
            { icon: '🎨', label: 'Showcase Work' },
            { icon: '💬', label: 'Chat Live' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <Button
          id="google-sign-in-btn"
          onClick={handleSignIn}
          disabled={isLoading || signing}
          size="lg"
          className="w-full h-14 text-base font-bold rounded-2xl bg-white text-gray-900 hover:bg-gray-100 shadow-xl gap-3"
        >
          {signing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {signing ? 'Signing in…' : 'Continue with Google'}
        </Button>

        {/* Terms */}
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-5 px-4">
          By continuing, you agree to our{' '}
          <span className="text-[hsl(var(--primary))] cursor-pointer hover:underline">Terms</span> and{' '}
          <span className="text-[hsl(var(--primary))] cursor-pointer hover:underline">Privacy Policy</span>
        </p>

        {/* Bottom badge */}
        <div className="flex items-center justify-center gap-1.5 mt-8 text-xs text-[hsl(var(--muted-foreground))]">
          <Sparkles className="w-3 h-3 text-[hsl(var(--primary))]" />
          <span>For university students, by students</span>
        </div>
      </div>
    </div>
  );
}
