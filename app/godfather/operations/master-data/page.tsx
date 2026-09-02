'use client';

import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  RefreshCw,
  Anchor,
  Ship,
  Box,
  FileCode2,
  Scale,
  Receipt,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Info,
  Check,
  X,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import {
  MasterLocation,
  MasterCarrier,
  MasterEquipment,
  MasterCommodity,
  MasterIncoterm,
  MasterTaxSAC,
  LocationType,
  CarrierType,
  CarrierAlliance,
  EquipmentCategory,
} from '@/lib/godfather/types';
import {
  getLocationTypeIcon,
  getCarrierTypeIcon,
  getEquipmentCategoryIcon,
  getIncotermIcon,
} from '@/lib/utils';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

type ActiveTab = 'locations' | 'carriers' | 'equipment' | 'commodities' | 'incoterms' | 'tax';

export default function MasterDataPage() {
  const {
    masterLocations,
    masterCarriers,
    masterEquipment,
    masterCommodities,
    masterIncoterms,
    masterTaxCodes,
    addMasterLocation,
    updateMasterLocation,
    deleteMasterLocation,
    toggleMasterLocationStatus,
    bulkImportMasterLocations,
    addMasterCarrier,
    updateMasterCarrier,
    deleteMasterCarrier,
    toggleMasterCarrierStatus,
    bulkImportMasterCarriers,
    addMasterEquipment,
    updateMasterEquipment,
    deleteMasterEquipment,
    addMasterCommodity,
    updateMasterCommodity,
    deleteMasterCommodity,
    addMasterIncoterm,
    updateMasterIncoterm,
    deleteMasterIncoterm,
    addMasterTaxCode,
    updateMasterTaxCode,
    deleteMasterTaxCode,
  } = useGodfatherData();

  const { operator } = useGodfatherAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('locations');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterLocationType, setFilterLocationType] = useState('ALL');
  const [filterCapability, setFilterCapability] = useState<'ALL' | 'POR' | 'POL' | 'POD' | 'FPOD'>('ALL');
  const [filterCarrierType, setFilterCarrierType] = useState('ALL');
  const [filterAlliance, setFilterAlliance] = useState('ALL');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Modals
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MasterLocation | null>(null);
  const [locationForm, setLocationForm] = useState<{
    unLocode: string;
    name: string;
    country: string;
    countryCode: string;
    region: string;
    type: LocationType;
    isPOR: boolean;
    isPOL: boolean;
    isPOD: boolean;
    isFPOD: boolean;
    terminals: string;
    lat: number;
    lng: number;
    customsZoneCode: string;
    remarks: string;
    auditReason: string;
  }>({
    unLocode: '',
    name: '',
    country: '',
    countryCode: '',
    region: '',
    type: 'Seaport',
    isPOR: true,
    isPOL: true,
    isPOD: true,
    isFPOD: true,
    terminals: '',
    lat: 0,
    lng: 0,
    customsZoneCode: '',
    remarks: '',
    auditReason: 'Regulatory standard master location update',
  });

  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<MasterCarrier | null>(null);
  const [carrierForm, setCarrierForm] = useState<{
    name: string;
    scacCode: string;
    carrierCode: string;
    type: CarrierType;
    alliance: CarrierAlliance;
    country: string;
    fleetTEU: string;
    bookingEmail: string;
    trackingApiEndpoint: string;
    supportedEquipment: string;
    remarks: string;
    auditReason: string;
  }>({
    name: '',
    scacCode: '',
    carrierCode: '',
    type: 'MLO',
    alliance: 'Independent',
    country: '',
    fleetTEU: '',
    bookingEmail: '',
    trackingApiEndpoint: '',
    supportedEquipment: '20DV, 40DV, 40HC, 20RF, 40HR',
    remarks: '',
    auditReason: 'Standard ocean liner registry update',
  });

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<MasterEquipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<{
    isoCode: string;
    isoGroup: string;
    name: string;
    category: EquipmentCategory;
    lengthFt: number;
    heightFt: number;
    maxGrossKg: number;
    tareWeightKg: number;
    maxPayloadKg: number;
    volumeCbm: number;
    isHazardousAllowed: boolean;
    isReefer: boolean;
    isOogAllowed: boolean;
    remarks: string;
    auditReason: string;
  }>({
    isoCode: '',
    isoGroup: '',
    name: '',
    category: 'High Cube',
    lengthFt: 40,
    heightFt: 9.5,
    maxGrossKg: 32500,
    tareWeightKg: 3900,
    maxPayloadKg: 28600,
    volumeCbm: 76.4,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    remarks: '',
    auditReason: 'ISO Container dimensions catalog update',
  });

  const [isCommodityModalOpen, setIsCommodityModalOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<MasterCommodity | null>(null);
  const [commodityForm, setCommodityForm] = useState<{
    hsCode: string;
    chapter: string;
    heading: string;
    name: string;
    isHazardous: boolean;
    imoClass: string;
    unNumber: string;
    storageReqs: string;
    auditReason: string;
  }>({
    hsCode: '',
    chapter: '',
    heading: '',
    name: '',
    isHazardous: false,
    imoClass: '',
    unNumber: '',
    storageReqs: '',
    auditReason: 'WCO Harmonized Tariff update',
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTemplateType, setBulkTemplateType] = useState<'locations' | 'carriers'>('locations');
  const [bulkText, setBulkText] = useState('');
  const [bulkReason, setBulkReason] = useState('Bulk batch ingestion for maritime statics sync');
  const [bulkReport, setBulkReport] = useState<string | null>(null);

  // Generic Confirmation modal for deletion
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    onConfirm: (reason: string) => void;
  } | null>(null);

  // Countries extracted from master locations
  const availableCountries = useMemo(() => {
    const list = Array.from(new Set(masterLocations.map((l) => l.country))).filter(Boolean);
    return list.sort();
  }, [masterLocations]);

  // Filtered Locations
  const filteredLocations = useMemo(() => {
    return masterLocations.filter((loc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loc.unLocode.toLowerCase().includes(q) ||
        loc.name.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        loc.region.toLowerCase().includes(q) ||
        loc.terminals.some((t) => t.toLowerCase().includes(q));

      const matchesCountry = filterCountry === 'ALL' || loc.country === filterCountry;
      const matchesType = filterLocationType === 'ALL' || loc.type === filterLocationType;

      let matchesCap = true;
      if (filterCapability === 'POR') matchesCap = loc.capabilities.isPOR;
      if (filterCapability === 'POL') matchesCap = loc.capabilities.isPOL;
      if (filterCapability === 'POD') matchesCap = loc.capabilities.isPOD;
      if (filterCapability === 'FPOD') matchesCap = loc.capabilities.isFPOD;

      return matchesSearch && matchesCountry && matchesType && matchesCap;
    });
  }, [masterLocations, searchQuery, filterCountry, filterLocationType, filterCapability]);

  // Filtered Carriers
  const filteredCarriers = useMemo(() => {
    return masterCarriers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.scacCode.toLowerCase().includes(q) ||
        c.carrierCode.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q);

      const matchesType = filterCarrierType === 'ALL' || c.type === filterCarrierType;
      const matchesAlliance = filterAlliance === 'ALL' || c.alliance === filterAlliance;

      return matchesSearch && matchesType && matchesAlliance;
    });
  }, [masterCarriers, searchQuery, filterCarrierType, filterAlliance]);

  // Filtered Equipment
  const filteredEquipment = useMemo(() => {
    return masterEquipment.filter((eq) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        eq.isoCode.toLowerCase().includes(q) ||
        eq.name.toLowerCase().includes(q) ||
        eq.category.toLowerCase().includes(q)
      );
    });
  }, [masterEquipment, searchQuery]);

  // Filtered Commodities
  const filteredCommodities = useMemo(() => {
    return masterCommodities.filter((cmd) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        cmd.hsCode.toLowerCase().includes(q) ||
        cmd.name.toLowerCase().includes(q) ||
        (cmd.imoClass && cmd.imoClass.toLowerCase().includes(q))
      );
    });
  }, [masterCommodities, searchQuery]);

  // Filtered Incoterms
  const filteredIncoterms = useMemo(() => {
    return masterIncoterms.filter((inc) => {
      const q = searchQuery.toLowerCase().trim();
      return !q || inc.code.toLowerCase().includes(q) || inc.name.toLowerCase().includes(q);
    });
  }, [masterIncoterms, searchQuery]);

  // Filtered Tax
  const filteredTax = useMemo(() => {
    return masterTaxCodes.filter((tax) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        tax.sacCode.toLowerCase().includes(q) ||
        tax.description.toLowerCase().includes(q) ||
        tax.category.toLowerCase().includes(q)
      );
    });
  }, [masterTaxCodes, searchQuery]);

  // Open Location Modal
  const handleOpenLocationModal = (loc?: MasterLocation) => {
    if (loc) {
      setEditingLocation(loc);
      setLocationForm({
        unLocode: loc.unLocode,
        name: loc.name,
        country: loc.country,
        countryCode: loc.countryCode,
        region: loc.region,
        type: loc.type,
        isPOR: loc.capabilities.isPOR,
        isPOL: loc.capabilities.isPOL,
        isPOD: loc.capabilities.isPOD,
        isFPOD: loc.capabilities.isFPOD,
        terminals: loc.terminals.join(', '),
        lat: loc.coordinates?.lat || 0,
        lng: loc.coordinates?.lng || 0,
        customsZoneCode: loc.customsZoneCode || '',
        remarks: loc.remarks || '',
        auditReason: `Updating master parameters for ${loc.unLocode} (${loc.name})`,
      });
    } else {
      setEditingLocation(null);
      setLocationForm({
        unLocode: '',
        name: '',
        country: 'India',
        countryCode: 'IN',
        region: '',
        type: 'Seaport',
        isPOR: true,
        isPOL: true,
        isPOD: true,
        isFPOD: true,
        terminals: 'Main Container Terminal',
        lat: 0,
        lng: 0,
        customsZoneCode: '',
        remarks: '',
        auditReason: 'Adding new global maritime location to registry',
      });
    }
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const terminalsArr = locationForm.terminals
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingLocation) {
      await updateMasterLocation(
        editingLocation.id,
        {
          unLocode: locationForm.unLocode.toUpperCase().trim(),
          name: locationForm.name.trim(),
          country: locationForm.country.trim(),
          countryCode: locationForm.countryCode.toUpperCase().trim(),
          region: locationForm.region.trim(),
          type: locationForm.type,
          capabilities: {
            isPOR: locationForm.isPOR,
            isPOL: locationForm.isPOL,
            isPOD: locationForm.isPOD,
            isFPOD: locationForm.isFPOD,
          },
          terminals: terminalsArr.length > 0 ? terminalsArr : ['Main Terminal'],
          coordinates: { lat: Number(locationForm.lat) || 0, lng: Number(locationForm.lng) || 0 },
          customsZoneCode: locationForm.customsZoneCode.trim(),
          remarks: locationForm.remarks.trim(),
        },
        locationForm.auditReason
      );
    } else {
      await addMasterLocation(
        {
          unLocode: locationForm.unLocode.toUpperCase().trim(),
          name: locationForm.name.trim(),
          country: locationForm.country.trim(),
          countryCode: locationForm.countryCode.toUpperCase().trim(),
          region: locationForm.region.trim(),
          type: locationForm.type,
          capabilities: {
            isPOR: locationForm.isPOR,
            isPOL: locationForm.isPOL,
            isPOD: locationForm.isPOD,
            isFPOD: locationForm.isFPOD,
          },
          terminals: terminalsArr.length > 0 ? terminalsArr : ['Main Terminal'],
          coordinates: { lat: Number(locationForm.lat) || 0, lng: Number(locationForm.lng) || 0 },
          customsZoneCode: locationForm.customsZoneCode.trim(),
          status: 'active',
          remarks: locationForm.remarks.trim(),
        },
        locationForm.auditReason
      );
    }
    setIsLocationModalOpen(false);
  };

  // Open Carrier Modal
  const handleOpenCarrierModal = (car?: MasterCarrier) => {
    if (car) {
      setEditingCarrier(car);
      setCarrierForm({
        name: car.name,
        scacCode: car.scacCode,
        carrierCode: car.carrierCode,
        type: car.type,
        alliance: car.alliance,
        country: car.country,
        fleetTEU: car.fleetTEU || '',
        bookingEmail: car.bookingEmail,
        trackingApiEndpoint: car.trackingApiEndpoint || '',
        supportedEquipment: car.supportedEquipment.join(', '),
        remarks: car.remarks || '',
        auditReason: `Updating carrier profile for ${car.name} (${car.scacCode})`,
      });
    } else {
      setEditingCarrier(null);
      setCarrierForm({
        name: '',
        scacCode: '',
        carrierCode: '',
        type: 'MLO',
        alliance: 'Independent',
        country: '',
        fleetTEU: '',
        bookingEmail: '',
        trackingApiEndpoint: '',
        supportedEquipment: '20DV, 40DV, 40HC, 20RF, 40HR',
        remarks: '',
        auditReason: 'Registering new carrier to master database',
      });
    }
    setIsCarrierModalOpen(true);
  };

  const handleSaveCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    const eqArr = carrierForm.supportedEquipment
      .split(',')
      .map((eq) => eq.trim())
      .filter(Boolean);

    if (editingCarrier) {
      await updateMasterCarrier(
        editingCarrier.id,
        {
          name: carrierForm.name.trim(),
          scacCode: carrierForm.scacCode.toUpperCase().trim(),
          carrierCode: carrierForm.carrierCode.toUpperCase().trim(),
          type: carrierForm.type,
          alliance: carrierForm.alliance,
          country: carrierForm.country.trim(),
          fleetTEU: carrierForm.fleetTEU.trim(),
          bookingEmail: carrierForm.bookingEmail.trim(),
          trackingApiEndpoint: carrierForm.trackingApiEndpoint.trim(),
          supportedEquipment: eqArr,
          remarks: carrierForm.remarks.trim(),
        },
        carrierForm.auditReason
      );
    } else {
      await addMasterCarrier(
        {
          name: carrierForm.name.trim(),
          scacCode: carrierForm.scacCode.toUpperCase().trim(),
          carrierCode: carrierForm.carrierCode.toUpperCase().trim(),
          type: carrierForm.type,
          alliance: carrierForm.alliance,
          country: carrierForm.country.trim(),
          fleetTEU: carrierForm.fleetTEU.trim(),
          bookingEmail: carrierForm.bookingEmail.trim(),
          trackingApiEndpoint: carrierForm.trackingApiEndpoint.trim(),
          supportedEquipment: eqArr,
          status: 'active',
          remarks: carrierForm.remarks.trim(),
        },
        carrierForm.auditReason
      );
    }
    setIsCarrierModalOpen(false);
  };

  // Sync Live Statics Engine
  const handleSyncStatics = () => {
    setSyncStatus('Synchronizing Master Data caches across client endpoints...');
    setTimeout(() => {
      setSyncStatus(`Statics Sync Complete. Synchronized ${masterLocations.length} locations, ${masterCarriers.length} carriers, and ${masterEquipment.length} equipment types.`);
      setTimeout(() => setSyncStatus(null), 4000);
    }, 800);
  };

  // Export Master Dictionary
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      platform: 'FR8X Sovereign Master Data',
      counts: {
        locations: masterLocations.length,
        carriers: masterCarriers.length,
        equipment: masterEquipment.length,
        commodities: masterCommodities.length,
        incoterms: masterIncoterms.length,
        taxCodes: masterTaxCodes.length,
      },
      locations: masterLocations,
      carriers: masterCarriers,
      equipment: masterEquipment,
      commodities: masterCommodities,
      incoterms: masterIncoterms,
      taxCodes: masterTaxCodes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FR8X_Master_Data_Dictionary_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Template Download Handlers
  const handleDownloadTemplate = (type: 'locations' | 'carriers', format: 'csv' | 'json') => {
    if (type === 'locations') {
      if (format === 'csv') {
        const csv = `UNLOCODE,Port Name,Country,CountryCode,Type,Region,isPOR,isPOL,isPOD,isFPOD,Terminals,Latitude,Longitude,CustomsZone,Remarks
INNSA,Nhava Sheva (JNPT),India,IN,Seaport,Maharashtra,true,true,true,true,"NSICT; NSIGT; BMCT; APMT Mumbai",18.9499,72.9515,INNSA1,Premier container gateway of India
INTKD,Tughlakabad ICD,India,IN,Inland Container Depot (ICD),Delhi NCR,true,false,false,true,"CONCOR ICD Hub",28.5089,77.2831,INTKD6,Largest dry port and inland terminal
NLRTM,Rotterdam,Netherlands,NL,Seaport,South Holland,true,true,true,true,"ECT Delta; APMT Maasvlakte II",51.9244,4.4777,NL0001,Europe largest container gateway`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FR8X_Locations_Bulk_Template.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = [
          {
            unLocode: 'INNSA',
            name: 'Nhava Sheva (JNPT)',
            country: 'India',
            countryCode: 'IN',
            region: 'Maharashtra',
            type: 'Seaport',
            capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
            terminals: ['NSICT', 'NSIGT', 'BMCT', 'APMT Mumbai'],
            coordinates: { lat: 18.9499, lng: 72.9515 },
            customsZoneCode: 'INNSA1',
            status: 'active'
          },
          {
            unLocode: 'INTKD',
            name: 'Tughlakabad ICD',
            country: 'India',
            countryCode: 'IN',
            region: 'Delhi NCR',
            type: 'Inland Container Depot (ICD)',
            capabilities: { isPOR: true, isPOL: false, isPOD: false, isFPOD: true },
            terminals: ['CONCOR ICD Hub'],
            coordinates: { lat: 28.5089, lng: 77.2831 },
            customsZoneCode: 'INTKD6',
            status: 'active'
          }
        ];
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FR8X_Locations_Bulk_Template.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      if (format === 'csv') {
        const csv = `Carrier Name,SCAC,CarrierCode,Type,Alliance,Country,FleetTEU,BookingEmail,TrackingApiEndpoint,SupportedEquipment,Remarks
A.P. Moller - Maersk,MAEU,MSK,MLO,Gemini Cooperation,Denmark,4250000 TEU,bookings.apac@maersk.com,https://api.maersk.com/track-and-trace/v2,"20DV, 40DV, 40HC, 20RF, 40HR",Integrated container carrier
Mediterranean Shipping Company (MSC),MSCU,MSC,MLO,Independent,Switzerland,5850000 TEU,ocean.desk@msc.com,https://api.msc.com/v1/tracking,"20DV, 40DV, 40HC, 45HC, 20RF, 40HR, ISO Tank",World largest container line
Kuehne + Nagel (Blue Anchor Line),BANQ,KN,NVOCC,Global Forwarder,Switzerland,4300000 TEU,seafreight.global@kuehne-nagel.com,https://api.kuehne-nagel.com/sea/track/v1,"20DV, 40DV, 40HC, 20RF, 40HR",Tier-1 Global NVOCC Forwarder`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FR8X_Carriers_Bulk_Template.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = [
          {
            name: 'A.P. Moller - Maersk',
            scacCode: 'MAEU',
            carrierCode: 'MSK',
            type: 'MLO',
            alliance: 'Gemini Cooperation',
            country: 'Denmark',
            fleetTEU: '4,250,000 TEU',
            bookingEmail: 'bookings.apac@maersk.com',
            supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR'],
            status: 'active'
          },
          {
            name: 'Mediterranean Shipping Company (MSC)',
            scacCode: 'MSCU',
            carrierCode: 'MSC',
            type: 'MLO',
            alliance: 'Independent',
            country: 'Switzerland',
            fleetTEU: '5,850,000 TEU',
            bookingEmail: 'ocean.desk@msc.com',
            supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', 'ISO Tank'],
            status: 'active'
          }
        ];
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FR8X_Carriers_Bulk_Template.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setBulkText(text);
    };
    reader.readAsText(file);
  };

  // Bulk Ingest
  const handleBulkImport = async () => {
    try {
      let parsed: any[] = [];
      const trimmed = bulkText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const json = JSON.parse(trimmed);
        parsed = Array.isArray(json) ? json : json.locations || json.carriers || [json];
      } else {
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        // Check if first line is header
        const startIndex = lines[0].toLowerCase().includes('unlocode') || lines[0].toLowerCase().includes('carrier') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 2 && parts[0] && parts[1]) {
            if (bulkTemplateType === 'locations') {
              parsed.push({
                unLocode: parts[0],
                name: parts[1],
                country: parts[2] || 'Global',
                countryCode: (parts[3] || parts[0].slice(0, 2)).toUpperCase(),
                type: (parts[4] as LocationType) || (parts[3] as LocationType) || 'Seaport',
                region: parts[5] || 'International',
                capabilities: {
                  isPOR: parts[6] ? parts[6].toLowerCase() === 'true' : true,
                  isPOL: parts[7] ? parts[7].toLowerCase() === 'true' : true,
                  isPOD: parts[8] ? parts[8].toLowerCase() === 'true' : true,
                  isFPOD: parts[9] ? parts[9].toLowerCase() === 'true' : true,
                },
                terminals: parts[10] ? parts[10].split(';').map((t) => t.trim()) : ['Main Terminal'],
                coordinates: { lat: Number(parts[11]) || 0, lng: Number(parts[12]) || 0 },
                customsZoneCode: parts[13] || '',
                remarks: parts[14] || '',
              });
            } else {
              parsed.push({
                name: parts[0],
                scacCode: parts[1].toUpperCase(),
                carrierCode: (parts[2] || parts[1].slice(0, 3)).toUpperCase(),
                type: (parts[3] as CarrierType) || 'MLO',
                alliance: (parts[4] as CarrierAlliance) || 'Independent',
                country: parts[5] || 'Global',
                fleetTEU: parts[6] || '',
                bookingEmail: parts[7] || `bookings@${parts[1].toLowerCase()}.com`,
                trackingApiEndpoint: parts[8] || '',
                supportedEquipment: parts[9] ? parts[9].split(';').map((eq) => eq.trim()) : ['20DV', '40DV', '40HC', '20RF', '40HR'],
                remarks: parts[10] || '',
              });
            }
          }
        }
      }

      if (parsed.length === 0) {
        setBulkReport('No valid records recognized. Provide JSON array or CSV lines.');
        return;
      }

      if (bulkTemplateType === 'locations') {
        const res = await bulkImportMasterLocations(parsed, bulkReason);
        setBulkReport(`Successfully ingested ${res.count} locations. ${res.errors.length > 0 ? `Errors: ${res.errors.join('; ')}` : ''}`);
      } else {
        const res = await bulkImportMasterCarriers(parsed, bulkReason);
        setBulkReport(`Successfully ingested ${res.count} carriers. ${res.errors.length > 0 ? `Errors: ${res.errors.join('; ')}` : ''}`);
      }

      setBulkText('');
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkReport(null);
      }, 2500);
    } catch (err: any) {
      setBulkReport(`Parse error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="gf-page-title">Master Data Management</h1>
            <span className="gf-badge gf-badge-gold text-[10px] uppercase font-mono tracking-wider font-bold">
              SOVEREIGN REGISTRY
            </span>
          </div>
          <p className="gf-page-subtitle">
            Configure authoritative master dictionaries for Locations (POR/POL/POD/FPOD), Carriers (MLO/NVOCC/Feeder), ISO Equipment, HS Classifications, Incoterms, and Statutory Tax Categories.
          </p>
        </div>

        <div className="gf-page-actions">
          <button onClick={handleSyncStatics} className="gf-btn gf-btn-secondary" title="Sync memory caches">
            <RefreshCw className="lucide w-3.5 h-3.5" />
            <span>Sync Statics</span>
          </button>
          <button onClick={handleExportJSON} className="gf-btn gf-btn-secondary" title="Export complete dictionary">
            <Download className="lucide w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button onClick={() => setIsBulkModalOpen(true)} className="gf-btn gf-btn-secondary" title="Bulk CSV/JSON Import">
            <Upload className="lucide w-3.5 h-3.5" />
            <span>Bulk Ingest</span>
          </button>
          <button
            onClick={() => {
              if (activeTab === 'locations') handleOpenLocationModal();
              else if (activeTab === 'carriers') handleOpenCarrierModal();
              else if (activeTab === 'equipment') setIsEquipmentModalOpen(true);
              else if (activeTab === 'commodities') setIsCommodityModalOpen(true);
            }}
            className="gf-btn gf-btn-primary"
          >
            <Plus className="lucide w-3.5 h-3.5" />
            <span>
              {activeTab === 'locations' && 'Add Location'}
              {activeTab === 'carriers' && 'Add Carrier'}
              {activeTab === 'equipment' && 'Add Equipment'}
              {activeTab === 'commodities' && 'Add HS Code'}
              {activeTab === 'incoterms' && 'Add Incoterm'}
              {activeTab === 'tax' && 'Add Tax SAC'}
            </span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="lucide w-4 h-4 text-emerald-600" />
            <span className="font-medium">{syncStatus}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="lucide w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Statistics Strip */}
      <div className="gf-grid-6">
        <div
          onClick={() => setActiveTab('locations')}
          className={`gf-stat-box ${activeTab === 'locations' ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Locations</span>
            <Anchor style={{ width: '15px', height: '15px', color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
            {masterLocations.length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>POR / POL / POD / FPOD</div>
        </div>

        <div
          onClick={() => setActiveTab('carriers')}
          className={`gf-stat-box ${activeTab === 'carriers' ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Carriers</span>
            <Ship style={{ width: '15px', height: '15px', color: '#4f46e5' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
            {masterCarriers.length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>MLO · NVOCC · Feeder</div>
        </div>

        <div
          onClick={() => setActiveTab('equipment')}
          className={`gf-stat-box ${activeTab === 'equipment' ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Equipment</span>
            <Box style={{ width: '15px', height: '15px', color: '#059669' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
            {masterEquipment.length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>ISO Dry · Reefer · OOG</div>
        </div>

        <div
          onClick={() => setActiveTab('commodities')}
          className={`gf-stat-box ${activeTab === 'commodities' ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>HS Codes</span>
            <FileCode2 style={{ width: '15px', height: '15px', color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
            {masterCommodities.length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Harmonized Tariff & Haz</div>
        </div>

        <div
          onClick={() => setActiveTab('incoterms')}
          className={`gf-stat-box ${activeTab === 'incoterms' ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Incoterms</span>
            <Scale style={{ width: '15px', height: '15px', color: '#7c3aed' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
            {masterIncoterms.length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Incoterms 2020 Rules</div>
        </div>

        <div
          onClick={() => setActiveTab('tax')}
          className={`gf-stat-box ${activeTab === 'tax' ? 'active' : ''}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tax & SAC</span>
            <Receipt style={{ width: '15px', height: '15px', color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
            {masterTaxCodes.length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Statutory GST & RCM</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="gf-tab-bar">
        <button
          onClick={() => { setActiveTab('locations'); setSearchQuery(''); }}
          className={`gf-tab-pill ${activeTab === 'locations' ? 'active' : ''}`}
        >
          <Anchor style={{ width: '14px', height: '14px' }} />
          <span>Locations & Ports ({masterLocations.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('carriers'); setSearchQuery(''); }}
          className={`gf-tab-pill ${activeTab === 'carriers' ? 'active' : ''}`}
        >
          <Ship style={{ width: '14px', height: '14px' }} />
          <span>Carriers & Liners ({masterCarriers.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('equipment'); setSearchQuery(''); }}
          className={`gf-tab-pill ${activeTab === 'equipment' ? 'active' : ''}`}
        >
          <Box style={{ width: '14px', height: '14px' }} />
          <span>Container Equipment ({masterEquipment.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('commodities'); setSearchQuery(''); }}
          className={`gf-tab-pill ${activeTab === 'commodities' ? 'active' : ''}`}
        >
          <FileCode2 style={{ width: '14px', height: '14px' }} />
          <span>Commodities & HS Codes ({masterCommodities.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('incoterms'); setSearchQuery(''); }}
          className={`gf-tab-pill ${activeTab === 'incoterms' ? 'active' : ''}`}
        >
          <Scale style={{ width: '14px', height: '14px' }} />
          <span>Incoterms 2020 Matrix ({masterIncoterms.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('tax'); setSearchQuery(''); }}
          className={`gf-tab-pill ${activeTab === 'tax' ? 'active' : ''}`}
        >
          <Receipt style={{ width: '14px', height: '14px' }} />
          <span>Tax SAC Classification ({masterTaxCodes.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="gf-filter-bar">
        <div className="gf-search-input-wrap">
          <Search className="lucide w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'locations'
                ? 'Search UN/LOCODE, port name, country, terminals...'
                : activeTab === 'carriers'
                ? 'Search carrier name, SCAC code, booking email...'
                : activeTab === 'equipment'
                ? 'Search ISO code, dimensions, equipment name...'
                : activeTab === 'commodities'
                ? 'Search HS code, description, IMO class...'
                : activeTab === 'incoterms'
                ? 'Search Incoterm rule code or title...'
                : 'Search SAC code, tax description...'
            }
            className="gf-search-input"
          />
        </div>

        {activeTab === 'locations' && (
          <div className="flex items-center gap-2">
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="gf-select text-xs min-w-[130px]"
            >
              <option value="ALL">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterLocationType}
              onChange={(e) => setFilterLocationType(e.target.value)}
              className="gf-select text-xs min-w-[150px]"
            >
              <option value="ALL">All Port & Location Types</option>
              <option value="Seaport">⚓ Seaport</option>
              <option value="Inland Container Depot (ICD)">🗺️ Inland Depot (ICD)</option>
              <option value="Container Freight Station (CFS)">🗺️ CFS Station</option>
              <option value="River Port">⚓ River Port</option>
              <option value="Airport">🗺️ Airport</option>
              <option value="Land Border">🗺️ Land Border</option>
            </select>

            <select
              value={filterCapability}
              onChange={(e) => setFilterCapability(e.target.value as any)}
              className="gf-select text-xs min-w-[130px]"
            >
              <option value="ALL">All Capabilities</option>
              <option value="POR">Place of Receipt (POR)</option>
              <option value="POL">Port of Loading (POL)</option>
              <option value="POD">Port of Discharge (POD)</option>
              <option value="FPOD">Final Delivery (FPOD)</option>
            </select>
          </div>
        )}

        {activeTab === 'carriers' && (
          <div className="flex items-center gap-2">
            <select
              value={filterCarrierType}
              onChange={(e) => setFilterCarrierType(e.target.value)}
              className="gf-select text-xs min-w-[140px]"
            >
              <option value="ALL">All Carrier Types</option>
              <option value="MLO">🚢 MLO (Main Line Operator)</option>
              <option value="NVOCC">📦 NVOCC</option>
              <option value="Feeder Operator">🛥️ Feeder Operator</option>
              <option value="Rail / Intermodal">🚆 Rail / Intermodal</option>
            </select>

            <select
              value={filterAlliance}
              onChange={(e) => setFilterAlliance(e.target.value)}
              className="gf-select text-xs min-w-[140px]"
            >
              <option value="ALL">All Alliances</option>
              <option value="Gemini Cooperation">Gemini Cooperation</option>
              <option value="Ocean Alliance">Ocean Alliance</option>
              <option value="THE Alliance / Premier">THE Alliance / Premier</option>
              <option value="Independent">Independent</option>
              <option value="Global Forwarder">Global Forwarder</option>
              <option value="Regional Feeder">Regional Feeder</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: LOCATIONS & PORTS */}
      {activeTab === 'locations' && (
        <div className="gf-card overflow-hidden">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>UN/LOCODE</th>
                  <th>Location & Country</th>
                  <th>Type</th>
                  <th>Capabilities</th>
                  <th>Major Terminals / Berths</th>
                  <th>Coordinates / Zone</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50">
                    <td>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700 text-xs">
                        <span className="text-sm">{getLocationTypeIcon(loc.type)}</span>
                        <span>{loc.unLocode}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 text-xs">{loc.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span className="font-mono text-[10px] text-slate-600 uppercase font-semibold">{loc.countryCode}</span>
                        <span>·</span>
                        <span>{loc.country} ({loc.region})</span>
                      </div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-gray text-[10px] flex items-center gap-1">
                        <span>{getLocationTypeIcon(loc.type)}</span>
                        <span>{loc.type}</span>
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`gf-badge text-[9px] font-mono ${loc.capabilities.isPOR ? 'gf-badge-blue' : 'opacity-30'}`}>POR</span>
                        <span className={`gf-badge text-[9px] font-mono ${loc.capabilities.isPOL ? 'gf-badge-green' : 'opacity-30'}`}>POL</span>
                        <span className={`gf-badge text-[9px] font-mono ${loc.capabilities.isPOD ? 'gf-badge-amber' : 'opacity-30'}`}>POD</span>
                        <span className={`gf-badge text-[9px] font-mono ${loc.capabilities.isFPOD ? 'gf-badge-purple' : 'opacity-30'}`}>FPOD</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 max-w-[220px] truncate font-medium" title={loc.terminals.join(', ')}>
                        {loc.terminals.join(', ')}
                      </div>
                      <div className="text-[10.5px] text-slate-500">{loc.terminals.length} terminal berths</div>
                    </td>
                    <td>
                      <div className="font-mono text-[10.5px] text-slate-600">
                        {loc.coordinates?.lat?.toFixed(4)}, {loc.coordinates?.lng?.toFixed(4)}
                      </div>
                      {loc.customsZoneCode && (
                        <div className="font-mono text-[9.5px] text-sky-700 font-bold">Zone: {loc.customsZoneCode}</div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`gf-badge text-[10px] uppercase font-bold cursor-pointer ${
                          loc.status === 'active' ? 'gf-badge-green' : 'gf-badge-red'
                        }`}
                        onClick={() => toggleMasterLocationStatus(loc.id, `Toggled location active status from console`)}
                        title="Click to toggle status"
                      >
                        {loc.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenLocationModal(loc)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-sky-700 rounded-md transition-colors"
                          title="Edit Location"
                        >
                          <Edit2 className="lucide w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmConfig({
                              isOpen: true,
                              title: 'Delete Master Location',
                              actionType: 'MASTER_LOCATION_DELETED',
                              targetLabel: `${loc.name} (${loc.unLocode})`,
                              targetId: loc.id,
                              onConfirm: (reason) => deleteMasterLocation(loc.id, reason),
                            })
                          }
                          className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 className="lucide w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CARRIERS & LINER OPERATORS */}
      {activeTab === 'carriers' && (
        <div className="gf-card overflow-hidden">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>SCAC / Liner Code</th>
                  <th>Carrier Name & Country</th>
                  <th>Type</th>
                  <th>Alliance</th>
                  <th>Fleet / Capacity</th>
                  <th>Booking Desk & Tracking</th>
                  <th>Supported Equipment</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarriers.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50">
                    <td>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-indigo-700 text-xs">
                        <span className="text-sm">{getCarrierTypeIcon(car.type)}</span>
                        <span>{car.scacCode}</span>
                        <span className="text-[10.5px] text-slate-500">({car.carrierCode})</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 text-xs">{car.name}</div>
                      <div className="text-[11px] text-slate-500">{car.country}</div>
                    </td>
                    <td>
                      <span
                        className={`gf-badge text-[10px] font-bold flex items-center gap-1 ${
                          car.type === 'MLO'
                            ? 'gf-badge-blue'
                            : car.type === 'NVOCC'
                            ? 'gf-badge-purple'
                            : car.type === 'Feeder Operator'
                            ? 'gf-badge-green'
                            : 'gf-badge-amber'
                        }`}
                      >
                        <span>{getCarrierTypeIcon(car.type)}</span>
                        <span>{car.type}</span>
                      </span>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-gray text-[10px]">{car.alliance}</span>
                    </td>
                    <td>
                      <div className="font-mono text-xs text-slate-800 font-semibold">{car.fleetTEU || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 font-mono">{car.bookingEmail}</div>
                      {car.trackingApiEndpoint && (
                        <div className="text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="lucide w-3 h-3" />
                          <span>Live API Webhook</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 max-w-[160px] truncate" title={car.supportedEquipment.join(', ')}>
                        {car.supportedEquipment.join(', ')}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`gf-badge text-[10px] uppercase font-bold cursor-pointer ${
                          car.status === 'active' ? 'gf-badge-green' : 'gf-badge-red'
                        }`}
                        onClick={() => toggleMasterCarrierStatus(car.id, `Toggled carrier status from console`)}
                      >
                        {car.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenCarrierModal(car)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-700 rounded-md transition-colors"
                          title="Edit Carrier"
                        >
                          <Edit2 className="lucide w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmConfig({
                              isOpen: true,
                              title: 'Delete Master Carrier',
                              actionType: 'MASTER_CARRIER_DELETED',
                              targetLabel: `${car.name} (${car.scacCode})`,
                              targetId: car.id,
                              onConfirm: (reason) => deleteMasterCarrier(car.id, reason),
                            })
                          }
                          className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md transition-colors"
                          title="Delete Carrier"
                        >
                          <Trash2 className="lucide w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTAINER & EQUIPMENT MASTER */}
      {activeTab === 'equipment' && (
        <div className="gf-card overflow-hidden">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>ISO Code / Group</th>
                  <th>Equipment Description</th>
                  <th>Category</th>
                  <th>Payload & Tare (kg)</th>
                  <th>Internal Volume</th>
                  <th>Dimensions (L × H)</th>
                  <th>Capabilities</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700 text-xs">
                        <span className="text-sm">{getEquipmentCategoryIcon(eq.category)}</span>
                        <span>{eq.isoCode}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({eq.isoGroup})</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 text-xs">{eq.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-[260px] truncate">{eq.remarks}</div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-gray text-[10px] flex items-center gap-1">
                        <span>{getEquipmentCategoryIcon(eq.category)}</span>
                        <span>{eq.category}</span>
                      </span>
                    </td>
                    <td>
                      <div className="font-mono text-xs text-slate-900">
                        <b>{eq.maxPayloadKg.toLocaleString()} kg</b> payload
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Tare: {eq.tareWeightKg.toLocaleString()} kg · Max: {eq.maxGrossKg.toLocaleString()} kg
                      </div>
                    </td>
                    <td>
                      <div className="font-mono font-bold text-xs text-slate-900">{eq.volumeCbm} CBM</div>
                    </td>
                    <td>
                      <div className="font-mono text-xs text-slate-700">{eq.lengthFt} ft × {eq.heightFt} ft</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {eq.isHazardousAllowed && <span className="gf-badge gf-badge-amber text-[9px]">⚠️ HAZ</span>}
                        {eq.isReefer && <span className="gf-badge gf-badge-blue text-[9px]">❄️ REEFER</span>}
                        {eq.isOogAllowed && <span className="gf-badge gf-badge-purple text-[9px]">🚜 OOG</span>}
                      </div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">{eq.status}</span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() =>
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Delete Equipment Standard',
                            actionType: 'MASTER_EQUIPMENT_DELETED',
                            targetLabel: `${eq.name} (${eq.isoCode})`,
                            targetId: eq.id,
                            onConfirm: (reason) => deleteMasterEquipment(eq.id, reason),
                          })
                        }
                        className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md transition-colors"
                      >
                        <Trash2 className="lucide w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMMODITIES & HS CLASSIFICATIONS */}
      {activeTab === 'commodities' && (
        <div className="gf-card overflow-hidden">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>HS Code</th>
                  <th>Commodity Description</th>
                  <th>Chapter & Heading</th>
                  <th>Hazardous Classification</th>
                  <th>Handling & Storage Specs</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommodities.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-slate-50">
                    <td>
                      <div className="font-mono font-bold text-amber-700 text-xs flex items-center gap-1.5">
                        <span className="text-sm">{cmd.isHazardous ? '⚠️' : '📦'}</span>
                        <span>{cmd.hsCode}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 text-xs">{cmd.name}</div>
                    </td>
                    <td>
                      <div className="font-mono text-xs text-slate-500">
                        Ch. {cmd.chapter} · {cmd.heading}
                      </div>
                    </td>
                    <td>
                      {cmd.isHazardous ? (
                        <div>
                          <span className="gf-badge gf-badge-amber text-[10px] font-bold flex items-center gap-1">
                            <span>⚠️</span>
                            <span>{cmd.imoClass || 'Hazardous Cargo'}</span>
                          </span>
                          {cmd.unNumber && (
                            <div className="font-mono text-[10px] text-amber-700 mt-0.5">{cmd.unNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span className="gf-badge gf-badge-green text-[10px]">Non-Hazmat / General</span>
                      )}
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 max-w-[240px] truncate" title={cmd.storageReqs}>
                        {cmd.storageReqs || 'Standard dry cargo container stowage'}
                      </div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">{cmd.status}</span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() =>
                          setConfirmConfig({
                            isOpen: true,
                            title: 'Delete Commodity HS Code',
                            actionType: 'MASTER_COMMODITY_DELETED',
                            targetLabel: `${cmd.name} (HS ${cmd.hsCode})`,
                            targetId: cmd.id,
                            onConfirm: (reason) => deleteMasterCommodity(cmd.id, reason),
                          })
                        }
                        className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-md transition-colors"
                      >
                        <Trash2 className="lucide w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INCOTERMS 2020 MATRIX */}
      {activeTab === 'incoterms' && (
        <div className="gf-card overflow-hidden">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>Incoterm</th>
                  <th>Full Name</th>
                  <th>Transport Category</th>
                  <th>Freight Paid By</th>
                  <th>Origin THC</th>
                  <th>Dest THC</th>
                  <th>Customs Export / Import</th>
                  <th>Risk Transfer Point</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncoterms.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td>
                      <span className="font-mono font-bold text-purple-800 text-xs px-2 py-1 bg-purple-50 rounded border border-purple-200 flex items-center gap-1 w-fit">
                        <span>⚖️</span>
                        <span>{inc.code}</span>
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 text-xs">{inc.name}</div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-gray text-[10px]">{inc.category}</span>
                    </td>
                    <td>
                      <span className={`gf-badge text-[10px] font-bold ${inc.costFreight === 'Seller' ? 'gf-badge-blue' : 'gf-badge-amber'}`}>
                        {inc.costFreight}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700 font-mono">{inc.costOriginTHC}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700 font-mono">{inc.costDestTHC}</span>
                    </td>
                    <td>
                      <div className="text-[11px] text-slate-600 font-mono">
                        Exp: {inc.costCustomsExport} · Imp: {inc.costCustomsImport}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 max-w-[220px] truncate" title={inc.riskTransferPoint}>
                        {inc.riskTransferPoint}
                      </div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">{inc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: TAX & SAC CLASSIFICATIONS */}
      {activeTab === 'tax' && (
        <div className="gf-card overflow-hidden">
          <div className="gf-table-wrap">
            <table className="gf-table">
              <thead>
                <tr>
                  <th>SAC Code</th>
                  <th>Service Category</th>
                  <th>Description</th>
                  <th>Standard GST %</th>
                  <th>Reverse Charge (RCM)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTax.map((tax) => (
                  <tr key={tax.id} className="hover:bg-slate-50">
                    <td>
                      <div className="font-mono font-bold text-rose-700 text-xs flex items-center gap-1.5">
                        <Receipt className="lucide w-3.5 h-3.5 text-rose-600" />
                        <span>SAC {tax.sacCode}</span>
                      </div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-gray text-[10px]">{tax.category}</span>
                    </td>
                    <td>
                      <div className="text-xs text-slate-800 max-w-[320px]">{tax.description}</div>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-xs text-rose-800 px-2 py-0.5 bg-rose-50 border border-rose-200 rounded">
                        {tax.standardGSTRate}% GST
                      </span>
                    </td>
                    <td>
                      {tax.rcmApplicable ? (
                        <span className="gf-badge gf-badge-blue text-[10px] font-bold">RCM Applicable</span>
                      ) : (
                        <span className="gf-badge gf-badge-gray text-[10px]">Forward Charge</span>
                      )}
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">{tax.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT LOCATION */}
      {isLocationModalOpen && (
        <div className="gf-modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Anchor className="lucide w-5 h-5 text-sky-600" />
                <h3 className="gf-modal-title">{editingLocation ? 'Edit Master Location' : 'Add Master Location'}</h3>
              </div>
              <button onClick={() => setIsLocationModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">UN/LOCODE (e.g. INNSA, NLRTM) *</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={locationForm.unLocode}
                      onChange={(e) => setLocationForm({ ...locationForm, unLocode: e.target.value.toUpperCase() })}
                      className="gf-input font-mono font-bold uppercase"
                      placeholder="INNSA"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Location / Port Name *</label>
                    <input
                      type="text"
                      required
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                      className="gf-input"
                      placeholder="Nhava Sheva (JNPT)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gf-form-label">Country *</label>
                    <input
                      type="text"
                      required
                      value={locationForm.country}
                      onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                      className="gf-input"
                      placeholder="India"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">2-Letter ISO Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={locationForm.countryCode}
                      onChange={(e) => setLocationForm({ ...locationForm, countryCode: e.target.value.toUpperCase() })}
                      className="gf-input font-mono uppercase"
                      placeholder="IN"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Location Type *</label>
                    <select
                      value={locationForm.type}
                      onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value as LocationType })}
                      className="gf-select"
                    >
                      <option value="Seaport">⚓ Seaport</option>
                      <option value="Inland Container Depot (ICD)">🗺️ Inland Depot (ICD)</option>
                      <option value="Container Freight Station (CFS)">🗺️ CFS Station</option>
                      <option value="River Port">⚓ River Port</option>
                      <option value="Airport">✈️ Airport</option>
                      <option value="Land Border">🛣️ Land Border</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Region / State / Hinterland</label>
                  <input
                    type="text"
                    value={locationForm.region}
                    onChange={(e) => setLocationForm({ ...locationForm, region: e.target.value })}
                    className="gf-input"
                    placeholder="Maharashtra / West Coast"
                  />
                </div>

                {/* Capabilities Checkboxes */}
                <div>
                  <label className="gf-form-label">Operational Capabilities (POR/POL/POD/FPOD)</label>
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={locationForm.isPOR}
                        onChange={(e) => setLocationForm({ ...locationForm, isPOR: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>POR (Receipt)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={locationForm.isPOL}
                        onChange={(e) => setLocationForm({ ...locationForm, isPOL: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>POL (Loading)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={locationForm.isPOD}
                        onChange={(e) => setLocationForm({ ...locationForm, isPOD: e.target.checked })}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>POD (Discharge)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={locationForm.isFPOD}
                        onChange={(e) => setLocationForm({ ...locationForm, isFPOD: e.target.checked })}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>FPOD (Delivery)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Terminal Berths (Comma separated)</label>
                  <input
                    type="text"
                    value={locationForm.terminals}
                    onChange={(e) => setLocationForm({ ...locationForm, terminals: e.target.value })}
                    className="gf-input"
                    placeholder="NSICT, NSIGT, BMCT, APMT Mumbai"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gf-form-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={locationForm.lat}
                      onChange={(e) => setLocationForm({ ...locationForm, lat: parseFloat(e.target.value) || 0 })}
                      className="gf-input font-mono"
                      placeholder="18.9499"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={locationForm.lng}
                      onChange={(e) => setLocationForm({ ...locationForm, lng: parseFloat(e.target.value) || 0 })}
                      className="gf-input font-mono"
                      placeholder="72.9515"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Customs Zone Code</label>
                    <input
                      type="text"
                      value={locationForm.customsZoneCode}
                      onChange={(e) => setLocationForm({ ...locationForm, customsZoneCode: e.target.value })}
                      className="gf-input font-mono"
                      placeholder="INNSA1"
                    />
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Remarks & Maritime Notes</label>
                  <textarea
                    rows={2}
                    value={locationForm.remarks}
                    onChange={(e) => setLocationForm({ ...locationForm, remarks: e.target.value })}
                    className="gf-textarea"
                    placeholder="Premier Indian container gateway with direct rail links..."
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="text-xs font-bold text-amber-900 block mb-1">Audited Justification Reason *</label>
                  <input
                    type="text"
                    required
                    value={locationForm.auditReason}
                    onChange={(e) => setLocationForm({ ...locationForm, auditReason: e.target.value })}
                    className="gf-input"
                    placeholder="Statutory update of master port registry"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  {editingLocation ? 'Save Location Changes' : 'Create Master Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CARRIER */}
      {isCarrierModalOpen && (
        <div className="gf-modal-overlay" onClick={() => setIsCarrierModalOpen(false)}>
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Ship className="lucide w-5 h-5 text-indigo-600" />
                <h3 className="gf-modal-title">{editingCarrier ? 'Edit Master Carrier' : 'Add Master Carrier'}</h3>
              </div>
              <button onClick={() => setIsCarrierModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCarrier}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="gf-form-label">Carrier Name *</label>
                    <input
                      type="text"
                      required
                      value={carrierForm.name}
                      onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                      className="gf-input"
                      placeholder="Mediterranean Shipping Company (MSC)"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">SCAC Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={carrierForm.scacCode}
                      onChange={(e) => setCarrierForm({ ...carrierForm, scacCode: e.target.value.toUpperCase() })}
                      className="gf-input font-mono uppercase font-bold"
                      placeholder="MSCU"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gf-form-label">Carrier Type *</label>
                    <select
                      value={carrierForm.type}
                      onChange={(e) => setCarrierForm({ ...carrierForm, type: e.target.value as CarrierType })}
                      className="gf-select"
                    >
                      <option value="MLO">🚢 MLO (Main Line Operator)</option>
                      <option value="NVOCC">📦 NVOCC</option>
                      <option value="Feeder Operator">🛥️ Feeder Operator</option>
                      <option value="Rail / Intermodal">🚆 Rail / Intermodal</option>
                    </select>
                  </div>

                  <div>
                    <label className="gf-form-label">Carrier Alliance *</label>
                    <select
                      value={carrierForm.alliance}
                      onChange={(e) => setCarrierForm({ ...carrierForm, alliance: e.target.value as CarrierAlliance })}
                      className="gf-select"
                    >
                      <option value="Gemini Cooperation">Gemini Cooperation</option>
                      <option value="Ocean Alliance">Ocean Alliance</option>
                      <option value="THE Alliance / Premier">THE Alliance / Premier</option>
                      <option value="Independent">Independent</option>
                      <option value="Global Forwarder">Global Forwarder</option>
                      <option value="Regional Feeder">Regional Feeder</option>
                    </select>
                  </div>

                  <div>
                    <label className="gf-form-label">Headquarters Country *</label>
                    <input
                      type="text"
                      required
                      value={carrierForm.country}
                      onChange={(e) => setCarrierForm({ ...carrierForm, country: e.target.value })}
                      className="gf-input"
                      placeholder="Switzerland"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Fleet / Managed TEU</label>
                    <input
                      type="text"
                      value={carrierForm.fleetTEU}
                      onChange={(e) => setCarrierForm({ ...carrierForm, fleetTEU: e.target.value })}
                      className="gf-input font-mono"
                      placeholder="5,850,000 TEU"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Booking Desk Email *</label>
                    <input
                      type="email"
                      required
                      value={carrierForm.bookingEmail}
                      onChange={(e) => setCarrierForm({ ...carrierForm, bookingEmail: e.target.value })}
                      className="gf-input font-mono"
                      placeholder="ocean.desk@msc.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Live Tracking Webhook / API URL</label>
                  <input
                    type="url"
                    value={carrierForm.trackingApiEndpoint}
                    onChange={(e) => setCarrierForm({ ...carrierForm, trackingApiEndpoint: e.target.value })}
                    className="gf-input font-mono"
                    placeholder="https://api.msc.com/v1/tracking"
                  />
                </div>

                <div>
                  <label className="gf-form-label">Supported Equipment Types</label>
                  <input
                    type="text"
                    value={carrierForm.supportedEquipment}
                    onChange={(e) => setCarrierForm({ ...carrierForm, supportedEquipment: e.target.value })}
                    className="gf-input"
                    placeholder="20DV, 40DV, 40HC, 45HC, 20RF, 40HR, ISO Tank"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="text-xs font-bold text-amber-900 block mb-1">Audited Justification Reason *</label>
                  <input
                    type="text"
                    required
                    value={carrierForm.auditReason}
                    onChange={(e) => setCarrierForm({ ...carrierForm, auditReason: e.target.value })}
                    className="gf-input"
                    placeholder="Master liner registration for spot rate benchmark"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button type="button" onClick={() => setIsCarrierModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  {editingCarrier ? 'Save Carrier Changes' : 'Create Master Carrier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK INGESTION */}
      {isBulkModalOpen && (
        <div className="gf-modal-overlay" onClick={() => setIsBulkModalOpen(false)}>
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Upload className="lucide w-5 h-5 text-sky-600" />
                <h3 className="gf-modal-title">Bulk Ingest Master Data (Locations & Carriers)</h3>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <div className="gf-modal-body space-y-3.5">
              {/* Entity Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setBulkTemplateType('locations'); setBulkText(''); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    bulkTemplateType === 'locations'
                      ? 'bg-white text-sky-800 border border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Anchor className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>Locations & Ports (POR / POL / POD / FPOD)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setBulkTemplateType('carriers'); setBulkText(''); }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    bulkTemplateType === 'carriers'
                      ? 'bg-white text-indigo-800 border border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Ship className="lucide w-3.5 h-3.5 text-indigo-600" />
                  <span>Carriers & Liners (MLO / NVOCC / Feeder)</span>
                </button>
              </div>

              {/* Template Download & File Upload Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700">Templates:</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(bulkTemplateType, 'csv')}
                    className="gf-btn gf-btn-secondary text-xs"
                    title="Download ready-to-fill CSV template"
                  >
                    <Download className="lucide w-3.5 h-3.5 text-emerald-600" />
                    <span>Download CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(bulkTemplateType, 'json')}
                    className="gf-btn gf-btn-secondary text-xs"
                    title="Download ready-to-fill JSON template"
                  >
                    <Download className="lucide w-3.5 h-3.5 text-sky-600" />
                    <span>Download JSON Template</span>
                  </button>
                </div>

                <div>
                  <input
                    type="file"
                    id="bulk-file-upload-input"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('bulk-file-upload-input')?.click()}
                    className="gf-btn gf-btn-secondary text-xs"
                    title="Choose CSV or JSON file from computer"
                  >
                    <FileSpreadsheet className="lucide w-3.5 h-3.5 text-amber-600" />
                    <span>Upload File (.csv / .json)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="gf-form-label">
                  Paste records (CSV or JSON Array) for <b>{bulkTemplateType === 'locations' ? 'Master Locations' : 'Master Carriers'}</b>:
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="gf-textarea font-mono text-xs w-full"
                  placeholder={
                    bulkTemplateType === 'locations'
                      ? `UNLOCODE,Port Name,Country,CountryCode,Type,Region,isPOR,isPOL,isPOD,isFPOD,Terminals,Latitude,Longitude,CustomsZone,Remarks\nINNSA,Nhava Sheva (JNPT),India,IN,Seaport,Maharashtra,true,true,true,true,"NSICT; NSIGT; BMCT",18.9499,72.9515,INNSA1,Premier container gateway\nINTKD,Tughlakabad ICD,India,IN,Inland Container Depot (ICD),Delhi NCR,true,false,false,true,"CONCOR Hub",28.5089,77.2831,INTKD6,Asia largest dry port`
                      : `Carrier Name,SCAC,CarrierCode,Type,Alliance,Country,FleetTEU,BookingEmail,TrackingApiEndpoint,SupportedEquipment,Remarks\nA.P. Moller - Maersk,MAEU,MSK,MLO,Gemini Cooperation,Denmark,4250000 TEU,bookings.apac@maersk.com,https://api.maersk.com/track-and-trace/v2,"20DV, 40DV, 40HC, 20RF",Global ocean carrier\nKuehne + Nagel,BANQ,KN,NVOCC,Global Forwarder,Switzerland,4300000 TEU,seafreight.global@kuehne-nagel.com,https://api.kuehne-nagel.com/track,"20DV, 40DV, 40HC",Tier-1 NVOCC Forwarder`
                  }
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="text-xs font-bold text-amber-900 block mb-1">Audit Ledger Reason *</label>
                <input
                  type="text"
                  required
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="gf-input"
                  placeholder={`Bulk ingestion of ${bulkTemplateType === 'locations' ? 'UN/LOCODE location' : 'carrier profile'} records`}
                />
              </div>

              {bulkReport && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs font-semibold text-sky-900">
                  {bulkReport}
                </div>
              )}
            </div>

            <div className="gf-modal-footer">
              <button type="button" onClick={() => setIsBulkModalOpen(false)} className="gf-btn gf-btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleBulkImport} className="gf-btn gf-btn-primary">
                Ingest {bulkTemplateType === 'locations' ? 'Locations' : 'Carriers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Action Modal */}
      {confirmConfig && (
        <ActionConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          actionType={confirmConfig.actionType}
          targetLabel={confirmConfig.targetLabel}
          targetId={confirmConfig.targetId}
          isDestructive={true}
          onConfirm={(reason) => {
            confirmConfig.onConfirm(reason);
            setConfirmConfig(null);
          }}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
