import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { Message } from '../types';

interface SocketContextValue {
  joinRoom: (assignmentId: string) => void;
  sendMessage: (assignmentId: string, content: string) => Promise<void>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { dbUser, firebaseUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        console.log('[Socket] 🧹 Unmounting — unsubscribing Firestore listener');
        unsubRef.current();
      }
    };
  }, []);

  const joinRoom = (assignmentId: string) => {
    // Avoid re-subscribing to the same room
    if (currentRoomRef.current === assignmentId && unsubRef.current) {
      console.log('[Socket] Already in room', assignmentId, '— skipping re-join');
      return;
    }

    // Leave previous room
    if (unsubRef.current) {
      console.log('[Socket] Leaving room', currentRoomRef.current);
      unsubRef.current();
      unsubRef.current = null;
    }

    currentRoomRef.current = assignmentId;
    setMessages([]);

    console.log('%c[Socket] 🔔 Subscribing to Firestore chat room →', 'color: #7c3aed; font-weight: bold;', assignmentId);

    const q = query(
      collection(db, 'chats', assignmentId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        const msgs: Message[] = snap.docs.map((d) => {
          const data = d.data();
          const createdAt =
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString();
          return {
            _id: d.id,
            sender: data.sender,
            content: data.content,
            createdAt,
          };
        });
        console.log('%c[Socket] 📨 Firestore snapshot →', 'color: #0ea5e9; font-weight: bold;', msgs.length, 'messages');
        setMessages(msgs);
      },
      (err) => {
        console.error('[Socket] ❌ Firestore listener error →', err);
      }
    );
  };

  const sendMessage = async (assignmentId: string, content: string) => {
    if (!firebaseUser) return;
    const uid = dbUser?.uid ?? firebaseUser.uid;
    const payload = {
      sender: {
        uid,
        fullName: dbUser?.fullName ?? firebaseUser.displayName ?? 'Unknown',
        photoURL: firebaseUser.photoURL ?? '',
      },
      content,
      createdAt: serverTimestamp(),
    };
    console.log('%c[Socket] 📤 Writing message to Firestore →', 'color: #a855f7; font-weight: bold;', { roomId: assignmentId, content });
    await addDoc(collection(db, 'chats', assignmentId, 'messages'), payload);
  };

  return (
    <SocketContext.Provider value={{ joinRoom, sendMessage, messages, setMessages }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
