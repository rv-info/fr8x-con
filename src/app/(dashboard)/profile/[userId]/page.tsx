// FR8X-CON Public Profile View Page
// Dynamically resolves UIDs and handles (e.g. @RAJAT001)
// Connects to Firestore to manage connections (Network Partners), follows, blocks, and posts.

"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  MapPin,
  Tag,
  Loader2,
  UserPlus,
  UserCheck,
  UserMinus,
  UserX,
  Heart,
  MessageSquare,
  Repeat2,
  Bookmark,
  Share2,
  Shield,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  deleteDocument,
} from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

type WorkExpItem = {
  id: string;
  company: string;
  location: string;
  designation: string;
  from: string;
  to: string;
};

type EduItem = {
  id: string;
  college: string;
  stream: string;
  from: string;
  to: string;
};

type UserProfile = {
  id: string;
  userId: string;
  fullName?: string;
  companyName?: string;
  location?: string;
  country?: string;
  designation?: string;
  about?: string;
  industryTags?: string[];
  membershipTier?: string;
  workExperience?: WorkExpItem[];
  education?: EduItem[];
  photoURL?: string | null;
  publicId?: string;
  followers?: string[];
  following?: string[];
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

type ConnectionRelation = {
  id: string;
  users: string[];
  status: "pending" | "accepted" | "rejected" | "blocked";
  requesterId: string;
  blockedById?: string;
};

export default function ViewProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Networking states
  const [connection, setConnection] = useState<ConnectionRelation | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Mutual network match states
  const [mutualCount, setMutualCount] = useState(0);
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [industryMatchPct, setIndustryMatchPct] = useState(0);

  const decodedUserId = decodeURIComponent(userId);

  // Redirect to my profile page if it's myself
  useEffect(() => {
    if (profile && currentUser && profile.userId === currentUser.uid) {
      router.replace(ROUTES.PROFILE);
    }
  }, [profile, currentUser, router]);

  // Load profile details
  const fetchProfileAndRelations = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // 1. Resolve viewed user profile
      let targetProfile: UserProfile | null = null;
      if (decodedUserId.startsWith("@")) {
        const results = await queryDocuments<UserProfile>(COLLECTIONS.PROFILES, [
          where("publicId", "==", decodedUserId),
        ]);
        if (results.length > 0) targetProfile = results[0] || null;
      } else {
        targetProfile = await getDocument<UserProfile>(COLLECTIONS.PROFILES, decodedUserId);
      }

      if (!targetProfile) {
        setIsLoading(false);
        return;
      }

      setProfile(targetProfile);

      // Fetch current user's profile to compute matches
      const myProf = await getDocument<UserProfile>(COLLECTIONS.PROFILES, currentUser.uid);
      setMyProfile(myProf);

      // 2. Fetch viewed user's posts
      setIsLoadingPosts(true);
      try {
        const userPosts = await queryDocuments<UserPost>(COLLECTIONS.POSTS, [
          where("authorId", "==", targetProfile.userId),
          orderBy("createdAt", "desc"),
          limit(15),
        ]);
        setPosts(userPosts);
      } catch (err) {
        console.error("Error fetching viewed user posts:", err);
        // Fallback query if no index
        const userPosts = await queryDocuments<UserPost>(COLLECTIONS.POSTS, [
          where("authorId", "==", targetProfile.userId),
        ]);
        setPosts(userPosts);
      } finally {
        setIsLoadingPosts(false);
      }

      // 3. Fetch connection relationship
      const connId = [currentUser.uid, targetProfile.userId].sort().join("_");
      const connDoc = await getDocument<ConnectionRelation>(COLLECTIONS.CONNECTIONS, connId);
      setConnection(connDoc);

      // 4. Check if following
      if (myProf?.following?.includes(targetProfile.userId)) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }

      // 5. Calculate mutual connections
      // Query current user's connections
      const myConns = await queryDocuments<{ users: string[] }>(COLLECTIONS.CONNECTIONS, [
        where("users", "array-contains", currentUser.uid),
        where("status", "==", "accepted"),
      ]);
      const myFriends = myConns.map((c) => c.users.find((u) => u !== currentUser.uid)!);

      // Query viewed user's connections
      const targetConns = await queryDocuments<{ users: string[] }>(COLLECTIONS.CONNECTIONS, [
        where("users", "array-contains", targetProfile.userId),
        where("status", "==", "accepted"),
      ]);
      const targetFriends = targetConns.map((c) => c.users.find((u) => u !== targetProfile.userId)!);

      const intersection = myFriends.filter((f) => targetFriends.includes(f));
      setMutualCount(intersection.length);

      // 6. Calculate shared tags and match percentage
      const myTags = myProf?.industryTags || [];
      const targetTags = targetProfile.industryTags || [];
      const shared = myTags.filter((t) => targetTags.includes(t));
      setSharedTags(shared);

      const totalUnique = Array.from(new Set([...myTags, ...targetTags]));
      if (totalUnique.length > 0) {
        setIndustryMatchPct(Math.round((shared.length / totalUnique.length) * 100));
      } else {
        setIndustryMatchPct(0);
      }
    } catch (err) {
      console.error("Error loading view profile details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [decodedUserId, currentUser]);

  useEffect(() => {
    fetchProfileAndRelations();
  }, [fetchProfileAndRelations]);

  // Network partners logic handlers
  const handleSendRequest = async () => {
    if (!currentUser || !profile) return;
    setIsActionLoading(true);
    try {
      const connId = [currentUser.uid, profile.userId].sort().join("_");
      const newConn: ConnectionRelation = {
        id: connId,
        users: [currentUser.uid, profile.userId].sort(),
        status: "pending",
        requesterId: currentUser.uid,
      };
      await setDocument(COLLECTIONS.CONNECTIONS, connId, newConn);
      setConnection(newConn);
    } catch (err) {
      console.error("Error sending request:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUser || !profile) return;
    setIsActionLoading(true);
    try {
      const connId = [currentUser.uid, profile.userId].sort().join("_");
      await deleteDocument(COLLECTIONS.CONNECTIONS, connId);
      setConnection(null);
    } catch (err) {
      console.error("Error cancelling request:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!currentUser || !profile) return;
    setIsActionLoading(true);
    try {
      const connId = [currentUser.uid, profile.userId].sort().join("_");
      const updated: ConnectionRelation = {
        id: connId,
        users: [currentUser.uid, profile.userId].sort(),
        status: "accepted",
        requesterId: connection?.requesterId || profile.userId,
      };
      await setDocument(COLLECTIONS.CONNECTIONS, connId, updated, true);
      setConnection(updated);
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!currentUser || !profile) return;
    if (!confirm("Are you sure you want to remove this connection?")) return;
    setIsActionLoading(true);
    try {
      const connId = [currentUser.uid, profile.userId].sort().join("_");
      await deleteDocument(COLLECTIONS.CONNECTIONS, connId);
      setConnection(null);
    } catch (err) {
      console.error("Error removing connection:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser || !profile) return;
    if (!confirm("Are you sure you want to block this professional? They will not be able to interact with you.")) return;
    setIsActionLoading(true);
    try {
      const connId = [currentUser.uid, profile.userId].sort().join("_");
      const blocked: ConnectionRelation = {
        id: connId,
        users: [currentUser.uid, profile.userId].sort(),
        status: "blocked",
        requesterId: connection?.requesterId || currentUser.uid,
        blockedById: currentUser.uid,
      };
      await setDocument(COLLECTIONS.CONNECTIONS, connId, blocked, true);
      setConnection(blocked);
    } catch (err) {
      console.error("Error blocking user:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!currentUser || !profile) return;
    setIsActionLoading(true);
    try {
      const connId = [currentUser.uid, profile.userId].sort().join("_");
      await deleteDocument(COLLECTIONS.CONNECTIONS, connId);
      setConnection(null);
    } catch (err) {
      console.error("Error unblocking user:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profile || !myProfile) return;
    setIsActionLoading(true);
    try {
      const currentFollowing = myProfile.following || [];
      let updatedFollowing: string[] = [];
      let updatedFollowers = profile.followers || [];

      if (isFollowing) {
        updatedFollowing = currentFollowing.filter((uid) => uid !== profile.userId);
        updatedFollowers = updatedFollowers.filter((uid) => uid !== currentUser.uid);
      } else {
        updatedFollowing = [...currentFollowing, profile.userId];
        updatedFollowers = [...updatedFollowers, currentUser.uid];
      }

      await setDocument(COLLECTIONS.PROFILES, currentUser.uid, { following: updatedFollowing }, true);
      await setDocument(COLLECTIONS.PROFILES, profile.userId, { followers: updatedFollowers }, true);

      setMyProfile({ ...myProfile, following: updatedFollowing });
      setProfile({ ...profile, followers: updatedFollowers });
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--fr8x-periwinkle)]" />
          <span className="text-body-sm text-foreground-secondary">Loading profile data...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fr8x-card p-8 text-center max-w-md mx-auto my-12 bg-white">
        <User className="h-12 w-12 text-slate-300 mx-auto mb-2" />
        <h2 className="text-body-lg font-bold text-[var(--fr8x-jet)]">User Not Found</h2>
        <p className="text-caption text-foreground-muted mt-1">
          The requested profile does not exist or has been deactivated.
        </p>
        <Button onClick={() => router.push(ROUTES.FEEDS)} className="mt-4 fr8x-btn-primary">
          Back to Feed
        </Button>
      </div>
    );
  }

  const displayName = profile.fullName || "Logistics Member";
  const isBlocked = connection?.status === "blocked";
  const isBlockedByMe = isBlocked && connection?.blockedById === currentUser?.uid;
  const isBlockedByThem = isBlocked && connection?.blockedById !== currentUser?.uid;

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-4">
      {/* Header / Network Match Quick bar */}
      <div className="fr8x-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-heading-md text-[var(--fr8x-jet)] font-semibold">{displayName}</h1>
            {profile.membershipTier === "premium" && (
              <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase font-bold tracking-wider">
                Premium
              </span>
            )}
          </div>
          <p className="text-caption text-foreground-secondary">
            Public Profile Page {profile.publicId && `• ${profile.publicId}`}
          </p>
        </div>

        {/* Match Indicators */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-1.5 px-2 border-r border-border last:border-r-0">
            <Percent className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" />
            <div className="text-left">
              <p className="text-[9px] text-foreground-muted leading-none">Industry Match</p>
              <p className="text-[10px] font-bold text-[var(--fr8x-jet)] mt-0.5">{industryMatchPct}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 border-r border-border last:border-r-0">
            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
            <div className="text-left">
              <p className="text-[9px] text-foreground-muted leading-none">Mutual Partners</p>
              <p className="text-[10px] font-bold text-[var(--fr8x-jet)] mt-0.5">{mutualCount}</p>
            </div>
          </div>
          {profile.companyName && myProfile?.companyName === profile.companyName && (
            <div className="flex items-center gap-1.5 px-2">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                Shared Company
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="fr8x-container flex flex-col lg:flex-row gap-4">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="w-full lg:w-[260px] shrink-0 space-y-4">
          {/* Main User Card */}
          <div className="fr8x-card p-4 bg-white text-center relative">
            <div className="w-16 h-16 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-heading-lg text-[var(--fr8x-jet)] font-semibold mb-3 mx-auto overflow-hidden border border-slate-200">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0)
              )}
            </div>
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{displayName}</p>
            {profile.publicId && (
              <p className="text-[10px] text-[var(--fr8x-periwinkle)] font-medium mt-0.5">{profile.publicId}</p>
            )}
            <p className="text-caption text-foreground-secondary mt-1">
              {profile.designation ? `${profile.designation} at ${profile.companyName || "Logistics Network"}` : profile.companyName || "Logistics Professional"}
            </p>
            {(profile.location || profile.country) && (
              <p className="text-caption text-foreground-secondary mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                <span>{profile.location}{profile.location && profile.country ? ", " : ""}{profile.country}</span>
              </p>
            )}

            {/* Followers / Following counts */}
            <div className="flex items-center justify-center gap-4 mt-3 border-t border-b border-border py-2 text-caption">
              <div>
                <p className="font-bold text-[var(--fr8x-jet)]">{(profile.followers || []).length}</p>
                <p className="text-foreground-secondary text-[10px]">Followers</p>
              </div>
              <div className="border-r border-border h-4" />
              <div>
                <p className="font-bold text-[var(--fr8x-jet)]">{(profile.following || []).length}</p>
                <p className="text-foreground-secondary text-[10px]">Following</p>
              </div>
            </div>

            {/* Action Buttons Block */}
            <div className="mt-4 space-y-2">
              {isBlockedByThem ? (
                <div className="bg-red-50 text-red-700 text-caption p-2 rounded border border-red-100 flex items-center gap-1.5 justify-center">
                  <UserX className="h-3.5 w-3.5" />
                  <span>Interaction Restricted</span>
                </div>
              ) : isBlockedByMe ? (
                <button
                  onClick={handleUnblockUser}
                  disabled={isActionLoading}
                  className="w-full fr8x-btn-secondary text-[11px] py-1 border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
                >
                  <Shield className="h-3.5 w-3.5" /> Unblock Professional
                </button>
              ) : (
                <>
                  {/* Connection Button */}
                  {!connection && (
                    <button
                      onClick={handleSendRequest}
                      disabled={isActionLoading}
                      className="w-full fr8x-btn-primary flex items-center justify-center gap-1.5 text-[11px] py-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Connect as Partner
                    </button>
                  )}
                  {connection?.status === "pending" && connection.requesterId === currentUser?.uid && (
                    <button
                      onClick={handleCancelRequest}
                      disabled={isActionLoading}
                      className="w-full fr8x-btn-secondary flex items-center justify-center gap-1.5 text-[11px] py-1 text-foreground-muted"
                    >
                      <UserMinus className="h-3.5 w-3.5" /> Cancel Request
                    </button>
                  )}
                  {connection?.status === "pending" && connection.requesterId !== currentUser?.uid && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleAcceptRequest}
                        disabled={isActionLoading}
                        className="flex-1 fr8x-btn-primary flex items-center justify-center gap-1 text-[10px] py-1 bg-emerald-500 hover:bg-emerald-600 border-none text-white font-bold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleCancelRequest} // delete request
                        disabled={isActionLoading}
                        className="flex-1 fr8x-btn-secondary text-[10px] py-1 text-red-600 hover:bg-red-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {connection?.status === "accepted" && (
                    <button
                      onClick={handleRemoveConnection}
                      disabled={isActionLoading}
                      className="w-full fr8x-btn-secondary flex items-center justify-center gap-1.5 text-[11px] py-1 border-slate-300 text-emerald-700 bg-emerald-50/30 font-semibold"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Network Partner
                    </button>
                  )}

                  {/* Follow Button */}
                  <button
                    onClick={handleFollowToggle}
                    disabled={isActionLoading}
                    className="w-full fr8x-btn-secondary flex items-center justify-center gap-1.5 text-[11px] py-1"
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFollowing ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                  </button>

                  {/* Block / Report block */}
                  <div className="pt-2 border-t border-border mt-2">
                    <button
                      onClick={handleBlockUser}
                      disabled={isActionLoading}
                      className="text-[10px] text-foreground-muted hover:text-red-500 flex items-center justify-center gap-1 mx-auto hover:underline"
                    >
                      <UserX className="h-3 w-3" /> Block Professional
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Industry Tags */}
          {profile.industryTags && profile.industryTags.length > 0 && (
            <div className="fr8x-card p-4 bg-white">
              <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-2 flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                <span>Specializations</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {profile.industryTags.map((tag) => {
                  const isShared = sharedTags.includes(tag);
                  return (
                    <span
                      key={tag}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                        isShared
                          ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)] font-medium"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {tag} {isShared && "✓"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Work Experience */}
          <div className="fr8x-card p-4 bg-white">
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-3 border-b border-border pb-1">
              Work Experience
            </p>
            {!profile.workExperience || profile.workExperience.length === 0 ? (
              <p className="text-caption text-foreground-muted italic">No details shared.</p>
            ) : (
              <div className="space-y-3">
                {profile.workExperience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-[var(--fr8x-periwinkle)] pl-3 text-left">
                    <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{exp.company}</p>
                    <p className="text-caption text-foreground-secondary">{exp.designation}</p>
                    {exp.location && <p className="text-caption text-foreground-muted">{exp.location}</p>}
                    <p className="text-[9px] text-foreground-muted mt-0.5">{exp.from} - {exp.to}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="fr8x-card p-4 bg-white">
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-3 border-b border-border pb-1">
              Education
            </p>
            {!profile.education || profile.education.length === 0 ? (
              <p className="text-caption text-foreground-muted italic">No details shared.</p>
            ) : (
              <div className="space-y-3">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-[var(--fr8x-periwinkle)] pl-3 text-left">
                    <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{edu.college}</p>
                    <p className="text-caption text-foreground-secondary">{edu.stream}</p>
                    <p className="text-[9px] text-foreground-muted mt-0.5">{edu.from} - {edu.to}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ═══ CENTER FEED — POSTS ═══ */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* About section */}
          {profile.about && (
            <div className="fr8x-card p-4 bg-white">
              <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-2">About / Background</p>
              <p className="text-body-sm text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line">
                {profile.about}
              </p>
            </div>
          )}

          {/* Viewed User's Posts */}
          <div className="space-y-2">
            <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Posts by {displayName}</h3>

            {isLoadingPosts ? (
              <div className="fr8x-card p-6 flex justify-center items-center gap-1.5 bg-white">
                <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
                <span className="text-[10px] text-foreground-muted">Loading posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="fr8x-card p-6 text-center bg-white text-foreground-secondary text-caption">
                No updates shared by this member yet.
              </div>
            ) : (
              posts.map((post) => {
                const timeAgo = post.createdAt ? formatRelativeTime(post.createdAt.seconds * 1000) : "";
                return (
                  <article key={post.id} className="fr8x-card p-3 bg-white space-y-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--fr8x-frozen)] flex items-center justify-center text-body-sm font-semibold text-[var(--fr8x-jet)] shrink-0">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-[var(--fr8x-jet)]">{displayName}</span>
                        </div>
                        <p className="text-[9px] text-foreground-muted leading-none mt-0.5">
                          {timeAgo}{post.category ? ` • ${post.category}` : ""}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Interactions */}
                    <div className="flex items-center gap-4 text-[10px] text-foreground-secondary pt-1 border-t border-border">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" /> {post.dislikesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="h-3 w-3" /> {post.repostsCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="h-3 w-3" /> {post.bookmarksCount || 0}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
