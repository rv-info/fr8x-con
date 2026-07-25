// FR8X-CON Profile Page
// Left: profile card + work experience + education
// Center: edit profile form (when editing) or user's own posts with delete/edit
// Right: Post Jobs button + job stats

"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { COLLECTIONS, INDUSTRY_TAGS } from "@/lib/utils/constants";
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  softDeleteDocument,
} from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";
import { getProfilePhotoPath } from "@/lib/firebase/storage";

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

  // Profile Form State
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
  
  // Work Exp State
  const [workExpList, setWorkExpList] = useState<WorkExpItem[]>([]);
  const [showAddWorkExp, setShowAddWorkExp] = useState(false);
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpDesignation, setNewExpDesignation] = useState("");
  const [newExpLocation, setNewExpLocation] = useState("");
  const [newExpFrom, setNewExpFrom] = useState("");
  const [newExpTo, setNewExpTo] = useState("");

  // Education State
  const [eduList, setEduList] = useState<EduItem[]>([]);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEduCollege, setNewEduCollege] = useState("");
  const [newEduStream, setNewEduStream] = useState("");
  const [newEduFrom, setNewEduFrom] = useState("");
  const [newEduTo, setNewEduTo] = useState("");

  // Save Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName = user?.displayName || profile?.fullName || "User";

  // Populate form state from profile object
  const syncFormWithProfile = useCallback((p: UserProfile | null) => {
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
  }, [user?.displayName]);


  // Fetch profile
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
          // Initialize defaults
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
        setPosts(data);
      } catch (err) {
        console.error("Error fetching user posts:", err);
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

  // Toggle Tag selection
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

  // Work Experience Handlers
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

  const handleRemoveWorkExp = (id: string) => {
    setWorkExpList(workExpList.filter((item) => item.id !== id));
  };

  // Education Handlers
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

  const handleRemoveEducation = (id: string) => {
    setEduList(eduList.filter((item) => item.id !== id));
  };

  // Save Profile to Firestore
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

      // Save to PROFILES collection
      await setDocument(COLLECTIONS.PROFILES, user.uid, updatedProfile, true);

      // Optionally sync display name & photoURL in USERS collection
      await setDocument(
        COLLECTIONS.USERS,
        user.uid,
        {
          displayName: fullName.trim(),
          photoURL: photoURL,
        },
        true
      );


      setProfile(updatedProfile);
      setIsEditing(false);
      setSaveSuccess("Profile updated successfully!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setSaveError("Failed to save profile details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    syncFormWithProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-4">
      {/* Header */}
      <div className="fr8x-container py-3 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-heading-md text-[var(--fr8x-jet)] font-semibold">Profile Settings</h1>
          <p className="text-caption text-foreground-secondary">Manage your professional profile, work history, and credentials</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="fr8x-btn-secondary"
              >
                Cancel
              </button>
              <Button
                onClick={() => handleSaveProfile()}
                isLoading={isSaving}
                loadingText="Saving..."
                className="fr8x-btn-primary"
              >
                Save Profile
              </Button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="fr8x-btn-primary flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="fr8x-container mb-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-body-sm rounded p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        </div>
      )}
      {saveError && (
        <div className="fr8x-container mb-4">
          <div className="bg-red-50 border border-red-200 text-red-800 text-body-sm rounded p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        </div>
      )}

      {/* 3-column layout */}
      <div className="fr8x-container flex flex-col lg:flex-row gap-4">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="w-full lg:w-[260px] shrink-0 space-y-4">
          {/* User Core Info Card */}
          <div className="fr8x-card p-4">
            <div className="relative w-16 h-16 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-heading-lg text-[var(--fr8x-jet)] font-semibold mb-3 mx-auto overflow-hidden">
              {photoURL ? (
                <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0)
              )}
            </div>
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] text-center">
              {isEditing ? (fullName || "User") : displayName}
            </p>
            {publicId && (
              <p className="text-[10px] text-[var(--fr8x-periwinkle)] font-medium text-center mb-1">
                {publicId}
              </p>
            )}
            <p className="text-caption text-foreground-secondary text-center">
              {isEditing ? (designation ? `${designation}${companyName ? ` at ${companyName}` : ''}` : companyName || user?.email || "Logistics Professional") : (profile?.designation ? `${profile.designation}${profile.companyName ? ` at ${profile.companyName}` : ''}` : profile?.companyName || user?.email || "Logistics Professional")}
            </p>
            {((isEditing ? location || country : profile?.location || profile?.country)) && (
              <p className="text-caption text-foreground-secondary text-center mt-0.5">
                {isEditing ? (
                  `${location ? location : ""}${location && country ? ", " : ""}${country || ""}`
                ) : (
                  `${profile?.location ? profile.location : ""}${profile?.location && profile?.country ? ", " : ""}${profile?.country || ""}`
                )}
              </p>
            )}


            {/* Displayed Industry Tags */}
            {((isEditing ? selectedTags : profile?.industryTags) || []).length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {((isEditing ? selectedTags : profile?.industryTags) || []).map((tag) => (
                  <span key={tag} className="text-[10px] bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 text-center border-t border-border pt-2">
              <span className="fr8x-badge-active capitalize">
                {user?.membershipTier || profile?.membershipTier || "Free Tier"}
              </span>
            </div>
          </div>

          {/* Read-Only Preview Sidebar when NOT editing */}
          {!isEditing && (
            <>
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
                  <p className="text-caption text-foreground-muted">No experience details added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.workExperience.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-[var(--fr8x-periwinkle)] pl-3">
                        <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{exp.company}</p>
                        <p className="text-caption text-foreground-secondary">{exp.designation}</p>
                        {exp.location && <p className="text-caption text-foreground-secondary">{exp.location}</p>}
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
                  <p className="text-caption text-foreground-muted">No education details added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="border-l-2 border-[var(--fr8x-periwinkle)] pl-3">
                        <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{edu.college}</p>
                        <p className="text-caption text-foreground-secondary">{edu.stream}</p>
                        <p className="text-[10px] text-foreground-muted">{edu.from} - {edu.to}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* ═══ CENTER AREA ═══ */}
        <main className="flex-1 min-w-0 space-y-4">
          {isEditing ? (
            /* ════ EDIT PROFILE FORM ════ */
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Section 1: Basic Information */}
              <div className="fr8x-card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <UserIcon className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                  <h2 className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Personal & Professional Info</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border-r border-border pr-4 space-y-2">
                    <label className="fr8x-label block">Profile Picture</label>
                    <ImageUploadWithCrop
                      currentImageUrl={photoURL}
                      storagePath={getProfilePhotoPath(user!.uid)}
                      onUploadComplete={(url) => {
                        setPhotoURL(url);
                      }}
                      onRemove={() => setPhotoURL(null)}
                      label="Upload Photo"
                      aspectRatio="square"
                    />
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="fr8x-label block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="fr8x-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="fr8x-label block mb-1">Public Handle (Optional)</label>
                      <input
                        type="text"
                        value={publicId}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val && !val.startsWith("@")) val = "@" + val;
                          setPublicId(val.replace(/\s+/g, "").toUpperCase());
                        }}
                        placeholder="e.g. @JOHN101"
                        className="fr8x-input font-mono"
                      />
                    </div>


                  <div>
                    <label className="fr8x-label block mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Trade Manager"
                      className="fr8x-input"
                    />
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Global Logistics"
                      className="fr8x-input"
                    />
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">City / State</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="fr8x-input"
                    />
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. India"
                      className="fr8x-input"
                    />
                  </div>
                </div>
              </div>

              <div>
                  <label className="fr8x-label block mb-1">About / Bio</label>
                  <textarea
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Brief description of your expertise, specialization, and logistics background..."
                    className="fr8x-input"
                  />
                </div>

                {/* Industry / Specialization Tags */}
                <div>
                  <label className="fr8x-label block mb-1">Industry Specializations & Services</label>
                  <p className="text-caption text-foreground-muted mb-2">Select relevant tags to help other freight forwarders and shippers discover you:</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {INDUSTRY_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                            isSelected
                              ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)]"
                              : "bg-white text-[var(--fr8x-jet)] border-[var(--fr8x-lavender)] hover:bg-[var(--fr8x-mist)]"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}{tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      placeholder="Add custom tag (e.g. Breakbulk) and press Add"
                      className="fr8x-input max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="fr8x-btn-secondary shrink-0"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Work Experience Manager */}
              <div className="fr8x-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                    <h2 className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Work Experience</h2>
                  </div>
                  {!showAddWorkExp && (
                    <button
                      type="button"
                      onClick={() => setShowAddWorkExp(true)}
                      className="fr8x-btn-secondary flex items-center gap-1 text-[10px]"
                    >
                      <Plus className="h-3 w-3" /> Add Experience
                    </button>
                  )}
                </div>

                {/* Existing Work Exp List */}
                {workExpList.length === 0 ? (
                  <p className="text-caption text-foreground-muted italic">No work experience entries added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {workExpList.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-start justify-between bg-[var(--fr8x-bg)] p-3 rounded border border-border"
                      >
                        <div>
                          <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{exp.company}</p>
                          <p className="text-caption text-foreground-secondary">{exp.designation} {exp.location ? `• ${exp.location}` : ''}</p>
                          <p className="text-[10px] text-foreground-muted">{exp.from} – {exp.to}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkExp(exp.id)}
                          className="text-foreground-muted hover:text-danger p-1"
                          title="Remove entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Work Exp Form */}
                {showAddWorkExp && (
                  <div className="bg-[var(--fr8x-mist)]/50 p-3 rounded border border-[var(--fr8x-lavender)] space-y-3">
                    <p className="text-caption font-semibold text-[var(--fr8x-jet)]">New Work Experience</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">Company Name *</label>
                        <input
                          type="text"
                          value={newExpCompany}
                          onChange={(e) => setNewExpCompany(e.target.value)}
                          placeholder="e.g. Maersk Logistics"
                          className="fr8x-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">Designation *</label>
                        <input
                          type="text"
                          value={newExpDesignation}
                          onChange={(e) => setNewExpDesignation(e.target.value)}
                          placeholder="e.g. Operations Manager"
                          className="fr8x-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">Location</label>
                        <input
                          type="text"
                          value={newExpLocation}
                          onChange={(e) => setNewExpLocation(e.target.value)}
                          placeholder="e.g. Singapore"
                          className="fr8x-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">Start Year</label>
                          <input
                            type="text"
                            value={newExpFrom}
                            onChange={(e) => setNewExpFrom(e.target.value)}
                            placeholder="e.g. 2020"
                            className="fr8x-input"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">End Year</label>
                          <input
                            type="text"
                            value={newExpTo}
                            onChange={(e) => setNewExpTo(e.target.value)}
                            placeholder="e.g. Present"
                            className="fr8x-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddWorkExp(false)}
                        className="fr8x-btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddWorkExp}
                        className="fr8x-btn-primary"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Education Manager */}
              <div className="fr8x-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                    <h2 className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Education</h2>
                  </div>
                  {!showAddEdu && (
                    <button
                      type="button"
                      onClick={() => setShowAddEdu(true)}
                      className="fr8x-btn-secondary flex items-center gap-1 text-[10px]"
                    >
                      <Plus className="h-3 w-3" /> Add Education
                    </button>
                  )}
                </div>

                {/* Existing Education List */}
                {eduList.length === 0 ? (
                  <p className="text-caption text-foreground-muted italic">No education entries added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {eduList.map((edu) => (
                      <div
                        key={edu.id}
                        className="flex items-start justify-between bg-[var(--fr8x-bg)] p-3 rounded border border-border"
                      >
                        <div>
                          <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{edu.college}</p>
                          <p className="text-caption text-foreground-secondary">{edu.stream}</p>
                          <p className="text-[10px] text-foreground-muted">{edu.from} – {edu.to}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(edu.id)}
                          className="text-foreground-muted hover:text-danger p-1"
                          title="Remove entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Education Form */}
                {showAddEdu && (
                  <div className="bg-[var(--fr8x-mist)]/50 p-3 rounded border border-[var(--fr8x-lavender)] space-y-3">
                    <p className="text-caption font-semibold text-[var(--fr8x-jet)]">New Education Detail</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">College / University *</label>
                        <input
                          type="text"
                          value={newEduCollege}
                          onChange={(e) => setNewEduCollege(e.target.value)}
                          placeholder="e.g. National University of Singapore"
                          className="fr8x-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">Degree / Stream *</label>
                        <input
                          type="text"
                          value={newEduStream}
                          onChange={(e) => setNewEduStream(e.target.value)}
                          placeholder="e.g. B.Tech Logistics & Supply Chain"
                          className="fr8x-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">Start Year</label>
                        <input
                          type="text"
                          value={newEduFrom}
                          onChange={(e) => setNewEduFrom(e.target.value)}
                          placeholder="e.g. 2016"
                          className="fr8x-input"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[var(--fr8x-jet)] block mb-0.5">End Year</label>
                        <input
                          type="text"
                          value={newEduTo}
                          onChange={(e) => setNewEduTo(e.target.value)}
                          placeholder="e.g. 2020"
                          className="fr8x-input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddEdu(false)}
                        className="fr8x-btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className="fr8x-btn-primary"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="fr8x-btn-secondary"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  loadingText="Saving Profile..."
                  className="fr8x-btn-primary px-4 py-1.5 text-body-sm"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          ) : (
            /* ════ VIEW POSTS (Normal View) ════ */
            <>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}

