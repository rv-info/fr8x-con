# FR8X — Database Schema & Security Rules Specification

## 1. Firestore Data Model & Schema Definitions

### 1.1 `users`
Represents individual freight professionals on the platform.
```typescript
interface UserDocument {
  uid: string;                          // Firebase Auth UID
  email: string;                        // Corporate email (e.g. arjun@atlaslogistics.com)
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  designation: string;                  // e.g. "Freight Manager"
  mobile: string;
  alternateMobile?: string;
  preferredContactMethod: 'email' | 'mobile' | 'whatsapp' | 'tradeChat';
  contactAvailability: string;          // e.g. "09:00 - 18:00 IST"
  timezone: string;                     // IANA string, e.g. "Asia/Kolkata"
  country: string;                      // ISO code / name, e.g. "India"
  state: string;
  city: string;
  companyId: string;                    // Reference to companies collection
  role: 'user' | 'company_admin' | 'moderator' | 'super_admin';
  plan: 'trial' | 'professional' | 'premium';
  isVerified: boolean;
  hasGoldenTick: boolean;               // Awarded to verified Premium users
  status: 'pending_otp' | 'pending_verification' | 'active' | 'suspended' | 'locked';
  avatarUrl?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 1.2 `companies`
Represents verified freight forwarder, NVOCC, carrier, or shipper corporate entities.
```typescript
interface CompanyDocument {
  id: string;                           // System-generated, e.g. "CMP-00482"
  legalName: string;                    // e.g. "Atlas Logistics Pvt. Ltd."
  registeredAddress: string;
  country: string;
  gstn?: string;                        // GST Number (India)
  pan?: string;                         // Permanent Account Number
  iecCode?: string;                     // Import Export Code
  mtoLicense?: string;                  // Multimodal Transport Operator No.
  website?: string;
  businessContactPerson: string;
  businessEmail: string;
  kycDocumentUrls: string[];
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  planHistory: {
    plan: 'trial' | 'professional' | 'premium';
    startDate: FirebaseFirestore.Timestamp;
    endDate: FirebaseFirestore.Timestamp;
    paymentId?: string;
    amountPaid: number;
    currency: string;
  }[];
  trialUsedYears: number[];             // e.g. [2026] - enforces 1 trial per calendar year
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 1.3 `profiles`
Detailed professional profiles extending user identity with address & credentials.
```typescript
interface ProfileDocument {
  uid: string;
  bio: string;
  specializations: string[];            // e.g. ["FCL", "OOG", "Reefer", "Dangerous Goods"]
  skills: string[];
  languages: string[];
  communities: string[];
  awards: string[];
  primaryAddress: {
    formattedAddress: string;
    placeId: string;
    latitude: number;
    longitude: number;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    timezone: string;
  };
  experiences: {
    id: string;
    company: string;
    designation: string;
    employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
    location: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description: string;
    skills: string[];
    visibility: 'public' | 'network' | 'private';
  }[];
  educations: {
    id: string;
    institution: string;
    qualification: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
    grade?: string;
    visibility: 'public' | 'network' | 'private';
  }[];
  certifications: {
    id: string;
    title: string;
    issuingAuthority: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate?: string;
    credentialUrl?: string;
    isVerified: boolean;
    visibility: 'public' | 'network' | 'private';
  }[];
  visibilitySettings: {
    email: 'public' | 'network' | 'private';
    phone: 'public' | 'network' | 'private';
    experience: 'public' | 'network' | 'private';
    ratingSummary: 'public' | 'network' | 'private';
  };
}
```

### 1.4 `posts` & `comments`
Freight feeds and nested discussions.
```typescript
interface PostDocument {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorCity: string;
  authorTimezone: string;
  hasGoldenTick: boolean;
  content: string;                      // Sanitized markdown-parsed text
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  likedBy: string[];                    // Array of UIDs
  dislikedBy: string[];
  savedBy: string[];                    // Array of UIDs who saved this post
  isReported: boolean;
  moderationStatus: 'clean' | 'flagged' | 'hidden';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

interface CommentDocument {
  id: string;
  postId: string;
  parentCommentId?: string;             // Null for top-level comments, ID for replies
  authorUid: string;
  authorName: string;
  authorCompany: string;
  authorTimezone: string;
  hasGoldenTick: boolean;
  content: string;
  likesCount: number;
  dislikesCount: number;
  replyCount: number;
  likedBy: string[];
  dislikedBy: string[];
  createdAt: FirebaseFirestore.Timestamp;
}
```

### 1.5 `auctions`, `bids` & `audit`
Reverse auction engine and live bid rooms.
```typescript
interface AuctionDocument {
  id: string;                           // e.g. "RA-2026-0846"
  rfqId: string;                        // e.g. "RFQ-4281"
  title: string;
  creatorUid: string;
  creatorCompany: string;
  auctionType: 'specific_bidder' | 'general_bidding';
  selectedBidderUids: string[];
  blockedBidderUids: string[];
  startTime: FirebaseFirestore.Timestamp;
  endTime: FirebaseFirestore.Timestamp;
  durationMinutes: number;
  timezone: string;
  status: 'draft' | 'live' | 'completed' | 'cancelled' | 'reopened';
  currency: string;                     // e.g. "USD", "INR"
  rules: {
    autoExtension: boolean;
    rankingVisible: boolean;
    hideCompetitorNames: boolean;
    bidderAnonymity: boolean;
    bidLimit: number;
  };
  shipment: {
    por: string;
    pol: string;
    pod: string;
    finalDestination: string;
    cargoReadyDate: string;
    shipmentType: 'FCL' | 'LCL' | 'Breakbulk' | 'RoRo';
    movementType: string;
    incoterm: string;
    blType: string;
    commodity: string;
    hsCode: string;
    grossWeightKg: number;
    cbm: number;
    isHazardous: boolean;
    unNumber?: string;
    imoClass?: string;
    packingGroup?: string;
    specialRequirements?: string;
  };
  containers: {
    id: string;
    equipmentType: string;              // e.g. "20DV", "40HC", "20RF"
    containerType: 'Standard' | 'Reefer' | 'OOG' | 'Tank';
    quantity: number;
    pickupLocation: string;
    emptyReturnLocation: string;
    isSpecial: boolean;
    commodity: string;
    hsCode: string;
    grossWeight: number;
  }[];
  originCharges: {
    transportation: boolean;
    clearance: boolean;
    carrierLocal: boolean;
    pickupAddress?: string;
    handoverLocation?: string;
    factoryStuffing?: boolean;
    cfsStuffing?: boolean;
  };
  destinationCharges: {
    transportation: boolean;
    clearance: boolean;
    carrierLocal: boolean;
    destuffingAddress?: string;
    dutyPaidBy: 'us' | 'consignee' | 'none';
    cargoCommodity?: string;
    hsCode?: string;
    approxCargoValue?: string;
  };
  winningBidId?: string;
  winningAmount?: number;
  competitionCeiling?: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

interface BidDocument {
  id: string;
  auctionId: string;
  bidderUid: string;
  bidderCompany: string;
  bidderHasGoldenTick: boolean;
  chargesBreakdown: {
    equipment: string;
    quantity: number;
    oceanFreight: number;
    freightSurcharges: number;
    originTransport: number;
    originClearance: number;
    originLocal: number;
    destTransport: number;
    destClearance: number;
    destLocal: number;
    totalUnitRate: number;
    lineTotal: number;
  }[];
  grandTotal: number;
  rank: number;
  postingFeeCharged: number;            // ₹300 or ₹180 for Premium
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: FirebaseFirestore.Timestamp;
}

interface AuctionAuditDocument {
  id: string;
  auctionId: string;
  actorUid: string;
  actorName: string;
  action: 'CREATE' | 'PUBLISH' | 'BID_SUBMITTED' | 'EXTENSION' | 'COMPLETED' | 'CANCELLED';
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: FirebaseFirestore.Timestamp;
}
```

### 1.6 `rates` & `rateImports`
Market intelligence and personal rate inventory.
```typescript
interface RateDocument {
  id: string;                           // "RT-######" (market) or "IRT-######" (i-Rate)
  ownerUid: string;
  serviceProvider: string;
  carrier: string;
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  d20USD: number;
  d20Type?: string;
  h40USD: number;
  h40Type?: string;
  freeTime: string;                     // e.g. "14 days"
  validityDate: string;                 // ISO date
  rateType: 'Direct' | 'Transshipment' | 'Spot' | 'Contract';
  transitTime: string;                  // e.g. "29 days"
  routing: string;
  remarks: string;
  isOwnerOnly: boolean;
  status: 'active' | 'expired' | 'archived';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 1.7 `conversations` & `messages`
Auditable text-only Trade Chat engine.
```typescript
interface ConversationDocument {
  id: string;
  participantUids: string[];
  participantDetails: {
    uid: string;
    displayName: string;
    company: string;
    avatarUrl?: string;
    timezone: string;
  }[];
  contextType?: 'auction' | 'rate' | 'job' | 'company';
  contextId?: string;
  contextTitle?: string;
  lastMessageText: string;
  lastMessageSenderUid: string;
  lastMessageTimestamp: FirebaseFirestore.Timestamp;
  unreadCounts: Record<string, number>; // uid -> count
}

interface MessageDocument {
  id: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  text: string;
  readBy: string[];
  isEdited: boolean;
  isDeleted: boolean;
  timestamp: FirebaseFirestore.Timestamp;
}
```

---

## 2. Production Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isVerifiedUser() {
      return isAuthenticated() && request.auth.token.isVerified == true;
    }
    
    function isPlatformAdmin() {
      return isAuthenticated() && request.auth.token.role == 'super_admin';
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['plan', 'isVerified', 'hasGoldenTick', 'role']);
      allow delete: if isPlatformAdmin();
    }

    // Profiles Collection
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) || isPlatformAdmin();
    }

    // Posts & Comments
    match /posts/{postId} {
      allow read: if isAuthenticated();
      allow create: if isVerifiedUser() && request.resource.data.authorUid == request.auth.uid;
      allow update: if isAuthenticated() && (
        (isOwner(resource.data.authorUid) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['likesCount', 'dislikesCount'])) ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likedBy', 'dislikedBy', 'likesCount', 'dislikesCount', 'savedBy', 'commentsCount'])
      );
      allow delete: if isOwner(resource.data.authorUid) || isPlatformAdmin();
      
      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isVerifiedUser() && request.resource.data.authorUid == request.auth.uid;
        allow update: if isAuthenticated();
        allow delete: if isOwner(resource.data.authorUid) || isPlatformAdmin();
      }
    }

    // Reverse Auctions & Bids
    match /auctions/{auctionId} {
      allow read: if isAuthenticated();
      allow create: if isVerifiedUser() && request.resource.data.creatorUid == request.auth.uid;
      allow update: if isOwner(resource.data.creatorUid) || isPlatformAdmin();
      allow delete: if isPlatformAdmin();

      match /bids/{bidId} {
        allow read: if isAuthenticated() && (
          isOwner(resource.data.bidderUid) || 
          isOwner(get(/databases/$(database)/documents/auctions/$(auctionId)).data.creatorUid) ||
          isPlatformAdmin()
        );
        allow create: if isVerifiedUser() && request.resource.data.bidderUid == request.auth.uid;
        allow update: if isPlatformAdmin();
      }

      match /audit/{auditId} {
        allow read: if isAuthenticated() && (
          isOwner(get(/databases/$(database)/documents/auctions/$(auctionId)).data.creatorUid) || 
          isPlatformAdmin()
        );
        allow create: if isAuthenticated();
        allow update, delete: if false; // Immutable audit log
      }
    }

    // Rates
    match /rates/{rateId} {
      allow read: if isAuthenticated();
      allow create: if isVerifiedUser() && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if isOwner(resource.data.ownerUid) || isPlatformAdmin();
    }

    // Trade Chat
    match /conversations/{conversationId} {
      allow read, write: if isAuthenticated() && (request.auth.uid in resource.data.participantUids || request.auth.uid in request.resource.data.participantUids);

      match /messages/{messageId} {
        allow read: if isAuthenticated() && (request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantUids);
        allow create: if isAuthenticated() && (request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantUids) && request.resource.data.senderUid == request.auth.uid;
        allow update: if isOwner(resource.data.senderUid) && request.resource.data.diff(resource.data).affectedKeys().hasAny(['isEdited', 'text']);
        allow delete: if isOwner(resource.data.senderUid) || isPlatformAdmin();
      }
    }
  }
}
```
