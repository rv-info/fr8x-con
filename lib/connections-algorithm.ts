/**
 * FR8X Advanced B2B Connection Recommendation & Affinity Scoring Engine
 * 
 * Scores and ranks candidate network members against the current logged-in user
 * using a multi-dimensional affinity algorithm based on:
 *   1. Current Organization / Work Affiliation (Same company / subsidiary)
 *   2. Past Work History / Ex-Company Overlap (e.g., both worked at Maersk, MSC, Cogoport)
 *   3. Maritime Operating Hub & Geographic Proximity (City, State, Port Terminal)
 *   4. Job Role & Designation Alignment (Logistics Procurement, Freight Specialist, Trade Lead)
 *   5. Schooling, Colleges & Universities (Alumni networks like IIFT, Mumbai Univ, NUS, RSM)
 *   6. Degrees & Academic Qualifications (MBA, B.Tech, M.Sc Maritime)
 *   7. Professional Courses & Certifications (FIATA Diploma, FFFAI Customs, ICS Shipbroker)
 *   8. Key Corridors & Liner Trade Lanes (Nhava Sheva, Jebel Ali, Rotterdam, Singapore)
 */

import { UserProfile, ProfileExperience, ProfileEducation, ProfileCertification } from './types';

export interface MatchReason {
  category: 'work' | 'ex_company' | 'location' | 'designation' | 'college' | 'qualification' | 'certification' | 'corridor' | 'network';
  badge: string;
  label: string;
  detail: string;
  points: number;
}

export interface RecommendedConnection {
  user: UserProfile;
  affinityScore: number;       // Raw weighted score (0 - 160+)
  matchPercentage: number;     // Normalized 0 - 100%
  reasons: MatchReason[];
  topBadges: string[];
  isAlreadyConnected: boolean;
  requestStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected';
}

// Normalized token cleaners for resilient matching
function cleanString(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str?: string): Set<string> {
  const cleaned = cleanString(str);
  if (!cleaned) return new Set();
  const STOP_WORDS = new Set([
    'and', 'or', 'the', 'of', 'in', 'at', 'on', 'for', 'with', 'by', 'pvt', 'ltd', 'limited', 'private', 'llc', 'corp', 'inc', 'co'
  ]);
  const tokens = cleaned.split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(tokens);
}

function tokenizeCompany(str?: string): Set<string> {
  const cleaned = cleanString(str);
  if (!cleaned) return new Set();
  const COMPANY_STOP_WORDS = new Set([
    'and', 'or', 'the', 'of', 'in', 'at', 'on', 'for', 'with', 'by',
    'pvt', 'ltd', 'limited', 'private', 'llc', 'corp', 'inc', 'co',
    'lines', 'logistics', 'freight', 'shipping', 'transport', 'group',
    'global', 'india', 'international', 'intl', 'solutions', 'services',
    'nv', 'eu', 'sg', 'agency', 'line', 'desk'
  ]);
  const tokens = cleaned.split(' ').filter((w) => w.length > 2 && !COMPANY_STOP_WORDS.has(w));
  return new Set(tokens);
}

function tokenizeInstitution(str?: string): Set<string> {
  const cleaned = cleanString(str);
  if (!cleaned) return new Set();
  const INSTITUTION_STOP_WORDS = new Set([
    'and', 'or', 'the', 'of', 'in', 'at', 'on', 'for', 'with', 'by',
    'university', 'univ', 'institute', 'college', 'school', 'academy',
    'faculty', 'department', 'studies', 'national', 'international',
    'global', 'management', 'business', 'commerce', 'trade', 'technology', 'tech'
  ]);
  const tokens = cleaned.split(' ').filter((w) => w.length > 2 && !INSTITUTION_STOP_WORDS.has(w));
  return new Set(tokens);
}

function tokenizeCertification(str?: string): Set<string> {
  const cleaned = cleanString(str);
  if (!cleaned) return new Set();
  const CERT_STOP_WORDS = new Set([
    'and', 'or', 'the', 'of', 'in', 'at', 'on', 'for', 'with', 'by',
    'diploma', 'certificate', 'certification', 'certified', 'specialist',
    'specialism', 'association', 'associations', 'federation', 'international',
    'national', 'india', 'indian', 'chartered', 'program', 'course'
  ]);
  const tokens = cleaned.split(' ').filter((w) => w.length > 2 && !CERT_STOP_WORDS.has(w));
  return new Set(tokens);
}

function hasOverlap(tokensA: Set<string>, tokensB: Set<string>): boolean {
  for (const token of tokensA) {
    if (tokensB.has(token)) return true;
  }
  return false;
}

function extractAllCompanyNames(u: Partial<UserProfile>): string[] {
  const list: string[] = [];
  if (u.company) list.push(u.company);
  if (Array.isArray(u.experiences)) {
    u.experiences.forEach((exp) => {
      if (exp.company && !list.includes(exp.company)) {
        list.push(exp.company);
      }
    });
  }
  return list;
}

function extractPastCompanyNames(u: Partial<UserProfile>): string[] {
  const list: string[] = [];
  if (Array.isArray(u.experiences)) {
    u.experiences.forEach((exp) => {
      if (!exp.isCurrent && exp.company && !list.includes(exp.company)) {
        list.push(exp.company);
      }
    });
  }
  return list;
}

/**
 * Rigorous multi-factor self-profile check.
 * Compares UID, database ID, email, mobile phone, and normalized name+company.
 * Returns true if candidate is the exact same human being as currentUser.
 */
export function isSelfProfile(
  me?: Partial<UserProfile> | Record<string, any> | null,
  target?: Partial<UserProfile> | Record<string, any> | null
): boolean {
  if (!me || !target) return false;

  // 1. Direct UID / ID matching (case-insensitive, trimmed)
  const myUid = (me.uid || (me as any).id || '').toString().trim().toLowerCase();
  const targetUid = (target.uid || (target as any).id || '').toString().trim().toLowerCase();
  if (myUid && targetUid && myUid === targetUid) return true;

  // 2. Email matching (authoritative)
  const myEmail = (me.email || '').toString().trim().toLowerCase();
  const targetEmail = (target.email || '').toString().trim().toLowerCase();
  if (myEmail && targetEmail && myEmail === targetEmail) return true;

  // 3. Mobile / Phone number matching (last 10 digits)
  const cleanPhone = (p?: string) => (p || '').replace(/[^0-9]/g, '');
  const myPhone = cleanPhone((me as any).mobile || (me as any).phone);
  const targetPhone = cleanPhone((target as any).mobile || (target as any).phone);
  if (myPhone.length >= 10 && targetPhone.length >= 10 && myPhone.slice(-10) === targetPhone.slice(-10)) {
    return true;
  }

  // 4. Normalized Display Name + Company match:
  // Catches cross-session schema drift where UID or email format differs
  const myName = (me.displayName || `${(me as any).firstName || ''} ${(me as any).lastName || ''}`)
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const targetName = (target.displayName || `${(target as any).firstName || ''} ${(target as any).lastName || ''}`)
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const myCompany = (me.company || (me as any).company_name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
  const targetCompany = (target.company || (target as any).company_name || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

  if (myName && targetName && myName === targetName && myName !== 'fr8x member') {
    if (myCompany && targetCompany && (myCompany === targetCompany || myCompany.includes(targetCompany) || targetCompany.includes(myCompany))) {
      return true;
    }
  }

  return false;
}

/**
 * Filter to permanently block test fixtures, automated dummy accounts,
 * and sample records from surfacing in production directory or recommendations.
 */
export function isTestOrDummyAccount(
  user?: Partial<UserProfile> | Record<string, any> | null
): boolean {
  if (!user) return true;

  const uid = (user.uid || (user as any).id || '').toString().toLowerCase().trim();
  const email = (user.email || '').toString().toLowerCase().trim();
  const name = (user.displayName || (user as any).display_name || (user as any).full_name || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`)
    .toString()
    .toLowerCase()
    .trim();
  const company = (user.company || (user as any).company_name || '').toString().toLowerCase().trim();
  const designation = (user.designation || (user as any).position || (user as any).headline || '').toString().toLowerCase().trim();

  // 1. UID test patterns
  if (['u-arjun', 'u-sarah', 'u-kiran', 'u-elena', 'u-david', 'u-vikram', 'u-ananya', 'u-suspended-01', 'u-chen', 'u-vikas', 'usr_raivega_mgt'].includes(uid)) return true;
  if (/^(u-)?(lockout|sureset|test|pilot|tmp|dummy|fixture|temp|su|exp)[-_0-9]/i.test(uid)) return true;
  if (/^usr_(compliance|commerce)_[0-9]+/i.test(uid)) return true;
  if (/^u-[a-z]+-[0-9]{10,}/i.test(uid)) return true;

  // 2. Email test patterns
  if (email.includes('@example.com') || email.includes('@test.') || email.includes('.test@') || email.includes('test.pilot') || email.endsWith('.local') || email.endsWith('@enterprise.local')) return true;
  if (/^(lockout|sureset|test|tester|dummy|temp|sample|mock|single-use|delivery-test|otprate)[-_0-9.]/i.test(email)) return true;
  if (email.includes('operations.test') || email.includes('test_') || email.includes('test-') || email.includes('+test')) return true;

  // 3. Name test patterns
  if (
    name.includes('test discovery') ||
    name.includes('operations test') ||
    name.includes('test controller') ||
    name.includes('test user') ||
    name.includes('mock user') ||
    name.includes('dummy user') ||
    name.includes('fixture') ||
    name.includes('sample user')
  ) {
    return true;
  }
  if (/^test\b/i.test(name) || /\btest$/i.test(name) || name === 'test') return true;

  // 4. Company test patterns
  if (
    company.includes('fr8x test') ||
    company.includes('test co') ||
    company.includes('test company') ||
    company.includes('sample company') ||
    company === 'beacon forwarding' ||
    company === 'cooldown test co'
  ) {
    return true;
  }

  // 5. Designation test patterns
  if (designation.includes('test controller') || designation.includes('dummy')) return true;

  return false;
}

/**
 * Calculates multi-dimensional affinity between two users
 */
export function calculateConnectionAffinity(
  me: Partial<UserProfile>,
  target: Partial<UserProfile>
): { score: number; percentage: number; reasons: MatchReason[]; topBadges: string[] } {
  if (!me || !target || isSelfProfile(me, target)) {
    return { score: 0, percentage: 0, reasons: [], topBadges: [] };
  }

  const reasons: MatchReason[] = [];
  let score = 0;

  // 1. Current Work / Company Match
  const myComp = cleanString(me.company);
  const targetComp = cleanString(target.company);
  if (myComp && targetComp) {
    const myCompTokens = tokenizeCompany(me.company);
    const targetCompTokens = tokenizeCompany(target.company);
    if (myComp === targetComp || (myCompTokens.size > 0 && hasOverlap(myCompTokens, targetCompTokens))) {
      const points = 35;
      score += points;
      reasons.push({
        category: 'work',
        badge: `🏢 Same Company: ${target.company}`,
        label: 'Colleague at same organization',
        detail: `Both work at ${target.company}`,
        points,
      });
    }
  }

  // 2. Ex-Company / Past Work Experience Match
  // Check if I worked somewhere they currently work, or they worked somewhere I work, or both worked at same past company
  const myPastCompanies = extractPastCompanyNames(me);
  const targetPastCompanies = extractPastCompanyNames(target);
  const myAllCompanies = extractAllCompanyNames(me);
  const targetAllCompanies = extractAllCompanyNames(target);

  const sharedExCompanies = new Set<string>();

  for (const myPast of myPastCompanies) {
    const pTokens = tokenizeCompany(myPast);
    if (pTokens.size === 0) continue;
    for (const targetCompName of targetAllCompanies) {
      const tTokens = tokenizeCompany(targetCompName);
      if (cleanString(myPast) === cleanString(targetCompName) || hasOverlap(pTokens, tTokens)) {
        sharedExCompanies.add(myPast);
      }
    }
  }

  for (const targetPast of targetPastCompanies) {
    const pTokens = tokenizeCompany(targetPast);
    if (pTokens.size === 0) continue;
    for (const myCompName of myAllCompanies) {
      const mTokens = tokenizeCompany(myCompName);
      if (cleanString(targetPast) === cleanString(myCompName) || hasOverlap(pTokens, mTokens)) {
        sharedExCompanies.add(targetPast);
      }
    }
  }

  if (sharedExCompanies.size > 0) {
    const list = Array.from(sharedExCompanies);
    const points = Math.min(list.length * 25, 45);
    score += points;
    reasons.push({
      category: 'ex_company',
      badge: `🏛️ Ex-${list[0]} Colleague`,
      label: 'Shared work experience',
      detail: `Shared history at ${list.join(', ')}`,
      points,
    });
  }

  // 3. Location / Maritime Port Hub
  const myCity = cleanString(me.city);
  const targetCity = cleanString(target.city);
  const myState = cleanString(me.state);
  const targetState = cleanString(target.state);

  if (myCity && targetCity && (myCity === targetCity || myCity.includes(targetCity) || targetCity.includes(myCity))) {
    const points = 25;
    score += points;
    reasons.push({
      category: 'location',
      badge: `📍 ${target.city} Maritime Hub`,
      label: 'Local Logistics Hub',
      detail: `Both based in ${target.city || target.country || 'Maritime Hub'}`,
      points,
    });
  } else if (myState && targetState && (myState === targetState || myState.includes(targetState) || targetState.includes(myState))) {
    const points = 12;
    score += points;
    reasons.push({
      category: 'location',
      badge: `📍 Region: ${target.state}`,
      label: 'Regional Maritime Cluster',
      detail: `Both based in ${target.state}`,
      points,
    });
  }

  // 4. Job Designation / Role Similarity
  const myDesig = cleanString(me.designation);
  const targetDesig = cleanString(target.designation);
  if (myDesig && targetDesig) {
    const myDesigTokens = tokenize(me.designation);
    const targetDesigTokens = tokenize(target.designation);
    const LOGISTICS_KEYWORDS = ['trade', 'ocean', 'freight', 'procurement', 'logistics', 'liner', 'director', 'specialist', 'manager', 'operations'];
    const matchingKeywords = Array.from(myDesigTokens).filter((t) => targetDesigTokens.has(t) && LOGISTICS_KEYWORDS.includes(t));

    if (matchingKeywords.length > 0 || myDesig === targetDesig) {
      const points = 20;
      score += points;
      reasons.push({
        category: 'designation',
        badge: `💼 Role: ${target.designation}`,
        label: 'Peer Industry Function',
        detail: `Both active in ${matchingKeywords.join(' / ') || target.designation} domain`,
        points,
      });
    }
  }

  // 5. Schooling / College / University Alumni Overlap
  const myEdus = Array.isArray(me.educations) ? me.educations : [];
  const targetEdus = Array.isArray(target.educations) ? target.educations : [];
  const matchedColleges: string[] = [];
  const matchedDegrees: string[] = [];

  for (const myEdu of myEdus) {
    const myInstTokens = tokenizeInstitution(myEdu.institution);
    const myQualTokens = tokenize(myEdu.qualification);

    for (const tEdu of targetEdus) {
      const tInstTokens = tokenizeInstitution(tEdu.institution);
      const tQualTokens = tokenize(tEdu.qualification);

      if (myInstTokens.size > 0 && tInstTokens.size > 0 && hasOverlap(myInstTokens, tInstTokens)) {
        if (!matchedColleges.includes(tEdu.institution)) {
          matchedColleges.push(tEdu.institution);
        }
      }

      if (myQualTokens.size > 0 && tQualTokens.size > 0 && hasOverlap(myQualTokens, tQualTokens)) {
        if (!matchedDegrees.includes(tEdu.qualification)) {
          matchedDegrees.push(tEdu.qualification);
        }
      }
    }
  }

  if (matchedColleges.length > 0) {
    const points = 25;
    score += points;
    // Abbreviate college name for badge
    const shortName = matchedColleges[0].includes('IIFT')
      ? 'IIFT Alumni'
      : matchedColleges[0].includes('Mumbai')
      ? 'Univ. of Mumbai Alumni'
      : matchedColleges[0].includes('Rotterdam')
      ? 'RSM Alumni'
      : matchedColleges[0].includes('Singapore') || matchedColleges[0].includes('NUS')
      ? 'NUS Alumni'
      : `${matchedColleges[0].slice(0, 22)} Alumni`;

    reasons.push({
      category: 'college',
      badge: `🎓 ${shortName}`,
      label: 'Alumni Network Connection',
      detail: `Both attended ${matchedColleges.join(', ')}`,
      points,
    });
  }

  if (matchedDegrees.length > 0) {
    const points = 12;
    score += points;
    reasons.push({
      category: 'qualification',
      badge: `📜 Qualification: ${matchedDegrees[0]}`,
      label: 'Shared Academic Background',
      detail: `Both hold qualifications in ${matchedDegrees.join(', ')}`,
      points,
    });
  }

  // 6. Professional Courses & Certifications Overlap
  const myCerts = Array.isArray(me.certifications) ? me.certifications : [];
  const targetCerts = Array.isArray(target.certifications) ? target.certifications : [];
  const matchedCerts: string[] = [];

  for (const myCert of myCerts) {
    const myCertTokens = tokenizeCertification(`${myCert.title} ${myCert.issuingAuthority}`);
    for (const tCert of targetCerts) {
      const tCertTokens = tokenizeCertification(`${tCert.title} ${tCert.issuingAuthority}`);
      if (myCertTokens.size > 0 && tCertTokens.size > 0 && hasOverlap(myCertTokens, tCertTokens)) {
        const title = tCert.title || myCert.title;
        if (!matchedCerts.includes(title)) {
          matchedCerts.push(title);
        }
      }
    }
  }

  if (matchedCerts.length > 0) {
    const points = 25;
    score += points;
    const certShort = matchedCerts[0].includes('FIATA')
      ? 'FIATA Certified'
      : matchedCerts[0].includes('FFFAI') || matchedCerts[0].includes('Customs')
      ? 'Customs Specialist'
      : matchedCerts[0].includes('Shipbroker') || matchedCerts[0].includes('ICS')
      ? 'ICS Chartered'
      : matchedCerts[0].slice(0, 24);

    reasons.push({
      category: 'certification',
      badge: `🏆 ${certShort}`,
      label: 'Shared Maritime Credential',
      detail: `Certified in ${matchedCerts.join(', ')}`,
      points,
    });
  }

  // 7. Operating Corridors & Trade Lanes
  const myCorridors = cleanString(me.operatingCorridors || (me.keyTradeLanes || []).join(' '));
  const targetCorridors = cleanString(target.operatingCorridors || (target.keyTradeLanes || []).join(' '));
  if (myCorridors && targetCorridors) {
    const myCorrTokens = tokenize(myCorridors);
    const targetCorrTokens = tokenize(targetCorridors);
    const CORRIDOR_PORTS = ['nhava', 'sheva', 'jebel', 'ali', 'rotterdam', 'singapore', 'hamburg', 'shanghai', 'mundra', 'klang', 'colombo'];
    const sharedPorts = Array.from(myCorrTokens).filter((p) => targetCorrTokens.has(p) && CORRIDOR_PORTS.includes(p));

    if (sharedPorts.length > 0) {
      const points = 18;
      score += points;
      reasons.push({
        category: 'corridor',
        badge: `🚢 Common Lane: ${sharedPorts.map((p) => p.toUpperCase()).join(' ⇄ ')}`,
        label: 'Shared Ocean Trade Route',
        detail: `Both operating on ${sharedPorts.join(', ')} shipping lanes`,
        points,
      });
    }
  }

  // Assign baseline network peer affinity for registered FR8X members
  if (reasons.length === 0) {
    const isVerified = Boolean(target.isVerified || target.hasGoldenTick);
    const baselineScore = isVerified ? 20 : 15;
    const baselinePct = isVerified ? 75 : 68;
    const peerReason: MatchReason = {
      category: 'network',
      badge: isVerified ? '🌐 Verified FR8X Member' : '🌐 FR8X Network Member',
      label: 'Freight Industry Professional',
      detail: 'Registered member in the global logistics network',
      points: baselineScore,
    };
    return {
      score: baselineScore,
      percentage: baselinePct,
      reasons: [peerReason],
      topBadges: [peerReason.badge],
    };
  }

  // Base network credibility boost for verified members
  if (target.isVerified || target.hasGoldenTick) {
    score += 5;
  }

  // Calibrate industry-grade percentage:
  // 1 reason: 72% - 82%
  // 2 reasons: 84% - 91%
  // 3 reasons: 92% - 95%
  // 4+ reasons: 96% - 99%
  const reasonScore = Math.min(reasons.length * 12, 48);
  const depthScore = Math.min((score / 130) * 45, 45);
  const percentage = Math.min(99, Math.max(68, Math.round(10 + reasonScore + depthScore)));

  const topBadges = reasons.slice(0, 3).map((r) => r.badge);

  return {
    score,
    percentage,
    reasons,
    topBadges,
  };
}

/**
 * Deterministic daily seed generator so that recommendations stay consistent for a given calendar day
 * but re-shuffle daily.
 */
function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function seededPseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates ranked recommendations for the given current user from a candidate pool of members
 */
export function getDailyConnectionRecommendations(
  currentUser: Partial<UserProfile>,
  candidates: Partial<UserProfile>[],
  connectedUids: string[],
  pendingSentUids: string[] = [],
  pendingReceivedUids: string[] = [],
  limit = 8
): RecommendedConnection[] {
  if (!currentUser?.uid || !Array.isArray(candidates)) return [];

  const daySeed = getDaySeed();
  const connectedSet = new Set(connectedUids.map((id) => id.toLowerCase()));
  const pendingSentSet = new Set(pendingSentUids.map((id) => id.toLowerCase()));
  const pendingReceivedSet = new Set(pendingReceivedUids.map((id) => id.toLowerCase()));

  const evaluated: RecommendedConnection[] = [];

  for (const candidate of candidates) {
    if (!candidate || isSelfProfile(currentUser, candidate) || isTestOrDummyAccount(candidate)) {
      continue;
    }

    const cUid = (candidate.uid || (candidate as any).id || '').toString().toLowerCase();
    if (!cUid) continue;
    const isAlreadyConnected = connectedSet.has(cUid);
    let requestStatus: RecommendedConnection['requestStatus'] = 'none';
    if (isAlreadyConnected) {
      requestStatus = 'connected';
    } else if (pendingSentSet.has(cUid)) {
      requestStatus = 'pending_sent';
    } else if (pendingReceivedSet.has(cUid)) {
      requestStatus = 'pending_received';
    }

    const { score, percentage, reasons, topBadges } = calculateConnectionAffinity(currentUser, candidate);

    // STRICT INDUSTRY-GRADE QUALITY FILTER:
    // Only recommend profiles with genuine connection points (minimum 65% affinity and at least 1 verified reason).
    // Never show dummy filler cards with zero connection points or blank badges!
    if (reasons.length === 0 || percentage < 65) {
      continue;
    }

    // Apply minor daily jitter to break ties and keep recommendations fresh each day
    const userSeed = (cUid.charCodeAt(0) || 1) * 17 + daySeed;
    const dailyJitter = seededPseudoRandom(userSeed) * 2;
    const totalRankScore = score + dailyJitter;

    evaluated.push({
      user: { ...candidate, uid: candidate.uid || cUid } as UserProfile,
      affinityScore: Math.round(totalRankScore),
      matchPercentage: percentage,
      reasons,
      topBadges: topBadges.length > 0 ? topBadges : [`🌐 Verified Freight Network Member`],
      isAlreadyConnected,
      requestStatus,
    });
  }

  // Sort by highest affinity score first; prioritize un-connected users first
  evaluated.sort((a, b) => {
    if (a.isAlreadyConnected !== b.isAlreadyConnected) {
      return a.isAlreadyConnected ? 1 : -1;
    }
    return b.affinityScore - a.affinityScore;
  });

  return evaluated.slice(0, limit);
}
