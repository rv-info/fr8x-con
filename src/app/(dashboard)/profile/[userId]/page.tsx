// FR8X-CON View Profile — Spec Page 5
// Read-only left sidebar (profile + work exp + education), center posts with comments

"use client";

import { use } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Share2,
} from "lucide-react";

// Mock profile data
const mockProfile = {
  name: "Viewed User",
  company: "Logistics Corp",
  location: "Singapore",
  country: "Singapore",
  tags: "FCL, Ocean Freight",
  batch: "Premium",
  workExperience: [
    { id: "w1", company: "Logistics Corp", location: "Singapore", designation: "Director", from: "2019", to: "Present" },
    { id: "w2", company: "Freight Masters", location: "Hong Kong, China", designation: "Senior Manager", from: "2015", to: "2019" },
    { id: "w3", company: "Trade Line Ltd", location: "Mumbai, India", designation: "Operations Lead", from: "2012", to: "2015" },
  ],
  education: [
    { id: "e1", college: "NUS Singapore", stream: "MBA - Supply Chain", from: "2010", to: "2012" },
    { id: "e2", college: "Mumbai University", stream: "B.Com", from: "2007", to: "2010" },
    { id: "e3", college: "Delhi School", stream: "Commerce", from: "2005", to: "2007" },
  ],
};

const mockPosts = Array.from({ length: 5 }, (_, i) => ({
  id: `vp-${i}`,
  authorName: mockProfile.name,
  authorCompany: mockProfile.company,
  authorLocation: `${mockProfile.location}, ${mockProfile.country}`,
  timePosted: `${i + 1}hr`,
  tags: ["FCL", "Ocean Freight", "NVOCC", "Air Freight", "LCL"][i],
  content: `Shared insight #${i + 1}: Market analysis and industry trends.`,
  likesCount: 10 + i * 3,
  dislikesCount: i,
  repostsCount: i * 2,
  bookmarksCount: i * 4,
  sharesCount: i + 1,
  comments: [
    { id: `vc-${i}-1`, author: "Commenter A", content: "Useful update!", time: "15m" },
  ],
}));

export default function ViewProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)]">
      {/* Header */}
      <div className="fr8x-container py-3">
        <h1 className="text-heading-md text-[var(--fr8x-jet)] font-semibold">view profile</h1>
      </div>

      {/* 2-column layout */}
      <div className="fr8x-container flex gap-4">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[240px] shrink-0 space-y-4">
          {/* Profile Card */}
          <div className="fr8x-card p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-heading-lg text-[var(--fr8x-jet)] font-semibold mb-3 mx-auto">
              {mockProfile.name.charAt(0)}
            </div>
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{mockProfile.name}</p>
            <p className="text-caption text-foreground-secondary">{mockProfile.company}</p>
            <p className="text-caption text-foreground-secondary">{mockProfile.location}, {mockProfile.country}</p>
            <p className="text-caption text-foreground-secondary mt-1">{mockProfile.tags}</p>
            <p className="text-caption text-foreground-secondary">{mockProfile.batch}</p>
          </div>

          {/* Work Experience */}
          <div className="fr8x-card p-4">
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-3">Work Experience</p>
            <div className="space-y-3">
              {mockProfile.workExperience.map((exp) => (
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
            <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-3">Education</p>
            <div className="space-y-3">
              {mockProfile.education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-[var(--fr8x-lavender)] pl-3">
                  <p className="text-body-sm font-medium text-[var(--fr8x-jet)]">{edu.college}</p>
                  <p className="text-caption text-foreground-secondary">{edu.stream}</p>
                  <p className="text-[10px] text-foreground-muted">{edu.from} - {edu.to}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══ CENTER — POSTS ═══ */}
        <main className="flex-1 min-w-0 space-y-3">
          <p className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-2">POSTS</p>
          {mockPosts.map((post) => (
            <article key={post.id} className="fr8x-card p-4">
              <div className="flex items-start gap-3 mb-3">
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

              <p className="text-body-sm text-[var(--fr8x-jet)] mb-3">{post.content}</p>

              {/* Interaction */}
              <div className="flex items-center gap-3 text-caption text-foreground-secondary mb-3 flex-wrap">
                <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)]">
                  <ThumbsUp className="h-3.5 w-3.5" /> Dislike [{post.likesCount}]
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
      </div>
    </div>
  );
}
