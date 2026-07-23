// FR8X-CON Edit Profile — Spec Page 4
// Left: profile card + work experience + education
// Center: own posts with delete/edit + comments
// Right: Post Jobs button + job stats

"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Share2,
  Pencil,
  Trash2,
  Plus,
  Briefcase,
} from "lucide-react";

// Mock data
const mockWorkExperience = [
  { id: "w1", company: "Company Alpha", location: "Mumbai, India", designation: "Operations Manager", from: "2020", to: "Present" },
  { id: "w2", company: "Company Beta", location: "Singapore", designation: "Logistics Lead", from: "2017", to: "2020" },
  { id: "w3", company: "Company Gamma", location: "Dubai, UAE", designation: "Freight Executive", from: "2014", to: "2017" },
];

const mockEducation = [
  { id: "e1", college: "IIT Bombay", stream: "Supply Chain Management", from: "2011", to: "2013" },
  { id: "e2", college: "University of Mumbai", stream: "B.Com", from: "2008", to: "2011" },
  { id: "e3", college: "Delhi University", stream: "Logistics", from: "2006", to: "2008" },
];

const mockPosts = Array.from({ length: 3 }, (_, i) => ({
  id: `post-${i}`,
  authorName: "Current User",
  authorCompany: "Company Alpha",
  authorLocation: "Mumbai, India",
  timePosted: `${i + 1}hr`,
  tags: ["FCL", "Ocean Freight", "NVOCC"][i],
  content: `Post content ${i + 1}: Industry insights and updates.`,
  likesCount: 10 + i * 5,
  dislikesCount: i,
  repostsCount: i * 2,
  bookmarksCount: i * 3,
  sharesCount: i,
  comments: [
    { id: `c-${i}-1`, author: "Commenter 1", content: "Great post!", time: "30m" },
    { id: `c-${i}-2`, author: "Commenter 2", content: "Very insightful.", time: "1hr" },
  ],
}));

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const displayName = user?.displayName || "User";

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)]">
      {/* Header */}
      <div className="fr8x-container py-3 flex items-center justify-between">
        <h1 className="text-heading-md text-[var(--fr8x-jet)] font-semibold">edit profile</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "fr8x-btn-secondary" : "fr8x-btn-primary"}
          >
            Edit
          </button>
          <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0]">Save</button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="fr8x-container flex gap-4">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[240px] shrink-0 space-y-4">
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
              {displayName} {isEditing && <span className="text-[10px] text-foreground-muted">[add/edit/delete popup]</span>}
            </p>
            <p className="text-caption text-foreground-secondary text-center">{ "Current/last COMPANY NAME" }</p>
            <p className="text-caption text-foreground-secondary text-center">
              {"{LOCATION, COUNTRY}"} {isEditing && <span className="text-[10px] text-foreground-muted">[add/edit/delete popup]</span>}
            </p>
            <p className="text-caption text-foreground-secondary text-center mt-1">
              {"{TAGS}"} {isEditing && <span className="text-[10px] text-foreground-muted">[add/edit/delete popup]</span>}
            </p>
            <p className="text-caption text-foreground-secondary text-center">
              {"{BATCH w/badge based on membership and connection}"}
            </p>
          </div>

          {/* Work Experience */}
          <div className="fr8x-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Work Experience</p>
              {isEditing && (
                <button className="text-[10px] text-[var(--fr8x-periwinkle)] hover:underline">[add/edit/delete popup]</button>
              )}
            </div>
            <div className="space-y-3">
              {mockWorkExperience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-[var(--fr8x-lavender)] pl-3">
                  <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{exp.company}</p>
                  <p className="text-caption text-foreground-secondary">{exp.location}</p>
                  <p className="text-caption text-foreground-secondary">{exp.designation}</p>
                  <p className="text-[10px] text-foreground-muted">{exp.from} - {exp.to}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="fr8x-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">Education</p>
              {isEditing && (
                <button className="text-[10px] text-[var(--fr8x-periwinkle)] hover:underline">[add/edit/delete popup]</button>
              )}
            </div>
            <div className="space-y-3">
              {mockEducation.map((edu) => (
                <div key={edu.id} className="border-l-2 border-[var(--fr8x-lavender)] pl-3">
                  <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{edu.college}</p>
                  <p className="text-caption text-foreground-secondary">{edu.stream}</p>
                  <p className="text-[10px] text-foreground-muted">{edu.from} - {edu.to}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══ CENTER — Posts Management ═══ */}
        <main className="flex-1 min-w-0 space-y-3">
          {mockPosts.map((post) => (
            <article key={post.id} className="fr8x-card p-4">
              {/* Author row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--fr8x-frozen)] flex items-center justify-center text-body-sm font-semibold text-[var(--fr8x-jet)] shrink-0">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{post.authorName}</span>
                      <span className="text-caption text-foreground-secondary">
                        {post.authorCompany}, {post.authorLocation}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground-muted">{post.timePosted} • {post.tags}</p>
                  </div>
                </div>
                {/* delete/edit actions */}
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <button className="hover:text-[var(--fr8x-jet)] transition-colors" title="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="hover:text-danger transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px]">delete/edit</span>
                </div>
              </div>

              <p className="text-body-sm text-[var(--fr8x-jet)] mb-3">{post.content}</p>

              {/* Interaction */}
              <div className="flex items-center gap-4 text-caption text-foreground-secondary mb-3">
                <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                  <ThumbsUp className="h-3.5 w-3.5" /> likes [{post.likesCount}]
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                  <ThumbsDown className="h-3.5 w-3.5" /> Dislike [{post.dislikesCount}]
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                  <Repeat2 className="h-3.5 w-3.5" /> Repost [{post.repostsCount}]
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                  <Bookmark className="h-3.5 w-3.5" /> Save [{post.bookmarksCount}]
                </button>
                <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                  <Share2 className="h-3.5 w-3.5" /> Share [{post.sharesCount}]
                </button>
              </div>

              {/* Comments */}
              <div className="border-t border-border pt-2 space-y-2">
                <p className="text-[10px] text-foreground-muted italic">
                  COMMENTS Downs below from latest on top and users have options to like and dislike the comments
                </p>
                {post.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2 pl-4">
                    <div className="w-5 h-5 rounded-full bg-[var(--fr8x-mist)] flex items-center justify-center text-[8px] font-medium shrink-0">
                      {c.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[var(--fr8x-jet)]">{c.author} <span className="text-foreground-muted font-normal">• {c.time}</span></p>
                      <p className="text-[10px] text-foreground-secondary">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </main>

        {/* ═══ RIGHT SIDEBAR — Jobs ═══ */}
        <aside className="hidden xl:block w-[200px] shrink-0 space-y-4">
          <div className="fr8x-card p-4 text-center">
            <button className="fr8x-btn-primary w-full flex items-center justify-center gap-2 bg-[#56C5F0] hover:bg-[#3ABFF0]">
              <Briefcase className="h-4 w-4" />
              Post Jobs <span className="text-[10px]">(pop up with form)</span>
            </button>
          </div>
          <div className="fr8x-card p-4 space-y-2">
            <p className="text-body-sm text-[var(--fr8x-jet)]">Job posted</p>
            <p className="text-body-sm text-foreground-secondary">Seen (count)</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
