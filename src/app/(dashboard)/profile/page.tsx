// FR8X-CON Profile Page
// Left: profile card + work experience + education
// Center: user's own posts with delete/edit
// Right: Post Jobs button + job stats

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Pencil,
  Trash2,
  Briefcase,
  Loader2,
} from "lucide-react";
import { COLLECTIONS } from "@/lib/utils/constants";
import {
  getDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  softDeleteDocument,
} from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";

type UserProfile = {
  fullName?: string;
  companyName?: string;
  location?: string;
  country?: string;
  designation?: string;
  industryTags?: string[];
  membershipTier?: string;
  workExperience?: Array<{
    id: string;
    company: string;
    location: string;
    designation: string;
    from: string;
    to: string;
  }>;
  education?: Array<{
    id: string;
    college: string;
    stream: string;
    from: string;
    to: string;
  }>;
};

type UserPost = {
  id: string;
  authorName: string;
  authorCompany: string;
  authorLocation: string;
  category?: string;
  content: string;
  likesCount: number;
  dislikesCount: number;
  repostsCount: number;
  bookmarksCount: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const displayName = user?.displayName || profile?.fullName || "User";

  // Fetch profile
  useEffect(() => {
    if (!user?.uid) return;
    async function fetchProfile() {
      setIsLoadingProfile(true);
      try {
        const data = await getDocument<UserProfile>(COLLECTIONS.PROFILES, user!.uid);
        if (data) setProfile(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Fetch user posts
  useEffect(() => {
    if (!user?.uid) return;
    async function fetchUserPosts() {
      setIsLoadingPosts(true);
      try {
        const data = await queryDocuments<UserPost>(COLLECTIONS.POSTS, [
          where("authorId", "==", user!.uid),
          orderBy("createdAt", "desc"),
          limit(20),
        ]);
        setPosts(data.filter((p) => !p.createdAt));
      } catch (err) {
        console.error("Error fetching user posts:", err);
        // Fallback without compound index if needed
        try {
          const data = await queryDocuments<UserPost>(COLLECTIONS.POSTS, [
            where("authorId", "==", user!.uid),
          ]);
          setPosts(data);
        } catch {
          setPosts([]);
        }
      } finally {
        setIsLoadingPosts(false);
      }
    }
    fetchUserPosts();
  }, [user]);

  const handleDeletePost = async (postId: string) => {
    if (!user?.uid) return;
    try {
      await softDeleteDocument(COLLECTIONS.POSTS, postId, user.uid);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-4">
      {/* Header */}
      <div className="fr8x-container py-3 flex items-center justify-between mb-4">
        <h1 className="text-heading-md text-[var(--fr8x-jet)] font-semibold">Profile Settings</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "fr8x-btn-secondary" : "fr8x-btn-primary"}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="fr8x-container flex gap-4">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[260px] shrink-0 space-y-4">
          {/* User Core Info */}
          <div className="fr8x-card p-4">
            <div className="relative w-16 h-16 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-heading-lg text-[var(--fr8x-jet)] font-semibold mb-3 mx-auto">
              {displayName.charAt(0)}
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--fr8x-periwinkle)] text-white flex items-center justify-center">
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] text-center">
              {displayName}
            </p>
            <p className="text-caption text-foreground-secondary text-center">
              {profile?.companyName || user?.email || "Logistics Professional"}
            </p>
            {(profile?.location || profile?.country) && (
              <p className="text-caption text-foreground-secondary text-center">
                {profile.location ? `${profile.location}, ` : ""}{profile.country || ""}
              </p>
            )}
            {profile?.industryTags && profile.industryTags.length > 0 && (
              <p className="text-caption text-brand-600 text-center mt-1">
                {profile.industryTags.join(" • ")}
              </p>
            )}
            <div className="mt-2 text-center">
              <span className="fr8x-badge-active capitalize">
                {user?.membershipTier || profile?.membershipTier || "Free Tier"}
              </span>
            </div>
          </div>

          {/* Work Experience */}
          <div className="fr8x-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Work Experience</p>
            </div>
            {isLoadingProfile ? (
              <div className="py-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin text-foreground-muted mx-auto" />
              </div>
            ) : !profile?.workExperience || profile.workExperience.length === 0 ? (
              <p className="text-caption text-foreground-muted">No experience details added.</p>
            ) : (
              <div className="space-y-3">
                {profile.workExperience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-[var(--fr8x-lavender)] pl-3">
                    <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{exp.company}</p>
                    <p className="text-caption text-foreground-secondary">{exp.designation}</p>
                    <p className="text-caption text-foreground-secondary">{exp.location}</p>
                    <p className="text-[10px] text-foreground-muted">{exp.from} - {exp.to}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="fr8x-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Education</p>
            </div>
            {isLoadingProfile ? (
              <div className="py-2 text-center">
                <Loader2 className="h-4 w-4 animate-spin text-foreground-muted mx-auto" />
              </div>
            ) : !profile?.education || profile.education.length === 0 ? (
              <p className="text-caption text-foreground-muted">No education details added.</p>
            ) : (
              <div className="space-y-3">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-[var(--fr8x-lavender)] pl-3">
                    <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{edu.college}</p>
                    <p className="text-caption text-foreground-secondary">{edu.stream}</p>
                    <p className="text-[10px] text-foreground-muted">{edu.from} - {edu.to}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ═══ CENTER — User's Posts ═══ */}
        <main className="flex-1 min-w-0 space-y-3">
          <h2 className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-2">My Posts</h2>
          {isLoadingPosts ? (
            <div className="fr8x-card p-6 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              <span className="text-[11px] text-foreground-muted">Loading posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="fr8x-card p-6 text-center">
              <p className="text-body-sm text-foreground-secondary">You haven&apos;t published any posts yet.</p>
              <p className="text-caption text-foreground-muted mt-1">Posts you publish in the feed will appear here.</p>
            </div>
          ) : (
            posts.map((post) => {
              const timeAgo = post.createdAt ? formatRelativeTime(post.createdAt.seconds * 1000) : "";
              return (
                <article key={post.id} className="fr8x-card p-4">
                  {/* Author row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--fr8x-frozen)] flex items-center justify-center text-body-sm font-semibold text-[var(--fr8x-jet)] shrink-0">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{displayName}</span>
                        </div>
                        <p className="text-[10px] text-foreground-muted">
                          {timeAgo}{post.category ? ` • ${post.category}` : ""}
                        </p>
                      </div>
                    </div>
                    {/* delete action */}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="hover:text-danger transition-colors p-1 text-foreground-muted"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-body-sm text-[var(--fr8x-jet)] mb-3">{post.content}</p>

                  {/* Interaction */}
                  <div className="flex items-center gap-4 text-caption text-foreground-secondary">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" /> {post.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-3.5 w-3.5" /> {post.dislikesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="h-3.5 w-3.5" /> {post.repostsCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3.5 w-3.5" /> {post.bookmarksCount || 0}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </main>

        {/* ═══ RIGHT SIDEBAR — Jobs ═══ */}
        <aside className="hidden xl:block w-[200px] shrink-0 space-y-4">
          <div className="fr8x-card p-4 text-center">
            <button className="fr8x-btn-primary w-full flex items-center justify-center gap-2 bg-[#56C5F0] hover:bg-[#3ABFF0]">
              <Briefcase className="h-4 w-4" />
              Post Job
            </button>
          </div>
          <div className="fr8x-card p-4 space-y-2">
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Job Stats</p>
            <p className="text-caption text-foreground-secondary">No active job listings</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
