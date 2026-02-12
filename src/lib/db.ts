// Firestore Database Services
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { TV, Event } from '@/types';

// Collection names
export const COLLECTIONS = {
  TVS: 'tvs',
  EVENTS: 'events',
  USERS: 'users',
} as const;

// ============== TV Operations ==============

export async function addTV(tvData: Omit<TV, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.TVS), {
    ...tvData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTV(id: string, updates: Partial<TV>) {
  const docRef = doc(db, COLLECTIONS.TVS, id);
  await updateDoc(docRef, updates);
}

export async function deleteTV(id: string) {
  const docRef = doc(db, COLLECTIONS.TVS, id);
  await deleteDoc(docRef);
}

export async function getTV(id: string): Promise<TV | null> {
  const docRef = doc(db, COLLECTIONS.TVS, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return convertDocToTV(docSnap.id, docSnap.data());
  }
  return null;
}

export async function getAllTVs(): Promise<TV[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.TVS));
  return querySnapshot.docs.map((doc) => convertDocToTV(doc.id, doc.data()));
}

export async function getTVBySlug(slug: string): Promise<TV | null> {
  const q = query(collection(db, COLLECTIONS.TVS), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return convertDocToTV(doc.id, doc.data());
  }
  return null;
}

export function subscribeTVs(callback: (tvs: TV[]) => void) {
  const q = query(collection(db, COLLECTIONS.TVS), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const tvs = snapshot.docs.map((doc) => convertDocToTV(doc.id, doc.data()));
    callback(tvs);
  });
}

// ============== Event Operations ==============

export async function addEvent(eventData: Omit<Event, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
    ...eventData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEvent(id: string, updates: Partial<Event>) {
  const docRef = doc(db, COLLECTIONS.EVENTS, id);
  await updateDoc(docRef, updates);
}

export async function deleteEvent(id: string) {
  const docRef = doc(db, COLLECTIONS.EVENTS, id);
  await deleteDoc(docRef);
}

export async function getEvent(id: string): Promise<Event | null> {
  const docRef = doc(db, COLLECTIONS.EVENTS, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return convertDocToEvent(docSnap.id, docSnap.data());
  }
  return null;
}

export async function getAllEvents(): Promise<Event[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
  return querySnapshot.docs.map((doc) => convertDocToEvent(doc.id, doc.data()));
}

export async function getEventsForTV(tvId: string): Promise<Event[]> {
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    where('tvIds', 'array-contains', tvId),
    orderBy('startDateTime', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => convertDocToEvent(doc.id, doc.data()));
}

export function subscribeEvents(callback: (events: Event[]) => void) {
  const q = query(collection(db, COLLECTIONS.EVENTS), orderBy('startDateTime', 'asc'));
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const events = snapshot.docs.map((doc) => convertDocToEvent(doc.id, doc.data()));
    callback(events);
  });
}

export function subscribeEventsForTV(tvId: string, callback: (events: Event[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    where('tvIds', 'array-contains', tvId)
  );
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const events = snapshot.docs.map((doc) => convertDocToEvent(doc.id, doc.data()))
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    callback(events);
  });
}

// ============== Helper Functions ==============

function convertDocToTV(id: string, data: DocumentData): TV {
  return {
    id,
    name: data.name,
    slug: data.slug,
    orientation: data.orientation,
    activeImage: data.activeImage,
    createdAt: convertTimestamp(data.createdAt),
  };
}

function convertDocToEvent(id: string, data: DocumentData): Event {
  return {
    id,
    name: data.name,
    location: data.location,
    startDateTime: data.startDateTime,
    endDateTime: data.endDateTime,
    tvIds: data.tvIds || [],
    tags: data.tags || [],
    createdAt: convertTimestamp(data.createdAt),
  };
}

function convertTimestamp(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return new Date(timestamp).toISOString();
}
