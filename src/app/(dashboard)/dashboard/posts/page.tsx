"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserPosts, deletePost } from "@/lib/firestore/posts";
import type { PostDoc } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserPosts(user.uid)
      .then((p) => setPosts(p.sort((a, b) => {
        const toMs = (v: Date | { toMillis?: () => number }) =>
          v instanceof Date ? v.getTime() : (v as { toMillis?: () => number }).toMillis?.() ?? 0;
        return toMs(b.createdAt) - toMs(a.createdAt);
      })))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Posts</h2>
        <p className="text-muted-foreground">All your saved blog posts.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Generate a blog post on the Dashboard and save it as a draft.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{post.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(
                        post.createdAt instanceof Date
                          ? post.createdAt
                          : (post.createdAt as { toDate?: () => Date }).toDate?.() ?? post.createdAt
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      <span className="capitalize">{post.status}</span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {post.coverImageUrl && (
                <CardContent className="pt-0">
                  <div className="relative w-full aspect-video overflow-hidden rounded-md">
                    <Image
                      src={post.coverImageUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                </CardContent>
              )}
              <CardContent className={post.coverImageUrl ? "pt-2" : "pt-0"}>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {post.content.replace(/^#+\s.+\n/, "").trim()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
