import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAssignments } from '../../lib/api';
import AssignmentCard from './AssignmentCard';
import CreateRequestModal from './CreateRequestModal';
import ChatSheet from '../chat/ChatSheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, SlidersHorizontal, Loader2, RefreshCw } from 'lucide-react';
import type { Assignment } from '../../types';

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    _id: 'm1',
    title: 'Organic Chemistry Lab Report — Titration Experiment',
    subjectCode: 'CHEM-301',
    totalPages: 12,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    status: 'open',
    requester: { uid: 'u1', fullName: 'Zara Ahmed', department: 'Chemistry' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm2',
    title: 'Data Structures Assignment — Linked List Implementation Notes',
    subjectCode: 'CS-202',
    totalPages: 8,
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'open',
    requester: { uid: 'u2', fullName: 'Bilal Hassan', department: 'Computer Science' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm3',
    title: 'Macroeconomics Essay — Keynesian vs Monetarist Policy',
    subjectCode: 'ECO-105',
    totalPages: 5,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'open',
    requester: { uid: 'u3', fullName: 'Aisha Malik', department: 'Economics' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm4',
    title: 'Physics Mechanics — Newton\'s Laws Problem Set (Handwritten)',
    subjectCode: 'PHY-101',
    totalPages: 15,
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'open',
    requester: { uid: 'u4', fullName: 'Omar Farooq', department: 'Physics' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm5',
    title: 'Business Law Contract Analysis — Case Study Notes',
    subjectCode: 'LAW-210',
    totalPages: 20,
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'open',
    requester: { uid: 'u5', fullName: 'Sana Qureshi', department: 'Law' },
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'm6',
    title: 'Engineering Drawing — AutoCAD Freehand Sketching Practice',
    subjectCode: 'MECH-103',
    totalPages: 6,
    deadline: new Date(Date.now() + 86400000 * 0.5).toISOString(),
    status: 'open',
    requester: { uid: 'u6', fullName: 'Hamza Iqbal', department: 'Mechanical Engineering' },
    createdAt: new Date().toISOString(),
  },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Dashboard() {
  const { dbUser, firebaseUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [activeGig, setActiveGig] = useState<Assignment | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const isMobile = useIsMobile();

  const fetchAssignments = useCallback(async () => {
    console.log('%c[Dashboard] Fetching assignments from Firestore...', 'color: #7c3aed; font-weight: bold;');
    setLoading(true);
    try {
      const data = await getAssignments('open');
      console.log('%c[Dashboard] ✅ Loaded %d assignments', 'color: #16a34a; font-weight: bold;', data.length, data);
      // Show mock data if Firestore is empty (dev seed)
      setAssignments(data.length > 0 ? data : MOCK_ASSIGNMENTS);
    } catch (err) {
      console.warn('[Dashboard] ⚠️ Firestore failed — showing mock data →', err);
      setAssignments(MOCK_ASSIGNMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
      a.requester.department.toLowerCase().includes(search.toLowerCase())
  );
  if (search) {
    console.log(`[Dashboard] Search filter: "${search}" → ${filtered.length}/${assignments.length} results`);
  }

  const handleOfferToWrite = (assignment: Assignment) => {
    console.log('%c[Dashboard] Opening chat for assignment →', 'color: #0ea5e9; font-weight: bold;', assignment);
    setActiveGig(assignment);
    setChatOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-[hsl(var(--foreground))]">
            Open Gigs
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {filtered.length} assignments available
          </p>
        </div>
        <Button
          id="refresh-btn"
          variant="ghost"
          size="icon"
          onClick={fetchAssignments}
          disabled={loading}
          className="rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          id="search-input"
          placeholder="Search by title, subject, or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] cursor-pointer" />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading assignments…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--secondary))] flex items-center justify-center">
            <Search className="w-7 h-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="font-semibold text-[hsl(var(--foreground))]">No assignments found</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Try a different search or post one yourself.</p>
        </div>
      ) : (
        /* Mobile: flex-col | Desktop: masonry columns */
        <div className="flex flex-col gap-4 md:columns-2 md:gap-0 md:space-y-0 lg:columns-3">
          {filtered.map((assignment, i) => (
            <div key={assignment._id} className="md:break-inside-avoid md:mb-4">
              <AssignmentCard
                assignment={assignment}
                onOfferToWrite={handleOfferToWrite}
                index={i}
              />
            </div>
          ))}
        </div>
      )}

      {/* FAB — Post Assignment */}
      {(dbUser?.role === 'Requester' || dbUser?.role === 'Both' || !dbUser) && (
        <button
          id="fab-create-btn"
          onClick={() => setShowCreate(true)}
          className="fixed bottom-24 md:bottom-8 right-5 md:right-8 w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(263_70%_55%)] to-[hsl(220_70%_55%)] text-white shadow-2xl shadow-[hsl(263_70%_40%/0.5)] flex items-center justify-center z-30 hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
          title="Post a gig"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
      )}

      {/* Modals */}
      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(a) => setAssignments((prev) => [a, ...prev])}
        isMobile={isMobile}
      />

      {activeGig && (
        <ChatSheet
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          assignment={activeGig}
          writerUid={dbUser?.uid ?? firebaseUser?.uid ?? ''}
          otherParty={{
            uid: activeGig.requester.uid,
            fullName: activeGig.requester.fullName,
            photoURL: activeGig.requester.photoURL,
            department: activeGig.requester.department,
          }}
        />
      )}
    </div>
  );
}
