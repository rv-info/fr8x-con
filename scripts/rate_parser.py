#!/usr/bin/env python3
"""
FR8X Enterprise Logistics — Lightweight Natural Language Rate Parser Engine (Python)
Zero third-party dependencies — utilizes Python Standard Library only (re, json, sys, datetime).
Extracts freight rate parameters and maps to standard schema:
SEQ | SERVICE PROVIDER | LINE | POR | POL | POD | FPOD | 20DV (USD) | 20TYPE | 40HC (USD) | 40TYPE | F/T | DATE | TYPE | TT | ROUTING | REMARKS
"""

import re
import json
import sys
from datetime import datetime

CARRIER_ALIASES = {
    'maersk': 'Maersk Line',
    'maersk line': 'Maersk Line',
    'maeu': 'Maersk Line',
    'msc': 'Mediterranean Shipping Company',
    'mediterranean shipping company': 'Mediterranean Shipping Company',
    'mscu': 'Mediterranean Shipping Company',
    'cma cgm': 'CMA CGM S.A.',
    'cma': 'CMA CGM S.A.',
    'cmdu': 'CMA CGM S.A.',
    'hapag lloyd': 'Hapag-Lloyd AG',
    'hapag-lloyd': 'Hapag-Lloyd AG',
    'hapag': 'Hapag-Lloyd AG',
    'hlcu': 'Hapag-Lloyd AG',
    'evergreen': 'Evergreen Marine Corporation',
    'eglv': 'Evergreen Marine Corporation',
    'cosco': 'COSCO Shipping Lines',
    'cosu': 'COSCO Shipping Lines',
    'one': 'Ocean Network Express',
    'ocean network express': 'Ocean Network Express',
    'oney': 'Ocean Network Express',
    'yang ming': 'Yang Ming Marine Transport',
    'yangming': 'Yang Ming Marine Transport',
    'ymlu': 'Yang Ming Marine Transport',
    'hmm': 'HMM Co. Ltd.',
    'hdmu': 'HMM Co. Ltd.',
    'zim': 'ZIM Integrated Shipping',
    'zimu': 'ZIM Integrated Shipping',
    'wan hai': 'Wan Hai Lines',
    'wanhai': 'Wan Hai Lines',
    'whlc': 'Wan Hai Lines',
    'pil': 'Pacific International Lines',
    'pabv': 'Pacific International Lines',
    'oocl': 'OOCL (Orient Overseas Container Line)',
    'arkas': 'Arkas Line',
    'arku': 'Arkas Line',
}

PORT_ALIASES = {
    'nhava sheva': ('Nhava Sheva (JNPT)', 'INNSA', True),
    'jnpt': ('Nhava Sheva (JNPT)', 'INNSA', True),
    'nsa': ('Nhava Sheva (JNPT)', 'INNSA', True),
    'innsa': ('Nhava Sheva (JNPT)', 'INNSA', True),
    'mumbai': ('Mumbai', 'INBOM', True),
    'inbom': ('Mumbai', 'INBOM', True),
    'mundra': ('Mundra', 'INMUN', True),
    'inmun': ('Mundra', 'INMUN', True),
    'kandla': ('Kandla (Deendayal Port)', 'INKTP', True),
    'chennai': ('Chennai (Madras)', 'INMAA', True),
    'madras': ('Chennai (Madras)', 'INMAA', True),
    'inmaa': ('Chennai (Madras)', 'INMAA', True),
    'cochin': ('Kochi (Cochin)', 'INCOK', True),
    'kochi': ('Kochi (Cochin)', 'INCOK', True),
    'pipavav': ('Pipavav', 'INPAV', True),
    'hazira': ('Hazira', 'INHAZ', True),
    'kolkata': ('Kolkata', 'INCCU', True),
    'delhi': ('Delhi ICD (Tughlakabad)', 'INDEL', False),
    'delhi icd': ('Delhi ICD (Tughlakabad)', 'INDEL', False),
    'pune': ('Pune ICD', 'INPNQ', False),
    'pune icd': ('Pune ICD', 'INPNQ', False),
    'ludhiana': ('Ludhiana ICD', 'INLUH', False),
    'rotterdam': ('Rotterdam', 'NLRTM', True),
    'rtm': ('Rotterdam', 'NLRTM', True),
    'nlrtm': ('Rotterdam', 'NLRTM', True),
    'hamburg': ('Hamburg', 'DEHAM', True),
    'ham': ('Hamburg', 'DEHAM', True),
    'deham': ('Hamburg', 'DEHAM', True),
    'antwerp': ('Antwerp', 'BEANR', True),
    'anr': ('Antwerp', 'BEANR', True),
    'felixstowe': ('Felixstowe', 'GBFXT', True),
    'fxt': ('Felixstowe', 'GBFXT', True),
    'southampton': ('Southampton', 'GBSOU', True),
    'london gateway': ('London Gateway', 'GBLGP', True),
    'le havre': ('Le Havre', 'FRLEH', True),
    'barcelona': ('Barcelona', 'ESBCN', True),
    'valencia': ('Valencia', 'ESVLC', True),
    'genoa': ('Genoa', 'ITGOA', True),
    'jebel ali': ('Jebel Ali (Dubai)', 'AEJEA', True),
    'dubai': ('Jebel Ali (Dubai)', 'AEJEA', True),
    'jea': ('Jebel Ali (Dubai)', 'AEJEA', True),
    'aejea': ('Jebel Ali (Dubai)', 'AEJEA', True),
    'abu dhabi': ('Abu Dhabi (Khalifa Port)', 'AEAUH', True),
    'jeddah': ('Jeddah', 'SAJED', True),
    'dammam': ('Dammam (King Abdul Aziz)', 'SADMM', True),
    'singapore': ('Singapore', 'SGSIN', True),
    'sin': ('Singapore', 'SGSIN', True),
    'port klang': ('Port Klang', 'MYPKG', True),
    'tanjung pelepas': ('Tanjung Pelepas', 'MYTPP', True),
    'shanghai': ('Shanghai', 'CNSHA', True),
    'sha': ('Shanghai', 'CNSHA', True),
    'ningbo': ('Ningbo-Zhoushan', 'CNNBO', True),
    'shenzhen': ('Shenzhen (Yantian)', 'CNSZN', True),
    'qingdao': ('Qingdao', 'CNQIN', True),
    'los angeles': ('Los Angeles / Long Beach', 'USLAX', True),
    'lax': ('Los Angeles / Long Beach', 'USLAX', True),
    'new york': ('New York / New Jersey', 'USNYC', True),
    'nyc': ('New York / New Jersey', 'USNYC', True),
    'savannah': ('Savannah', 'USSAV', True),
    'houston': ('Houston', 'USHOU', True),
}

MONTHS_MAP = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12',
}

def normalize_date(text):
    if not text:
        return ""
    text = text.strip()
    
    # YYYY-MM-DD
    m = re.match(r'^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$', text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
        
    # DD-MM-YYYY
    m = re.match(r'^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$', text)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
        
    # DD-Mon-YYYY
    m = re.match(r'^(\d{1,2})[-/\s]+([a-zA-Z]{3,9})[-/\s]+(\d{4})$', text)
    if m:
        mon = MONTHS_MAP.get(m.group(2).lower())
        if mon:
            return f"{m.group(3)}-{mon}-{int(m.group(1)):02d}"
            
    return ""

def parse_single_instruction(text):
    lower = text.lower()
    
    # 1. Carrier
    carrier = ""
    for alias in sorted(CARRIER_ALIASES.keys(), key=len, reverse=True):
        if re.search(r'\b' + re.escape(alias) + r'\b', lower):
            carrier = CARRIER_ALIASES[alias]
            break
            
    # 2. Port Matching
    por, pol, pod, fpod = "", "", "", ""
    
    # Check explicit labels
    m_pol = re.search(r'\b(?:pol|loading\s+port|from)\s*[:=-]?\s*([a-zA-Z\s/()\-]+?)(?=(?:\s+to\b|pod|fpod|20|40|valid|\$|\n|,|$))', text, re.I)
    if m_pol:
        p_name = m_pol.group(1).strip().lower()
        if p_name in PORT_ALIASES:
            pol = PORT_ALIASES[p_name][0]
            
    m_pod = re.search(r'\b(?:pod|discharge\s+port|destination|to)\s*[:=-]?\s*([a-zA-Z\s/()\-]+?)(?=(?:fpod|20|40|valid|ft|transit|via|\$|\n|,|$))', text, re.I)
    if m_pod:
        p_name = m_pod.group(1).strip().lower()
        if p_name in PORT_ALIASES:
            pod = PORT_ALIASES[p_name][0]
            
    if not pol or not pod:
        # Route match "from X to Y" or "X -> Y"
        m_route = re.search(r'\b(?:from\s+)?([A-Za-z\s/()\-]{2,25}?)\s*(?:-->|->|—|–|-|\bto\b)\s*([A-Za-z\s/()\-]{2,25}?)(?=(?:,|\.|\s+20|\s+40|\s+valid|\s+\$|$))', text, re.I)
        if m_route:
            p1 = m_route.group(1).strip().lower()
            p2 = m_route.group(2).strip().lower()
            if p1 in PORT_ALIASES and not pol:
                pol = PORT_ALIASES[p1][0]
            if p2 in PORT_ALIASES and not pod:
                pod = PORT_ALIASES[p2][0]
                
    if not pol or not pod:
        for p_alias, p_val in PORT_ALIASES.items():
            if re.search(r'\b' + re.escape(p_alias) + r'\b', lower):
                if not pol:
                    pol = p_val[0]
                elif not pod and p_val[0] != pol:
                    pod = p_val[0]
                    
    por = pol
    fpod = pod
    
    # 3. Pricing & Equipment
    d20 = ""
    d20_type = "20DV"
    h40 = ""
    h40_type = "40HC"
    
    m_20 = re.search(r'\b(20(?:ft|\'|\s*feet)?(?:\s*(?:dv|gp|dry|rf|hc|ot|fr|tk|std))?)\s*[:=-]?\s*(?:\$|usd|eur|inr)?\s*(\d{2,5}(?:[.,]\d{1,2})?)\b', text, re.I)
    if m_20:
        raw_t = m_20.group(1).upper()
        d20 = float(m_20.group(2).replace(',', ''))
        if 'RF' in raw_t: d20_type = '20RF'
        elif 'OT' in raw_t: d20_type = '20OT'
        elif 'FR' in raw_t: d20_type = '20FR'
        elif 'HC' in raw_t: d20_type = '20HC'
        else: d20_type = '20DV'
        
    m_40 = re.search(r'\b(40(?:ft|\'|\s*feet)?(?:\s*(?:hc|hq|high\s*cube|dv|rf|ot|fr))?)\s*[:=-]?\s*(?:\$|usd|eur|inr)?\s*(\d{2,5}(?:[.,]\d{1,2})?)\b', text, re.I)
    if m_40:
        raw_t = m_40.group(1).upper()
        h40 = float(m_40.group(2).replace(',', ''))
        if 'DV' in raw_t: h40_type = '40DV'
        elif 'RF' in raw_t: h40_type = '40RF'
        elif 'OT' in raw_t: h40_type = '40OT'
        elif 'FR' in raw_t: h40_type = '40FR'
        else: h40_type = '40HC'
        
    if not d20 and not h40:
        m_dual = re.search(r'(?:\$|usd\s*)?(\d{3,5})\s*(?:\/|\s+and\s+|\s*,\s*)\s*(?:\$|usd\s*)?(\d{3,5})', text, re.I)
        if m_dual:
            p1 = float(m_dual.group(1))
            p2 = float(m_dual.group(2))
            d20 = min(p1, p2)
            h40 = max(p1, p2)
            
    # 4. Free Time
    free_time = "14 days combined"
    m_ft = re.search(r'\b(?:free\s*time|ft|f\/t|detention|demurrage)?\s*[:=-]?\s*(\d{1,2})\s*(?:days?|d)\s*(?:free\s*time|combined|detention|demurrage)?\b', text, re.I)
    if m_ft and any(k in lower for k in ['free', 'ft', 'f/t', 'detention', 'demurrage', 'days']):
        free_time = f"{m_ft.group(1)} days combined"
        
    # 5. Validity Date
    valid_date = ""
    m_val = re.search(r'\b(?:valid\s*(?:till|to|until|through)?|validity|expiry|expires)\s*[:=-]?\s*([0-9a-zA-Z\s/.-]{5,20})', text, re.I)
    if m_val:
        valid_date = normalize_date(m_val.group(1))
    if not valid_date:
        m_stand = re.search(r'\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.\s][a-zA-Z]{3,9}[-/.\s]\d{4})\b', text)
        if m_stand:
            valid_date = normalize_date(m_stand.group(1))
            
    # 6. Transit Time
    transit_time = "28 days"
    m_tt = re.search(r'\b(?:transit(?:\s*time)?|tt)\s*[:=-]?\s*(\d{1,3})\s*(?:days?|d)?\b', text, re.I)
    if m_tt:
        transit_time = f"{m_tt.group(1)} days"
        
    # 7. Routing & Rate Type
    routing = "Direct Ocean Service"
    m_via = re.search(r'\b(?:via|ts\s*via|transshipment\s*via)\s*([a-zA-Z\s/()\-]+?)(?=(?:,|\.|\s+valid|\s+includes|$))', text, re.I)
    if m_via:
        routing = f"TS via {m_via.group(1).strip()}"
    elif re.search(r'\bdirect\b', lower):
        routing = "Direct Ocean Service"
        
    rate_type = "Direct Spot"
    if 'contract' in lower: rate_type = "Contract"
    elif 'nac' in lower: rate_type = "NAC"
    elif 'coloader' in lower: rate_type = "Coloader"
    
    # 8. Remarks & Surcharges
    remarks_items = []
    kw_list = ['thc', 'baf', 'isps', 'seal', 'gri', 'pss', 'subject to', 'includes', 'guaranteed', 'non-hazardous', 'haz']
    for clause in re.split(r'[,;.\n]+', text):
        c = clause.strip()
        if any(k in c.lower() for k in kw_list):
            remarks_items.append(c)
    remarks = " · ".join(remarks_items) if remarks_items else "Subject to space & equipment availability"
    
    return {
        "carrier": carrier,
        "por": por,
        "pol": pol,
        "pod": pod,
        "fpod": fpod,
        "d20": d20,
        "d20Type": d20_type,
        "h40": h40,
        "h40Type": h40_type,
        "freeTime": free_time,
        "validDate": valid_date,
        "transitTime": transit_time,
        "routing": routing,
        "rateType": rate_type,
        "remarks": remarks
    }

def main():
    if len(sys.argv) > 1:
        raw = " ".join(sys.argv[1:])
    else:
        raw = sys.stdin.read()
        
    res = parse_single_instruction(raw)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
