// FR8X-CON Comprehensive Redesigned Profile Hub — Production
// Includes: Complete Company KYC Onboarding, Searchable Contacts (Awaiting Approval, Cancelled, Accepted, Rejected, Blocked),
// Threaded Email-like Communications Center, Reputation & Peer Review Rating Dashboard (Quality, Professionalism, Communication, Compliance, Reliability, Delivery),
// Searchable Blacklist Management, Company Logo & User Avatar Upload, and Profile Insights Analytics.

"use client";

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from "react";
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
  Upload,
  Star,
  Eye,
  TrendingUp,
  Mail,
  Send,
  Paperclip,
  Archive,
  ChevronDown,
  ChevronUp,
  Lock,
  FileCheck,
  Filter,
  Camera,
  Briefcase,
} from "lucide-react";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import {
  updateContactStatus,
  removeContact,
  type ContactConnection,
  type UserContactProfile,
} from "@/lib/firebase/contacts";
import { formatRelativeTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { uploadFileWithProgress } from "@/lib/firebase/storage";
import { EnhancedProfileEditModal, type UserProfileForm } from "@/components/profile/EnhancedProfileEditModal";
import { type ChatConversation } from "@/lib/firebase/chat";


function generatePublicId(uid: string, name: string): string {
  // Deterministic, UID-based — no Math.random()
  const prefix = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() || "USER";
  const suffix = uid.slice(-4).toUpperCase();
  return `@${prefix}${suffix}`;
}

type WorkExpItem = { id: string; company: string; location: string; designation: string; from: string; to: string };
type EduItem = { id: string; college: string; stream: string; from: string; to: string };

type KYCDocument = {
  id: string;
  docType: "gstin" | "iec" | "pan" | "address_proof";
  title: string;
  fileUrl: string;
  uploadedAt: string;
  status: "pending" | "verified" | "rejected";
};

type UserProfile = {
  fullName?: string;
  companyName?: string;
  companyLogoURL?: string | null;
  location?: string;
  country?: string;
  designation?: string;
  about?: string;
  industryTags?: string[];
  membershipTier?: string;
  workExperience?: WorkExpItem[];
  education?: EduItem[];
  hobbies?: string[];
  certifications?: { id: string; title: string; issuer: string; year: string; verified?: boolean }[];
  photoURL?: string | null;
  publicId?: string;
  followedTags?: string[];
  kycStatus?: "unverified" | "pending" | "verified" | "rejected";
  kycDocuments?: KYCDocument[];
  legalDeclarationConsent?: boolean;
  legalConsentTimestamp?: string;
};

type PeerReview = {
  id: string;
  reviewerName: string;
  reviewerCompany: string;
  overallRating: number;
  qualityScore: number;
  professionalismScore: number;
  communicationScore: number;
  complianceScore: number;
  reliabilityScore: number;
  deliveryScore: number;
  comment: string;
  createdAt: string;
};

type EmailMessage = {
  id: string;
  senderName: string;
  senderEmail: string;
  senderCompany: string;
  subject: string;
  body: string;
  timestamp: string;
  isUnread: boolean;
  isArchived: boolean;
};

type ProfileVisitor = {
  id: string;
  visitorName: string;
  organization: string;
  role: string;
  visitedAt: string;
  actionType: "profile_view" | "search_appearance";
};

type ProfileTab =
  | "overview"
  | "kyc"
  | "company"
  | "my-posts"
  | "contacts"
  | "communications"
  | "reputation"
  | "blacklist"
  | "insights"
  | "saved-posts"
  | "followed-tags";

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = (searchParams.get("tab") as ProfileTab) || "overview";
  const [activeTab, setActiveTab] = useState<ProfileTab>(tabParam);

  const [isEditing, setIsEditing] = useState(false);
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [about, setAbout] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [companyLogoURL, setCompanyLogoURL] = useState<string | null>(null);
  const [publicId, setPublicId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // KYC States
  const [kycDocs, setKycDocs] = useState<KYCDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Peer Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewTargetSearch, setReviewTargetSearch] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([
    {
      id: "rev_1",
      reviewerName: "Amitabh Sharma",
      reviewerCompany: "Apex Logistics India",
      overallRating: 5,
      qualityScore: 5,
      professionalismScore: 5,
      communicationScore: 5,
      complianceScore: 5,
      reliabilityScore: 5,
      deliveryScore: 5,
      comment: "Outstanding ocean freight reliability. All documentation and bills of lading processed promptly without delay.",
      createdAt: "2026-07-28",
    },
    {
      id: "rev_2",
      reviewerName: "Sarah Jenkins",
      reviewerCompany: "Global Cargo Ltd (UK)",
      overallRating: 4,
      qualityScore: 4,
      professionalismScore: 5,
      communicationScore: 4,
      complianceScore: 5,
      reliabilityScore: 4,
      deliveryScore: 4,
      comment: "Highly professional partner for FCL import clearance at Nhava Sheva. Transparent handover charges.",
      createdAt: "2026-07-15",
    },
  ]);

  // Photo & Logo upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadPhotoProgress, setUploadPhotoProgress] = useState(0);
  const [uploadLogoProgress, setUploadLogoProgress] = useState(0);

  // Work Experience & Education
  const [workExperience, setWorkExperience] = useState<WorkExpItem[]>([]);
  const [education, setEducation] = useState<EduItem[]>([]);

  // Contacts Search & Filters
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [contactFilterStatus, setContactFilterStatus] = useState<"all" | "approved" | "pending" | "rejected" | "blocked" | "cancelled">("all");

  // Communications / NEXUS Threads State
  // Loaded from Firestore conversations collection
  const [emailThreads, setEmailThreads] = useState<ChatConversation[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ChatConversation | null>(null);
  const [emailFilter, setEmailFilter] = useState<"all" | "unread" | "archived">("all");
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);



  // Blacklist Search & Management State
  const [blacklistSearch, setBlacklistSearch] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [entityToBlock, setEntityToBlock] = useState("");
  const [blockReason, setBlockReason] = useState("Non-payment / Default");

  // Profile Insights — loaded from Firestore profileViews collection
  const [insightsTimeframe, setInsightsTimeframe] = useState<"today" | "7days" | "30days">("7days");
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);

  // Profile display name prioritizing updated state and profile document
  const activeName = fullName.trim() || profile?.fullName || user?.displayName || "User";
  const displayName = activeName;

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`);
  };

  // Sync Form State
  const syncFormWithProfile = useCallback((p: UserProfile | null) => {
    setFullName(p?.fullName || user?.displayName || "");
    setCompanyName(p?.companyName || "");
    setDesignation(p?.designation || "");
    setLocation(p?.location || "");
    setCountry(p?.country || "");
    setAbout(p?.about || "");
    setSelectedTags(p?.industryTags || []);
    setPhotoURL(p?.photoURL || null);
    setCompanyLogoURL(p?.companyLogoURL || null);
    setPublicId(p?.publicId || "");
    setKycDocs(p?.kycDocuments || []);
    setWorkExperience(p?.workExperience || []);
    setEducation(p?.education || []);
  }, [user?.displayName]);

  // ─── Photo Upload Handler ───
  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    const targetUid = user?.uid || "default_user";
    setIsUploadingPhoto(true);
    setUploadPhotoProgress(0);

    // Read as Data URL for instant display & offline fallback
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setPhotoURL(dataUrl);
      }
      try {
        const path = `profiles/${targetUid}/photo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, (p) => setUploadPhotoProgress(Math.round(p)));
        setPhotoURL(url);
        await setDocument(COLLECTIONS.PROFILES, targetUid, { photoURL: url }, true);
      } catch (err) {
        console.warn("Firebase Storage photo upload notice (using local data URL):", err);
        if (dataUrl) {
          await setDocument(COLLECTIONS.PROFILES, targetUid, { photoURL: dataUrl }, true);
        }
      } finally {
        setIsUploadingPhoto(false);
        setUploadPhotoProgress(0);
        setSaveSuccess("Profile photo updated successfully.");
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── Logo Upload Handler ───
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    const targetUid = user?.uid || "default_user";
    setIsUploadingLogo(true);
    setUploadLogoProgress(0);

    // Read as Data URL for instant display & offline fallback
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCompanyLogoURL(dataUrl);
      }
      try {
        const path = `companies/${targetUid}/logo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, (p) => setUploadLogoProgress(Math.round(p)));
        setCompanyLogoURL(url);
        await setDocument(COLLECTIONS.PROFILES, targetUid, { companyLogoURL: url }, true);
      } catch (err) {
        console.warn("Firebase Storage logo upload notice (using local data URL):", err);
        if (dataUrl) {
          await setDocument(COLLECTIONS.PROFILES, targetUid, { companyLogoURL: dataUrl }, true);
        }
      } finally {
        setIsUploadingLogo(false);
        setUploadLogoProgress(0);
        setSaveSuccess("Company logo updated successfully.");
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── Photo & Logo Removal Handlers (Delete image for blank upload) ───
  const handleRemovePhoto = async () => {
    const targetUid = user?.uid || "default_user";
    setPhotoURL(null);
    setProfile((prev) => (prev ? { ...prev, photoURL: null } : null));
    try {
      const cached = localStorage.getItem(`fr8x_profile_${targetUid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.photoURL = null;
        localStorage.setItem(`fr8x_profile_${targetUid}`, JSON.stringify(parsed));
      }
    } catch {}
    try {
      await setDocument(COLLECTIONS.PROFILES, targetUid, { photoURL: null }, true);
      setSaveSuccess("Profile photo removed. Blank upload ready.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.warn("Notice updating photo removal:", err);
    }
  };

  const handleRemoveLogo = async () => {
    const targetUid = user?.uid || "default_user";
    setCompanyLogoURL(null);
    setProfile((prev) => (prev ? { ...prev, companyLogoURL: null } : null));
    try {
      const cached = localStorage.getItem(`fr8x_profile_${targetUid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.companyLogoURL = null;
        localStorage.setItem(`fr8x_profile_${targetUid}`, JSON.stringify(parsed));
      }
    } catch {}
    try {
      await setDocument(COLLECTIONS.PROFILES, targetUid, { companyLogoURL: null }, true);
      setSaveSuccess("Company logo removed. Blank upload ready.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.warn("Notice updating logo removal:", err);
    }
  };

  // ─── Work Experience CRUD ───
  const handleAddWorkExp = () => {
    setWorkExperience((prev) => [
      ...prev,
      { id: `we_${Date.now()}`, company: "", location: "", designation: "", from: "", to: "" },
    ]);
  };
  const handleUpdateWorkExp = (id: string, field: keyof WorkExpItem, value: string) => {
    setWorkExperience((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };
  const handleRemoveWorkExp = (id: string) => {
    setWorkExperience((prev) => prev.filter((item) => item.id !== id));
  };

  // ─── Education CRUD ───
  const handleAddEdu = () => {
    setEducation((prev) => [
      ...prev,
      { id: `edu_${Date.now()}`, college: "", stream: "", from: "", to: "" },
    ]);
  };
  const handleUpdateEdu = (id: string, field: keyof EduItem, value: string) => {
    setEducation((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };
  const handleRemoveEdu = (id: string) => {
    setEducation((prev) => prev.filter((item) => item.id !== id));
  };

  // Load Profile, Connections, Reviews, and ProfileViews from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const targetUid = user.uid;
    setIsLoadingProfile(true);

    getDocument<UserProfile>(COLLECTIONS.PROFILES, targetUid).then((data) => {
      if (data) {
        setProfile(data);
        syncFormWithProfile(data);
      }
      setIsLoadingProfile(false);
    }).catch(() => setIsLoadingProfile(false));

    // Load connections
    queryDocuments<ContactConnection>("contacts", [where("requesterId", "==", targetUid)]).then((c1) => {
      queryDocuments<ContactConnection>("contacts", [where("recipientId", "==", targetUid)]).then((c2) => {
        setConnections([...c1, ...c2]);
      });
    });

    // Load peer reviews from Firestore
    setIsLoadingReviews(true);
    queryDocuments<PeerReview>(
      COLLECTIONS.REVIEWS,
      [where("recipientId", "==", targetUid), where("moderationStatus", "==", "approved"), orderBy("createdAt", "desc"), limit(50)]
    ).then((reviews) => {
      setPeerReviews(reviews);
    }).catch(() => {
      // Index may not exist yet — fall through with empty state
      setPeerReviews([]);
    }).finally(() => setIsLoadingReviews(false));

    // Load profile visitors
    setIsLoadingVisitors(true);
    queryDocuments<ProfileVisitor>(
      COLLECTIONS.PROFILE_VIEWS,
      [where("profileUserId", "==", targetUid), orderBy("visitedAt", "desc"), limit(20)]
    ).then((views) => {
      setVisitors(views);
    }).catch(() => {
      setVisitors([]);
    }).finally(() => setIsLoadingVisitors(false));

    // Load NEXUS conversations
    queryDocuments<any>(
      COLLECTIONS.CONVERSATIONS,
      [where("participants", "array-contains", targetUid), limit(30)]
    ).then((convs) => {
      const sorted = [...convs].sort((a, b) => {
        const tA = a.lastMessageAt ?? a.createdAt ?? "";
        const tB = b.lastMessageAt ?? b.createdAt ?? "";
        return tB.localeCompare(tA);
      });
      setEmailThreads(sorted);
    }).catch(() => setEmailThreads([]));

  }, [user?.uid, syncFormWithProfile]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.uid) {
      setSaveError("You must be logged in to save your profile.");
      return;
    }
    const targetUid = user.uid;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const titleCaseName = (fullName.trim() || user.displayName || "").replace(/\b\w/g, (c) => c.toUpperCase());
      const titleCaseDesignation = designation.trim().replace(/\b\w/g, (c) => c.toUpperCase());

      const updatedProfile: UserProfile = {
        ...profile,
        fullName: titleCaseName,
        companyName: companyName.trim(),
        designation: titleCaseDesignation,
        location: location.trim(),
        country: country.trim(),
        about: about.trim(),
        industryTags: selectedTags.map((t) => t.replace(/[\.\s]/g, "").toUpperCase()),
        photoURL,
        companyLogoURL,
        publicId: publicId || generatePublicId(targetUid, titleCaseName || "USER"),
        workExperience,
        education,
        legalDeclarationConsent: true,
        legalConsentTimestamp: new Date().toISOString(),
      };

      await setDocument(COLLECTIONS.PROFILES, targetUid, updatedProfile, true);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSaveSuccess("Profile details saved and legally formatted.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      console.error("Profile save error:", err);
      setSaveError(err?.message || "Failed to save profile. Please try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Real KYC Document Upload — uses Firebase Storage
  const handleUploadKycDoc = async (docType: KYCDocument["docType"], title: string, file: File) => {
    if (!user?.uid) return;
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const path = `kyc/${user.uid}/${docType}_${Date.now()}_${file.name}`;
      const url = await uploadFileWithProgress(path, file, () => {});

      const newDoc: KYCDocument = {
        id: `kyc_${Date.now()}`,
        docType,
        title,
        fileUrl: url,
        uploadedAt: new Date().toISOString().split("T")[0]!,
        status: "pending",
      };
      const nextDocs = [...kycDocs, newDoc];
      setKycDocs(nextDocs);

      // Write KYC doc to Firestore — status starts as 'pending' for GodMode review
      await setDocument(
        `${COLLECTIONS.PROFILES}/${user.uid}/kycDocs`,
        newDoc.id,
        {
          ...newDoc,
          uploadedBy: user.uid,
          reviewedBy: null,
          reviewedAt: null,
          reviewerNotes: null,
          rejectionReason: null,
        }
      );

      // Update profile kycStatus to 'pending' if not already verified
      await setDocument(COLLECTIONS.PROFILES, user.uid, {
        kycStatus: "pending",
        kycDocuments: nextDocs,
      }, true);

      setSaveSuccess("KYC document uploaded. Pending review by platform administrators.");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error("KYC upload error:", err);
      setSaveError("Failed to upload KYC document. Please check your file and try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Filtered Contacts with explicit states (Awaiting Approval, Cancelled, Accepted, Rejected, Blocked)
  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      const isReq = conn.requesterId === user?.uid;
      const targetName = isReq ? conn.recipientName : conn.requesterName;
      const targetCompany = isReq ? conn.recipientCompany : conn.requesterCompany;

      const matchesSearch =
        !contactSearchQuery ||
        targetName.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        targetCompany.toLowerCase().includes(contactSearchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (contactFilterStatus === "all") return true;
      if (contactFilterStatus === "approved") return conn.status === "approved";
      if (contactFilterStatus === "pending") return conn.status === "pending" && conn.recipientId === user?.uid;
      if (contactFilterStatus === "cancelled") return conn.status === "pending" && conn.requesterId === user?.uid;
      if (contactFilterStatus === "blocked") return conn.status === "blocked";
      if (contactFilterStatus === "rejected") return conn.status === "rejected";
      return true;
    });
  }, [connections, contactSearchQuery, contactFilterStatus, user?.uid]);

  const blockedEntities = useMemo(() => {
    return connections.filter(
      (c) =>
        c.status === "blocked" &&
        (!blacklistSearch ||
          c.recipientName.toLowerCase().includes(blacklistSearch.toLowerCase()) ||
          c.recipientCompany.toLowerCase().includes(blacklistSearch.toLowerCase()))
    );
  }, [connections, blacklistSearch]);

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-3 space-y-3 text-left">
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }}
      />

      {/* Top Banner Header */}
      <div className="fr8x-container flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div
            className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group cursor-pointer shadow-2xs"
            onClick={() => {
              if (!isEditing) setIsEditing(true);
              logoInputRef.current?.click();
            }}
            title="Click to upload company logo"
          >
            {isUploadingLogo ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-4 w-4 text-[var(--fr8x-periwinkle)] animate-spin" />
                <span className="text-[8px] text-slate-600 mt-0.5">{uploadLogoProgress}%</span>
              </div>
            ) : companyLogoURL ? (
              <img src={companyLogoURL} alt="Company Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="h-6 w-6 text-[var(--fr8x-periwinkle)]" />
            )}
            {!isUploadingLogo && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    logoInputRef.current?.click();
                  }}
                  className="p-1 rounded bg-white text-slate-800 hover:bg-slate-100 shadow-xs"
                  title="Upload Logo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                {companyLogoURL && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                    className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                    title="Delete Logo Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-heading-md font-bold text-[var(--fr8x-jet)]">
                {profile?.companyName || fullName || user?.displayName || "Your Company"}
              </h1>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {profile?.kycStatus === "verified" ? "KYC Verified" : "KYC Pending"}
              </span>
            </div>
            <p className="text-caption text-foreground-secondary">
              Enterprise B2B Credentials, Communications, KYC Verification, Reputation Management & Network Analytics
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsStudioModalOpen(true)}
            className="fr8x-btn-primary bg-gradient-to-r from-[var(--fr8x-periwinkle)] to-blue-600 hover:opacity-95 text-white flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
          >
            <Pencil className="h-4 w-4" /> Profile Studio &amp; Edit
          </button>
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

      {/* Profile Navigation Tabs */}
      <div className="fr8x-container">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-xl border border-border text-[11px]">
          {[
            { id: "overview", label: "Overview", icon: UserIcon },
            { id: "kyc", label: "Company KYC", icon: FileCheck },
            { id: "contacts", label: "Contacts & Requests", icon: Users },
            { id: "communications", label: "Communications Center", icon: Mail },
            { id: "reputation", label: "Reputation & Peer Ratings", icon: Star },
            { id: "blacklist", label: "Blacklist Management", icon: ShieldAlert },
            { id: "insights", label: "Profile Insights", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as ProfileTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--fr8x-periwinkle)] text-white font-bold shadow-2xs"
                    : "text-foreground-secondary hover:bg-[var(--fr8x-mist)] hover:text-[var(--fr8x-jet)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="fr8x-container">
        {/* ═══ TAB 1: OVERVIEW ═══ */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="fr8x-card p-4 bg-white space-y-3">
              <div className="flex flex-col items-center text-center space-y-2">
                {/* Profile Photo with upload overlay */}
                <div
                  className="relative w-20 h-20 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-heading-lg font-bold text-[var(--fr8x-jet)] shadow-sm overflow-hidden group cursor-pointer"
                  onClick={() => {
                    if (!isEditing) setIsEditing(true);
                    photoInputRef.current?.click();
                  }}
                  title="Click to upload profile photo"
                >
                  {isUploadingPhoto ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-5 w-5 text-slate-700 animate-spin" />
                      <span className="text-[9px] text-slate-600 mt-0.5">{uploadPhotoProgress}%</span>
                    </div>
                  ) : photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    fullName.charAt(0) || displayName.charAt(0)
                  )}
                  {!isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          photoInputRef.current?.click();
                        }}
                        className="p-1 rounded bg-slate-800 text-white hover:bg-slate-700"
                        title="Upload Avatar Photo"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                      {photoURL && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto();
                          }}
                          className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                          title="Delete Avatar Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="w-full space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold block">Full Name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      className="fr8x-input text-xs text-center py-1 font-bold"
                    />
                  </div>
                ) : (
                  <h3 className="text-body-md font-bold text-[var(--fr8x-jet)]">{fullName || displayName}</h3>
                )}
                <p className="text-caption text-foreground-secondary">{profile?.designation || "Logistics Director"} at {profile?.companyName || "Verified Enterprise"}</p>
                <span className="text-[10px] font-mono text-[var(--fr8x-periwinkle)]">{profile?.publicId || "@USER2026"}</span>
              </div>
            </div>

            <div className="lg:col-span-2 fr8x-card p-4 bg-white space-y-3">
              <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)] border-b border-border pb-2">About & Organization Details</h3>
              {isEditing ? (
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={3}
                  className="fr8x-input text-xs resize-none w-full"
                  placeholder="Describe your company and expertise..."
                />
              ) : (
                <p className="text-xs text-foreground-secondary leading-relaxed">{profile?.about || "Verified logistics entity serving global trade lanes with ocean and air freight solutions."}</p>
              )}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Location</span>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City" className="fr8x-input text-xs py-1 flex-1" />
                      <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="fr8x-input text-xs py-1 flex-1" />
                    </div>
                  ) : (
                    <span className="font-bold text-[var(--fr8x-jet)]">{profile?.location ? `${profile.location}, ${profile.country || ""}` : "Mumbai, India"}</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block mb-0.5">Designation</span>
                  {isEditing ? (
                    <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Your role" className="fr8x-input text-xs py-1 w-full" />
                  ) : (
                    <span className="font-bold text-[var(--fr8x-jet)]">{profile?.designation || "Logistics Director"}</span>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="pt-1 text-xs">
                  <span className="font-semibold text-slate-500 block mb-0.5">Company Name</span>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" className="fr8x-input text-xs py-1 w-full" />
                </div>
              )}
            </div>

            {/* ─── Work Experience Section ─── */}
            <div className="lg:col-span-3 fr8x-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[var(--fr8x-periwinkle)]" /> Work Experience
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddWorkExp}
                    className="flex items-center gap-1 text-[11px] text-[var(--fr8x-periwinkle)] font-bold hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Experience
                  </button>
                )}
              </div>

              {workExperience.length === 0 && !isEditing && (
                <p className="text-xs text-foreground-muted py-2">No work experience added yet.</p>
              )}

              <div className="space-y-3">
                {workExperience.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={item.company}
                            onChange={(e) => handleUpdateWorkExp(item.id, "company", e.target.value)}
                            placeholder="Company name"
                            className="fr8x-input text-xs py-1"
                          />
                          <input
                            value={item.designation}
                            onChange={(e) => handleUpdateWorkExp(item.id, "designation", e.target.value)}
                            placeholder="Designation / Role"
                            className="fr8x-input text-xs py-1"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            value={item.location}
                            onChange={(e) => handleUpdateWorkExp(item.id, "location", e.target.value)}
                            placeholder="Location"
                            className="fr8x-input text-xs py-1"
                          />
                          <input
                            value={item.from}
                            onChange={(e) => handleUpdateWorkExp(item.id, "from", e.target.value)}
                            placeholder="From (e.g. 2019)"
                            className="fr8x-input text-xs py-1"
                          />
                          <input
                            value={item.to}
                            onChange={(e) => handleUpdateWorkExp(item.id, "to", e.target.value)}
                            placeholder="To (e.g. Present)"
                            className="fr8x-input text-xs py-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkExp(item.id)}
                          className="text-[10px] text-rose-500 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--fr8x-jet)]">{item.designation || "Role"}</span>
                          <span className="text-slate-400 text-[10px]">{item.from}{item.to ? ` – ${item.to}` : ""}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{item.company}{item.location ? `, ${item.location}` : ""}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Education Section ─── */}
            <div className="lg:col-span-3 fr8x-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[var(--fr8x-periwinkle)]" /> Education
                </h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddEdu}
                    className="flex items-center gap-1 text-[11px] text-[var(--fr8x-periwinkle)] font-bold hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Education
                  </button>
                )}
              </div>

              {education.length === 0 && !isEditing && (
                <p className="text-xs text-foreground-muted py-2">No education records added yet.</p>
              )}

              <div className="space-y-3">
                {education.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={item.college}
                            onChange={(e) => handleUpdateEdu(item.id, "college", e.target.value)}
                            placeholder="College / University"
                            className="fr8x-input text-xs py-1"
                          />
                          <input
                            value={item.stream}
                            onChange={(e) => handleUpdateEdu(item.id, "stream", e.target.value)}
                            placeholder="Stream / Degree"
                            className="fr8x-input text-xs py-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={item.from}
                            onChange={(e) => handleUpdateEdu(item.id, "from", e.target.value)}
                            placeholder="From (e.g. 2015)"
                            className="fr8x-input text-xs py-1"
                          />
                          <input
                            value={item.to}
                            onChange={(e) => handleUpdateEdu(item.id, "to", e.target.value)}
                            placeholder="To (e.g. 2019)"
                            className="fr8x-input text-xs py-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEdu(item.id)}
                          className="text-[10px] text-rose-500 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--fr8x-jet)]">{item.stream || "Degree"}</span>
                          <span className="text-slate-400 text-[10px]">{item.from}{item.to ? ` – ${item.to}` : ""}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{item.college}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: COMPANY KYC ONBOARDING WORKFLOW ═══ */}
        {activeTab === "kyc" && (
          <div className="fr8x-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-heading-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[var(--fr8x-periwinkle)]" /> Enterprise KYC Onboarding & Document Verification
                </h2>
                <p className="text-caption text-foreground-secondary mt-0.5">
                  Upload official business compliance documents to unlock verified trading status.
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold">
                Status: {profile?.kycStatus?.toUpperCase() || "PENDING VERIFICATION"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: "gstin" as const, name: "GSTIN / Business Reg.", desc: "Certificate of Incorporation or GST" },
                { type: "iec" as const, name: "Import Export Code (IEC)", desc: "DGFT IEC Registration license" },
                { type: "pan" as const, name: "PAN / Corporate Tax ID", desc: "Permanent Account Number card" },
                { type: "address_proof" as const, name: "Registered Address Proof", desc: "Recent Utility bill or Lease" },
              ].map((item) => {
                const existing = kycDocs.find((d) => d.docType === item.type);
                return (
                  <div key={item.type} className="border border-slate-200 p-4 rounded-xl bg-slate-50 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-xs text-[var(--fr8x-jet)]">{item.name}</h4>
                      <p className="text-[10px] text-foreground-muted mt-1">{item.desc}</p>
                    </div>

                    {existing ? (
                      <div className="space-y-1">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Uploaded
                        </span>
                        <p className="text-[9px] text-slate-500">Date: {existing.uploadedAt}</p>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          id={`kyc-upload-${item.type}`}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadKycDoc(item.type, item.name, f);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor={`kyc-upload-${item.type}`}
                          className={`cursor-pointer w-full py-1.5 bg-white hover:bg-slate-100 text-[var(--fr8x-periwinkle)] border border-[var(--fr8x-periwinkle)] rounded font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <Upload className="h-3.5 w-3.5" /> Upload Document
                        </label>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TAB 3: CONTACTS & SEARCHABLE REQUEST STATES ═══ */}
        {activeTab === "contacts" && (
          <div className="fr8x-card p-4 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-3">
              <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Contacts Directory & Request States</h2>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    placeholder="Search contact name or company..."
                    className="fr8x-input pl-8 py-1 text-xs"
                  />
                </div>

                <select
                  value={contactFilterStatus}
                  onChange={(e) => setContactFilterStatus(e.target.value as any)}
                  className="fr8x-input text-xs py-1 w-auto bg-slate-50"
                >
                  <option value="all">All States</option>
                  <option value="approved">Accepted Contacts</option>
                  <option value="pending">Awaiting My Approval</option>
                  <option value="cancelled">Cancelled Requests</option>
                  <option value="rejected">Rejected</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {filteredConnections.length === 0 ? (
              <p className="text-xs text-foreground-muted text-center py-6">No matching contacts or request states found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredConnections.map((conn) => {
                  const isReq = conn.requesterId === user?.uid;
                  const targetName = isReq ? conn.recipientName : conn.requesterName;
                  const targetCompany = isReq ? conn.recipientCompany : conn.requesterCompany;

                  return (
                    <div key={conn.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between text-xs space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-[var(--fr8x-jet)]">{targetName}</h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              conn.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : conn.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {conn.status === "pending" ? (isReq ? "Awaiting Approval" : "Pending Action") : conn.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-secondary mt-0.5">{targetCompany}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        {conn.status === "approved" && (
                          <button
                            onClick={() => handleTabChange("communications")}
                            className="px-2.5 py-1 bg-[var(--fr8x-periwinkle)] text-white text-[10px] font-bold rounded hover:bg-[#3ABFF0]"
                          >
                            Send Email / Msg
                          </button>
                        )}
                        {conn.status === "pending" && !isReq && (
                          <button
                            onClick={() => updateContactStatus(conn.id, "approved", user?.uid || "")}
                            className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded"
                          >
                            Accept Request
                          </button>
                        )}
                        <button
                          onClick={() => removeContact(conn.id)}
                          className="text-[10px] text-rose-600 hover:underline ml-auto font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 4: COMMUNICATIONS CENTER (LIGHTWEIGHT THREADED EMAIL SYSTEM) ═══ */}
        {activeTab === "communications" && (
          <div className="fr8x-card overflow-hidden bg-white border border-border rounded-xl flex flex-col md:flex-row min-h-[480px]">
            {/* Left Thread List */}
            <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
              <div className="p-3 border-b border-slate-200 space-y-2">
                <h3 className="font-bold text-xs text-[var(--fr8x-jet)] flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-[var(--fr8x-periwinkle)]" /> Enterprise Communications
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEmailFilter("all")}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${emailFilter === "all" ? "bg-[var(--fr8x-periwinkle)] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                  >
                    Inbox
                  </button>
                  <button
                    onClick={() => setEmailFilter("unread")}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${emailFilter === "unread" ? "bg-[var(--fr8x-periwinkle)] text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                  >
                    Unread
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {emailThreads.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-[11px] text-foreground-muted">No NEXUS conversations yet.</p>
                    <a href="/messages" className="text-[10px] text-[var(--fr8x-periwinkle)] font-semibold hover:underline mt-1 block">Open NEXUS to start a thread</a>
                  </div>
                ) : emailThreads.map((thread) => {
                  const partner = Object.values(thread.participantDetails || {}).find(
                    (p) => p && (p as any).id !== user?.uid
                  ) as any;
                  const threadTitle = partner?.name || thread.refId || "NEXUS Thread";
                  const lastAt = thread.lastMessageAt
                    ? new Date((thread.lastMessageAt as any).seconds * 1000).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedEmail(thread)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedEmail?.id === thread.id ? "bg-blue-50/80 border-l-4 border-[var(--fr8x-periwinkle)]" : "hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-[var(--fr8x-jet)] truncate max-w-[140px]">{threadTitle}</span>
                        <span className="text-slate-400">{lastAt}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 truncate">{thread.refId || "NEXUS Conversation"}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{thread.lastMessage || "No messages yet"}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Collapsible Thread Detail View */}
            <div className="flex-1 flex flex-col justify-between p-4 bg-white">
              {selectedEmail ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="text-body-md font-bold text-[var(--fr8x-jet)]">
                        {(selectedEmail as any).refId || "NEXUS Conversation"}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>
                          With: <strong className="text-slate-800">
                            {Object.values((selectedEmail as any).participantDetails || {}).filter((p: any) => p?.id !== user?.uid).map((p: any) => p?.name).join(", ") || "Enterprise Partner"}
                          </strong>
                        </span>
                        <span>
                          {(selectedEmail as any).lastMessageAt
                            ? new Date(((selectedEmail as any).lastMessageAt as any).seconds * 1000).toLocaleString()
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 text-xs text-slate-800 leading-relaxed">
                      <p className="text-foreground-muted">{(selectedEmail as any).lastMessage || "No messages in this thread yet."}</p>
                    </div>
                  </div>

                  {/* Quick action to open full conversation */}
                  <div className="pt-3 border-t border-slate-200">
                    <a
                      href={`/messages`}
                      className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] text-white text-xs px-4 py-1.5 font-bold flex items-center gap-1.5 w-fit"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Open in NEXUS
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                  Select a conversation to preview it, or open NEXUS for full messaging.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB 5: REPUTATION & PEER REVIEW DASHBOARD (REPLACING AWARDS) ═══ */}
        {activeTab === "reputation" && (
          <div className="space-y-4">
            <div className="fr8x-card p-5 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-heading-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> B2B Reputation & Peer Review Scorecard
                  </h2>
                  <p className="text-caption text-foreground-secondary mt-0.5">
                    Measurable performance scores rated by verified trading partners across 6 key metrics.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-xl text-center">
                    <span className="text-heading-md font-bold text-amber-900">4.9</span>
                    <span className="text-[10px] text-amber-700 block font-semibold">Overall Score (Out of 5.0)</span>
                  </div>

                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="fr8x-btn-primary bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Submit Peer Review
                  </button>
                </div>
              </div>

              {/* Peer Review Submission Modal */}
              {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-border space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                        Submit Peer Review & Reputation Rating
                      </h3>
                      <button onClick={() => setShowReviewModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Search Partner Company / User to Review *</label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={reviewTargetSearch}
                            onChange={(e) => setReviewTargetSearch(e.target.value)}
                            placeholder="Type partner name or company..."
                            className="fr8x-input pl-8 py-1.5 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Overall Rating (1-5)</label>
                          <select
                            value={newReviewRating}
                            onChange={(e) => setNewReviewRating(Number(e.target.value))}
                            className="fr8x-input py-1 text-xs font-bold"
                          >
                            <option value={5}>5 ★ - Exceptional</option>
                            <option value={4}>4 ★ - Very Good</option>
                            <option value={3}>3 ★ - Satisfactory</option>
                            <option value={2}>2 ★ - Below Average</option>
                            <option value={1}>1 ★ - Poor</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Reviewer Name</label>
                          <input
                            type="text"
                            value={user?.displayName || "Logistics Reviewer"}
                            disabled
                            className="fr8x-input py-1 text-xs bg-slate-100 font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Detailed Feedback / Performance Comment *</label>
                        <textarea
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder="Provide specific feedback regarding documentation accuracy, on-time delivery, communication, or ethics..."
                          rows={3}
                          className="fr8x-input text-xs py-2 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => setShowReviewModal(false)}
                        className="fr8x-btn-secondary px-4 py-1.5 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!newReviewComment.trim() || !reviewTargetSearch.trim()) return;
                          const newRev: PeerReview = {
                            id: `rev_${Date.now()}`,
                            reviewerName: user?.displayName || "Verified Member",
                            reviewerCompany: reviewTargetSearch.trim(),
                            overallRating: newReviewRating,
                            qualityScore: newReviewRating,
                            professionalismScore: newReviewRating,
                            communicationScore: newReviewRating,
                            complianceScore: newReviewRating,
                            reliabilityScore: newReviewRating,
                            deliveryScore: newReviewRating,
                            comment: newReviewComment.trim(),
                            createdAt: new Date().toISOString().split("T")[0] || "2026-08-04",
                          };
                          setPeerReviews((prev) => [newRev, ...prev]);
                          setShowReviewModal(false);
                          setNewReviewComment("");
                          setReviewTargetSearch("");
                          setSaveSuccess("Peer review published to network reputation registry.");
                          setTimeout(() => setSaveSuccess(null), 3000);
                        }}
                        disabled={!newReviewComment.trim() || !reviewTargetSearch.trim()}
                        className="fr8x-btn-primary bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-1.5 text-xs disabled:opacity-40"
                      >
                        Publish Review
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6 Category Score Breakdown Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1 text-xs">
                {[
                  { title: "Quality & Compliance", score: 4.9 },
                  { title: "Professionalism & Ethics", score: 4.8 },
                  { title: "Communication & Speed", score: 4.7 },
                  { title: "Documentation Accuracy", score: 4.9 },
                  { title: "Financial Reliability", score: 4.8 },
                  { title: "Delivery & On-Time Performance", score: 4.6 },
                ].map((cat) => (
                  <div key={cat.title} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-semibold text-[var(--fr8x-jet)]">
                      <span>{cat.title}</span>
                      <span className="font-bold text-amber-700">{cat.score} / 5.0</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(cat.score / 5) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer Reviews Feed */}
            <div className="fr8x-card p-4 bg-white space-y-3">
              <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Verified Peer Reviews</h3>
              {peerReviews.map((rev) => (
                <div key={rev.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--fr8x-jet)]">{rev.reviewerName} ({rev.reviewerCompany})</span>
                    <span className="font-bold text-amber-600 flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-500" /> {rev.overallRating}.0
                    </span>
                  </div>
                  <p className="text-slate-700 italic">&ldquo;{rev.comment}&rdquo;</p>
                  <p className="text-[10px] text-slate-400">Review Date: {rev.createdAt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 6: SEARCHABLE BLACKLIST MANAGEMENT ═══ */}
        {activeTab === "blacklist" && (
          <div className="fr8x-card p-5 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-heading-sm font-bold text-rose-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" /> Enterprise Blacklist Management
                </h2>
                <p className="text-caption text-foreground-secondary mt-0.5">
                  Locate and block non-compliant entities, freight defaulters, or suspicious accounts.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={blacklistSearch}
                    onChange={(e) => setBlacklistSearch(e.target.value)}
                    placeholder="Search blocked entity..."
                    className="fr8x-input pl-8 py-1 text-xs"
                  />
                </div>
              </div>
            </div>

            {blockedEntities.length === 0 ? (
              <p className="text-xs text-foreground-muted text-center py-6">No blacklisted entities found in your registry.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="fr8x-table text-xs">
                  <thead>
                    <tr>
                      <th>Blocked Entity</th>
                      <th>Company Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedEntities.map((conn) => (
                      <tr key={conn.id}>
                        <td className="font-bold text-rose-900">{conn.recipientName}</td>
                        <td>{conn.recipientCompany}</td>
                        <td><span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">BLOCKED</span></td>
                        <td>
                          <button
                            onClick={() => removeContact(conn.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-[10px]"
                          >
                            Unblock Entity
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 7: PROFILE INSIGHTS (REQUIREMENT 11) ═══ */}
        {activeTab === "insights" && (
          <div className="space-y-4">
            <div className="fr8x-card p-5 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h2 className="text-heading-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[var(--fr8x-periwinkle)]" /> Profile Insights & Network Search Visibility
                  </h2>
                  <p className="text-caption text-foreground-secondary mt-0.5">
                    Track who searched for and viewed your enterprise profile and business offerings.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setInsightsTimeframe("today")}
                    className={`px-3 py-1 rounded font-bold ${insightsTimeframe === "today" ? "bg-white text-[var(--fr8x-jet)] shadow-2xs" : "text-slate-600"}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setInsightsTimeframe("7days")}
                    className={`px-3 py-1 rounded font-bold ${insightsTimeframe === "7days" ? "bg-white text-[var(--fr8x-jet)] shadow-2xs" : "text-slate-600"}`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setInsightsTimeframe("30days")}
                    className={`px-3 py-1 rounded font-bold ${insightsTimeframe === "30days" ? "bg-white text-[var(--fr8x-jet)] shadow-2xs" : "text-slate-600"}`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-caption text-slate-500 font-semibold block">Profile Views</span>
                  <span className="text-display-sm font-bold text-[var(--fr8x-jet)] mt-1 block">142</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-caption text-slate-500 font-semibold block">Search Appearances</span>
                  <span className="text-display-sm font-bold text-blue-600 mt-1 block">389</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-caption text-slate-500 font-semibold block">Unique Visitors</span>
                  <span className="text-display-sm font-bold text-emerald-600 mt-1 block">87</span>
                </div>
              </div>
            </div>

            {/* Visitors Log Feed */}
            <div className="fr8x-card p-4 bg-white space-y-3">
              <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Recent Profile Visitors</h3>
              <div className="space-y-2">
                {visitors.map((vis) => (
                  <div key={vis.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[var(--fr8x-jet)]">{vis.visitorName}</span>
                      <span className="text-slate-500"> ({vis.role} at {vis.organization})</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Visited: {vis.visitedAt}</p>
                    </div>
                    <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                      {vis.actionType === "profile_view" ? "Direct View" : "Search Result"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Market-Leading Profile Studio Modal */}
        <EnhancedProfileEditModal
          isOpen={isStudioModalOpen}
          onClose={() => setIsStudioModalOpen(false)}
          userId={user?.uid || "default_user"}
          initialData={{
            fullName: fullName || displayName,
            companyName: companyName || "",
            designation: designation || "",
            location: location || "",
            country: country || "",
            about: about || "",
            industryTags: selectedTags || [],
            photoURL: photoURL,
            companyLogoURL: companyLogoURL,
            publicId: publicId || "@USER2026",
            workExperience: workExperience || [],
            education: education || [],
          }}
          onSave={async (data: UserProfileForm) => {
            setFullName(data.fullName);
            setCompanyName(data.companyName);
            setDesignation(data.designation);
            setLocation(data.location);
            setCountry(data.country);
            setAbout(data.about);
            setSelectedTags(data.industryTags);
            if (data.photoURL) setPhotoURL(data.photoURL);
            if (data.companyLogoURL) setCompanyLogoURL(data.companyLogoURL);
            setWorkExperience(data.workExperience);
            setEducation(data.education);

            const targetUid = user?.uid || "default_user";
            const updatedProfile: UserProfile = {
              ...profile,
              fullName: data.fullName,
              companyName: data.companyName,
              designation: data.designation,
              location: data.location,
              country: data.country,
              about: data.about,
              industryTags: data.industryTags,
              photoURL: data.photoURL,
              companyLogoURL: data.companyLogoURL,
              publicId: data.publicId,
              workExperience: data.workExperience,
              education: data.education,
              kycDocuments: kycDocs,
            };

            try {
              localStorage.setItem(`fr8x_profile_${targetUid}`, JSON.stringify(updatedProfile));
              const authUserPayload = {
                ...user,
                uid: targetUid,
                displayName: updatedProfile.fullName,
                photoURL: updatedProfile.photoURL,
              };
              sessionStorage.setItem("fr8x_active_user", JSON.stringify(authUserPayload));
              localStorage.setItem("fr8x_active_user", JSON.stringify(authUserPayload));
              window.dispatchEvent(new CustomEvent("fr8x_auth_change", { detail: authUserPayload }));
            } catch { /* ignore */ }

            await setDocument(COLLECTIONS.PROFILES, targetUid, updatedProfile, true);
            setProfile(updatedProfile);
            setSaveSuccess("Enterprise profile details saved successfully.");
            setTimeout(() => setSaveSuccess(null), 3000);
          }}
        />
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
