import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from '../ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ArrowLeft, PenLine, Brush, ImageOff, Loader2 } from 'lucide-react';
import { getInitials } from '../../lib/utils';
import { getUserProfile } from '../../lib/api';
import type { User, WriterProfile } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  writer: WriterProfile;
}

export default function WriterProfileSheet({ open, onClose, writer }: Props) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !writer.uid) return;
    setLoading(true);
    getUserProfile(writer.uid)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [open, writer.uid]);

  const portfolio = profile?.portfolio ?? [];

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-md overflow-y-auto">
          <SheetTitle className="sr-only">Writer Profile — {writer.fullName}</SheetTitle>
          <SheetDescription className="sr-only">
            Public profile of {writer.fullName} from {writer.department}
          </SheetDescription>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shrink-0 sticky top-0 z-10">
            <SheetClose asChild>
              <button className="p-2 rounded-xl hover:bg-[hsl(var(--secondary))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </SheetClose>
            <p className="font-bold text-[hsl(var(--foreground))]">Writer Profile</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center flex-1 py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))]" />
            </div>
          ) : (
            <div className="flex-1 px-4 py-6 space-y-6">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-br from-[hsl(263_70%_25%)] via-[hsl(240_60%_20%)] to-[hsl(var(--background))] rounded-2xl relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: `repeating-linear-gradient(45deg, hsl(263 70% 60%) 0px, hsl(263 70% 60%) 1px, transparent 1px, transparent 12px)` }}
                />
              </div>

              {/* Avatar + info */}
              <div className="-mt-14 px-1 flex items-end gap-4">
                <Avatar className="w-16 h-16 border-4 border-[hsl(var(--background))] shadow-xl">
                  <AvatarImage src={profile?.photoURL || writer.photoURL || ''} alt={writer.fullName} />
                  <AvatarFallback className="text-xl">{getInitials(writer.fullName)}</AvatarFallback>
                </Avatar>
              </div>

              <div>
                <h2 className="text-xl font-black text-[hsl(var(--foreground))]">{writer.fullName}</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{writer.department}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {writer.role && (
                    <Badge variant="default">{writer.role}</Badge>
                  )}
                  <Badge variant="secondary">{portfolio.length} portfolio items</Badge>
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <h3 className="font-bold text-[hsl(var(--foreground))] mb-3">Portfolio</h3>
                {portfolio.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 border-2 border-dashed border-[hsl(var(--border))] rounded-2xl">
                    <ImageOff className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">No work uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {portfolio.map((item, i) => (
                      <button
                        key={item._id || i}
                        onClick={() => setLightbox(item.imgUrl)}
                        className="relative aspect-square rounded-2xl overflow-hidden group border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] transition-all"
                      >
                        <img
                          src={item.imgUrl}
                          alt={item.category}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <Badge variant={item.category === 'Handwriting' ? 'default' : 'secondary'} className="text-[9px]">
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
          )}
        </SheetContent>
      </Sheet>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Portfolio" className="max-w-full max-h-[90dvh] rounded-2xl object-contain" />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
