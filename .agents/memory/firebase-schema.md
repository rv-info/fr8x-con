# FR8X-CON Firebase Schema Reference

> **Purpose**: Complete Firestore schema, security rules, indexes, and storage rules so future sessions don't need to re-read configuration files.

## Firestore Collections

### `users` — Core account data
| Field | Type | Notes |
|-------|------|-------|
| uid | string | Document ID = Firebase Auth UID |
| email | string | |
| role | string | nvocc, mlo, freight_forwarder, cha, transporter, importer, exporter, procurement, logistics_manager, admin, godmode |
| companyId | string | FK → companies |
| membershipTier | string | trial, basic, premium |
| isGodMode | boolean | Superuser flag |
| status | string | active, inactive, suspended, deleted |
| lastLoginAt | timestamp | |
| createdAt/updatedAt | timestamp | Audit fields |

**Rules**: Read = any auth. Create = own UID. Update = owner or GodMode. Delete = GodMode only.

### `profiles` — Extended user profile
| Field | Type |
|-------|------|
| userId, fullName, designation, location, country, about, companyName | string |
| photoURL | string\|null |
| verifiedBadge | boolean |
| followers, following | string[] |
| followersCount, followingCount, postsCount, awardsCount | number |
| currentAuctions, completedAuctions | string[] |
| blacklistStatus | string (clean, blacklisted, appealing, resolved) |
| industryTags, serviceTags | string[] |
| workExperience | array of { id, companyName, designation, location, startDate, endDate, isCurrent } |

**Rules**: Same as users (owner or GodMode).

### `companies`
| Field | Type |
|-------|------|
| name, country, region, industry | string |
| serviceTags | string[] |
| verified | boolean |
| memberCount | number |
| logoURL | string\|null |

**Rules**: Read = auth. Create = auth. Update/Delete = GodMode only.

### `posts` — Feed posts
| Field | Type |
|-------|------|
| authorId, authorName, authorCompany, authorDesignation, authorLocation | string |
| authorPhotoURL | string\|null |
| content | string |
| type | string (text, table) |
| hashtags, mentions | string[] |
| likesCount, dislikesCount, commentsCount, repostsCount, bookmarksCount | number |
| isPinned, isRepost | boolean |
| category | string (nvocc, fcl, lcl, air, etc.) |

**Rules**: Read = auth. Create = auth (authorId must match). Update = author only. Delete = author or GodMode.

### `comments`
**Rules**: Same as posts (authorId match). Nested by postId.

### `likes`
**Rules**: Read = auth. Create = auth (userId match). Delete = own only. No update.

### `bookmarks`
**Rules**: Read/Create/Delete = own userId only.

### `auctions` — Reverse auction events
| Key Fields | Type |
|------------|------|
| creatorId | string |
| title, auctionType, shipmentType, serviceType | string |
| startTime, endTime | timestamp |
| status | string (draft, active, closed, awarded, cancelled) |
| currency, incoterms | string |
| origin, pol, pod, fpod, destination | string |
| commodityDetails | array |
| rateComponents | map |
| commercialTerms | map |
| invitedSuppliers | array |

**Rules**: Read = auth. Create = auth. Update = creator or GodMode. Delete = GodMode only.

### `auctionParticipants`
**Rules**: Read/Create/Update = auth. Delete = GodMode only.

### `bids` — Write-protected (Cloud Functions only)
| Key Fields | Type |
|------------|------|
| auctionId, participantId | string |
| totalAmount | number |
| containerCharges, localCharges | array |

**Rules**: Read = own participant or GodMode. **Write = false** (server-only via Cloud Functions).

### `liveRanks` — Read-only for clients
| Key Fields | Type |
|------------|------|
| auctionId | string |
| rank | number |

**Rules**: Read = auth. **Write = false** (server-only).

### `rates` — Rate center entries
| Key Fields | Type |
|------------|------|
| submittedBy | string |
| origin, destination, carrier | string |
| containerType, containerSize | string |
| rate, currency | string/number |
| transitTime | number |
| validFrom, validTo | timestamp |

**Rules**: Read = auth. Create = auth. Update = submitter or GodMode. Delete = GodMode.

### `awards`, `blacklists` — Admin-only write
**Rules**: Read = auth. Write = GodMode only.

### `currencies` — Server-managed FX rates
**Rules**: Read = auth. Write = false (Cloud Functions).

### `notifications`
**Rules**: Read/Update = own userId. Write = false (server-managed).

### `audit`, `logs` — Append-only
**Rules**: Read = GodMode only. Create = auth. Update/Delete = false.

### `settings` — Platform config
**Rules**: Read = auth. Write = GodMode only.

## Firestore Indexes
| Collection | Fields | Order |
|-----------|--------|-------|
| posts | category ASC, createdAt DESC | |
| posts | authorId ASC, createdAt DESC | |
| auctions | status ASC, createdAt DESC | |
| bids | auctionId ASC, totalAmount ASC | |
| liveRanks | auctionId ASC, rank ASC | |
| rates | origin ASC, destination ASC, rate ASC | |
| notifications | userId ASC, createdAt DESC | |
| audit | action ASC, timestamp DESC | |

## Storage Rules
- `/users/{userId}/profile.jpg` — Read: auth. Write: owner or GodMode.
- `/auctions/{auctionId}/{fileName}` — Read: auth. Write: auction creator or GodMode.

## Key Constants (from constants.ts)
- `BID_MAX_SUBMISSIONS = 5`
- `DEFAULT_PAGE_SIZE = 20`
- `MAX_PAGE_SIZE = 100`
- `CURRENCY_CACHE_TTL = 300` (5 min)
