import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Loader2, MessageCircle } from 'lucide-react';
import { getInitials, formatTime } from '../../lib/utils';
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
  lastMessage?: string;
  lastTime?: string;
}

export default function MessagesPage() {
  const { dbUser, firebaseUser } = useAuth();
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<ChatEntry | null>(null);

  const myUid = dbUser?.uid ?? firebaseUser?.uid;

  useEffect(() => {
    if (!myUid) return;
    let active = true;

    const load = async () => {
      try {
        const all = await getAssignments();
        if (!active) return;

        const entries: ChatEntry[] = [];

        for (const a of all) {
          const writers = a.writers ?? {};
          const participants = a.participants ?? [];

          if (a.requester.uid === myUid) {
            // I'm the requester — show one row per writer who has initiated a chat
            const writerList = Object.values(writers);
            if (writerList.length === 0) {
              // No writers yet — show placeholder row (non-interactive)
              entries.push({
                assignment: a,
                writerUid: '',
                otherParty: {
                  uid: '',
                  fullName: 'Awaiting writers…',
                  department: a.subjectCode,
                  photoURL: '',
                },
                isMyGig: true,
              });
            } else {
              writerList.forEach((w) => {
                entries.push({
                  assignment: a,
                  writerUid: w.uid,
                  otherParty: w,
                  isMyGig: true,
                });
              });
            }
          } else if (participants.includes(myUid) || Object.keys(writers).includes(myUid)) {
            // I'm a writer who has chatted in this gig — show requester as the other party
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
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
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
            <ChatEntryRow
              key={`${entry.assignment._id}-${entry.writerUid}-${i}`}
              entry={entry}
              onClick={() => entry.writerUid && setActiveEntry(entry)}
            />
          ))}
        </div>
      )}

      {activeEntry && (
        <ChatSheet
          open={!!activeEntry}
          onClose={() => setActiveEntry(null)}
          assignment={activeEntry.assignment}
          writerUid={activeEntry.writerUid}
          otherParty={activeEntry.otherParty}
        />
      )}
    </div>
  );
}

// ── Chat entry row with live last-message preview ──────────────────────────────
function ChatEntryRow({
  entry,
  onClick,
}: {
  entry: ChatEntry;
  onClick: () => void;
}) {
  const [lastMsg, setLastMsg] = useState<{ content: string; time: string } | null>(null);
  const roomId = `${entry.assignment._id}__${entry.writerUid}`;

  useEffect(() => {
    if (!entry.writerUid) return;
    const q = query(
      collection(db, 'chats', roomId, 'messages'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const first = snap.docs[0];
      if (!first) return;
      const data = first.data();
      const ts = data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
      setLastMsg({ content: data.content as string, time: ts });
    });
    return () => unsub();
  }, [roomId, entry.writerUid]);

  const isAwaiting = !entry.writerUid;

  return (
    <button
      id={`chat-item-${entry.assignment._id}-${entry.writerUid}`}
      disabled={isAwaiting}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 glass rounded-2xl transition-all text-left animate-fade-in ${
        !isAwaiting
          ? 'hover:border-[hsl(var(--primary)/0.3)] cursor-pointer'
          : 'opacity-50 cursor-default'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar className="w-13 h-13">
          <AvatarImage src={entry.otherParty.photoURL || ''} />
          <AvatarFallback>{getInitials(entry.otherParty.fullName)}</AvatarFallback>
        </Avatar>
        {!isAwaiting && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[hsl(var(--card))]" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-semibold text-[hsl(var(--foreground))] text-sm truncate">
            {entry.otherParty.fullName}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {lastMsg && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {formatTime(lastMsg.time)}
              </span>
            )}
            <Badge
              variant={entry.isMyGig ? 'default' : 'secondary'}
              className="text-[9px]"
            >
              {entry.isMyGig ? 'My Gig' : 'Writing'}
            </Badge>
          </div>
        </div>

        {/* Last message preview */}
        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
          {lastMsg
            ? lastMsg.content
            : isAwaiting
            ? 'No writers yet…'
            : entry.assignment.title}
        </p>

        {/* Sub-info */}
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5 truncate">
          {entry.assignment.subjectCode} · {entry.otherParty.department}
        </p>
      </div>

      {/* Chat icon */}
      {!isAwaiting && (
        <MessageCircle className="w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0" />
      )}
    </button>
  );
}
