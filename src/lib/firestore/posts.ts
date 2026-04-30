import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { PostDoc } from "@/types";

export async function createPost(
  uid: string,
  data: { title: string; content: string; coverImageUrl?: string | null },
): Promise<string> {
  const ref = collection(getFirebaseDb(), "posts");
  const docRef = await addDoc(ref, {
    uid,
    title: data.title,
    content: data.content,
    coverImageUrl: data.coverImageUrl ?? null,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export async function getPostCountThisMonth(uid: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const ref = collection(getFirebaseDb(), "posts");
  const q = query(ref, where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.filter((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.() ?? new Date(data.createdAt).getTime();
    return createdAt >= startOfMonth;
  }).length;
}

export async function getUserPosts(uid: string): Promise<PostDoc[]> {
  const ref = collection(getFirebaseDb(), "posts");
  const q = query(ref, where("uid", "==", uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(
    (d) =>
      ({
        id: d.id,
        ...d.data(),
      }) as PostDoc,
  );
}

export async function deletePost(postId: string): Promise<void> {
  const ref = doc(getFirebaseDb(), "posts", postId);
  await deleteDoc(ref);
}
