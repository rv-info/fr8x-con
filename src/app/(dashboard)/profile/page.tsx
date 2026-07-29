// FR8X-CON Centralized Profile Hub (Reference Specs & Layout)
// Includes: Overview, Company, My Posts, Contacts, Contact Requests, Messages, Saved Posts, Followed Tags, Awards, Blacklist

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Pencil,
  Trash2,
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  User as UserIcon,
  Users,
  MessageSquare,
  Tag as TagIcon,
  Award,
  ShieldAlert,
  FileText,
  UserCheck,
  Clock,
  UserPlus,
  ShieldBan,
  Search,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { COLLECTIONS, INDUSTRY_TAGS, ROUTES } from "@/lib/utils/constants";
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  softDeleteDocument,
} from "@/lib/firebase/firestore";
import {
  getUserConnections,
  sendContactRequest,
  updateContactStatus,
  removeContact,
  searchContactDirectory,
  type ContactConnection,
  type UserContactProfile,
} from "@/lib/firebase/contacts";
import { formatRelativeTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";
import { getProfilePhotoPath } from "@/lib/firebase/storage";
import Link from "next/link";
import { ContactsPanel } from "@/components/contacts/ContactsPanel";

function generatePublicId(name: string): string {
  const prefix = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 5).toUpperCase() || "USER";
  const num = Math.floor(100 + Math.random() * 900);
  return `@${prefix}${num}`;
}

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
  followedTags?: string[];
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

type ProfileTab =
  | "overview"
  | "company"
  | "my-posts"
  | "contacts"
  | "requests"
  | "messages"
  | "saved-posts"
  | "followed-tags"
  | "awards"
  | "blacklist";

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = (searchParams.get("tab") as ProfileTab) || "overview";
  const [activeTab, setActiveTab] = useState<ProfileTab>(tabParam);
  const [contactSubTab, setContactSubTab] = useState<"approved" | "blocked">("approved");

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [directoryResults, setDirectoryResults] = useState<UserContactProfile[]>([]);
  const [directorySearchQuery, setDirectorySearchQuery] = useState("");

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [about, setAbout] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [publicId, setPublicId] = useState("");

  // Work Exp
  const [workExpList, setWorkExpList] = useState<WorkExpItem[]>([]);
  const [showAddWorkExp, setShowAddWorkExp] = useState(false);
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpDesignation, setNewExpDesignation] = useState("");
  const [newExpLocation, setNewExpLocation] = useState("");
  const [newExpFrom, setNewExpFrom] = useState("");
  const [newExpTo, setNewExpTo] = useState("");

  // Education
  const [eduList, setEduList] = useState<EduItem[]>([]);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEduCollege, setNewEduCollege] = useState("");
  const [newEduStream, setNewEduStream] = useState("");
  const [newEduFrom, setNewEduFrom] = useState("");
  const [newEduTo, setNewEduTo] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName = user?.displayName || profile?.fullName || "User";

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`);
  };

  const syncFormWithProfile = useCallback(
    (p: UserProfile | null) => {
      setFullName(p?.fullName || user?.displayName || "");
      setCompanyName(p?.companyName || "");
      setDesignation(p?.designation || "");
      setLocation(p?.location || "");
      setCountry(p?.country || "");
      setAbout(p?.about || "");
      setSelectedTags(p?.industryTags || []);
      setWorkExpList(p?.workExperience || []);
      setEduList(p?.education || []);
      setPhotoURL(p?.photoURL || null);
      setPublicId(p?.publicId || "");
    },
    [user?.displayName]
  );

  // Fetch Profile
  useEffect(() => {
    if (!user?.uid) return;
    async function fetchProfile() {
      setIsLoadingProfile(true);
      try {
        const data = await getDocument<UserProfile>(COLLECTIONS.PROFILES, user!.uid);
        if (data) {
          if (!data.publicId) {
            const generated = generatePublicId(data.fullName || user?.displayName || "USER");
            data.publicId = generated;
            await setDocument(COLLECTIONS.PROFILES, user!.uid, { publicId: generated }, true);
          }
          setProfile(data);
          syncFormWithProfile(data);
        } else {
          const generated = generatePublicId(user?.displayName || "USER");
          const initial: UserProfile = {
            fullName: user?.displayName || "",
            companyName: "",
            designation: "",
            location: "",
            country: "",
            about: "",
            industryTags: [],
            workExperience: [],
            education: [],
            photoURL: null,
            publicId: generated,
          };
          await setDocument(COLLECTIONS.PROFILES, user!.uid, initial, true);
          setProfile(initial);
          syncFormWithProfile(initial);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user, syncFormWithProfile]);

  // Fetch User Posts
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
        setPosts(data);
      } catch (err) {
        console.error("Error fetching user posts:", err);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    fetchUserPosts();
  }, [user]);

  // Fetch Connections
  const fetchConnections = useCallback(async () => {
    if (!user?.uid) return;
    const data = await getUserConnections(user.uid);
    setConnections(data);
  }, [user?.uid]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleDeletePost = async (postId: string) => {
    if (!user?.uid) return;
    try {
      await softDeleteDocument(COLLECTIONS.POSTS, postId, user.uid);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput("");
    }
  };

  const handleAddWorkExp = () => {
    if (!newExpCompany.trim() || !newExpDesignation.trim()) return;
    const newItem: WorkExpItem = {
      id: `exp_${Date.now()}`,
      company: newExpCompany.trim(),
      designation: newExpDesignation.trim(),
      location: newExpLocation.trim(),
      from: newExpFrom.trim() || "N/A",
      to: newExpTo.trim() || "Present",
    };
    setWorkExpList([...workExpList, newItem]);
    setNewExpCompany("");
    setNewExpDesignation("");
    setNewExpLocation("");
    setNewExpFrom("");
    setNewExpTo("");
    setShowAddWorkExp(false);
  };

  const handleAddEducation = () => {
    if (!newEduCollege.trim() || !newEduStream.trim()) return;
    const newItem: EduItem = {
      id: `edu_${Date.now()}`,
      college: newEduCollege.trim(),
      stream: newEduStream.trim(),
      from: newEduFrom.trim() || "N/A",
      to: newEduTo.trim() || "Present",
    };
    setEduList([...eduList, newItem]);
    setNewEduCollege("");
    setNewEduStream("");
    setNewEduFrom("");
    setNewEduTo("");
    setShowAddEdu(false);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.uid) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updatedProfile: UserProfile = {
        ...profile,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        designation: designation.trim(),
        location: location.trim(),
        country: country.trim(),
        about: about.trim(),
        industryTags: selectedTags,
        workExperience: workExpList,
        education: eduList,
        photoURL: photoURL,
        publicId: publicId || generatePublicId(fullName.trim() || user?.displayName || "USER"),
      };

      await setDocument(COLLECTIONS.PROFILES, user.uid, updatedProfile, true);
      await setDocument(
        COLLECTIONS.USERS,
        user.uid,
        { displayName: fullName.trim(), photoURL: photoURL },
        true
      );

      setProfile(updatedProfile);
      setIsEditing(false);
      setSaveSuccess("Profile updated successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setSaveError("Failed to save profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Connection List Filterings
  const approvedList = connections.filter((c) => c.status === "approved");
  const blockedList = connections.filter((c) => c.status === "blocked");
  const receivedList = connections.filter((c) => c.status === "pending" && c.recipientId === user?.uid);
  const sentList = connections.filter((c) => c.status === "pending" && c.requesterId === user?.uid);

  const handleUpdateStatus = async (connId: string, status: "approved" | "rejected" | "blocked") => {
    if (!user) return;
    await updateContactStatus(connId, status, user.uid);
    await fetchConnections();
  };

  const handleRemoveConn = async (connId: string) => {
    await removeContact(connId);
    await fetchConnections();
  };

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-3 space-y-3">
      {/* Top Banner Header */}
      <div className="fr8x-container flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-border">
        <div>
          <h1 className="text-heading-md font-bold text-[var(--fr8x-jet)]">
            Enterprise Profile Hub & Network Central
          </h1>
          <p className="text-caption text-foreground-secondary">
            Manage your B2B profile, company credentials, enterprise contacts, and communications.
          </p>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  syncFormWithProfile(profile);
                  setIsEditing(false);
                }}
                className="fr8x-btn-secondary text-[11px]"
              >
                Cancel
              </button>
              <Button onClick={() => handleSaveProfile()} isLoading={isSaving} className="fr8x-btn-primary text-[11px]">
                Save Profile
              </Button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="fr8x-btn-primary flex items-center gap-1.5 text-[11px]">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="fr8x-container">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-caption rounded p-2.5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        </div>
      )}
      {saveError && (
        <div className="fr8x-container">
          <div className="bg-red-50 border border-red-200 text-red-800 text-caption rounded p-2.5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        </div>
      )}

      {/* Main Profile Module Navigation Tabs */}
      <div className="fr8x-container">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-xl border border-border text-[11px]">
          <button
            onClick={() => handleTabChange("overview")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "overview" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" /> Profile Overview
          </button>

          <button
            onClick={() => handleTabChange("company")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "company" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Company Profile
          </button>

          <button
            onClick={() => handleTabChange("my-posts")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "my-posts" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> My Posts ({posts.length})
          </button>

          <button
            onClick={() => handleTabChange("contacts")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "contacts" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Contacts & Blocked ({approvedList.length})
          </button>

          <button
            onClick={() => handleTabChange("requests")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "requests" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" /> Contact Requests ({receivedList.length})
          </button>

          <button
            onClick={() => handleTabChange("messages")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "messages" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Messages
          </button>

          <button
            onClick={() => handleTabChange("saved-posts")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "saved-posts" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" /> Saved Posts
          </button>

          <button
            onClick={() => handleTabChange("followed-tags")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "followed-tags" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <TagIcon className="h-3.5 w-3.5" /> Followed Tags
          </button>

          <button
            onClick={() => handleTabChange("awards")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "awards" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <Award className="h-3.5 w-3.5" /> Awards & Certs
          </button>

          <button
            onClick={() => handleTabChange("blacklist")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === "blacklist" ? "bg-[var(--fr8x-periwinkle)] text-white font-bold" : "text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Blacklist
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="fr8x-container flex flex-col lg:flex-row gap-4">
        {/* ═══ TAB 1: OVERVIEW (With Reference Layout Image 3 Structure) ═══ */}
        {activeTab === "overview" && (
          <>
            {/* Left Column: User Core Card + Work Exp + Education */}
            <aside className="w-full lg:w-[260px] shrink-0 space-y-3">
              <div className="fr8x-card p-4 bg-white text-center space-y-2">
                <div className="relative w-16 h-16 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-heading-lg text-[var(--fr8x-jet)] font-semibold mx-auto overflow-hidden">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0)
                  )}
                </div>
                <p className="text-body-sm font-bold text-[var(--fr8x-jet)]">{displayName}</p>
                {publicId && <p className="text-[10px] text-[var(--fr8x-periwinkle)] font-mono">{publicId}</p>}
                <p className="text-caption text-foreground-secondary">
                  {profile?.designation ? `${profile.designation} at ${profile.companyName}` : profile?.companyName || "Logistics Member"}
                </p>

                <div className="pt-2 border-t border-border">
                  <span className="fr8x-badge-active capitalize">
                    {user?.membershipTier || profile?.membershipTier || "Verified Member"}
                  </span>
                </div>
              </div>

              {/* Work Experience */}
              <div className="fr8x-card p-3.5 bg-white text-left">
                <h3 className="text-[11px] font-bold text-[var(--fr8x-jet)] mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" /> Work Experience
                </h3>
                {workExpList.length === 0 ? (
                  <p className="text-[10px] text-foreground-muted">No experience details added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {workExpList.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-[var(--fr8x-periwinkle)] pl-2 text-[10px]">
                        <p className="font-bold text-[var(--fr8x-jet)]">{exp.company}</p>
                        <p className="text-foreground-secondary">{exp.designation}</p>
                        <p className="text-foreground-muted text-[9px]">{exp.from} – {exp.to}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="fr8x-card p-3.5 bg-white text-left">
                <h3 className="text-[11px] font-bold text-[var(--fr8x-jet)] mb-2 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" /> Education
                </h3>
                {eduList.length === 0 ? (
                  <p className="text-[10px] text-foreground-muted">No education details added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {eduList.map((edu) => (
                      <div key={edu.id} className="border-l-2 border-[var(--fr8x-periwinkle)] pl-2 text-[10px]">
                        <p className="font-bold text-[var(--fr8x-jet)]">{edu.college}</p>
                        <p className="text-foreground-secondary">{edu.stream}</p>
                        <p className="text-foreground-muted text-[9px]">{edu.from} – {edu.to}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* Center Area: Posts / Edit Form */}
            <main className="flex-1 min-w-0 space-y-3">
              {isEditing ? (
                /* Edit Profile Form */
                <form onSubmit={handleSaveProfile} className="fr8x-card p-4 space-y-3 bg-white">
                  <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)] border-b border-border pb-2">Edit Profile Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <label className="fr8x-label block mb-1">Full Name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="fr8x-input" required />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Designation</label>
                      <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="fr8x-input" />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Company Name</label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="fr8x-input" />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">City / Country</label>
                      <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="fr8x-input" />
                    </div>
                  </div>
                  <div>
                    <label className="fr8x-label block mb-1">About / Bio</label>
                    <textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} className="fr8x-input" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="fr8x-btn-secondary text-[10px]">Cancel</button>
                    <Button type="submit" isLoading={isSaving} className="fr8x-btn-primary text-[10px]">Save Changes</Button>
                  </div>
                </form>
              ) : (
                /* My Posts View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-border">
                    <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)]">My Feed Updates & Posts</h2>
                    <span className="text-caption text-foreground-muted">{posts.length} published</span>
                  </div>

                  {isLoadingPosts ? (
                    <div className="fr8x-card p-6 text-center text-foreground-muted">Loading posts...</div>
                  ) : posts.length === 0 ? (
                    <div className="fr8x-card p-6 text-center bg-white">
                      <p className="text-body-sm text-foreground-secondary">You haven&apos;t published any posts yet.</p>
                      <p className="text-caption text-foreground-muted mt-1">Posts published in the feed will appear here.</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <article key={post.id} className="fr8x-card p-3 bg-white space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-[var(--fr8x-jet)]">{displayName}</span>
                            <p className="text-[9px] text-foreground-muted">{post.createdAt ? formatRelativeTime(post.createdAt.seconds * 1000) : "Recently"}</p>
                          </div>
                          <button onClick={() => handleDeletePost(post.id)} className="text-foreground-muted hover:text-red-600 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--fr8x-jet)] whitespace-pre-line">{post.content}</p>
                      </article>
                    ))
                  )}
                </div>
              )}
            </main>

            {/* Right Panel: Reference Image 3 Layout — Contacts & Blocked Quick Cards */}
            <aside className="w-full lg:w-[260px] shrink-0 space-y-3">
              <div className="fr8x-card p-3 bg-white text-left space-y-2 border border-slate-200">
                {/* Contacts & Blocked Sub Tabs (Image 3 Red Box) */}
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <button
                    onClick={() => setContactSubTab("approved")}
                    className={`flex-1 py-1 text-[11px] font-bold rounded text-center border transition-all ${
                      contactSubTab === "approved"
                        ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)]"
                        : "bg-white text-foreground-secondary border-slate-200"
                    }`}
                  >
                    Contacts ({approvedList.length})
                  </button>

                  <button
                    onClick={() => setContactSubTab("blocked")}
                    className={`flex-1 py-1 text-[11px] font-bold rounded text-center border transition-all ml-1.5 ${
                      contactSubTab === "blocked"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-foreground-secondary border-slate-200"
                    }`}
                  >
                    Blocked ({blockedList.length})
                  </button>
                </div>

                {contactSubTab === "approved" ? (
                  <div className="space-y-2">
                    {approvedList.length === 0 ? (
                      <p className="text-[10px] text-foreground-muted text-center py-4">No approved contacts yet.</p>
                    ) : (
                      approvedList.map((conn) => {
                        const isReq = conn.requesterId === user?.uid;
                        const targetId = isReq ? conn.recipientId : conn.requesterId;
                        const targetName = isReq ? conn.recipientName : conn.requesterName;
                        const targetCompany = isReq ? conn.recipientCompany : conn.requesterCompany;

                        return (
                          <div key={conn.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-[10px]">
                            <div>
                              <p className="font-bold text-[var(--fr8x-jet)]">{targetName}</p>
                              <p className="text-foreground-secondary">{targetCompany}</p>
                            </div>
                            <button
                              onClick={() => handleTabChange("messages")}
                              className="px-2 py-1 bg-[var(--fr8x-periwinkle)] text-white rounded text-[9px] font-bold hover:bg-[#3ABFF0]"
                            >
                              Chat
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedList.length === 0 ? (
                      <p className="text-[10px] text-foreground-muted text-center py-4">No blocked contacts.</p>
                    ) : (
                      blockedList.map((conn) => (
                        <div key={conn.id} className="p-2 rounded bg-red-50 border border-red-200 flex items-center justify-between text-[10px]">
                          <div>
                            <p className="font-bold text-red-900">{conn.recipientName}</p>
                            <p className="text-red-700">{conn.recipientCompany}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveConn(conn.id)}
                            className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] hover:bg-red-700"
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </aside>
          </>
        )}

        {/* ═══ TAB 2: COMPANY PROFILE ═══ */}
        {activeTab === "company" && (
          <div className="w-full fr8x-card p-6 bg-white space-y-4 text-left">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <Building2 className="h-8 w-8 text-[var(--fr8x-periwinkle)]" />
              <div>
                <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)]">
                  {profile?.companyName || "RV-Info Enterprise Logistics"}
                </h2>
                <p className="text-caption text-foreground-secondary">
                  Verified Enterprise Account • {profile?.location || "India"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-[var(--fr8x-jet)]">Company Status</p>
                <p className="text-emerald-600 font-semibold mt-1">Verified Member</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-[var(--fr8x-jet)]">Industry Tags</p>
                <p className="text-foreground-secondary mt-1">{(profile?.industryTags || ["NVOCC", "Ocean Freight"]).join(", ")}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-[var(--fr8x-jet)]">Public Profile Link</p>
                <p className="text-[var(--fr8x-periwinkle)] font-mono mt-1">fr8x.in/company/{user?.uid}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 4: CONTACTS & BLOCKED ═══ */}
        {activeTab === "contacts" && (
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedList.map((conn) => {
                const isReq = conn.requesterId === user?.uid;
                const contactId = isReq ? conn.recipientId : conn.requesterId;
                const contactName = isReq ? conn.recipientName : conn.requesterName;
                const contactCompany = isReq ? conn.recipientCompany : conn.requesterCompany;

                return (
                  <div key={conn.id} className="bg-white p-4 rounded-xl border border-border shadow-xs flex flex-col justify-between text-left">
                    <div>
                      <h3 className="font-bold text-[var(--fr8x-jet)]">{contactName}</h3>
                      <p className="text-caption text-foreground-secondary">{contactCompany}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-border flex items-center justify-between">
                      <button
                        onClick={() => handleTabChange("messages")}
                        className="fr8x-btn-primary py-1 px-3 text-[10px]"
                      >
                        Start Live Chat
                      </button>
                      <button onClick={() => handleRemoveConn(conn.id)} className="text-red-600 hover:underline text-[10px]">
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB 5: CONTACT REQUESTS ═══ */}
        {activeTab === "requests" && (
          <div className="w-full space-y-4 text-left">
            <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Pending Received Requests</h2>
            {receivedList.length === 0 ? (
              <div className="p-6 bg-white rounded-xl text-center text-foreground-muted border border-border">
                No pending contact requests received.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedList.map((conn) => (
                  <div key={conn.id} className="bg-white p-4 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--fr8x-jet)]">{conn.requesterName}</p>
                      <p className="text-caption text-foreground-secondary">{conn.requesterCompany}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(conn.id, "approved")} className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold">
                        Accept
                      </button>
                      <button onClick={() => handleUpdateStatus(conn.id, "rejected")} className="px-3 py-1 bg-slate-200 text-slate-800 rounded text-[11px]">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 6: MESSAGES EMBEDDED ═══ */}
        {activeTab === "messages" && (
          <div className="w-full bg-white p-4 rounded-xl border border-border text-center space-y-3">
            <MessageSquare className="h-10 w-10 text-[var(--fr8x-periwinkle)] mx-auto" />
            <h2 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">Real-time Enterprise Chat</h2>
            <p className="text-caption text-foreground-secondary max-w-md mx-auto">
              Use the floating chat launcher in the bottom-right corner or click below to launch the dedicated messaging workspace.
            </p>
            <Link href={ROUTES.MESSAGES} className="fr8x-btn-primary inline-flex items-center gap-1.5 text-body-sm px-4 py-2">
              Open Full Messaging System
            </Link>
          </div>
        )}

        {/* ═══ OTHER TABS: SAVED POSTS, FOLLOWED TAGS, AWARDS, BLACKLIST ═══ */}
        {activeTab === "saved-posts" && (
          <div className="w-full fr8x-card p-6 bg-white text-center text-foreground-muted border border-border">
            No saved posts yet. Bookmarked feed posts will appear here.
          </div>
        )}

        {activeTab === "followed-tags" && (
          <div className="w-full fr8x-card p-6 bg-white text-left space-y-3">
            <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Followed Industry Tags</h2>
            <div className="flex flex-wrap gap-2">
              {(profile?.followedTags || ["Ocean Freight", "NVOCC", "FCL"]).map((tag) => (
                <span key={tag} className="px-3 py-1 bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] rounded-full font-bold text-caption">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === "awards" && (
          <div className="w-full fr8x-card p-6 bg-white text-left space-y-3">
            <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Awards & Verified Certifications
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <p className="font-bold text-amber-900">FR8X Gold Star Forwarder 2026</p>
              <p className="text-caption text-amber-800">Verified by FR8X Network Moderation Team</p>
            </div>
          </div>
        )}

        {activeTab === "blacklist" && (
          <div className="w-full fr8x-card p-6 bg-white text-left space-y-3">
            <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" /> Enterprise Blacklist
            </h2>
            {blockedList.length === 0 ? (
              <p className="text-caption text-foreground-muted">No blacklisted entities.</p>
            ) : (
              blockedList.map((conn) => (
                <div key={conn.id} className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center text-body-sm">
                  <span>{conn.recipientName} ({conn.recipientCompany})</span>
                  <button onClick={() => handleRemoveConn(conn.id)} className="text-red-700 font-bold hover:underline">
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Profile Hub...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
