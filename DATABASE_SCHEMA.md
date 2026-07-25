# Firestore & Firebase Storage Database Schema

## Firestore Collections

### 1. `profiles`
Holds extended user details. Document ID = User UID.
* `userId`: string
* `fullName`: string
* `photoURL`: string | null
* `designation`: string
* `companyId`: string | null
* `companyName`: string
* `publicId`: string (unique handle, e.g. `@RAJAT001`)
* `location`: string
* `country`: string
* `about`: string
* `industryTags`: string[]
* `followers`: string[] (array of UIDs)
* `following`: string[] (array of UIDs)
* `followedTags`: string[] (array of hashtags followed)
* `workExperience`: WorkExperience[]
* `education`: Education[]

### 2. `companies`
Holds logistics company info. Document ID = Company ID.
* `id`: string
* `name`: string
* `publicId`: string (unique handle, e.g. `@COMP-0001`)
* `logoURL`: string | null
* `gstn`: string
* `pan`: string
* `cin`: string
* `iec`: string
* `businessRegistrationNumber`: string
* `companyType`: string
* `yearEstablished`: string
* `about`: string
* `verified`: boolean

### 3. `connections`
Maintains relations between network partners. Document ID = `uid1_uid2` (sorted).
* `id`: string
* `users`: string[] (array containing both UIDs)
* `status`: `'pending' | 'accepted' | 'rejected' | 'blocked'`
* `requesterId`: string (UID who sent the request)
* `blockedById`: string (UID who blocked, if applicable)

### 4. `awards`
Network awards.
* `id`: string
* `recipientId`: string
* `recipientName`: string
* `recipientCompany`: string
* `category`: string
* `year`: number
* `quarter`: number
* `reactions`: `{ like: string[], celebrate: string[], recommend: string[], support: string[] }`
* `votes`: `{ up: string[], down: string[] }`
* `verifications`: `{ company: string[], community: string[], admin: string[] }`

#### Subcollection: `awards/{awardId}/comments`
Comments and discussions on awards.
* `id`: string
* `authorId`: string
* `authorName`: string
* `authorCompany`: string
* `content`: string
* `parentCommentId`: string | null
* `createdAt`: timestamp

### 5. `locations`
Centralized Logistics Ports and Terminals. Document ID = `loc_{lowercase_code}`.
* `id`: string
* `code`: string (UN/LOCODE or IATA code, e.g. "INNSA")
* `name`: string (e.g. "Nhava Sheva Port")
* `country`: string (e.g. "India")
* `countryCode`: string (e.g. "IN")
* `type`: `'sea' | 'air' | 'icd' | 'dry' | 'rail'`
* `postalCode`: string (e.g. "110020")
* `status`: `'active' | 'disabled'`
* `coordinates`: string (e.g. "18.95,72.95")

### 6. `backups`
Daily automated snapshot backups. Document ID = `bkp_{timestamp}`.
* `id`: string
* `dateString`: string (e.g. "2026-07-25")
* `timestamp`: string (ISO datetime)
* `collectionsData`: map (collectionName -> stringified JSON array of docs)
* `sizeBytes`: number
* `compressed`: boolean
* `integrityVerified`: boolean
* `status`: `'success' | 'failed'`
* `createdById`: string (operator UID)

### 7. `location_audit`
Administrative logs for location modifications.
* `id`: string
* `action`: string (e.g. "create_location", "edit_location", "toggle_status")
* `userId`: string (operator UID)
* `timestamp`: string (ISO datetime)
* `details`: string
* `ipAddress`: string
* `prevValue`: string (serialized JSON)
* `newValue`: string (serialized JSON)

---

## Firebase Storage File Paths

* User profile pictures: `profiles/{userId}/photo`
* Company logos: `companies/{companyId}/logo`
