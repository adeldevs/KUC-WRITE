import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';
import { getInitials } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { getAssignments } from '../../lib/api';
import ChatSheet from '../chat/ChatSheet';
import type { Assignment, WriterProfile } from '../../types';

// A flattened chat entry: one row per conversation thread
interface ChatEntry {
  assignment: Assignment;
  writerUid: string;
  otherParty: WriterProfile;
  isMyGig: boolean; // true = I'm the requester
}

export default function MessagesPage() {
  const { dbUser, firebaseUser } = useAuth();
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<ChatEntry | null>(null);

  const myUid = dbUser?.uid ?? firebaseUser?.uid;

  useEffect(() => {
    if (!myUid) return;
    const load = async () => {
      try {
        const all = await getAssignments();
        const entries: ChatEntry[] = [];

        for (const a of all) {
          const writers = a.writers ?? {};
          const participants = a.participants ?? [];

          if (a.requester.uid === myUid) {
            // I'm the requester — show one row per writer who has messaged me
            const writerList = Object.values(writers);
            if (writerList.length === 0) {
              // No writers yet — show the gig as "Awaiting writers"
              entries.push({
                assignment: a,
                writerUid: '',
                otherParty: { uid: '', fullName: 'Awaiting writers…', department: a.subjectCode, photoURL: '' },
                isMyGig: true,
              });
            } else {
              writerList.forEach((w) => {
                entries.push({ assignment: a, writerUid: w.uid, otherParty: w, isMyGig: true });
              });
            }
          } else if (participants.includes(myUid)) {
            // I'm a writer who has chatted in this gig
            entries.push({
              assignment: a,
              writerUid: myUid,
              otherParty: {
                uid: a.requester.uid,
                fullName: a.requester.fullName,
                photoURL: a.requester.photoURL ?? '',
                department: a.requester.department,
              },
              isMyGig: false,
            });
          }
        }

        setChatEntries(entries);
        console.log('[MessagesPage] Chat entries:', entries.length, '(uid:', myUid, ')');
      } catch (err) {
        console.error('[MessagesPage] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [myUid]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-black mb-6 text-[hsl(var(--foreground))]">Messages</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : chatEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--secondary))] flex items-center justify-center text-3xl">
            💬
          </div>
          <p className="font-semibold text-[hsl(var(--foreground))]">No conversations yet</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
            Post a gig or tap "Offer to Write" on a gig to start chatting.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chatEntries.map((entry, i) => (
            <button
              key={`${entry.assignment._id}-${entry.writerUid}-${i}`}
              id={`chat-item-${entry.assignment._id}-${entry.writerUid}`}
              disabled={!entry.writerUid} // "Awaiting writers" rows are non-interactive
              onClick={() => entry.writerUid && setActiveEntry(entry)}
              className={`w-full flex items-center gap-3 p-4 glass rounded-2xl transition-all text-left animate-fade-in ${
                entry.writerUid
                  ? 'hover:border-[hsl(var(--primary)/0.3)] cursor-pointer'
                  : 'opacity-60 cursor-default'
              }`}
            >
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={entry.otherParty.photoURL || ''} />
                <AvatarFallback>{getInitials(entry.otherParty.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[hsl(var(--foreground))] text-sm truncate">
                    {entry.otherParty.fullName}
                  </p>
                  <Badge
                    variant={entry.isMyGig ? 'default' : 'secondary'}
                    className="text-[9px] shrink-0"
                  >
                    {entry.isMyGig ? 'My Gig' : 'Writing'}
                  </Badge>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                  {entry.assignment.title}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-1">
                  {entry.otherParty.department} · {entry.assignment.subjectCode}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeEntry && (
        <ChatSheet
          open={!!activeEntry}
          onClose={() => setActiveEntry(null)}
          assignment={activeEntry.assignment}
          writerUid={activeEntry.writerUid}
        />
      )}
    </div>
  );
}
