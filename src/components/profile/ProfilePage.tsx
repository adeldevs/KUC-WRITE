import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import UploadWorkModal from './UploadWorkModal';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getInitials } from '../../lib/utils';
import { getAssignments } from '../../lib/api';
import { Plus, ImageOff, PenLine, Brush, LogOut } from 'lucide-react';
import type { PortfolioItem } from '../../types';

const ROLE_COLORS = {
  Writer: 'default' as const,
  Requester: 'secondary' as const,
  Both: 'success' as const,
};

export default function ProfilePage() {
  const { dbUser, firebaseUser, logout, refreshUser } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Handwriting' | 'Drawing'>('All');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [gigsCount, setGigsCount] = useState(0);

  // Keep portfolio in sync with dbUser (refreshed after upload)
  const portfolio: PortfolioItem[] = dbUser?.portfolio ?? [];

  // Load gig count for this user
  useEffect(() => {
    if (!dbUser?.uid) return;
    getAssignments()
      .then((all) => {
        const mine = all.filter((a) => a.requester.uid === dbUser.uid);
        setGigsCount(mine.length);
      })
      .catch(() => {});
  }, [dbUser?.uid]);

  const displayName = dbUser?.fullName || firebaseUser?.displayName || 'Student';
  const photoURL = firebaseUser?.photoURL || '';
  const department = dbUser?.department || 'University Student';
  const role = dbUser?.role || 'Both';
  const phone = dbUser?.phoneNumber || '—';

  const filteredPortfolio = portfolio.filter(
    (i) => activeFilter === 'All' || i.category === activeFilter
  );

  const handleUploaded = async () => {
    // Refresh user from Firestore to pick up new portfolio item
    await refreshUser();
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Banner gradient */}
      <div className="h-32 bg-gradient-to-br from-[hsl(263_70%_25%)] via-[hsl(240_60%_20%)] to-[hsl(var(--background))] relative">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, hsl(263 70% 60%) 0px, hsl(263 70% 60%) 1px, transparent 1px, transparent 12px)`,
          }}
        />
      </div>

      <div className="px-4">
        {/* Avatar + actions */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-[hsl(var(--background))] shadow-2xl">
              <AvatarImage src={photoURL} alt={displayName} />
              <AvatarFallback className="text-2xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex gap-2 pb-1">
            <Button
              id="upload-work-btn"
              size="sm"
              onClick={() => setShowUpload(true)}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Work
            </Button>
            <Button id="profile-logout-btn" variant="ghost" size="icon" onClick={logout} className="w-9 h-9" title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User info */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[hsl(var(--foreground))]">{displayName}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-0.5">{department}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant={ROLE_COLORS[role]}>{role}</Badge>
            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <span>📱</span> {phone}
            </span>
          </div>

          {/* Stats — live from Firestore */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Portfolio', value: portfolio.length },
              { label: 'Gigs Posted', value: gigsCount },
              { label: 'Email', value: dbUser?.email?.split('@')[0] || '—' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-[hsl(var(--foreground))] truncate">{s.value}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Portfolio</h2>
            <div className="flex gap-1.5">
              {(['All', 'Handwriting', 'Drawing'] as const).map((f) => (
                <button
                  key={f}
                  id={`filter-${f.toLowerCase()}`}
                  onClick={() => setActiveFilter(f)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    activeFilter === f
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {f === 'Handwriting' ? <PenLine className="w-3 h-3" /> : f === 'Drawing' ? <Brush className="w-3 h-3" /> : null}
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredPortfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed border-[hsl(var(--border))] rounded-2xl">
              <ImageOff className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No work uploaded yet.</p>
              <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Upload Your First Work
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredPortfolio.map((item, i) => (
                <button
                  key={item._id || i}
                  onClick={() => setLightboxImg(item.imgUrl)}
                  className="relative aspect-square rounded-2xl overflow-hidden group border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <img
                    src={item.imgUrl}
                    alt={item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                    <Badge
                      variant={item.category === 'Handwriting' ? 'default' : 'secondary'}
                      className="text-[9px]"
                    >
                      {item.category === 'Handwriting' ? <PenLine className="w-2.5 h-2.5 mr-0.5" /> : <Brush className="w-2.5 h-2.5 mr-0.5" />}
                      {item.category}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Portfolio item"
            className="max-w-full max-h-[90dvh] rounded-2xl object-contain shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            ✕
          </button>
        </div>
      )}

      <UploadWorkModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}
