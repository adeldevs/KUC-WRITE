import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetClose, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { markChatParticipant } from '../../lib/api';
import WriterProfileSheet from '../profile/WriterProfileSheet';
import { Send, Phone, ArrowLeft } from 'lucide-react';
import { getInitials, formatTime } from '../../lib/utils';
import type { Assignment, Message, WriterProfile } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  assignment: Assignment;
  /** The writer's UID for this conversation thread. */
  writerUid: string;
  /** Pre-resolved other-party profile (passed from MessagesPage or Dashboard). */
  otherParty?: WriterProfile | null;
}

export default function ChatSheet({ open, onClose, assignment, writerUid, otherParty: otherPartyProp }: Props) {
  const { dbUser, firebaseUser } = useAuth();
  const { messages, joinRoom, sendMessage } = useSocket();
  const [input, setInput] = useState('');
  const [showWriterProfile, setShowWriterProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myUid = dbUser?.uid ?? firebaseUser?.uid;
  const isRequester = myUid === assignment.requester.uid;

  // Unique room per assignment+writer pair
  const roomId = `${assignment._id}__${writerUid}`;

  // Resolve the other party:
  // 1. Use prop if provided (most reliable — comes from MessagesPage)
  // 2. Fall back to extracting from writers map
  // 3. Fall back to first non-requester sender in messages
  const writerSender = messages.find(
    (m) => m.sender.uid !== assignment.requester.uid && m.sender.uid !== 'system'
  )?.sender;

  const otherParty: WriterProfile | null =
    otherPartyProp ??
    (isRequester
      ? writerSender
        ? { ...writerSender, department: assignment.writers?.[writerUid]?.department ?? '' }
        : assignment.writers?.[writerUid] ?? null
      : {
          uid: assignment.requester.uid,
          fullName: assignment.requester.fullName,
          photoURL: assignment.requester.photoURL,
          department: assignment.requester.department,
        });

  // Subscribe to Firestore chat room + register writer as participant
  useEffect(() => {
    if (!open) return;
    console.log('%c[ChatSheet] Joining room →', 'color: #0ea5e9; font-weight: bold;', roomId);
    joinRoom(roomId);

    // Register writer as participant immediately when chat opens
    if (!isRequester && dbUser) {
      markChatParticipant(assignment._id, {
        uid: dbUser.uid,
        fullName: dbUser.fullName,
        photoURL: firebaseUser?.photoURL ?? '',
        department: dbUser.department,
        role: dbUser.role,
      });
    }
  }, [open, roomId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    await sendMessage(roomId, content);
  };

  const handleSharePhone = async () => {
    if (!dbUser?.phoneNumber) return;
    await sendMessage(roomId, `📱 My phone number: ${dbUser.phoneNumber}`);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-md">
          <SheetTitle className="sr-only">Chat — {assignment.title}</SheetTitle>
          <SheetDescription className="sr-only">
            {isRequester
              ? `Chat with writer for ${assignment.subjectCode}`
              : `Chat with ${assignment.requester.fullName} about ${assignment.subjectCode}`}
          </SheetDescription>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shrink-0">
            <SheetClose asChild>
              <button className="p-2 rounded-xl hover:bg-[hsl(var(--secondary))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </SheetClose>

            {/* Clickable avatar — requester can tap to see writer profile */}
            <button
              onClick={() => isRequester && otherParty && setShowWriterProfile(true)}
              className={isRequester && otherParty ? 'cursor-pointer' : 'cursor-default'}
              title={isRequester && otherParty ? `View ${otherParty.fullName}'s profile` : undefined}
            >
              <Avatar className="w-10 h-10 ring-2 ring-transparent hover:ring-[hsl(var(--primary)/0.5)] transition-all">
                <AvatarImage src={otherParty?.photoURL || ''} />
                <AvatarFallback>
                  {otherParty ? getInitials(otherParty.fullName) : '?'}
                </AvatarFallback>
              </Avatar>
            </button>

            <div
              className={`flex-1 min-w-0 ${isRequester && otherParty ? 'cursor-pointer' : ''}`}
              onClick={() => isRequester && otherParty && setShowWriterProfile(true)}
            >
              <p className="font-bold text-[hsl(var(--foreground))] leading-tight truncate">
                {otherParty ? otherParty.fullName : isRequester ? 'Awaiting writer…' : assignment.requester.fullName}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {isRequester
                  ? otherParty?.department
                    ? `${otherParty.department} · ${assignment.subjectCode}`
                    : assignment.subjectCode
                  : `${assignment.subjectCode} · ${assignment.title}`}
              </p>
            </div>

            <Button
              id="share-phone-btn"
              variant="outline"
              size="sm"
              onClick={handleSharePhone}
              className="shrink-0 gap-1.5 text-xs h-9"
              title="Share your phone number"
            >
              <Phone className="w-3.5 h-3.5" />
              Share #
            </Button>
          </div>

          {/* ── Assignment strip ─────────────────────────────────────────────── */}
          <div className="px-4 py-2.5 bg-[hsl(var(--accent)/0.5)] border-b border-[hsl(var(--border))] shrink-0">
            <p className="text-xs font-semibold text-[hsl(var(--primary))]">{assignment.subjectCode}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              {assignment.title} · {assignment.totalPages} pages · Due{' '}
              {new Date(assignment.deadline).toLocaleDateString()}
            </p>
          </div>

          {/* ── Messages ─────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No messages yet.</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Say hello and discuss the gig!</p>
              </div>
            ) : (
              messages.map((msg: Message) => {
                const isMe = msg.sender.uid === myUid;
                const isSystem = msg.sender.uid === 'system';

                if (isSystem) {
                  return (
                    <div key={msg._id} className="flex justify-center">
                      <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] px-3 py-1.5 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg._id}
                    className={`flex gap-2 animate-fade-in ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMe && (
                      <Avatar className="w-7 h-7 shrink-0 mt-1">
                        <AvatarImage src={msg.sender.photoURL || ''} />
                        <AvatarFallback className="text-[9px]">{getInitials(msg.sender.fullName)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isMe && (
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] px-1">{msg.sender.fullName}</span>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'msg-sent text-white rounded-tr-sm'
                            : 'msg-received text-[hsl(var(--foreground))] rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ────────────────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-3 safe-bottom">
            <div className="flex items-center gap-2">
              <Input
                id="chat-input"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-[hsl(var(--secondary))] border-transparent focus-visible:border-[hsl(var(--primary))]"
              />
              <Button
                id="send-msg-btn"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="shrink-0 w-11 h-11 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Writer profile sheet — visible to requesters only */}
      {isRequester && otherParty && showWriterProfile && (
        <WriterProfileSheet
          open={showWriterProfile}
          onClose={() => setShowWriterProfile(false)}
          writer={otherParty}
        />
      )}
    </>
  );
}
