"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Building2,
  Camera,
  Briefcase,
  GraduationCap,
  Tag,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  MapPin,
  ShieldCheck,
  Eye,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { uploadFileWithProgress } from "@/lib/firebase/storage";
import { compressAndOptimizeImage } from "@/lib/utils/imageOptimizer";

export type WorkExpItem = { id: string; company: string; location: string; designation: string; from: string; to: string; roleDescription?: string };
export type EduItem = { id: string; college: string; stream: string; from: string; to: string };
export type CertItem = { id: string; title: string; issuer: string; year: string };

export type UserProfileForm = {
  fullName: string;
  companyName: string;
  designation: string;
  location: string;
  country: string;
  about: string;
  industryTags: string[];
  photoURL: string | null;
  companyLogoURL: string | null;
  publicId: string;
  workExperience: WorkExpItem[];
  education: EduItem[];
  certifications?: CertItem[];
  gstin?: string;
  iec?: string;
  pan?: string;
  chaNo?: string;
};

interface EnhancedProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: UserProfileForm;
  onSave: (data: UserProfileForm) => Promise<void>;
  userId: string;
}

const COMMON_LOGISTICS_TAGS = [
  "Ocean Freight (FCL)", "Ocean Freight (LCL)", "Air Freight", "Customs Brokerage (CHA)",
  "Cross-Border Trucking", "3PL Warehousing", "Cold Chain", "Project Cargo", "Dangerous Goods (DG)"
];

export function EnhancedProfileEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  userId,
}: EnhancedProfileEditModalProps) {
  const [activeSection, setActiveSection] = useState<"basic" | "kyc" | "branding" | "experience" | "education" | "tags">("basic");
  const [formData, setFormData] = useState<UserProfileForm>({
    certifications: [],
    gstin: "",
    iec: "",
    pan: "",
    chaNo: "",
    ...initialData,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // File refs & upload progress
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setFormData({
      certifications: [],
      gstin: "",
      iec: "",
      pan: "",
      chaNo: "",
      ...initialData,
    });
  }, [initialData]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressAndOptimizeImage(file, 600, 600, 0.75);
      setFormData((prev) => ({ ...prev, photoURL: compressedDataUrl }));
      try {
        const path = `profiles/${userId}/photo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, () => {});
        setFormData((prev) => ({ ...prev, photoURL: url }));
      } catch {
        /* Keep compressed data URL fallback */
      }
    } catch (err) {
      console.warn("Photo upload warning:", err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogoSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const compressedDataUrl = await compressAndOptimizeImage(file, 600, 600, 0.75);
      setFormData((prev) => ({ ...prev, companyLogoURL: compressedDataUrl }));
      try {
        const path = `companies/${userId}/logo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, () => {});
        setFormData((prev) => ({ ...prev, companyLogoURL: url }));
      } catch {
        /* Keep compressed data URL fallback */
      }
    } catch (err) {
      console.warn("Logo upload warning:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      industryTags: prev.industryTags.includes(tag)
        ? prev.industryTags.filter((t) => t !== tag)
        : [...prev.industryTags, tag],
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E2329]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-left font-sans">
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); e.target.value = ""; }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoSelect(f); e.target.value = ""; }}
      />

      <div className="bg-[#252B33] rounded-[3px] border border-[#333B44] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-left text-[#E2E8F0]">
        {/* Top Header - Graphite Bar */}
        <div className="px-5 py-3.5 bg-[#20252B] text-[#E2E8F0] flex items-center justify-between border-b border-[#333B44] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2A3038] rounded-[3px] text-[#0EA5E9] border border-[#333B44] shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-[#E2E8F0]">Profile Studio &amp; Settings</h2>
                <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] bg-[#2A3038] text-[#0EA5E9] border border-[#333B44] flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3 text-[#0EA5E9]" /> PRO
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8]">Configure your B2B enterprise identity, credentials &amp; trade profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="px-3 py-1.5 rounded-[3px] text-[10px] bg-[#2A3038] text-[#E2E8F0] border border-[#333B44] hover:bg-[#333B44] transition-colors"
            >
              <Eye className="h-3.5 w-3.5 inline mr-1" />
              {showLivePreview ? "Hide Preview" : "Show Preview"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#E2E8F0] p-1.5 rounded-[3px] hover:bg-[#2A3038] transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-60 bg-[#20252B] text-[#E2E8F0] border-r border-[#333B44] p-3 space-y-1 overflow-y-auto shrink-0">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">
              Modules
            </div>
            {[
              { id: "basic", label: "Basic Info", icon: User },
              { id: "kyc", label: "KYC Numbers", icon: FileCheck },
              { id: "branding", label: "Visual Identity", icon: Camera },
              { id: "experience", label: "Work History", icon: Briefcase },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "tags", label: "Logistics Tags", icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-[3px] text-left transition-colors text-[11px] ${
                    isActive
                      ? "bg-[#0EA5E9] text-white font-bold"
                      : "text-[#94A3B8] hover:bg-[#2A3038] hover:text-[#E2E8F0]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#252B33]">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* BASIC INFO */}
              {activeSection === "basic" && (
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333B44] pb-2">
                    Executive Profile
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">Full Name</label>
                      <input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Full Name"
                        className="fr8x-input text-[11px] w-full"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Designation</label>
                      <input
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Role / Title"
                        className="fr8x-input text-[11px] w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">Company Name</label>
                      <input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Company"
                        className="fr8x-input text-[11px] w-full"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Location / Base City</label>
                      <input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                        className="fr8x-input text-[11px] w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">About Organization / Bio</label>
                    <textarea
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      placeholder="Company summary and logistics operations..."
                      className="fr8x-input text-[11px] w-full min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* KYC NUMBERS */}
              {activeSection === "kyc" && (
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333B44] pb-2">
                    Corporate Compliance Numbers
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">GSTIN Number</label>
                      <input
                        value={formData.gstin || ""}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="GSTIN Code"
                        className="fr8x-input text-[11px] w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Import Export Code (IEC)</label>
                      <input
                        value={formData.iec || ""}
                        onChange={(e) => setFormData({ ...formData, iec: e.target.value })}
                        placeholder="IEC Code"
                        className="fr8x-input text-[11px] w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">PAN Number</label>
                      <input
                        value={formData.pan || ""}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                        placeholder="PAN Card Number"
                        className="fr8x-input text-[11px] w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Customs / CHA License No.</label>
                      <input
                        value={formData.chaNo || ""}
                        onChange={(e) => setFormData({ ...formData, chaNo: e.target.value })}
                        placeholder="CHA License No."
                        className="fr8x-input text-[11px] w-full font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VISUAL IDENTITY */}
              {activeSection === "branding" && (
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333B44] pb-2">
                    Avatars &amp; Branding Images
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#2A3038] p-4 rounded-[3px] border border-[#333B44] flex flex-col items-center space-y-3">
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Profile Avatar</span>
                      <div className="w-20 h-20 rounded-full bg-[#20252B] border border-[#333B44] flex items-center justify-center overflow-hidden">
                        {formData.photoURL ? (
                          <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-[#94A3B8]" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="fr8x-btn-secondary text-[10px] py-1 px-3"
                      >
                        {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                      </button>
                    </div>

                    <div className="bg-[#2A3038] p-4 rounded-[3px] border border-[#333B44] flex flex-col items-center space-y-3">
                      <span className="text-[10px] text-[#94A3B8] font-bold uppercase">Company Logo</span>
                      <div className="w-20 h-20 rounded-[3px] bg-[#20252B] border border-[#333B44] flex items-center justify-center overflow-hidden">
                        {formData.companyLogoURL ? (
                          <img src={formData.companyLogoURL} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-8 w-8 text-[#94A3B8]" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="fr8x-btn-secondary text-[10px] py-1 px-3"
                      >
                        {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* WORK EXPERIENCE */}
              {activeSection === "experience" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333B44] pb-2">
                    <h3 className="text-[12px] font-bold text-[#E2E8F0] uppercase tracking-wider">
                      Work Experience
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          workExperience: [
                            ...(prev.workExperience || []),
                            { id: `we_${Date.now()}`, company: "", location: "", designation: "", from: "", to: "" },
                          ],
                        }))
                      }
                      className="text-[10px] text-[#0EA5E9] font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Item
                    </button>
                  </div>

                  {(formData.workExperience || []).map((exp, idx) => (
                    <div key={exp.id || idx} className="bg-[#2A3038] p-3 rounded-[3px] border border-[#333B44] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...formData.workExperience];
                            updated[idx] = { ...updated[idx]!, company: e.target.value };
                            setFormData({ ...formData, workExperience: updated });
                          }}
                          placeholder="Company Name"
                          className="fr8x-input text-[10px] py-1"
                        />
                        <input
                          value={exp.designation}
                          onChange={(e) => {
                            const updated = [...formData.workExperience];
                            updated[idx] = { ...updated[idx]!, designation: e.target.value };
                            setFormData({ ...formData, workExperience: updated });
                          }}
                          placeholder="Designation"
                          className="fr8x-input text-[10px] py-1"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={exp.location}
                          onChange={(e) => {
                            const updated = [...formData.workExperience];
                            updated[idx] = { ...updated[idx]!, location: e.target.value };
                            setFormData({ ...formData, workExperience: updated });
                          }}
                          placeholder="Location"
                          className="fr8x-input text-[10px] py-1"
                        />
                        <input
                          value={exp.from}
                          onChange={(e) => {
                            const updated = [...formData.workExperience];
                            updated[idx] = { ...updated[idx]!, from: e.target.value };
                            setFormData({ ...formData, workExperience: updated });
                          }}
                          placeholder="From (Year)"
                          className="fr8x-input text-[10px] py-1"
                        />
                        <input
                          value={exp.to}
                          onChange={(e) => {
                            const updated = [...formData.workExperience];
                            updated[idx] = { ...updated[idx]!, to: e.target.value };
                            setFormData({ ...formData, workExperience: updated });
                          }}
                          placeholder="To (Year)"
                          className="fr8x-input text-[10px] py-1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.workExperience.filter((_, i) => i !== idx);
                          setFormData({ ...formData, workExperience: updated });
                        }}
                        className="text-[9px] text-[#FCA5A5] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* EDUCATION */}
              {activeSection === "education" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#333B44] pb-2">
                    <h3 className="text-[12px] font-bold text-[#E2E8F0] uppercase tracking-wider">
                      Education Records
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          education: [
                            ...(prev.education || []),
                            { id: `edu_${Date.now()}`, college: "", stream: "", from: "", to: "" },
                          ],
                        }))
                      }
                      className="text-[10px] text-[#0EA5E9] font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Record
                    </button>
                  </div>

                  {(formData.education || []).map((edu, idx) => (
                    <div key={edu.id || idx} className="bg-[#2A3038] p-3 rounded-[3px] border border-[#333B44] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={edu.college}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx] = { ...updated[idx]!, college: e.target.value };
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="University / College"
                          className="fr8x-input text-[10px] py-1"
                        />
                        <input
                          value={edu.stream}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx] = { ...updated[idx]!, stream: e.target.value };
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Degree / Stream"
                          className="fr8x-input text-[10px] py-1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.education.filter((_, i) => i !== idx);
                          setFormData({ ...formData, education: updated });
                        }}
                        className="text-[9px] text-[#FCA5A5] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* LOGISTICS TAGS */}
              {activeSection === "tags" && (
                <div className="space-y-4">
                  <h3 className="text-[12px] font-bold text-[#E2E8F0] uppercase tracking-wider border-b border-[#333B44] pb-2">
                    Industry Specialization Tags
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {COMMON_LOGISTICS_TAGS.map((tag) => {
                      const isSelected = formData.industryTags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-[3px] text-[10px] border transition-colors ${
                            isSelected
                              ? "bg-[#0EA5E9] text-white border-[#0EA5E9]"
                              : "bg-[#2A3038] text-[#94A3B8] border-[#333B44] hover:text-[#E2E8F0]"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Save Footer */}
              <div className="pt-3 border-t border-[#333B44] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="fr8x-btn-secondary text-[11px] px-4 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="fr8x-btn-primary text-[11px] px-6 py-1.5 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Profile Settings
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Live Preview (Optional) */}
          {showLivePreview && (
            <div className="w-full lg:w-72 bg-[#20252B] border-l border-[#333B44] p-4 hidden md:flex flex-col space-y-3 shrink-0">
              <div className="text-[10px] uppercase text-[#94A3B8] font-bold tracking-wider">
                Live Card Preview
              </div>

              <div className="bg-[#252B33] p-4 rounded-[3px] border border-[#333B44] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2A3038] border border-[#333B44] overflow-hidden flex items-center justify-center text-[12px] font-bold text-[#E2E8F0]">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      formData.fullName?.[0] || "U"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#E2E8F0] truncate">{formData.fullName || "User Name"}</p>
                    <p className="text-[10px] text-[#94A3B8] truncate">{formData.designation || "Title"}</p>
                  </div>
                </div>

                <div className="border-t border-[#333B44] pt-2 text-[10px] text-[#94A3B8] space-y-1">
                  <p><span className="text-[#E2E8F0]">Company:</span> {formData.companyName || "N/A"}</p>
                  <p><span className="text-[#E2E8F0]">Location:</span> {formData.location || "N/A"}</p>
                  {formData.gstin && <p><span className="text-[#E2E8F0]">GSTIN:</span> {formData.gstin}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
