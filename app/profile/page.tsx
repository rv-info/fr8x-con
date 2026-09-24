'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import {
  ProfileExperience,
  ProfileEducation,
  ProfileCertification,
  PlanTier,
  KYCDossier,
  UserPrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
  PrivacyLevel,
} from '@/lib/types';
import {
  getUserPrivacySettings,
  saveUserPrivacySettings,
  maskEmail,
  maskPhone,
  maskStatutory,
} from '@/lib/connections';
import { normalizeAssociationName } from '@/lib/utils/associations';
import { upsertKYCDossierInDB } from '@/lib/firebase/firestore';
import {
  getStatutoryProfile,
  evaluateCompliance,
  STATUTORY_PROFILES,
  StatutoryJurisdictionProfile,
} from '@/lib/utils/statutory-kyc';
import SearchableDropdown, { DropdownOption } from '@/components/ui/SearchableDropdown';
import {
  getAllGlobalCountries,
  getStatesForCountry,
  getCitiesForState,
  getCitiesForCountry,
  getAllGlobalTimezones,
} from '@/lib/geo/global-geo';
import {
  UserCheck,
  Save,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Award,
  GraduationCap,
  Briefcase,
  Sparkles,
  ExternalLink,
  Check,
  Building2,
  Mail,
  Phone,
  Clock,
  Compass,
  Eye,
  Lock,
  Globe2,
  CheckCircle2,
  Star,
  Download,
  Share2,
  Layers,
  FileSpreadsheet,
  FileText,
  Activity,
  Anchor,
  Truck,
  TrendingUp,
  Percent,
  Key,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  KeyRound,
  Copy,
  ArrowRight,
  EyeOff,
  Loader2,
  Navigation,
  AlertTriangle,
  Search,
  Users,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, upgradePlan } = useAuth();
  const { toast } = useToast();

  // Mode: View vs Edit
  const [isEditMode, setIsEditMode] = useState(false);

  // Active Tab: overview | experience_edu | kyc | scorecard | privacy
  const [activeTab, setActiveTab] = useState<'overview' | 'experience_edu' | 'kyc' | 'scorecard' | 'privacy'>('overview');

  // Preview Passport Modal
  const [showPassportPreview, setShowPassportPreview] = useState(false);

  // Basic Profile State
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [designation, setDesignation] = useState(user.designation || '');
  const [mobile, setMobile] = useState(user.mobile || '');
  const [company, setCompany] = useState(user.company || '');
  const [summary, setSummary] = useState(user.summary || '');

  // Profile Image & Company Logo State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ? user.avatarUrl : null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(user.companyLogoUrl ? user.companyLogoUrl : null);

  // Sync avatar and logo state whenever user object in AuthContext updates
  useEffect(() => {
    setAvatarUrl(user.avatarUrl ? user.avatarUrl : null);
  }, [user.avatarUrl]);

  useEffect(() => {
    setCompanyLogoUrl(user.companyLogoUrl ? user.companyLogoUrl : null);
  }, [user.companyLogoUrl]);

  // Address & Google Maps State
  const [city, setCity] = useState(user.city || '');
  const [stateName, setStateName] = useState(user.state || '');
  const [country, setCountry] = useState(user.country || '');
  const [formattedAddress, setFormattedAddress] = useState(user.formattedAddress || '');
  const [lat, setLat] = useState(user.coordinates?.lat || 19.1136);
  const [lng, setLng] = useState(user.coordinates?.lng || 72.8697);
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Kolkata');

  // Business IDs & Statutory Filings
  const [kycCountry, setKycCountry] = useState<string>((user as any).kycCountry || user.country || 'India');
  const [taxId, setTaxId] = useState<string>((user as any).taxId || user.gstn || '');
  const [corporateReg, setCorporateReg] = useState<string>((user as any).corporateRegNumber || user.pan || '');
  const [tradeCustoms, setTradeCustoms] = useState<string>((user as any).tradeCustomsCode || user.iec || '');
  const [logisticsLicense, setLogisticsLicense] = useState<string>((user as any).logisticsLicenseNumber || user.mto || '');
  const [gstn, setGstn] = useState(user.gstn || '');
  const [pan, setPan] = useState(user.pan || '');
  const [iec, setIec] = useState(user.iec || '');
  const [mto, setMto] = useState(user.mto || '');
  const [iataCode, setIataCode] = useState((user as any).iataCode || '');
  const [fiataReg, setFiataReg] = useState((user as any).fiataReg || '');
  const [fmcNumber, setFmcNumber] = useState((user as any).fmcNumber || '');
  const [aeoTier, setAeoTier] = useState((user as any).aeoTier || '');
  const [associationName, setAssociationName] = useState((user as any).associationName || '');
  const [associationId, setAssociationId] = useState((user as any).associationId || '');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showKycModal, setShowKycModal] = useState(false);

  // Privacy & Contact Visibility Governance State
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings>(() => {
    return getUserPrivacySettings(user.uid, user.privacySettings);
  });
  const [privacyPreviewMode, setPrivacyPreviewMode] = useState<'public' | 'contact'>('public');
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [operatingCorridors, setOperatingCorridors] = useState<string>(() => {
    return user.operatingCorridors || (user.keyTradeLanes && user.keyTradeLanes.length > 0 ? user.keyTradeLanes.join(', ') : 'Nhava Sheva ⇄ Jebel Ali, Rotterdam');
  });

  useEffect(() => {
    setPrivacySettings(getUserPrivacySettings(user.uid, user.privacySettings));
    if (user.operatingCorridors) {
      setOperatingCorridors(user.operatingCorridors);
    }
  }, [user.uid, user.privacySettings, user.operatingCorridors]);

  const handleUpdatePrivacy = <K extends keyof UserPrivacySettings>(key: K, value: UserPrivacySettings[K]) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePrivacySettings = () => {
    setIsSavingPrivacy(true);
    saveUserPrivacySettings(user.uid, privacySettings);
    updateUser({
      privacySettings,
      operatingCorridors: operatingCorridors.trim(),
    });
    setTimeout(() => {
      setIsSavingPrivacy(false);
      toast('✓ Privacy & Contact Visibility Governance settings saved.');
    }, 250);
  };

  // Edit Identity & Company Link State
  const [showEditIdentityModal, setShowEditIdentityModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user.firstName || '');
  const [editLastName, setEditLastName] = useState(user.lastName || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editMobile, setEditMobile] = useState(user.mobile || '');
  const [editDesignation, setEditDesignation] = useState(user.designation || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(user.avatarUrl ? user.avatarUrl : null);
  const [editCompanyLogoUrl, setEditCompanyLogoUrl] = useState<string | null>(user.companyLogoUrl || null);
  const [editCity, setEditCity] = useState(user.city || '');
  const [editState, setEditState] = useState(user.state || '');
  const [editCountry, setEditCountry] = useState(user.country || '');
  const [editFormattedAddress, setEditFormattedAddress] = useState(user.formattedAddress || '');
  const [editTimezone, setEditTimezone] = useState(user.timezone || 'Asia/Kolkata');
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [transferTargetCompany, setTransferTargetCompany] = useState('');
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const [transferMethod, setTransferMethod] = useState<'self' | 'godfather'>('self');
  const [transferReason, setTransferReason] = useState('Change of Employer / Corporate Reorganization');

  // Company Transfer Autocomplete & Duplicate Prevention State
  const [profileCompanySearchResults, setProfileCompanySearchResults] = useState<any[]>([]);
  const [isProfileCompanyDropdownOpen, setIsProfileCompanyDropdownOpen] = useState(false);
  const [profileCompanyAdvisory, setProfileCompanyAdvisory] = useState<any | null>(null);

  useEffect(() => {
    if (!transferTargetCompany.trim()) {
      setProfileCompanySearchResults([]);
      setProfileCompanyAdvisory(null);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/companies/search?q=${encodeURIComponent(transferTargetCompany.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProfileCompanySearchResults(data.companies || []);
            if (data.duplicateAdvisory?.isPotentialDuplicate) {
              setProfileCompanyAdvisory(data.duplicateAdvisory);
            } else {
              setProfileCompanyAdvisory(null);
            }
          }
        })
        .catch(() => {});
    }, 250);

    return () => clearTimeout(timer);
  }, [transferTargetCompany]);

  // Location Detection & Address Suggestion State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

  // Memoized Geographic Data for SearchableDropdowns
  const globalCountries = useMemo(() => getAllGlobalCountries(), []);

  const countryOptions = useMemo<DropdownOption[]>(() => {
    return globalCountries.map((c) => ({
      value: c.name,
      label: c.name,
      subLabel: c.isoCode,
      flag: c.flag || '🌐',
    }));
  }, [globalCountries]);

  const editCountryIso = useMemo(() => {
    if (!editCountry) return 'IN';
    const found = globalCountries.find(
      (c) =>
        c.name.toLowerCase() === editCountry.trim().toLowerCase() ||
        c.isoCode.toLowerCase() === editCountry.trim().toLowerCase()
    );
    return found ? found.isoCode : 'IN';
  }, [editCountry, globalCountries]);

  const stateOptions = useMemo<DropdownOption[]>(() => {
    const states = getStatesForCountry(editCountryIso);
    return states.map((s) => ({
      value: s.name,
      label: s.name,
      subLabel: s.isoCode,
    }));
  }, [editCountryIso]);

  const editStateIso = useMemo(() => {
    if (!editState) return '';
    const states = getStatesForCountry(editCountryIso);
    const found = states.find(
      (s) =>
        s.name.toLowerCase() === editState.trim().toLowerCase() ||
        s.isoCode.toLowerCase() === editState.trim().toLowerCase()
    );
    return found ? found.isoCode : '';
  }, [editCountryIso, editState]);

  const cityOptions = useMemo<DropdownOption[]>(() => {
    let cities: Array<{ name: string }> = [];
    if (editStateIso) {
      cities = getCitiesForState(editCountryIso, editStateIso);
    }
    if (!cities || cities.length === 0) {
      cities = getCitiesForCountry(editCountryIso);
    }
    return (cities || []).map((ci) => ({
      value: ci.name,
      label: ci.name,
    }));
  }, [editCountryIso, editStateIso]);

  const timezoneOptions = useMemo<DropdownOption[]>(() => {
    const timezones = getAllGlobalTimezones();
    return timezones.map((tz) => ({
      value: tz.value,
      label: `${tz.value} (${tz.offset})`,
      subLabel: tz.offset,
    }));
  }, []);

  const effectiveAddressSuggestions = useMemo(() => {
    const list: string[] = [...addressSuggestions];
    if (editCity || editCountry) {
      const cityHub = `${editCity || 'Central'} Container Terminal / CFS Area, ${editState || editCountry}`;
      const icdHub = `Inland Container Depot (ICD) Logistics Park, ${editCity || editState || editCountry}`;
      if (!list.includes(cityHub)) list.push(cityHub);
      if (!list.includes(icdHub)) list.push(icdHub);
    }
    return list.slice(0, 4);
  }, [addressSuggestions, editCity, editState, editCountry]);

  // Location Auto-Detect Handler via device GPS + free reverse geocoding API
  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);

    const applyDetectedData = (data: any) => {
      if (data.country) setEditCountry(data.country);
      if (data.state) setEditState(data.state);
      if (data.city) setEditCity(data.city);
      if (data.timezone) setEditTimezone(data.timezone);
      if (data.suggestedStreetAddress) {
        setEditFormattedAddress(data.suggestedStreetAddress);
      } else if (data.formattedAddress) {
        setEditFormattedAddress(data.formattedAddress);
      }
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        setAddressSuggestions(data.suggestions);
      }
      toast(`✓ Detected: ${data.city || data.state || data.country} (${data.source === 'gps' ? 'High-Precision GPS' : 'Network Geolocation'})`);
    };

    const fetchGeoFromApi = async (coordsLat?: number, coordsLng?: number) => {
      try {
        const query = coordsLat !== undefined && coordsLng !== undefined ? `?lat=${coordsLat}&lng=${coordsLng}` : '';
        const res = await fetch(`/api/geo/detect${query}`);
        if (!res.ok) throw new Error('Location detection failed');
        const data = await res.json();
        if (data.success) {
          applyDetectedData(data);
        } else {
          throw new Error(data.error || 'Could not resolve location');
        }
      } catch (err) {
        console.warn('Geo detection error, attempting IP fallback:', err);
        if (coordsLat !== undefined) {
          try {
            const fallbackRes = await fetch('/api/geo/detect');
            const fallbackData = await fallbackRes.json();
            if (fallbackData.success) {
              applyDetectedData(fallbackData);
              return;
            }
          } catch {}
        }
        toast('Location detection unavailable. Please select your hub from the searchable dropdowns.');
      } finally {
        setIsDetectingLocation(false);
      }
    };

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchGeoFromApi(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation permission denied or timeout, fallback to IP:', err?.message);
          fetchGeoFromApi();
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    } else {
      fetchGeoFromApi();
    }
  };

  // Privacy controls per section
  const [expPrivacy, setExpPrivacy] = useState<'public' | 'network' | 'private'>('public');
  const [eduPrivacy, setEduPrivacy] = useState<'public' | 'network' | 'private'>('public');
  const [certPrivacy, setCertPrivacy] = useState<'public' | 'network' | 'private'>('public');
  const [kycPrivacy, setKycPrivacy] = useState<'public' | 'network' | 'private'>('network');

  // Professional Record Cards (Experience, Education, Certifications) - Real user state only, no mock/dummy records
  const [experiences, setExperiences] = useState<ProfileExperience[]>([]);
  const [educations, setEducations] = useState<ProfileEducation[]>([]);
  const [certifications, setCertifications] = useState<ProfileCertification[]>([]);

  // Persistent storage key helper for records
  const userStorageKey = user.uid || user.email || 'guest';

  // Load real user experiences, educations, and certifications from localStorage or user profile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedExp = localStorage.getItem(`fr8x_user_exp_${userStorageKey}`);
      if (storedExp) {
        setExperiences(JSON.parse(storedExp));
      } else if (user.experiences && Array.isArray(user.experiences)) {
        setExperiences(user.experiences);
      } else {
        setExperiences([]);
      }

      const storedEdu = localStorage.getItem(`fr8x_user_edu_${userStorageKey}`);
      if (storedEdu) {
        setEducations(JSON.parse(storedEdu));
      } else if (user.educations && Array.isArray(user.educations)) {
        setEducations(user.educations);
      } else {
        setEducations([]);
      }

      const storedCert = localStorage.getItem(`fr8x_user_cert_${userStorageKey}`);
      if (storedCert) {
        setCertifications(JSON.parse(storedCert));
      } else if (user.certifications && Array.isArray(user.certifications)) {
        setCertifications(user.certifications);
      } else {
        setCertifications([]);
      }
    } catch (e) {
      console.error('[Profile] Failed to load stored records:', e);
    }
  }, [userStorageKey, user.experiences, user.educations, user.certifications]);

  // Synchronize component form states whenever the user object in AuthContext changes or reloads
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setDesignation(user.designation || '');
    setMobile(user.mobile || '');
    setCompany(user.company || '');
    setSummary(user.summary || '');
    setCity(user.city || '');
    setStateName(user.state || '');
    setCountry(user.country || '');
    setFormattedAddress(user.formattedAddress || '');
    setTimezone(user.timezone || 'Asia/Kolkata');
    setKycCountry((user as any).kycCountry || user.country || 'India');
    setTaxId((user as any).taxId || '');
    setCorporateReg((user as any).corporateRegNumber || '');
    setTradeCustoms((user as any).tradeCustomsCode || '');
    setLogisticsLicense((user as any).logisticsLicenseNumber || '');
    setGstn(user.gstn || '');
    setPan(user.pan || '');
    setIec(user.iec || '');
    setMto(user.mto || '');
    setIataCode((user as any).iataCode || '');
    setFiataReg((user as any).fiataReg || '');
    setFmcNumber((user as any).fmcNumber || '');
    setAeoTier((user as any).aeoTier || '');
    setAssociationName((user as any).associationName || '');
    setAssociationId((user as any).associationId || '');
  }, [user]);

  const persistExperiences = (newExp: ProfileExperience[]) => {
    setExperiences(newExp);
    try {
      localStorage.setItem(`fr8x_user_exp_${userStorageKey}`, JSON.stringify(newExp));
    } catch {}
    updateUser({ experiences: newExp });
  };

  const persistEducations = (newEdu: ProfileEducation[]) => {
    setEducations(newEdu);
    try {
      localStorage.setItem(`fr8x_user_edu_${userStorageKey}`, JSON.stringify(newEdu));
    } catch {}
    updateUser({ educations: newEdu });
  };

  const persistCertifications = (newCert: ProfileCertification[]) => {
    setCertifications(newCert);
    try {
      localStorage.setItem(`fr8x_user_cert_${userStorageKey}`, JSON.stringify(newCert));
    } catch {}
    updateUser({ certifications: newCert });
  };

  // Modal State for Adding/Editing Records
  const [activeRecordModal, setActiveRecordModal] = useState<'exp' | 'edu' | 'cert' | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form State for Experience
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expEmpType, setExpEmpType] = useState<ProfileExperience['employmentType']>('Full-time');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expSkills, setExpSkills] = useState('');

  // Form State for Education
  const [eduInst, setEduInst] = useState('');
  const [eduQual, setEduQual] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');
  const [eduGrade, setEduGrade] = useState('');
  const [eduDesc, setEduDesc] = useState('');

  // Form State for Certifications
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certIssue, setCertIssue] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certUrl, setCertUrl] = useState('');

  // Avatar and Logo upload handlers
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const url = loadEvt.target?.result as string;
        setAvatarUrl(url);
        updateUser({ avatarUrl: url });
        toast('Profile photo updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const url = loadEvt.target?.result as string;
        setCompanyLogoUrl(url);
        updateUser({ companyLogoUrl: url });
        toast('Company logo uploaded successfully.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile Completeness Calculation
  const calculateCompleteness = () => {
    let score = 0;
    if (firstName && lastName) score += 15;
    if (company && designation) score += 15;
    if (avatarUrl) score += 10;
    if (companyLogoUrl) score += 10;
    if (formattedAddress && city) score += 10;
    if (summary) score += 10;
    const complianceEval = evaluateCompliance(kycCountry || country, {
      taxId,
      corporateReg,
      tradeCustomsCode: tradeCustoms,
      logisticsLicense,
      gstn,
      pan,
      iec,
      mto,
    });
    if (complianceEval.isCompliant) score += 10;
    if (experiences.length > 0) score += 10;
    if (certifications.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleSaveProfile = () => {
    updateUser({
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      designation,
      company,
      mobile,
      summary,
      avatarUrl: avatarUrl ? avatarUrl : '',
      companyLogoUrl: companyLogoUrl ? companyLogoUrl : '',
      city,
      state: stateName,
      country,
      formattedAddress,
      coordinates: { lat, lng },
      timezone,
      kycCountry,
      taxId,
      corporateRegNumber: corporateReg,
      tradeCustomsCode: tradeCustoms,
      logisticsLicenseNumber: logisticsLicense,
      gstn: gstn || '',
      pan: pan || '',
      iec: iec || '',
      mto: mto || '',
    });
    setIsEditMode(false);
    toast('Enterprise profile updated successfully.');
  };

  const handleOpenExpModal = (exp?: ProfileExperience) => {
    if (exp) {
      setEditingRecordId(exp.id);
      setExpTitle(exp.designation);
      setExpCompany(exp.company);
      setExpLocation(exp.location);
      setExpEmpType(exp.employmentType);
      setExpStart(exp.startDate);
      setExpEnd(exp.endDate || '');
      setExpCurrent(exp.isCurrent);
      setExpDesc(exp.description);
      setExpSkills(exp.skills);
    } else {
      setEditingRecordId(null);
      setExpTitle('');
      setExpCompany(company || user.company);
      setExpLocation(`${city}, ${country}`);
      setExpEmpType('Full-time');
      setExpStart('Jan 2022');
      setExpEnd('');
      setExpCurrent(true);
      setExpDesc('');
      setExpSkills('Ocean Freight, Reverse Auctions, Container Logistics');
    }
    setActiveRecordModal('exp');
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expCompany) return;
    let updated: ProfileExperience[];
    if (editingRecordId) {
      updated = experiences.map((item) =>
        item.id === editingRecordId
          ? {
              ...item,
              designation: expTitle,
              company: expCompany,
              location: expLocation,
              employmentType: expEmpType,
              startDate: expStart,
              endDate: expEnd,
              isCurrent: expCurrent,
              description: expDesc,
              skills: expSkills,
            }
          : item
      );
    } else {
      updated = [
        ...experiences,
        {
          id: `exp-${Date.now()}`,
          designation: expTitle,
          company: expCompany,
          location: expLocation,
          employmentType: expEmpType,
          startDate: expStart,
          endDate: expEnd,
          isCurrent: expCurrent,
          description: expDesc,
          skills: expSkills,
          visibility: 'public',
        },
      ];
    }
    persistExperiences(updated);
    setActiveRecordModal(null);
    toast('Work experience details saved.');
  };

  const handleOpenEduModal = (edu?: ProfileEducation) => {
    if (edu) {
      setEditingRecordId(edu.id);
      setEduInst(edu.institution);
      setEduQual(edu.qualification);
      setEduField(edu.fieldOfStudy);
      setEduStart(edu.startYear);
      setEduEnd(edu.endYear);
      setEduGrade(edu.grade || '');
      setEduDesc(edu.description || '');
    } else {
      setEditingRecordId(null);
      setEduInst('');
      setEduQual('');
      setEduField('');
      setEduStart('');
      setEduEnd('');
      setEduGrade('');
      setEduDesc('');
    }
    setActiveRecordModal('edu');
  };

  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInst || !eduQual) return;
    let updated: ProfileEducation[];
    if (editingRecordId) {
      updated = educations.map((item) =>
        item.id === editingRecordId
          ? {
              ...item,
              institution: eduInst,
              qualification: eduQual,
              fieldOfStudy: eduField,
              startYear: eduStart,
              endYear: eduEnd,
              grade: eduGrade,
              description: eduDesc,
            }
          : item
      );
    } else {
      updated = [
        ...educations,
        {
          id: `edu-${Date.now()}`,
          institution: eduInst,
          qualification: eduQual,
          fieldOfStudy: eduField,
          startYear: eduStart,
          endYear: eduEnd,
          grade: eduGrade,
          description: eduDesc,
          visibility: 'public',
        },
      ];
    }
    persistEducations(updated);
    setActiveRecordModal(null);
    toast('Education details saved.');
  };

  const handleOpenCertModal = (cert?: ProfileCertification) => {
    if (cert) {
      setEditingRecordId(cert.id);
      setCertTitle(cert.title);
      setCertOrg(cert.issuingAuthority);
      setCertNumber(cert.certificateNumber);
      setCertIssue(cert.issueDate);
      setCertExpiry(cert.expiryDate || '');
      setCertUrl(cert.credentialUrl || '');
    } else {
      setEditingRecordId(null);
      setCertTitle('');
      setCertOrg('');
      setCertNumber('');
      setCertIssue('');
      setCertExpiry('');
      setCertUrl('');
    }
    setActiveRecordModal('cert');
  };

  const handleSaveCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle || !certOrg) return;
    let updated: ProfileCertification[];
    if (editingRecordId) {
      updated = certifications.map((item) =>
        item.id === editingRecordId
          ? {
              ...item,
              title: certTitle,
              issuingAuthority: certOrg,
              certificateNumber: certNumber,
              issueDate: certIssue,
              expiryDate: certExpiry,
              credentialUrl: certUrl,
            }
          : item
      );
    } else {
      updated = [
        ...certifications,
        {
          id: `cert-${Date.now()}`,
          title: certTitle,
          issuingAuthority: certOrg,
          certificateNumber: certNumber,
          issueDate: certIssue,
          expiryDate: certExpiry,
          credentialUrl: certUrl,
          verificationStatus: 'verified',
          visibility: 'public',
        },
      ];
    }
    persistCertifications(updated);
    setActiveRecordModal(null);
    toast('Certification credentials saved.');
  };

  // Company Reference Code & Link Share
  const companyRefNo = (user as any).companyRefNo ||
    `REF-FR8X-${(user.companyId || user.company || 'CORP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || '8921'}-${(user.uid || '99').slice(-3).toUpperCase()}`;
  const companyShareUrl = `https://con.fr8x.in/ref/${companyRefNo}`;
  const [showShareModal, setShowShareModal] = useState(false);

  // OTP Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirmPass, setShowResetConfirmPass] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Handle Resend Cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleShareProfile = () => {
    navigator.clipboard?.writeText?.(companyShareUrl);
    setShowShareModal(true);
    toast(`Reference link copied: ${companyShareUrl}`);
  };

  const handleRequestProfileOtp = async () => {
    setResetError('');
    setIsResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, action: 'request' }),
      });
      const data = await res.json();
      setIsResetSubmitting(false);
      if (!res.ok || !data.success) {
        setResetError(data.error || 'Failed to dispatch OTP. Please try again.');
        return;
      }
      setResetStep('verify');
      setResendCooldown(60);
      toast(`Security OTP dispatched to ${user.email}.`);
    } catch {
      setIsResetSubmitting(false);
      setResetError('Network error while dispatching OTP.');
    }
  };

  const handleConfirmProfileReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (resetNewPass.length < 8) {
      setResetError('New password must be at least 8 characters in length.');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('New password and confirm password do not match.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          otp: resetOtp.trim(),
          newPassword: resetNewPass.trim(),
          confirmPassword: resetConfirmPass.trim(),
          action: 'verify_and_reset',
        }),
      });
      const data = await res.json();
      setIsResetSubmitting(false);
      if (!res.ok || !data.success) {
        setResetError(data.error || 'Failed to reset password. Please check OTP.');
        return;
      }
      setShowResetModal(false);
      setResetStep('request');
      setResetOtp('');
      setResetNewPass('');
      setResetConfirmPass('');
      toast('✓ Password updated successfully via OTP authentication.');
    } catch {
      setIsResetSubmitting(false);
      setResetError('Network error while resetting password.');
    }
  };

  return (
    <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Experience Modal */}
      {activeRecordModal === 'exp' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRecordModal(null)}
          title={editingRecordId ? 'Edit Work Experience Details' : 'Add Work Experience Details'}
          maxWidth="680px"
        >
          <form onSubmit={handleSaveExp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Job Title / Designation <span className="req">*</span></label>
                <input className="input" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} placeholder="Director of Ocean Procurement" required />
              </div>
              <div className="field">
                <label>Company Name <span className="req">*</span></label>
                <input className="input" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="Atlas Logistics Pvt. Ltd." required />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Location / Port Hub</label>
                <input className="input" value={expLocation} onChange={(e) => setExpLocation(e.target.value)} placeholder="Mumbai, India / Nhava Sheva" />
              </div>
              <div className="field">
                <label>Employment Type</label>
                <select className="input" value={expEmpType} onChange={(e) => setExpEmpType(e.target.value as any)}>
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Part-time</option>
                  <option>Freelance</option>
                </select>
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Start Date</label>
                <input className="input" value={expStart} onChange={(e) => setExpStart(e.target.value)} placeholder="e.g. Jan 2021" />
              </div>
              <div className="field">
                <label>End Date</label>
                <input
                  className="input"
                  value={expCurrent ? 'Present' : expEnd}
                  onChange={(e) => setExpEnd(e.target.value)}
                  placeholder="e.g. Dec 2023 or Present"
                  disabled={expCurrent}
                />
              </div>
            </div>

            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={expCurrent}
                onChange={(e) => setExpCurrent(e.target.checked)}
              />
              I am currently working in this role
            </label>

            <div className="field">
              <label>Core Responsibilities & Operational Milestones</label>
              <textarea
                className="input"
                rows={3}
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Managed 14,000+ TEUs annually across Asia-Europe and US West Coast corridors, carrier rate negotiations (MSC, Maersk), and digital reverse auction execution…"
              />
            </div>

            <div className="field">
              <label>Key Skills, Liner Alliances & Trade Lanes</label>
              <input
                className="input"
                value={expSkills}
                onChange={(e) => setExpSkills(e.target.value)}
                placeholder="Ocean Procurement, Reverse Auctions, INNSA-NLRTM, Demurrage Management"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setActiveRecordModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save Experience</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Education Modal */}
      {activeRecordModal === 'edu' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRecordModal(null)}
          title={editingRecordId ? 'Edit Academic Education' : 'Add Academic Education'}
          maxWidth="640px"
        >
          <form onSubmit={handleSaveEdu} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Institution / University <span className="req">*</span></label>
                <input className="input" value={eduInst} onChange={(e) => setEduInst(e.target.value)} placeholder="Symbiosis Institute / World Maritime University" required />
              </div>
              <div className="field">
                <label>Degree / Qualification <span className="req">*</span></label>
                <input className="input" value={eduQual} onChange={(e) => setEduQual(e.target.value)} placeholder="MBA / B.Sc. Nautical Science" required />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Field of Study / Major <span className="req">*</span></label>
                <input className="input" value={eduField} onChange={(e) => setEduField(e.target.value)} placeholder="Maritime Logistics & Supply Chain" required />
              </div>
              <div className="field">
                <label>Grade / GPA / Honors</label>
                <input className="input" value={eduGrade} onChange={(e) => setEduGrade(e.target.value)} placeholder="Distinction / 3.9 GPA" />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Start Year</label>
                <input className="input" value={eduStart} onChange={(e) => setEduStart(e.target.value)} placeholder="2015" />
              </div>
              <div className="field">
                <label>End Year / Graduation Year</label>
                <input className="input" value={eduEnd} onChange={(e) => setEduEnd(e.target.value)} placeholder="2017" />
              </div>
            </div>

            <div className="field">
              <label>Key Coursework, Thesis & Specializations</label>
              <textarea
                className="input"
                rows={2}
                value={eduDesc}
                onChange={(e) => setEduDesc(e.target.value)}
                placeholder="Specialization in Maritime Trade Law, Port Economics, and Container Stowage Logistics…"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setActiveRecordModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save Education</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Certification Modal */}
      {activeRecordModal === 'cert' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRecordModal(null)}
          title={editingRecordId ? 'Edit Certification Credential' : 'Add Certification Credential'}
          maxWidth="640px"
        >
          <form onSubmit={handleSaveCert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Certification Title <span className="req">*</span></label>
                <input className="input" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="IATA Dangerous Goods DGR Cat 6" required />
              </div>
              <div className="field">
                <label>Issuing Authority / Body <span className="req">*</span></label>
                <input className="input" value={certOrg} onChange={(e) => setCertOrg(e.target.value)} placeholder="IATA / FIATA / CBIC" required />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>License / Certificate ID <span className="req">*</span></label>
                <input className="input" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="DGR-2024-8849" required />
              </div>
              <div className="field">
                <label>Issue Date</label>
                <input className="input" value={certIssue} onChange={(e) => setCertIssue(e.target.value)} placeholder="Mar 2024" />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Expiration Date (Optional)</label>
                <input className="input" value={certExpiry} onChange={(e) => setCertExpiry(e.target.value)} placeholder="Mar 2027 or No Expiry" />
              </div>
              <div className="field">
                <label>Online Verification URL</label>
                <input className="input" value={certUrl} onChange={(e) => setCertUrl(e.target.value)} placeholder="https://iata.org/verify/..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setActiveRecordModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save Certification</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Company Link Share Modal */}
      {showShareModal && (
        <Modal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Share Company Reference & Profile"
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <div style={{ padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#0369a1', lineHeight: 1.4 }}>
              Share this official verified enterprise link with logistics partners, shippers, and carriers.
            </div>

            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                Company Reference Code
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '6px', fontWeight: 800, fontSize: '14px', letterSpacing: '1px', color: '#0f172a', flex: 1 }}>
                  {companyRefNo}
                </div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText?.(companyRefNo);
                    toast(`Company code ${companyRefNo} copied.`);
                  }}
                >
                  <Copy size={13} /> Copy Code
                </button>
              </div>
            </div>

            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                Live con.fr8x.in Reference URL
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  className="input"
                  readOnly
                  value={companyShareUrl}
                  style={{ fontSize: '12px', height: '36px', background: '#f8fafc', color: '#0284c7', fontWeight: 600 }}
                />
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    navigator.clipboard?.writeText?.(companyShareUrl);
                    toast('Reference link copied to clipboard.');
                  }}
                >
                  <Copy size={13} /> Copy Link
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* OTP Password Reset Modal */}
      {showResetModal && (
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="Account Password Reset via OTP"
          maxWidth="460px"
        >
          {resetStep === 'request' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', color: '#0369a1', lineHeight: 1.45, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                <span>
                  Click below to dispatch a secure 6-digit recovery OTP code to your registered corporate email (<strong>{user.email}</strong>).
                </span>
              </div>

              {resetError && (
                <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '11.5px' }}>
                  {resetError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <button type="button" className="btn secondary" onClick={() => setShowResetModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={isResetSubmitting}
                  onClick={handleRequestProfileOtp}
                >
                  {isResetSubmitting ? 'Dispatching OTP…' : 'Send 6-Digit OTP Code'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmProfileReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
              <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>6-digit OTP code dispatched to <strong>{user.email}</strong>. Enter it below to set your new password.</span>
              </div>

              {resetError && (
                <div style={{ padding: '8px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '11.5px' }}>
                  {resetError}
                </div>
              )}

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>6-Digit OTP Code <span className="req">*</span></label>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isResetSubmitting}
                    onClick={handleRequestProfileOtp}
                    style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#94a3b8' : 'var(--brand)', fontSize: '10.5px', cursor: resendCooldown > 0 ? 'default' : 'pointer', padding: 0 }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  required
                  style={{ height: '38px', fontSize: '16px', letterSpacing: '5px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                  className="input"
                  autoFocus
                />
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>New Password (min. 8 characters) <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{ height: '34px', fontSize: '12px', width: '100%', boxSizing: 'border-box', paddingRight: '32px' }}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(!showResetPass)}
                    style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showResetPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>Confirm New Password <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showResetConfirmPass ? 'text' : 'password'}
                    value={resetConfirmPass}
                    onChange={(e) => setResetConfirmPass(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    style={{ height: '34px', fontSize: '12px', width: '100%', boxSizing: 'border-box', paddingRight: '32px' }}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPass(!showResetConfirmPass)}
                    style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showResetConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                <button type="button" className="btn secondary" onClick={() => setShowResetModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={isResetSubmitting || resetOtp.length !== 6 || !resetNewPass}
                >
                  {isResetSubmitting ? 'Updating Password…' : 'Verify OTP & Update Password'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Top Header */}
      <div className="head" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>Enterprise Member Identity &amp; Freight Passport</h1>
            {user.kycStatus === 'verified' ? (
              <span className="badge green" style={{ fontSize: '10.5px' }}>
                <ShieldCheck size={12} /> KYC Verified
              </span>
            ) : user.kycStatus === 'pending' ? (
              <span className="badge blue" style={{ fontSize: '10.5px' }}>
                <ShieldCheck size={12} /> KYC Review Pending
              </span>
            ) : user.kycStatus === 'rejected' ? (
              <span className="badge red" style={{ fontSize: '10.5px' }}>
                <ShieldCheck size={12} /> KYC Action Required
              </span>
            ) : (
              <span className="badge gray" style={{ fontSize: '10.5px' }}>
                <ShieldCheck size={12} /> Standard Member
              </span>
            )}
            <span className="badge blue" style={{ fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={12} /> Ref: {companyRefNo}
            </span>
          </div>
          <p style={{ marginTop: '4px' }}>
            Enterprise Freight Forwarding Identity, Statutory Registrations (GSTN/PAN/IEC/MTO), and Accredited Professional Records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn secondary cursor-pointer"
            onClick={() => setShowPassportPreview(true)}
            title="Preview how other freight network members view your verified passport"
          >
            <Eye size={14} /> Preview Passport
          </button>
          <button
            className="btn secondary cursor-pointer"
            onClick={() => {
              const el = document.getElementById('privacy-governance');
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title="Configure profile privacy, masked credentials, and connection visibility"
          >
            <Lock size={14} /> Privacy & Visibility
          </button>
          <button
            className="btn secondary"
            onClick={() => {
              setShowResetModal(true);
              setResetStep('request');
              setResetError('');
            }}
            title="Reset Password via OTP"
          >
            <KeyRound size={14} /> Reset Password
          </button>
          <button className="btn secondary" onClick={handleShareProfile} title="Share Company Reference Link">
            <Share2 size={14} /> Share
          </button>
          <button
            className="btn primary"
            onClick={() => {
              setEditFirstName(user.firstName || firstName || '');
              setEditLastName(user.lastName || lastName || '');
              setEditEmail(user.email || '');
              setEditMobile(user.mobile || mobile || '');
              setEditDesignation(user.designation || designation || '');
              setEditAvatarUrl(avatarUrl || user.avatarUrl || null);
              setEditCompanyLogoUrl(companyLogoUrl || user.companyLogoUrl || null);
              setEditCity(user.city || city || '');
              setEditState(user.state || stateName || '');
              setEditCountry(user.country || country || '');
              setEditFormattedAddress(user.formattedAddress || formattedAddress || '');
              setEditTimezone(user.timezone || timezone || 'Asia/Kolkata');
              setIsChangingCompany(false);
              setTransferTargetCompany('');
              setTransferTargetEmail('');
              setShowEditIdentityModal(true);
            }}
          >
            <Edit2 size={14} /> Edit Identity & Location
          </button>
        </div>
      </div>

      {/* Verified Enterprise Logistics Passport Preview Modal */}
      <ProfilePreviewModal
        isOpen={showPassportPreview}
        onClose={() => setShowPassportPreview(false)}
      />

      {/* Corporate Transfer Status Banner if Pending Godfather Review */}
      {user.companyTransferStatus === 'pending_godfather_approval' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} color="#d97706" />
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400e' }}>
                Corporate Affiliation Transfer Pending Godfather Review
              </div>
              <div style={{ fontSize: '11px', color: '#b45309' }}>
                Requested transfer to <b>{user.pendingCompany}</b> with corporate email <b>{user.pendingEmail}</b>. Docket Ticket: <code>{user.transferRequestId}</code>
              </div>
            </div>
          </div>
          <span className="badge amber" style={{ fontSize: '10.5px' }}>Under Godfather Audit</span>
        </div>
      )}

      {/* Executive Hero Banner Card with Profile Picture & Company Logo Uploads */}
      <div
        className="card"
        style={{
          padding: '22px 24px',
          background: 'var(--card)',
          border: '1px solid var(--fr8x-outline)',
          boxShadow: 'var(--sh-md)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {/* Avatar + Background CO Symbol + User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* 5-Layer Stack: 1. Card Bg | 2. CO Symbol | 3. Circular Avatar | 4. GoldenTick Badge | 5. Camera/Edit Controls */}
            <div
              style={{
                position: 'relative',
                width: '106px',
                height: '106px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* LAYER 2: Subtle Geometric "CO" Background Symbol (40% larger than 76px avatar = 106px diameter) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'var(--fr8x-input)',
                  border: '1px dashed var(--fr8x-outline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '-0.06em',
                    color: 'var(--fr8x-container)',
                    lineHeight: 1,
                  }}
                >
                  CO
                </span>
              </div>

              {/* LAYER 3: Circular Avatar (Reduced by exactly 10%: 84px -> 75.6px ≈ 76px) */}
              <div
                style={{
                  position: 'relative',
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  zIndex: 2,
                  boxShadow: 'var(--sh)',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #fff',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    className="avatar hero"
                    style={{
                      width: '76px',
                      height: '76px',
                      fontSize: '24px',
                      borderRadius: '50%',
                      background: 'var(--fr8x-outline)',
                      border: '2px solid #fff',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    {user.displayName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                )}

                {/* LAYER 4: Verified / Premium Brand Asset Badge */}
                {user.hasGoldenTick && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      zIndex: 3,
                    }}
                  >
                    <GoldenTick size={20} title="FR8X Premium Verified" />
                  </div>
                )}

                {/* LAYER 5: Camera / Upload Profile Photo Trigger */}
                <label
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: 'var(--fr8x-outline)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--sh)',
                    border: '1.5px solid #fff',
                    zIndex: 4,
                  }}
                  title="Upload profile photo"
                >
                  <Camera size={10} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>

                {/* Remove Profile Photo Trigger (if photo exists) */}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl(null);
                      updateUser({ avatarUrl: '' });
                      toast('Profile photo removed.');
                    }}
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      background: '#dc2626',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--sh)',
                      border: '1.5px solid #fff',
                      zIndex: 5,
                    }}
                    title="Remove profile photo"
                  >
                    <Trash2 size={10} />
                  </button>
                )}

                {/* Company Logo Badge — lower-left overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '-14px',
                    zIndex: 4,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {companyLogoUrl ? (
                      <img
                        src={companyLogoUrl}
                        alt="Company Logo"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '5px',
                          objectFit: 'contain',
                          background: '#fff',
                          border: '1.5px solid var(--fr8x-outline)',
                          padding: '1px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '5px',
                          background: 'var(--fr8x-input)',
                          border: '1.5px solid var(--fr8x-outline)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--fr8x-text)',
                        }}
                      >
                        <Building2 size={12} />
                        <span style={{ fontSize: '6.5px', fontWeight: 800 }}>CO</span>
                      </div>
                    )}
                    {/* Upload company logo trigger */}
                    <label
                      style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        background: 'var(--fr8x-outline)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid #fff',
                      }}
                      title="Upload company logo"
                    >
                      <Upload size={7} />
                      <input type="file" accept="image/*" onChange={handleCompanyLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* User Identity Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
                  {user.displayName}
                </h2>
                {user.hasGoldenTick && <GoldenTick size={16} />}
                <span className="badge" style={{ fontSize: '10px', fontWeight: 700 }}>
                  <ShieldCheck size={11} /> VERIFIED B2B
                </span>
                <span className="badge" style={{ fontSize: '10px' }}>
                  <Sparkles size={10} /> {user.plan.toUpperCase()} PLAN
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--fr8x-text)', marginTop: '4px', fontWeight: 600 }}>
                {designation} at <span style={{ fontWeight: 700 }}>{company}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--fr8x-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="var(--fr8x-outline)" /> {city || country ? `${city}${city && country ? ', ' : ''}${country}` : 'Location not configured'}
                </span>
                <LocalTimeBadge timezone={timezone || 'Asia/Kolkata'} />
                {(iataCode || mto) && (
                  <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
                    {iataCode ? <>IATA: <b>{iataCode}</b></> : null}
                    {iataCode && mto ? ' · ' : null}
                    {mto ? <>MTO: <b>{mto}</b></> : null}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* D&B / Ariba Trust Index & Completeness Score */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--fr8x-input)', border: '1px solid var(--fr8x-outline)', padding: '10px 16px', borderRadius: '6px', textAlign: 'center' }}>
              <small style={{ color: 'var(--fr8x-muted)', fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Star size={11} color="var(--fr8x-outline)" /> FR8X TRUST SCORE
              </small>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--fr8x-text)', marginTop: '2px' }}>
                98<span style={{ fontSize: '13px', color: 'var(--fr8x-muted)', fontWeight: 500 }}>/100</span>
              </div>
              <small style={{ fontSize: '9.5px', color: 'var(--fr8x-muted)', fontWeight: 700 }}>Tier-1 Accredited</small>
            </div>

            <div style={{ minWidth: '190px', background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--fr8x-outline)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fr8x-text)' }}>Profile Completeness</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--fr8x-text)' }}>{completeness}%</span>
              </div>
              <div className="progress" style={{ background: 'var(--fr8x-input)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completeness}%`, background: 'var(--fr8x-outline)', height: '100%' }} />
              </div>
              <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--fr8x-muted)', marginTop: '4px' }}>
                {completeness === 100 ? 'All credentials & logos verified' : 'Upload photos & details to reach 100%'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* 3 DEDICATED, COMPREHENSIVE SECTIONS: CARDS IN ROWS (EXPERIENCE, EDUCATION, CERTIFICATIONS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* SECTION 1: Professional Work Experience */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '0px', border: '1px solid var(--fr8x-outline)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--fr8x-outline)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} color="var(--fr8x-text)" />
              </div>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>1. Professional Work Experience</b>
                <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block' }}>
                  Forwarding career milestones, freight volume managed, and liner contract leadership.
                </span>
              </div>
            </div>
            <button className="btn primary sm" style={{ borderRadius: '0px' }} onClick={() => handleOpenExpModal()}>
              <Plus size={13} /> Add Experience
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {experiences.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fr8x-muted)', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', gridColumn: '1 / -1' }}>
                No experience records added yet. Click &quot;+ Add Experience&quot; to showcase your career.
              </div>
            ) : (
              experiences.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '0px',
                    border: '1px solid var(--fr8x-outline)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <b style={{ fontSize: '14px', color: 'var(--fr8x-text)' }}>{exp.designation}</b>
                        <div style={{ fontSize: '12px', color: 'var(--fr8x-text)', fontWeight: 600, marginTop: '2px' }}>
                          {exp.company} · <span style={{ color: 'var(--fr8x-muted)' }}>{exp.location}</span>
                        </div>
                      </div>
                      <span className="badge" style={{ fontSize: '9.5px', background: '#f1f5f9', color: 'var(--fr8x-text)', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }}>
                        {exp.employmentType}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </div>

                    <p style={{ margin: '10px 0 8px', fontSize: '12px', color: 'var(--fr8x-text)', lineHeight: 1.5 }}>
                      {exp.description}
                    </p>
                  </div>

                  <div>
                    {exp.skills && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '8px 0' }}>
                        {exp.skills.split(',').map((s, idx) => (
                          <span key={idx} style={{ fontSize: '10px', background: '#f8fafc', padding: '2px 6px', border: '1px solid var(--fr8x-outline)', color: 'var(--fr8x-text)' }}>
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line-light)' }}>
                      <button className="btn secondary sm" style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }} onClick={() => handleOpenExpModal(exp)}>
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        className="btn secondary sm"
                        style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px', color: '#b91c1c' }}
                        onClick={() => {
                          persistExperiences(experiences.filter((i) => i.id !== exp.id));
                          toast('Experience entry removed.');
                        }}
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: Academic & Maritime Education */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '0px', border: '1px solid var(--fr8x-outline)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--fr8x-outline)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={16} color="var(--fr8x-text)" />
              </div>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>2. Academic & Maritime Education</b>
                <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block' }}>
                  University degrees, supply chain specializations, and maritime research credentials.
                </span>
              </div>
            </div>
            <button className="btn primary sm" style={{ borderRadius: '0px' }} onClick={() => handleOpenEduModal()}>
              <Plus size={13} /> Add Education
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {educations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fr8x-muted)', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', gridColumn: '1 / -1' }}>
                No education records added yet. Click &quot;+ Add Education&quot; to add degree credentials.
              </div>
            ) : (
              educations.map((edu) => (
                <div
                  key={edu.id}
                  style={{
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '0px',
                    border: '1px solid var(--fr8x-outline)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <b style={{ fontSize: '14px', color: 'var(--fr8x-text)' }}>{edu.qualification} in {edu.fieldOfStudy}</b>
                    <div style={{ fontSize: '12px', color: 'var(--fr8x-text)', fontWeight: 600, marginTop: '2px' }}>
                      {edu.institution}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '2px' }}>
                      {edu.startYear} – {edu.endYear} {edu.grade && `· Grade: ${edu.grade}`}
                    </span>

                    {edu.description && (
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--fr8x-text)', lineHeight: 1.5 }}>
                        {edu.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line-light)', marginTop: '10px' }}>
                    <button className="btn secondary sm" style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }} onClick={() => handleOpenEduModal(edu)}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      className="btn secondary sm"
                      style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px', color: '#b91c1c' }}
                      onClick={() => {
                        persistEducations(educations.filter((i) => i.id !== edu.id));
                        toast('Education record removed.');
                      }}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: Industry Certifications & Licences */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '0px', border: '1px solid var(--fr8x-outline)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--fr8x-outline)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={16} color="var(--fr8x-text)" />
              </div>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>3. Industry Certifications & Licences</b>
                <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block' }}>
                  IATA DGR, FIATA, CSCP, and CBIC Customs Brokerage license registrations.
                </span>
              </div>
            </div>
            <button className="btn primary sm" style={{ borderRadius: '0px' }} onClick={() => handleOpenCertModal()}>
              <Plus size={13} /> Add Certification
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {certifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fr8x-muted)', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', gridColumn: '1 / -1' }}>
                No certifications added yet. Click &quot;+ Add Certification&quot; to add your accredited licenses.
              </div>
            ) : (
              certifications.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '0px',
                    border: '1px solid var(--fr8x-outline)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <b style={{ fontSize: '14px', color: 'var(--fr8x-text)' }}>{cert.title}</b>
                      <span className="badge" style={{ fontSize: '9px', fontWeight: 800, background: '#f1f5f9', color: 'var(--fr8x-text)', border: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
                        <CheckCircle2 size={10} /> VERIFIED
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--fr8x-text)', fontWeight: 600, marginTop: '2px' }}>
                      {cert.issuingAuthority}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '3px' }}>
                      License ID: <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--fr8x-text)' }}>{cert.certificateNumber}</b>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '1px' }}>
                      Issued: {cert.issueDate} {cert.expiryDate ? `· Exp: ${cert.expiryDate}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line-light)', marginTop: '10px' }}>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn secondary sm"
                        style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }}
                        title="Verify credential online"
                      >
                        <ExternalLink size={11} /> Verify
                      </a>
                    )}
                    <button className="btn secondary sm" style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }} onClick={() => handleOpenCertModal(cert)}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      className="btn secondary sm"
                      style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px', color: '#b91c1c' }}
                      onClick={() => {
                        persistCertifications(certifications.filter((i) => i.id !== cert.id));
                        toast('Certification credential removed.');
                      }}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Corporate KYC & Regulatory Filings Section — Address & Multi-Jurisdiction Aware */}
      {(() => {
        const activeProfile = getStatutoryProfile(kycCountry || country || 'India');
        const complianceEval = evaluateCompliance(kycCountry || country, {
          taxId,
          corporateReg,
          tradeCustomsCode: tradeCustoms,
          logisticsLicense,
          gstn,
          pan,
          iec,
          mto,
        });

        return (
          <div className="card" style={{ padding: '20px 24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line-light)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <b style={{ fontSize: '16px', color: 'var(--ink)' }}>4. Corporate KYC & Statutory Trade Filings</b>
                  <span className="badge blue" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>{activeProfile.flag}</span>
                    <span>{activeProfile.countryName} Jurisdiction</span>
                  </span>
                  {city && (
                    <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
                      · {city}, {country || activeProfile.countryName}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--mut)', display: 'block', marginTop: '2px' }}>
                  Statutory government identifiers validated with {activeProfile.regulatoryAuthorities}.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {complianceEval.isCompliant ? (
                  <span className="badge green"><ShieldCheck size={11} /> {complianceEval.statusLabel}</span>
                ) : (
                  <span className="badge amber"><ShieldCheck size={11} /> {complianceEval.statusLabel}</span>
                )}
                <button className="btn primary sm" onClick={() => setShowKycModal(true)}>
                  <Edit2 size={12} /> Edit / Update KYC
                </button>
              </div>
            </div>

            <div className="grid g2" style={{ gap: '12px' }}>
              {/* 1. Primary Tax ID */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>{activeProfile.primaryTaxId.label}</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {(taxId || (activeProfile.countryCode === 'IN' ? gstn : '')) ? (
                    <>{taxId || gstn} <span className="badge green" style={{ fontSize: '9px' }}>ACTIVE</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not registered</span>
                  )}
                </b>
              </div>

              {/* 2. Corporate Reg */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>{activeProfile.corporateReg.label}</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {(corporateReg || (activeProfile.countryCode === 'IN' ? pan : '')) ? (
                    <>{corporateReg || pan} <span className="badge green" style={{ fontSize: '9px' }}>VERIFIED</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not provided</span>
                  )}
                </b>
              </div>

              {/* 3. Trade / Customs Code */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>{activeProfile.tradeCustomsCode.label}</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {(tradeCustoms || (activeProfile.countryCode === 'IN' ? iec : '')) ? (
                    <>{tradeCustoms || iec} <span className="badge green" style={{ fontSize: '9px' }}>CUSTOMS VALID</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not registered</span>
                  )}
                </b>
              </div>

              {/* 4. Logistics / Operating License */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>{activeProfile.logisticsLicense.label}</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {(logisticsLicense || (activeProfile.countryCode === 'IN' ? mto : '')) ? (
                    <>{logisticsLicense || mto} <span className="badge green" style={{ fontSize: '9px' }}>RECOGNISED</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not registered</span>
                  )}
                </b>
              </div>

              {/* 5. IATA Cargo Numeric Code */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>IATA Cargo Numeric Code</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {iataCode ? (
                    <>{iataCode} <span className="badge blue" style={{ fontSize: '9px' }}>IATA ACCREDITED</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not assigned</span>
                  )}
                </b>
              </div>

              {/* 6. FIATA Registration */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>FIATA Registration</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {fiataReg ? (
                    <>{fiataReg} <span className="badge blue" style={{ fontSize: '9px' }}>FIATA MEMBER</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not registered</span>
                  )}
                </b>
              </div>

              {/* 7. FMC OTI License */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>FMC OTI License</span>
                <b style={{ fontFamily: 'var(--font-mono)' }}>
                  {fmcNumber ? (
                    <>{fmcNumber} <span className="badge blue" style={{ fontSize: '9px' }}>FMC BONDED</span></>
                  ) : (
                    <span style={{ color: 'var(--mut)', fontWeight: 400 }}>Not registered</span>
                  )}
                </b>
              </div>

              {/* 8. Authorized Economic Operator */}
              <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <span>Authorized Economic Operator</span>
                <b style={{ color: aeoTier && aeoTier !== 'Not Applicable' ? 'var(--brand)' : 'var(--mut)', fontWeight: aeoTier && aeoTier !== 'Not Applicable' ? 700 : 400 }}>
                  {aeoTier || 'Standard Non-AEO'}
                </b>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SECTION 5: Privacy & Contact Visibility Governance */}
      <div
        id="privacy-governance"
        className="card"
        style={{
          padding: '22px 24px',
          borderRadius: '12px',
          border: '1px solid var(--fr8x-outline)',
          background: 'var(--card)',
          boxShadow: 'var(--sh)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            borderBottom: '1px solid var(--line-light)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 163, 196, 0.1)',
                border: '1px solid rgba(0, 163, 196, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={18} color="var(--fr8x-primary, #00a3c4)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <b style={{ fontSize: '16px', color: 'var(--fr8x-text)' }}>5. Privacy & Contact Visibility Governance</b>
                <span className="badge green" style={{ fontSize: '10px' }}>
                  <ShieldCheck size={11} /> ZERO-TRUST PRIVACY
                </span>
                <span className="badge blue" style={{ fontSize: '10px' }}>
                  <Users size={11} /> CONSENT-DRIVEN
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '2px' }}>
                Determine exactly what the general public can see on your passport before you accept their connection request.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn primary"
              onClick={handleSavePrivacySettings}
              disabled={isSavingPrivacy}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isSavingPrivacy ? (
                <>
                  <Loader2 size={13} className="spin" /> Saving Privacy...
                </>
              ) : (
                <>
                  <Save size={13} /> Save Privacy Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Grid: Left Controls, Right Live Simulator */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Setting 1: Direct Work Email */}
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--line-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                    <Mail size={14} color="#0284c7" /> Direct Corporate Email
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '2px' }}>
                    Controls whether non-connected platform members can view your full email address.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                {[
                  { value: 'contacts_only' as const, label: 'Contacts Only', desc: 'Masked until connected (Recommended)' },
                  { value: 'public' as const, label: 'Public', desc: 'Visible to all members' },
                  { value: 'private' as const, label: 'Private', desc: 'Always hidden' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdatePrivacy('emailVisibility', opt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: privacySettings.emailVisibility === opt.value ? '2px solid #00a3c4' : '1px solid var(--fr8x-outline)',
                      background: privacySettings.emailVisibility === opt.value ? 'rgba(0, 163, 196, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: privacySettings.emailVisibility === opt.value ? '#007a93' : 'var(--fr8x-text)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--fr8x-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Setting 2: Mobile / WhatsApp Phone */}
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--line-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                    <Phone size={14} color="#16a34a" /> Direct Mobile & WhatsApp
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '2px' }}>
                    Safeguards your direct line from spam until mutual trade consent is established.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                {[
                  { value: 'contacts_only' as const, label: 'Contacts Only', desc: 'Masked until accepted (Recommended)' },
                  { value: 'public' as const, label: 'Public', desc: 'Visible to all members' },
                  { value: 'private' as const, label: 'Private', desc: 'Always hidden' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdatePrivacy('phoneVisibility', opt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: privacySettings.phoneVisibility === opt.value ? '2px solid #00a3c4' : '1px solid var(--fr8x-outline)',
                      background: privacySettings.phoneVisibility === opt.value ? 'rgba(0, 163, 196, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: privacySettings.phoneVisibility === opt.value ? '#007a93' : 'var(--fr8x-text)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--fr8x-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Setting 3: Statutory Tax & Regulatory IDs */}
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--line-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                    <ShieldCheck size={14} color="#7c3aed" /> Statutory Tax & License Filings (GSTIN, PAN, IEC, MTO)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '2px' }}>
                    Protects corporate tax registration certificates and trade registry credentials.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                {[
                  { value: 'contacts_only' as const, label: 'Contacts Only', desc: 'Connect to view (Recommended)' },
                  { value: 'public' as const, label: 'Public', desc: 'Open verification' },
                  { value: 'private' as const, label: 'Private', desc: 'Only on active contracts' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdatePrivacy('statutoryVisibility', opt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: privacySettings.statutoryVisibility === opt.value ? '2px solid #00a3c4' : '1px solid var(--fr8x-outline)',
                      background: privacySettings.statutoryVisibility === opt.value ? 'rgba(0, 163, 196, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: privacySettings.statutoryVisibility === opt.value ? '#007a93' : 'var(--fr8x-text)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--fr8x-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Setting 4: Trade Lanes & Corridors */}
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--line-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                    <Compass size={14} color="#d97706" /> Preferred Trade Lanes & Port Corridors
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '2px' }}>
                    Manage visibility of your operating sectors (e.g. Nhava Sheva to Jebel Ali, Rotterdam).
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                {[
                  { value: 'public' as const, label: 'Public', desc: 'Attract relevant trade inquiries' },
                  { value: 'contacts_only' as const, label: 'Contacts Only', desc: 'Visible to approved partners' },
                  { value: 'private' as const, label: 'Private', desc: 'Hidden completely' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdatePrivacy('tradeLanesVisibility', opt.value)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: privacySettings.tradeLanesVisibility === opt.value ? '2px solid #00a3c4' : '1px solid var(--fr8x-outline)',
                      background: privacySettings.tradeLanesVisibility === opt.value ? 'rgba(0, 163, 196, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: privacySettings.tradeLanesVisibility === opt.value ? '#007a93' : 'var(--fr8x-text)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '9.5px', color: 'var(--fr8x-muted)', marginTop: '2px', lineHeight: 1.2 }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Operating Corridors Content & Edit */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--line-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="preferred-trade-lanes-input" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                    Operating Trade Corridors:
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--fr8x-muted)' }}>Visible according to visibility setting above</span>
                </div>
                <input
                  id="preferred-trade-lanes-input"
                  type="text"
                  value={operatingCorridors}
                  onChange={(e) => setOperatingCorridors(e.target.value)}
                  placeholder="e.g. Nhava Sheva ⇄ Jebel Ali, Rotterdam"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--fr8x-outline)',
                    background: '#ffffff',
                    color: 'var(--fr8x-text)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Setting 5: Connection Requests Inbound */}
            <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#f8fafc', border: '1px solid var(--line-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                    <UserCheck size={14} color="#0284c7" /> Inbound Contact Connection Requests
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '2px' }}>
                    Allow verified enterprise freight forwarders and shippers to send you connection invitations.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowConnectionRequests}
                    onChange={(e) => handleUpdatePrivacy('allowConnectionRequests', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#00a3c4', cursor: 'pointer' }}
                  />
                  <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: privacySettings.allowConnectionRequests ? '#00a3c4' : 'var(--fr8x-muted)' }}>
                    {privacySettings.allowConnectionRequests ? 'Allowed' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            {/* Dedicated Save Privacy Settings button inside the left controls column (Addresses Issue 7 / Image 5) */}
            <div style={{ paddingTop: '6px' }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleSavePrivacySettings}
                disabled={isSavingPrivacy}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: 'var(--fr8x-primary, #00a3c4)',
                  boxShadow: '0 2px 6px rgba(0, 163, 196, 0.25)',
                  cursor: 'pointer'
                }}
              >
                {isSavingPrivacy ? (
                  <>
                    <Loader2 size={15} className="spin" /> Saving Privacy Settings...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Save Privacy Settings
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Privacy Simulator */}
          <div
            style={{
              padding: '16px 18px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1.5px solid var(--fr8x-outline)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <b style={{ fontSize: '13.5px', color: 'var(--fr8x-text)' }}>Live Privacy Simulation Preview</b>
                <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
                  Toggle to see how other users experience your profile before vs after connecting.
                </div>
              </div>

              {/* Toggle: Public vs Contact */}
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', border: '1px solid var(--line-light)' }}>
                <button
                  type="button"
                  onClick={() => setPrivacyPreviewMode('public')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: privacyPreviewMode === 'public' ? '#00a3c4' : 'transparent',
                    color: privacyPreviewMode === 'public' ? '#ffffff' : 'var(--fr8x-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Globe2 size={12} /> Public Visitor
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacyPreviewMode('contact')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: privacyPreviewMode === 'contact' ? '#00a3c4' : 'transparent',
                    color: privacyPreviewMode === 'contact' ? '#ffffff' : 'var(--fr8x-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Users size={12} /> Accepted Contact
                </button>
              </div>
            </div>

            {/* Privacy Simulator Notice Banner */}
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: privacyPreviewMode === 'public' ? 'rgba(0, 163, 196, 0.08)' : 'rgba(22, 163, 74, 0.08)',
                border: `1px solid ${privacyPreviewMode === 'public' ? 'rgba(0, 163, 196, 0.25)' : 'rgba(22, 163, 74, 0.25)'}`,
                fontSize: '11px',
                color: privacyPreviewMode === 'public' ? '#007a93' : '#15803d',
                lineHeight: 1.4,
              }}
            >
              {privacyPreviewMode === 'public' ? (
                <>
                  <b>Viewing as General Public (Unconnected):</b> Non-contacts only see your public identity and masked credentials. Sensitive statutory and direct phone/email data is masked until you approve their connection request.
                </>
              ) : (
                <>
                  <b>Viewing as Accepted Contact:</b> Connected members enjoy direct communication access, verified phone and email, and unmasked corporate statutory registrations.
                </>
              )}
            </div>

            {/* Passport Preview Simulation Card */}
            <div
              style={{
                border: '1px solid var(--fr8x-outline)',
                borderRadius: '8px',
                padding: '14px',
                background: '#fafbfc',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Header inside preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#00a3c4',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
                    {user.displayName || `${firstName} ${lastName}`}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
                    {designation || user.designation} at <b>{company || user.company}</b>
                  </div>
                </div>
              </div>

              {/* Data Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {/* Email Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', padding: '6px 8px', background: '#fff', borderRadius: '4px', border: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--fr8x-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> Work Email:
                  </span>
                  <div>
                    {privacyPreviewMode === 'contact' ? (
                      <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>{user.email || 'user@company.com'}</span>
                    ) : privacySettings.emailVisibility === 'public' ? (
                      <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>{user.email || 'user@company.com'}</span>
                    ) : privacySettings.emailVisibility === 'contacts_only' ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fr8x-muted)', fontSize: '11px' }}>
                        {maskEmail(user.email || 'user@company.com')}{' '}
                        <span className="badge amber" style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                          <Lock size={8} /> Connect to view
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--fr8x-muted)', fontStyle: 'italic' }}>Private / Hidden</span>
                    )}
                  </div>
                </div>

                {/* Phone Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', padding: '6px 8px', background: '#fff', borderRadius: '4px', border: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--fr8x-muted)', display: 'center', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> Mobile / WhatsApp:
                  </span>
                  <div>
                    {privacyPreviewMode === 'contact' ? (
                      <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>{mobile || user.mobile || '+91 98200 12345'}</span>
                    ) : privacySettings.phoneVisibility === 'public' ? (
                      <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>{mobile || user.mobile || '+91 98200 12345'}</span>
                    ) : privacySettings.phoneVisibility === 'contacts_only' ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fr8x-muted)', fontSize: '11px' }}>
                        {maskPhone(mobile || user.mobile || '+91 98200 12345')}{' '}
                        <span className="badge amber" style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                          <Lock size={8} /> Connect to view
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--fr8x-muted)', fontStyle: 'italic' }}>Private / Hidden</span>
                    )}
                  </div>
                </div>

                {/* Statutory Filing Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', padding: '6px 8px', background: '#fff', borderRadius: '4px', border: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--fr8x-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Statutory Tax / Reg:
                  </span>
                  <div>
                    {privacyPreviewMode === 'contact' ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--fr8x-text)' }}>
                        {taxId || gstn || '27AABCR1234F1Z5'}
                      </span>
                    ) : privacySettings.statutoryVisibility === 'public' ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--fr8x-text)' }}>
                        {taxId || gstn || '27AABCR1234F1Z5'}
                      </span>
                    ) : privacySettings.statutoryVisibility === 'contacts_only' ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fr8x-muted)', fontSize: '11px' }}>
                        {maskStatutory(taxId || gstn || '27AABCR1234F1Z5')}{' '}
                        <span className="badge amber" style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                          <Lock size={8} /> Connect to view
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--fr8x-muted)', fontStyle: 'italic' }}>Private / Hidden</span>
                    )}
                  </div>
                </div>

                {/* Trade Lanes Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', padding: '6px 8px', background: '#fff', borderRadius: '4px', border: '1px solid var(--line-light)' }}>
                  <span style={{ color: 'var(--fr8x-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={12} /> Operating Corridors:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {privacyPreviewMode === 'contact' || privacySettings.tradeLanesVisibility === 'public' ? (
                      <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>
                        {operatingCorridors || 'Nhava Sheva ⇄ Jebel Ali, Rotterdam'}
                      </span>
                    ) : privacySettings.tradeLanesVisibility === 'contacts_only' ? (
                      <span style={{ color: 'var(--fr8x-muted)', fontSize: '11px' }}>
                        •••••••••••• (Connect to unlock)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--fr8x-muted)', fontStyle: 'italic' }}>Private / Hidden</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('preferred-trade-lanes-input');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.focus();
                        }
                      }}
                      title="Edit Operating Corridors in Settings"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--fr8x-outline)',
                        background: '#f1f5f9',
                        color: '#00a3c4',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={10} /> Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Simulation in Preview */}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--line-light)', display: 'flex', justifyContent: 'flex-end' }}>
                {privacyPreviewMode === 'public' ? (
                  <button type="button" className="btn primary sm" style={{ pointerEvents: 'none', opacity: 0.9 }}>
                    <UserCheck size={12} /> Connect / Add Contact
                  </button>
                ) : (
                  <button type="button" className="btn secondary sm" style={{ pointerEvents: 'none', opacity: 0.9 }}>
                    <Mail size={12} /> Direct Trade Message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Edit Modal — Address & Multi-Jurisdiction Adaptive */}
      {showKycModal && (() => {
        const activeProfile = getStatutoryProfile(kycCountry || country || 'India');
        return (
          <Modal
            isOpen={showKycModal}
            onClose={() => setShowKycModal(false)}
            title="Edit Corporate KYC & Statutory Trade Filings"
            maxWidth="720px"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!termsAccepted) {
                  toast('You must accept the Terms & Non-Repudiation Policy to verify KYC.');
                  return;
                }
                const canonicalAssoc = normalizeAssociationName(associationName);
                const now = new Date().toISOString();

                const isIndia = activeProfile.countryCode === 'IN';
                const finalGstn = isIndia ? (taxId || gstn).trim() : (gstn || '');
                const finalPan = isIndia ? (corporateReg || pan).trim() : (pan || '');
                const finalIec = isIndia ? (tradeCustoms || iec).trim() : (iec || '');
                const finalMto = isIndia ? (logisticsLicense || mto).trim() : (mto || '');

                const dossier: KYCDossier = {
                  userId: user.uid,
                  companyId: user.company,
                  legalEntityName: user.company,
                  kycCountry,
                  taxId: taxId.trim(),
                  taxIdLabel: activeProfile.primaryTaxId.label,
                  corporateRegNumber: corporateReg.trim(),
                  corporateRegLabel: activeProfile.corporateReg.label,
                  tradeCustomsCode: tradeCustoms.trim(),
                  tradeCustomsLabel: activeProfile.tradeCustomsCode.label,
                  logisticsLicenseNumber: logisticsLicense.trim(),
                  logisticsLicenseLabel: activeProfile.logisticsLicense.label,
                  statutoryCountry: kycCountry,
                  gstin: finalGstn,
                  pan: finalPan,
                  iec: finalIec,
                  mto: finalMto,
                  registeredAddress: {
                    addressLine1: formattedAddress || 'Logistics Hub',
                    city: city || 'Mumbai',
                    state: stateName || 'State',
                    postalCode: user.postalCode || '400093',
                    country: kycCountry || country || 'India',
                  },
                  memberships: [
                    {
                      id: `assoc_${canonicalAssoc}_${Date.now()}`,
                      association: canonicalAssoc,
                      canonicalName: canonicalAssoc,
                      membershipNumber: associationId.trim().toUpperCase(),
                      validTill: '2027-12-31',
                      verified: true,
                    },
                  ],
                  status: 'verified',
                  missingItemsChecklist: [],
                  statusHistory: [
                    {
                      status: 'verified',
                      timestamp: now,
                      reviewerUid: 'system',
                      reviewerName: 'FR8X Multi-Jurisdiction Automated Verifier',
                      notes: `Self-declaration certified under ${activeProfile.nonRepudiationStatute} with non-repudiation audit trail.`,
                    },
                  ],
                  termsAccepted: true,
                  termsAcceptedAt: now,
                  termsVersion: 'v2.4-2026',
                  submittedAt: now,
                  verifiedAt: now,
                  updatedAt: now,
                };

                try {
                  await upsertKYCDossierInDB(dossier);
                } catch {}

                updateUser({
                  kycCountry,
                  taxId: taxId.trim(),
                  taxIdLabel: activeProfile.primaryTaxId.label,
                  corporateRegNumber: corporateReg.trim(),
                  corporateRegLabel: activeProfile.corporateReg.label,
                  tradeCustomsCode: tradeCustoms.trim(),
                  tradeCustomsLabel: activeProfile.tradeCustomsCode.label,
                  logisticsLicenseNumber: logisticsLicense.trim(),
                  logisticsLicenseLabel: activeProfile.logisticsLicense.label,
                  gstn: finalGstn,
                  pan: finalPan,
                  iec: finalIec,
                  mto: finalMto,
                  iataCode,
                  fiataReg,
                  fmcNumber,
                  aeoTier,
                  associationName,
                  associationId,
                });
                setShowKycModal(false);
                toast(`Corporate KYC & Statutory filings for ${activeProfile.countryName} saved to ledger.`);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Top Anchor: Company Registered Address & Statutory Jurisdiction */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      Registered Company & Statutory Address
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                      {user.company || 'Enterprise Entity'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '1px' }}>
                      {formattedAddress || (city ? `${city}, ${stateName || ''} ${country || ''}` : 'Address based on corporate profile')}
                    </div>
                  </div>

                  {/* Country Jurisdiction Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)' }}>
                      Statutory Tax & Regulatory Domicile:
                    </label>
                    <select
                      className="input sm"
                      style={{ fontSize: '12px', fontWeight: 600, minWidth: '220px' }}
                      value={kycCountry}
                      onChange={(e) => {
                        const newCountry = e.target.value;
                        setKycCountry(newCountry);
                        const newProfile = getStatutoryProfile(newCountry);
                        if (newProfile.countryCode === 'IN' && !taxId && gstn) {
                          setTaxId(gstn);
                        }
                      }}
                    >
                      <option value="India">🇮🇳 India (GSTN / PAN / DGFT IEC / MTO)</option>
                      <option value="United States">🇺🇸 United States (Federal EIN / State Corp / CBP / FMC)</option>
                      <option value="United Arab Emirates">🇦🇪 United Arab Emirates (UAE TRN / Commercial License / Customs)</option>
                      <option value="United Kingdom">🇬🇧 United Kingdom (HMRC VAT / Companies House CRN / UK EORI)</option>
                      <option value="Singapore">🇸🇬 Singapore (ACRA UEN / TradeNet / SLA)</option>
                      <option value="European Union">🇪🇺 European Union (EU VAT / Handelsregister-KvK / EU EORI)</option>
                      <option value="China">🇨🇳 China (Unified Social Credit Code / Customs CR / MOT)</option>
                      <option value="Hong Kong SAR">🇭🇰 Hong Kong SAR (Business Reg BRN / CR No. / HAFFA)</option>
                      <option value="Australia">🇦🇺 Australia (Australian Business Number ABN / ACN / CCID)</option>
                      <option value="Canada">🇨🇦 Canada (CRA Business Number / Corp Reg / CBSA)</option>
                      <option value="Global International Entity">🌐 Other / Global International Entity (National Tax ID / CRN)</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={12} />
                  <span>Identifiers validated with <b>{activeProfile.regulatoryAuthorities}</b></span>
                </div>
              </div>

              {/* Dynamic Row 1: Primary Tax ID & Corporate Registration */}
              <div className="grid g2">
                <div className="field">
                  <label>
                    {activeProfile.primaryTaxId.label}{' '}
                    {activeProfile.primaryTaxId.required && <span className="req">*</span>}
                  </label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: activeProfile.primaryTaxId.uppercase ? 'uppercase' : 'none' }}
                    value={taxId}
                    onChange={(e) => {
                      const val = activeProfile.primaryTaxId.uppercase ? e.target.value.toUpperCase() : e.target.value;
                      setTaxId(val);
                      if (activeProfile.countryCode === 'IN') {
                        setGstn(val);
                        if (val.length >= 12 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]/.test(val)) {
                          const extractedPan = val.substring(2, 12);
                          setCorporateReg(extractedPan);
                          setPan(extractedPan);
                        }
                      }
                    }}
                    placeholder={activeProfile.primaryTaxId.placeholder}
                    required={activeProfile.primaryTaxId.required}
                  />
                  {activeProfile.primaryTaxId.formatHelp && (
                    <small style={{ fontSize: '10px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                      {activeProfile.primaryTaxId.formatHelp}
                    </small>
                  )}
                </div>

                <div className="field">
                  <label>
                    {activeProfile.corporateReg.label}{' '}
                    {activeProfile.corporateReg.required && <span className="req">*</span>}
                  </label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: activeProfile.corporateReg.uppercase ? 'uppercase' : 'none' }}
                    value={corporateReg}
                    onChange={(e) => {
                      const val = activeProfile.corporateReg.uppercase ? e.target.value.toUpperCase() : e.target.value;
                      setCorporateReg(val);
                      if (activeProfile.countryCode === 'IN') {
                        setPan(val);
                      }
                    }}
                    placeholder={activeProfile.corporateReg.placeholder}
                    required={activeProfile.corporateReg.required}
                  />
                  {activeProfile.corporateReg.formatHelp && (
                    <small style={{ fontSize: '10px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                      {activeProfile.corporateReg.formatHelp}
                    </small>
                  )}
                </div>
              </div>

              {/* Dynamic Row 2: Customs / Trade Identifier & Logistics License */}
              <div className="grid g2">
                <div className="field">
                  <label>
                    {activeProfile.tradeCustomsCode.label}{' '}
                    {activeProfile.tradeCustomsCode.required && <span className="req">*</span>}
                  </label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: activeProfile.tradeCustomsCode.uppercase ? 'uppercase' : 'none' }}
                    value={tradeCustoms}
                    onChange={(e) => {
                      const val = activeProfile.tradeCustomsCode.uppercase ? e.target.value.toUpperCase() : e.target.value;
                      setTradeCustoms(val);
                      if (activeProfile.countryCode === 'IN') {
                        setIec(val);
                      }
                    }}
                    placeholder={activeProfile.tradeCustomsCode.placeholder}
                    required={activeProfile.tradeCustomsCode.required}
                  />
                  {activeProfile.tradeCustomsCode.formatHelp && (
                    <small style={{ fontSize: '10px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                      {activeProfile.tradeCustomsCode.formatHelp}
                    </small>
                  )}
                </div>

                <div className="field">
                  <label>
                    {activeProfile.logisticsLicense.label}{' '}
                    {activeProfile.logisticsLicense.required && <span className="req">*</span>}
                  </label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: activeProfile.logisticsLicense.uppercase ? 'uppercase' : 'none' }}
                    value={logisticsLicense}
                    onChange={(e) => {
                      const val = activeProfile.logisticsLicense.uppercase ? e.target.value.toUpperCase() : e.target.value;
                      setLogisticsLicense(val);
                      if (activeProfile.countryCode === 'IN') {
                        setMto(val);
                      }
                    }}
                    placeholder={activeProfile.logisticsLicense.placeholder}
                    required={activeProfile.logisticsLicense.required}
                  />
                  {activeProfile.logisticsLicense.formatHelp && (
                    <small style={{ fontSize: '10px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                      {activeProfile.logisticsLicense.formatHelp}
                    </small>
                  )}
                </div>
              </div>

              {/* Row 3: Freight Forwarder Association Network */}
              <div className="grid g2">
                <div className="field">
                  <label>Freight Forwarder Association Network</label>
                  <input
                    className="input"
                    style={{ textTransform: 'uppercase' }}
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value.toUpperCase())}
                    placeholder="E.G. WCA, FIATA, IATA, JCTRANS, AMTOI..."
                  />
                  <small style={{ fontSize: '10.5px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                    Canonical Association: <b style={{ color: 'var(--brand)' }}>{normalizeAssociationName(associationName)}</b>
                  </small>
                </div>
                <div className="field">
                  <label>Association Membership ID</label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    value={associationId}
                    onChange={(e) => setAssociationId(e.target.value.toUpperCase())}
                    placeholder="E.G. WCA-98124 / JCTRANS-4412"
                  />
                </div>
              </div>

              {/* Row 4: Universal Global Accreditations (IATA & FIATA) */}
              <div className="grid g2">
                <div className="field">
                  <label>IATA Cargo Agent Code</label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    value={iataCode}
                    onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                    placeholder="14-3-8821"
                  />
                </div>
                <div className="field">
                  <label>FIATA Registration Number</label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    value={fiataReg}
                    onChange={(e) => setFiataReg(e.target.value.toUpperCase())}
                    placeholder="FIATA-INT-2026-918"
                  />
                </div>
              </div>

              {/* Row 5: Universal Maritime & Security (FMC & AEO) */}
              <div className="grid g2">
                <div className="field">
                  <label>US Federal Maritime Commission (FMC / OTI)</label>
                  <input
                    className="input"
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    value={fmcNumber}
                    onChange={(e) => setFmcNumber(e.target.value.toUpperCase())}
                    placeholder="FMC-OTI-024881"
                  />
                </div>
                <div className="field">
                  <label>Authorized Economic Operator (AEO / Security Tier)</label>
                  <select className="input" value={aeoTier} onChange={(e) => setAeoTier(e.target.value)}>
                    <option value="AEO-T1 Certified">AEO-T1 Certified (Customs)</option>
                    <option value="AEO-T2 Certified">AEO-T2 Certified (Customs)</option>
                    <option value="AEO-T3 Tier-3 Secure">AEO-T3 Tier-3 High Security</option>
                    <option value="AEO-LO Logistics Operator">AEO-LO Logistics Operator</option>
                    <option value="C-TPAT Validated (USA)">C-TPAT Validated (USA)</option>
                    <option value="STP-Plus Secure (Singapore)">STP-Plus Secure (Singapore)</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Non-Repudiation Terms Consent Checkbox */}
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line-light)' }}>
                <label className="check" style={{ fontSize: '11px', display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                  />
                  <span>
                    I legally certify that all <b>{activeProfile.primaryTaxId.shortLabel}</b>, <b>{activeProfile.corporateReg.shortLabel}</b>, and trade registrations are authentic and belong to <b>{user.company || 'our legal entity'}</b> in <b>{activeProfile.countryName}</b>. I accept the <b>FR8X Enterprise Non-Repudiation Code</b> under <i>{activeProfile.nonRepudiationStatute}</i> and Terms of Service (v2.4-2026).
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" className="btn secondary" onClick={() => setShowKycModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  <Check size={13} /> Save Statutory KYC ({activeProfile.countryCode})
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* MODAL: EDIT IDENTITY, PHOTO, LOGO, USER NAME, EMAIL & COMPANY LINK (User Requirements 9 & 10) */}
      {showEditIdentityModal && (
        <Modal
          isOpen={showEditIdentityModal}
          onClose={() => setShowEditIdentityModal(false)}
          title="Edit Member Identity, Credentials & Corporate Link"
          maxWidth="680px"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();

              let newCompanyTransferStatus = user.companyTransferStatus || 'none';
              let newPendingCompany = user.pendingCompany;
              let newPendingEmail = user.pendingEmail;
              let newTransferRequestId = user.transferRequestId;
              let finalCompany = user.company;
              let finalEmail = editEmail;

              if (isChangingCompany && transferTargetCompany.trim()) {
                if (transferMethod === 'self') {
                  finalCompany = transferTargetCompany.trim();
                  finalEmail = transferTargetEmail.trim() || editEmail;
                  newCompanyTransferStatus = 'verified';
                  setCompany(finalCompany);
                  toast(`✓ Company transferred to ${finalCompany} and login email updated via Domain Self-Link.`);
                } else {
                  const ticket = `TRF-CO-${Math.floor(1000 + Math.random() * 9000)}`;
                  newCompanyTransferStatus = 'pending_godfather_approval';
                  newPendingCompany = transferTargetCompany.trim();
                  newPendingEmail = transferTargetEmail.trim() || editEmail;
                  newTransferRequestId = ticket;
                  toast(`Corporate transfer docket ${ticket} submitted for Godfather Governance review.`);
                }
              }

              // Update local state
              setFirstName(editFirstName);
              setLastName(editLastName);
              setMobile(editMobile);
              setDesignation(editDesignation);
              setCity(editCity);
              setStateName(editState);
              setCountry(editCountry);
              setFormattedAddress(editFormattedAddress);
              setTimezone(editTimezone);
              setAvatarUrl(editAvatarUrl || null);
              setCompanyLogoUrl(editCompanyLogoUrl || null);

              updateUser({
                firstName: editFirstName,
                lastName: editLastName,
                displayName: `${editFirstName} ${editLastName}`.trim(),
                email: finalEmail,
                mobile: editMobile,
                designation: editDesignation,
                company: finalCompany,
                city: editCity,
                state: editState,
                country: editCountry,
                formattedAddress: editFormattedAddress,
                timezone: editTimezone,
                avatarUrl: editAvatarUrl || '',
                companyLogoUrl: editCompanyLogoUrl || '',
                companyTransferStatus: newCompanyTransferStatus as any,
                pendingCompany: newPendingCompany,
                pendingEmail: newPendingEmail,
                transferRequestId: newTransferRequestId,
                transferSubmittedAt: isChangingCompany ? new Date().toISOString() : user.transferSubmittedAt,
              });

              setShowEditIdentityModal(false);
              toast('Enterprise identity and location updated successfully.');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* 1. Visual Identity & Brand Assets (Profile Picture + Company Logo) */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                1. Visual Identity & Brand Assets
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Profile Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>User Profile Photo</span>
                  <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand)' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#475569' }}>
                        {editFirstName[0] || 'U'}{editLastName[0] || ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <label className="btn secondary sm" style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}>
                      <Camera size={12} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onload = (ev) => setEditAvatarUrl(ev.target?.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    {editAvatarUrl && (
                      <button type="button" className="btn secondary sm" style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }} onClick={() => setEditAvatarUrl(null)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Company Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Company Corporate Logo</span>
                  <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editCompanyLogoUrl ? (
                      <img src={editCompanyLogoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--brand)', padding: '2px', background: '#fff' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#f1f5f9', border: '1px dashed var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--mut)' }}>
                        <Building2 size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <label className="btn secondary sm" style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}>
                      <Upload size={12} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onload = (ev) => setEditCompanyLogoUrl(ev.target?.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    {editCompanyLogoUrl && (
                      <button type="button" className="btn secondary sm" style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }} onClick={() => setEditCompanyLogoUrl(null)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. User Name & Contact Credentials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. User Name & Contact Credentials
              </span>
              <div className="grid g2">
                <div className="field">
                  <label>First Name <span className="req">*</span></label>
                  <input className="input" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Last Name <span className="req">*</span></label>
                  <input className="input" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid g2">
                <div className="field">
                  <label>Login Email ID (Primary Auth) <span className="req">*</span></label>
                  <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Mobile Number (with Country Code) <span className="req">*</span></label>
                  <input className="input" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} placeholder="+91 98200 12345" required />
                </div>
              </div>

              <div className="field">
                <label>Job Designation / Role</label>
                <input className="input" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="Senior Freight Procurement Manager" />
              </div>
            </div>

            {/* 3. Enterprise Geographic Location & Operating Hub */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  3. Enterprise Operating Hub & Geographic Location
                </span>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={isDetectingLocation}
                  className="btn secondary sm"
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    border: '1px solid #0284c7',
                    color: '#0284c7',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: isDetectingLocation ? 'wait' : 'pointer',
                  }}
                  title="Detect GPS coordinates & reverse geocode terminal address"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 size={13} className="spin" />
                      <span>Detecting Device Location…</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={13} color="#0284c7" />
                      <span>Auto-Detect Device Location</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid g2">
                <div className="field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Country / Territory <span className="req">*</span></span>
                    {editCountryIso && (
                      <span style={{ fontSize: '10px', color: 'var(--mut)', fontWeight: 600 }}>ISO: {editCountryIso}</span>
                    )}
                  </label>
                  <SearchableDropdown
                    options={countryOptions}
                    value={editCountry}
                    onChange={(val) => {
                      setEditCountry(val);
                      setEditState('');
                      setEditCity('');
                    }}
                    placeholder="Search or select country…"
                    searchPlaceholder="Type country name or code…"
                    allowCustom={true}
                    triggerHeight="36px"
                    maxHeight={220}
                  />
                </div>
                <div className="field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>State / Province / Region</span>
                    {stateOptions.length > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--mut)' }}>{stateOptions.length} regions</span>
                    )}
                  </label>
                  <SearchableDropdown
                    options={stateOptions}
                    value={editState}
                    onChange={(val) => {
                      setEditState(val);
                      setEditCity('');
                    }}
                    placeholder="Search or select state/province…"
                    searchPlaceholder="Type state or province name…"
                    allowCustom={true}
                    triggerHeight="36px"
                    maxHeight={220}
                  />
                </div>
              </div>

              <div className="grid g2">
                <div className="field">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>City / Maritime Hub</span>
                    {cityOptions.length > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--mut)' }}>{cityOptions.length} cities</span>
                    )}
                  </label>
                  <SearchableDropdown
                    options={cityOptions}
                    value={editCity}
                    onChange={(val) => setEditCity(val)}
                    placeholder="Search or select city/maritime hub…"
                    searchPlaceholder="Type city or port name…"
                    allowCustom={true}
                    triggerHeight="36px"
                    maxHeight={220}
                  />
                </div>
                <div className="field">
                  <label>Operational Timezone</label>
                  <SearchableDropdown
                    options={timezoneOptions}
                    value={editTimezone}
                    onChange={(val) => setEditTimezone(val)}
                    placeholder="Search operational timezone…"
                    searchPlaceholder="Type timezone or offset (e.g. UTC, Asia, America)…"
                    allowCustom={true}
                    triggerHeight="36px"
                    maxHeight={220}
                  />
                </div>
              </div>

              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>Registered Street Address / Logistics Terminal</label>
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={isDetectingLocation}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#0284c7',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MapPin size={11} /> Auto-suggest from device location
                  </button>
                </div>
                <input
                  className="input"
                  value={editFormattedAddress}
                  onChange={(e) => setEditFormattedAddress(e.target.value)}
                  placeholder="e.g. CFS / ICD Logistics Park, Port Gate 3, Andheri East, Mumbai 400093"
                  style={{ height: '36px', fontSize: '13px' }}
                />

                {/* Suggestions Pills / Chips */}
                {effectiveAddressSuggestions.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--mut)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={11} color="#0284c7" />
                      Suggested Logistics Hub Addresses (Click to apply):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {effectiveAddressSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditFormattedAddress(sug);
                            toast('Address applied to registration field.');
                          }}
                          style={{
                            textAlign: 'left',
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: editFormattedAddress === sug ? '#e0f2fe' : '#ffffff',
                            border: editFormattedAddress === sug ? '1px solid #0284c7' : '1px solid #cbd5e1',
                            borderRadius: '4px',
                            color: editFormattedAddress === sug ? '#0284c7' : '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title={`Click to fill: ${sug}`}
                        >
                          📍 {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Company Link & Affiliation Governance */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    4. Enterprise Company Link & Login Affiliation
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '2px' }}>
                    Current Associated Organization: <b style={{ color: 'var(--ink)' }}>{user.company}</b>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn sm ${isChangingCompany ? 'primary' : 'secondary'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setIsChangingCompany(!isChangingCompany)}
                >
                  {isChangingCompany ? 'Cancel Switch' : 'Link / Switch Company'}
                </button>
              </div>

              {isChangingCompany && (
                <div style={{ background: '#fff', border: '1px solid var(--line-light)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mut)', lineHeight: 1.4 }}>
                    <b>Enterprise Governance Policy:</b> When switching organizations, your account profile can be transferred to the new company domain, updating your corporate login email ID. Choose between instant domain self-link or submitting for official Godfather regulatory clearance.
                  </div>

                  <div className="grid g2">
                    <div className="field" style={{ position: 'relative' }}>
                      <label>New Company / Employer Name <span className="req">*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input"
                          placeholder="Search existing company or enter new name…"
                          value={transferTargetCompany}
                          onChange={(e) => {
                            setTransferTargetCompany(e.target.value);
                            setIsProfileCompanyDropdownOpen(true);
                          }}
                          onFocus={() => setIsProfileCompanyDropdownOpen(true)}
                          required={isChangingCompany}
                          style={{ paddingRight: '28px' }}
                        />
                        <Search
                          size={13}
                          color="#94a3b8"
                          style={{
                            position: 'absolute',
                            right: '9px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {/* Dropdown with Location Indication */}
                      {isProfileCompanyDropdownOpen && profileCompanySearchResults.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 2px)',
                            left: 0,
                            right: 0,
                            zIndex: 99999,
                            background: '#ffffff',
                            border: '1.5px solid #0284c7',
                            borderRadius: '6px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            maxHeight: '220px',
                            overflowY: 'auto',
                          }}
                        >
                          <div
                            style={{
                              padding: '5px 8px',
                              background: '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              color: '#64748b',
                              textTransform: 'uppercase',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Registered Companies in DBMS (with Location)</span>
                            <button
                              type="button"
                              onClick={() => setIsProfileCompanyDropdownOpen(false)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                            >
                              <X size={11} />
                            </button>
                          </div>

                          {profileCompanySearchResults.map((comp) => (
                            <div
                              key={comp.id}
                              onClick={() => {
                                setTransferTargetCompany(comp.legalName);
                                setIsProfileCompanyDropdownOpen(false);
                                toast(`Selected: ${comp.legalName} (${comp.locationLabel})`);
                              }}
                              style={{
                                padding: '6px 10px',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{comp.legalName}</span>
                                {comp.verified && <span className="badge green" style={{ fontSize: '8.5px', padding: '0 4px' }}>VERIFIED</span>}
                              </div>
                              <span style={{ fontSize: '10px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={10} /> {comp.locationLabel} {comp.registeredAddress ? `· ${comp.registeredAddress}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Duplicate Advisory Notice */}
                      {profileCompanyAdvisory && profileCompanyAdvisory.isPotentialDuplicate && (
                        <div
                          style={{
                            marginTop: '4px',
                            padding: '6px 8px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            color: '#92400e',
                            lineHeight: 1.3,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, marginBottom: '2px' }}>
                            <AlertTriangle size={11} color="#d97706" />
                            <span>Registered Entity Match Notice (Advisory Only)</span>
                          </div>
                          <div>{profileCompanyAdvisory.advisoryMessage}</div>
                        </div>
                      )}
                    </div>
                    <div className="field">
                      <label>New Corporate Email ID <span className="req">*</span></label>
                      <input
                        className="input"
                        type="email"
                        placeholder="e.g. arjun.rao@hapag-lloyd.com"
                        value={transferTargetEmail}
                        onChange={(e) => setTransferTargetEmail(e.target.value)}
                        required={isChangingCompany}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Transfer & Verification Method</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', cursor: 'pointer', padding: '8px', border: transferMethod === 'self' ? '1.5px solid var(--brand)' : '1px solid var(--line-light)', borderRadius: '6px', background: transferMethod === 'self' ? 'rgba(0, 163, 196, 0.05)' : '#fff' }}>
                        <input
                          type="radio"
                          name="transferMethod"
                          checked={transferMethod === 'self'}
                          onChange={() => setTransferMethod('self')}
                        />
                        <div>
                          <b>Method 1: Instant Self-Link</b>
                          <div style={{ fontSize: '10px', color: 'var(--mut)' }}>Verify immediately via corporate email domain match.</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', cursor: 'pointer', padding: '8px', border: transferMethod === 'godfather' ? '1.5px solid var(--brand)' : '1px solid var(--line-light)', borderRadius: '6px', background: transferMethod === 'godfather' ? 'rgba(0, 163, 196, 0.05)' : '#fff' }}>
                        <input
                          type="radio"
                          name="transferMethod"
                          checked={transferMethod === 'godfather'}
                          onChange={() => setTransferMethod('godfather')}
                        />
                        <div>
                          <b>Method 2: Godfather Approval</b>
                          <div style={{ fontSize: '10px', color: 'var(--mut)' }}>Routes ticket to Godfather Admin for regulatory review.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowEditIdentityModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                <Check size={13} /> Save Identity, Location & Credentials
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
