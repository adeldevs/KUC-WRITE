import {
  doc, getDoc, setDoc, updateDoc, arrayUnion,
  collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { User, Assignment, CreateAssignmentPayload, OnboardingPayload, PortfolioItem, WriterProfile } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISO(ts: Timestamp | string | undefined): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  return ts.toDate().toISOString();
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const getMe = async (): Promise<User> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  console.log('[API] getMe → Firestore users/' + uid);
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    // Throw in the shape AuthContext expects to trigger needsOnboarding
    throw { response: { status: 404 } };
  }
  const d = snap.data();
  return {
    uid: snap.id,
    fullName: d.fullName,
    email: d.email,
    photoURL: d.photoURL,
    department: d.department,
    phoneNumber: d.phoneNumber,
    role: d.role,
    portfolio: d.portfolio || [],
    createdAt: toISO(d.createdAt),
  } as User;
};

export const createUser = async (
  payload: OnboardingPayload & { uid: string; email: string; photoURL?: string }
): Promise<User> => {
  const { uid, ...rest } = payload;
  console.log('[API] createUser → Firestore users/' + uid, rest);
  const data = { ...rest, portfolio: [], createdAt: serverTimestamp() };
  await setDoc(doc(db, 'users', uid), data);
  return { uid, ...rest, portfolio: [], createdAt: new Date().toISOString() } as User;
};

export const addPortfolioItem = async (
  imgUrl: string,
  category: 'Handwriting' | 'Drawing'
): Promise<User> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const item: PortfolioItem = { imgUrl, category, uploadedAt: new Date().toISOString(), _id: `p-${Date.now()}` };
  console.log('[API] addPortfolioItem → Firestore arrayUnion', item);
  await updateDoc(doc(db, 'users', uid), { portfolio: arrayUnion(item) });
  return getMe();
};

export const getUserProfile = async (uid: string): Promise<User> => {
  console.log('[API] getUserProfile → Firestore users/' + uid);
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('User not found');
  const d = snap.data();
  return { uid: snap.id, ...d, createdAt: toISO(d.createdAt) } as User;
};

// ─── Assignments ──────────────────────────────────────────────────────────────

export const getAssignments = async (status?: string): Promise<Assignment[]> => {
  console.log('[API] getAssignments → Firestore, status filter:', status ?? 'none');
  const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  let results = snap.docs.map((d) => {
    const data = d.data();
    return {
      _id: d.id,
      title: data.title,
      subjectCode: data.subjectCode,
      totalPages: data.totalPages,
      deadline: data.deadline,
      status: data.status,
      requester: data.requester,
      createdAt: toISO(data.createdAt),
      participants: data.participants ?? [],
      writers: data.writers ?? {},
    } as Assignment;
  });
  if (status) results = results.filter((a) => a.status === status);
  console.log('[API] getAssignments → got', results.length, 'results');
  return results;
};

export const createAssignment = async (payload: CreateAssignmentPayload): Promise<Assignment> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Fetch requester profile for fullName / department
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const userData = userSnap.exists() ? userSnap.data() : null;

  const data = {
    ...payload,
    status: 'open',
    participants: [user.uid], // requester is the first participant
    requester: {
      uid: user.uid,
      fullName: userData?.fullName ?? user.displayName ?? 'Unknown',
      department: userData?.department ?? '',
      photoURL: user.photoURL ?? '',
    },
    createdAt: serverTimestamp(),
  };

  console.log('[API] createAssignment → Firestore', data);
  const ref = await addDoc(collection(db, 'assignments'), data);

  return {
    _id: ref.id,
    ...payload,
    status: 'open' as const,
    requester: data.requester,
    createdAt: new Date().toISOString(),
  };
};

// ─── Chat Participants ────────────────────────────────────────────────────────

/**
 * Called when a writer opens a chat for the first time.
 * - Adds them to participants[] (for MessagesPage writer-side queries)
 * - Stores their profile in writers.{uid} map (for MessagesPage requester-side view)
 * Uses dot-notation merge so each writer's entry is independent.
 */
export const markChatParticipant = async (
  assignmentId: string,
  writer: WriterProfile
): Promise<void> => {
  try {
    // setDoc with merge: true allows dot-notation field paths
    await setDoc(
      doc(db, 'assignments', assignmentId),
      {
        participants: arrayUnion(writer.uid),
        [`writers.${writer.uid}`]: writer,
      },
      { merge: true }
    );
    console.log('[API] markChatParticipant → writer registered:', writer.uid, 'on', assignmentId);
  } catch (err) {
    console.warn('[API] markChatParticipant failed (non-critical):', err);
  }
};

// Chat history is now handled via real-time Firestore listeners in SocketContext.
// getChatHistory is no longer needed.
