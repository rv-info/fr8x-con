# Feature Matrix

| Category | Requirement | Status | Verification Method |
|---|---|---|---|
| **User Profile** | Crop/Resize & Upload Photo | Completed | Canvas Cropper UI & Firebase Storage |
| **User Profile** | JPG, PNG, WEBP & Size Limits | Completed | File input onChange validation |
| **User Profile** | Unique Public ID `@handle` | Completed | Auto-generated or custom format |
| **Company Profile** | Logo Upload, Replace, Remove | Completed | Storage deletion and update triggers |
| **Company Profile** | GSTN, PAN, CIN, IEC Fields | Completed | Forms in `/company` & details view |
| **Networking** | Connection Requests & Status | Completed | `/connections` collection status state |
| **Networking** | Follow, Unfollow, Block | Completed | Profile arrays & blocked flags |
| **Networking** | Mutual & Industry Match Pct | Completed | Set intersection calculation |
| **Awards** | Reactions (Like, Celebrate, etc) | Completed | Sub-arrays on award documents |
| **Awards** | Voting Once & Recommendation Score | Completed | Up/down array checking and scoring |
| **Awards** | Comments, Edit, Delete, Reply | Completed | `comments` subcollection CRUD |
| **Awards** | Company, Community, Admin Verify | Completed | Verification arrays & role enforcement |
| **Feeds** | Sponsored Ads Placements | Completed | Inter-post ad blocks & sidebar slots |
| **Feeds** | Trending Tags Follow/Filter | Completed | Follow toggle, click-to-compose, filter feed |
| **Navigation** | Saved Posts, RFQs, Tags, Company Links | Completed | Integrated in Sidebar, TopNav, feeds list |
| **Universal Search** | Unified Search / Filter Panel | Completed | Autocomplete, tab toggle, query filter |
| **Public Profiles** | Dynamic handle resolution | Completed | Resolves `@handle` & raw UIDs in URL |
| **Location Master** | central port & terminal registry | Completed | Seeded standard locations & `/godmode/locations` |
| **Location Master** | 3-char trigger autocomplete search | Completed | Parallel code/name queries with caching |
| **Location Master** | POR & FPOD PIN indicators | Completed | Appends postal/PIN codes to dropdown labels |
| **Security** | text input sanitization | Completed | `sanitizeText` neutralizes HTML/XSS, SQL, CSV |
| **Security** | upload magic signature checks | Completed | File header validations & metadata stripping |
| **Security** | malware & antivirus scans | Completed | EICAR detection and dangerous extension blocks |
| **Database Backup** | daily automated snapshots | Completed | Daily 12:00 AM IST scheduler & recovery panel |
| **Database Backup** | retention policies | Completed | Automatic daily, weekly, monthly purging |

