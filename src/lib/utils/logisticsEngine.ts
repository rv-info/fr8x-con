// FR8X-CON Logistics Domain Engine
// Single source of truth for transport modes, equipment types, Incoterms rules, and dynamic charge heads

export type TransportMode =
  | "fcl"
  | "lcl"
  | "air"
  | "break_bulk"
  | "project_cargo"
  | "roro"
  | "rail"
  | "road"
  | "multimodal";

export type IncotermCode =
  | "EXW"
  | "FCA"
  | "FAS"
  | "FOB"
  | "CFR"
  | "CIF"
  | "CPT"
  | "CIP"
  | "DAP"
  | "DPU"
  | "DDP";

export type FclEquipmentType =
  | "20ft_dv"
  | "40ft_dv"
  | "40ft_hc"
  | "45ft_hc"
  | "open_top"
  | "20ft_fr"
  | "40ft_fr"
  | "40ft_fr_collapsible"
  | "20ft_fb"
  | "40ft_fb"
  | "platform"
  | "reefer"
  | "tank_container"
  | "iso_tank"
  | "special_equipment";

export type AirCargoCategory =
  | "general"
  | "dangerous_goods"
  | "express"
  | "courier"
  | "charter"
  | "perishable"
  | "live_animals"
  | "valuable";

export type BreakBulkCategory =
  | "heavy_lift"
  | "oog_cargo"
  | "industrial_machinery"
  | "steel_products"
  | "windmill_components"
  | "railway_wagons"
  | "boats_yachts"
  | "project_logistics";

export type RailServiceType =
  | "container_rail"
  | "wagons"
  | "full_rake"
  | "parcel_services"
  | "specialized_rail";

export type RoadTransportType =
  | "ftl"
  | "ltl"
  | "flatbed_trailer"
  | "low_bed_trailer"
  | "hydraulic_axles"
  | "multi_axle"
  | "reefer_truck"
  | "specialized_transport";

export type RoRoVehicleType =
  | "drivable_vehicle"
  | "towable_mafi"
  | "heavy_construction_equipment"
  | "trucks_buses"
  | "static_cargo_on_mafi";

export interface TransportModeConfig {
  id: TransportMode;
  label: string;
  category: "Sea" | "Air" | "Land" | "Combined";
  description: string;
  iconName: string;
}

export const TRANSPORT_MODES: TransportModeConfig[] = [
  {
    id: "fcl",
    label: "Ocean Freight – FCL",
    category: "Sea",
    description: "Full Container Load for standard, reefer, or special ISO containers",
    iconName: "Ship",
  },
  {
    id: "lcl",
    label: "Ocean Freight – LCL",
    category: "Sea",
    description: "Less than Container Load based on CBM / Weight (W/M)",
    iconName: "Boxes",
  },
  {
    id: "air",
    label: "Air Freight",
    category: "Air",
    description: "General, express, charter, perishable, or live animal air cargo",
    iconName: "Plane",
  },
  {
    id: "break_bulk",
    label: "Break Bulk",
    category: "Sea",
    description: "Non-containerized heavy lift, steel, or oversized breakbulk cargo",
    iconName: "PackageCheck",
  },
  {
    id: "project_cargo",
    label: "Project Cargo",
    category: "Sea",
    description: "Complex industrial equipment, windmills, and heavy plant logistics",
    iconName: "Factory",
  },
  {
    id: "roro",
    label: "RoRo (Roll-on/Roll-off)",
    category: "Sea",
    description: "Wheeled or tracked self-propelled/towable vehicles and machinery",
    iconName: "Truck",
  },
  {
    id: "rail",
    label: "Rail Freight",
    category: "Land",
    description: "Container rail, wagon loads, full rakes, and parcel movements",
    iconName: "Train",
  },
  {
    id: "road",
    label: "Road Freight",
    category: "Land",
    description: "FTL, LTL, low-bed trailers, hydraulic axles, and reefer trucks",
    iconName: "Container",
  },
  {
    id: "multimodal",
    label: "Multimodal Shipments",
    category: "Combined",
    description: "Integrated end-to-end multi-leg sea/rail/road transport",
    iconName: "GitMerge",
  },
];

export const FCL_EQUIPMENT_TYPES: { id: FclEquipmentType; label: string; code: string }[] = [
  { id: "20ft_dv", label: "20' Dry Van (20'DV)", code: "20DV" },
  { id: "40ft_dv", label: "40' Dry Van (40'DV)", code: "40DV" },
  { id: "40ft_hc", label: "40' High Cube (40'HC)", code: "40HC" },
  { id: "45ft_hc", label: "45' High Cube (45'HC)", code: "45HC" },
  { id: "open_top", label: "Open Top Container (OT)", code: "20OT/40OT" },
  { id: "20ft_fr", label: "20' Flat Rack Container (20'FR)", code: "20FR" },
  { id: "40ft_fr", label: "40' Flat Rack Container (40'FR)", code: "40FR" },
  { id: "40ft_fr_collapsible", label: "40' Collapsible Flat Rack (40'CFR)", code: "40CFR" },
  { id: "20ft_fb", label: "20' Flat Bed (20'FB)", code: "20FB" },
  { id: "40ft_fb", label: "40' Flat Bed (40'FB)", code: "40FB" },
  { id: "platform", label: "Platform Container", code: "PL" },
  { id: "reefer", label: "Reefer Container (RF)", code: "20RF/40RF" },
  { id: "tank_container", label: "Tank Container", code: "TK" },
  { id: "iso_tank", label: "ISO Tank Container", code: "ISO-TK" },
  { id: "special_equipment", label: "Special / Customized Equipment", code: "SPEC" },
];

export const AIR_CARGO_CATEGORIES: { id: AirCargoCategory; label: string }[] = [
  { id: "general", label: "General Cargo" },
  { id: "dangerous_goods", label: "Dangerous Goods (DG)" },
  { id: "express", label: "Express Freight" },
  { id: "courier", label: "Courier / Small Parcel" },
  { id: "charter", label: "Air Charter Service" },
  { id: "perishable", label: "Perishable Cargo (Temp-Controlled)" },
  { id: "live_animals", label: "Live Animals (AVI)" },
  { id: "valuable", label: "Valuable Cargo (VAL)" },
];

export const BREAK_BULK_CATEGORIES: { id: BreakBulkCategory; label: string }[] = [
  { id: "heavy_lift", label: "Heavy Lift Heavy Machinery" },
  { id: "oog_cargo", label: "Out of Gauge (OOG) Cargo" },
  { id: "industrial_machinery", label: "Industrial Machinery & Plants" },
  { id: "steel_products", label: "Steel Coils / Pipes / Structural Steel" },
  { id: "windmill_components", label: "Windmill Turbines & Blades" },
  { id: "railway_wagons", label: "Railway Wagons & Locomotives" },
  { id: "boats_yachts", label: "Boats & Yachts" },
  { id: "project_logistics", label: "Turnkey Project Logistics" },
];

export const RAIL_SERVICE_TYPES: { id: RailServiceType; label: string }[] = [
  { id: "container_rail", label: "Container Rail Movement (CONCOR/Private)" },
  { id: "wagons", label: "Wagon Load (BoxN / BCN / BRN)" },
  { id: "full_rake", label: "Full Rake Train Charter" },
  { id: "parcel_services", label: "Express Rail Parcel Service" },
  { id: "specialized_rail", label: "Specialized Rail Transport" },
];

export const ROAD_TRANSPORT_TYPES: { id: RoadTransportType; label: string }[] = [
  { id: "ftl", label: "Full Truckload (FTL)" },
  { id: "ltl", label: "Less than Truckload (LTL)" },
  { id: "flatbed_trailer", label: "Flatbed / Highbed Trailer" },
  { id: "low_bed_trailer", label: "Low Bed Trailer" },
  { id: "hydraulic_axles", label: "Hydraulic Multi-Axle Trailer" },
  { id: "multi_axle", label: "Multi-Axle Vehicle" },
  { id: "reefer_truck", label: "Reefer / Temperature Controlled Truck" },
  { id: "specialized_transport", label: "Hazmat / Heavy Specialized Vehicle" },
];

export const RORO_VEHICLE_TYPES: { id: RoRoVehicleType; label: string }[] = [
  { id: "drivable_vehicle", label: "Self-Propelled / Drivable Vehicle (Cars, Vans, Buses)" },
  { id: "towable_mafi", label: "Towable Unit on Mafi Trailer" },
  { id: "heavy_construction_equipment", label: "Heavy Construction / Earthmoving Machinery" },
  { id: "trucks_buses", label: "Commercial Trucks & Buses" },
  { id: "static_cargo_on_mafi", label: "Static Heavy Cargo Stowed on Mafi" },
];

// Incoterms 2020 Matrix
export interface IncotermResponsibility {
  code: IncotermCode;
  name: string;
  sellerResponsibility: string[];
  buyerResponsibility: string[];
  applicableChargeHeads: string[];
}

export const INCOTERMS_RULES: Record<IncotermCode, IncotermResponsibility> = {
  EXW: {
    code: "EXW",
    name: "Ex Works (Named Place)",
    sellerResponsibility: ["Make goods available at factory / warehouse"],
    buyerResponsibility: ["Origin Haulage", "Export Customs", "OTHC", "Main Freight", "Cargo Insurance", "DTHC", "Import Customs", "Final Delivery"],
    applicableChargeHeads: [
      "Origin Haulage / Trucking",
      "Export Customs Brokerage",
      "Terminal Handling - Origin (OTHC)",
      "Main Carriage Freight (Ocean / Air / Road / Rail)",
      "Cargo Insurance",
      "Terminal Handling - Destination (DTHC)",
      "Import Customs Clearance",
      "Destination Delivery Haulage",
    ],
  },
  FCA: {
    code: "FCA",
    name: "Free Carrier (Named Place)",
    sellerResponsibility: ["Export Customs Clearance", "Origin Transport to Named Carrier Site"],
    buyerResponsibility: ["OTHC", "Main Freight", "Cargo Insurance", "DTHC", "Import Customs", "Final Delivery"],
    applicableChargeHeads: [
      "Terminal Handling - Origin (OTHC)",
      "Main Carriage Freight",
      "Cargo Insurance",
      "Terminal Handling - Destination (DTHC)",
      "Import Customs Clearance",
      "Destination Delivery",
    ],
  },
  FAS: {
    code: "FAS",
    name: "Free Alongside Ship (Port of Shipment)",
    sellerResponsibility: ["Export Customs Clearance", "Origin Transport Alongside Ship"],
    buyerResponsibility: ["OTHC (Vessel Loading)", "Ocean Freight", "Cargo Insurance", "DTHC", "Import Customs", "Destination Delivery"],
    applicableChargeHeads: [
      "Vessel Loading / OTHC",
      "Ocean Freight Rate",
      "Cargo Insurance",
      "DTHC",
      "Import Customs Clearance",
      "Destination Haulage",
    ],
  },
  FOB: {
    code: "FOB",
    name: "Free On Board (Port of Shipment)",
    sellerResponsibility: ["Origin Trucking", "Export Customs Clearance", "OTHC (Loaded on Board)"],
    buyerResponsibility: ["Ocean Freight", "Cargo Insurance", "DTHC", "Import Customs", "Destination Delivery"],
    applicableChargeHeads: [
      "Ocean Freight Rate (All-in)",
      "BAF / CAF / ISPS Surcharges",
      "Cargo Insurance",
      "Terminal Handling - Destination (DTHC)",
      "Import Customs Clearance",
      "Destination Delivery",
    ],
  },
  CFR: {
    code: "CFR",
    name: "Cost and Freight (Port of Destination)",
    sellerResponsibility: ["Origin Transport", "Export Customs", "OTHC", "Main Ocean Freight"],
    buyerResponsibility: ["Cargo Insurance", "DTHC", "Import Customs", "Final Delivery"],
    applicableChargeHeads: [
      "Cargo Insurance",
      "Terminal Handling - Destination (DTHC)",
      "Import Customs Clearance",
      "Destination Delivery Haulage",
    ],
  },
  CIF: {
    code: "CIF",
    name: "Cost, Insurance and Freight (Port of Destination)",
    sellerResponsibility: ["Origin Transport", "Export Customs", "OTHC", "Main Ocean Freight", "Marine Cargo Insurance"],
    buyerResponsibility: ["DTHC", "Import Customs", "Final Delivery"],
    applicableChargeHeads: [
      "Terminal Handling - Destination (DTHC)",
      "Import Customs Clearance",
      "Destination Delivery Haulage",
    ],
  },
  CPT: {
    code: "CPT",
    name: "Carriage Paid To (Named Place of Destination)",
    sellerResponsibility: ["Origin Transport", "Export Customs", "OTHC", "Main Freight (Air/Road/Sea)"],
    buyerResponsibility: ["Cargo Insurance", "Import Customs", "Final Delivery (if beyond named place)"],
    applicableChargeHeads: [
      "Cargo Insurance",
      "Import Customs Clearance",
      "Final Destination Haulage",
    ],
  },
  CIP: {
    code: "CIP",
    name: "Carriage and Insurance Paid To (Named Place of Destination)",
    sellerResponsibility: ["Origin Transport", "Export Customs", "OTHC", "Main Freight", "Comprehensive Cargo Insurance"],
    buyerResponsibility: ["Import Customs Clearance", "Final Delivery (if beyond named place)"],
    applicableChargeHeads: [
      "Import Customs Clearance",
      "Final Delivery Haulage",
    ],
  },
  DAP: {
    code: "DAP",
    name: "Delivered at Place (Named Destination)",
    sellerResponsibility: ["Origin Haulage", "Export Customs", "OTHC", "Main Freight", "DTHC", "Destination Delivery to Door"],
    buyerResponsibility: ["Import Customs Clearance & Duties", "Unloading at destination"],
    applicableChargeHeads: [
      "Import Customs Clearance",
      "Import Duties & Taxes",
      "Unloading Charges at Destination",
    ],
  },
  DPU: {
    code: "DPU",
    name: "Delivered at Place Unloaded (Named Terminal/Place)",
    sellerResponsibility: ["Origin Haulage", "Export Customs", "OTHC", "Main Freight", "DTHC", "Destination Delivery", "Unloading at Destination"],
    buyerResponsibility: ["Import Customs Clearance & Duties"],
    applicableChargeHeads: [
      "Import Customs Clearance",
      "Import Duties & Taxes",
    ],
  },
  DDP: {
    code: "DDP",
    name: "Delivered Duty Paid (Named Place of Destination)",
    sellerResponsibility: ["All-inclusive Door-to-Door", "Export Customs", "Main Freight", "Import Customs", "Import Duties & Taxes", "Final Delivery"],
    buyerResponsibility: ["Unloading at buyer premises"],
    applicableChargeHeads: [
      "All-in Door Delivery Rate",
      "Unloading Charges at Destination",
    ],
  },
};

// Calculations Helper Functions
export function calculateAirVolumetricWeight(lengthCm: number, widthCm: number, heightCm: number, packages: number = 1, divisor: number = 6000): number {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  return Number((((lengthCm * widthCm * heightCm) / divisor) * packages).toFixed(2));
}

export function calculateChargeableWeight(grossWeightKg: number, volumetricWeightKg: number): number {
  return Math.max(grossWeightKg || 0, volumetricWeightKg || 0);
}

export function calculateLclWM(cbm: number, weightTon: number): { wmBasis: number; billingUnit: "CBM" | "TON" } {
  const safeCbm = cbm || 0;
  const safeTon = weightTon || 0;
  if (safeCbm >= safeTon) {
    return { wmBasis: safeCbm, billingUnit: "CBM" };
  } else {
    return { wmBasis: safeTon, billingUnit: "TON" };
  }
}
