import React, { useState, useMemo, useEffect, useRef } from "react";
import type { College } from "../types";
import CollegeCard from "../components/CollegeCard";

import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";


/* ================= TYPES ================= */
type Filters = {
  college: string;
  city: string;
  course: string;
  stream: string;
  collegeType: string;
  accreditation: string;
  minRating: number;
  region?: string;
  feeRange: string;
};

interface ListingPageProps {
  colleges: College[];
  compareList: string[];
  onCompareToggle: (id: string) => void;
  onOpenApplyNow: () => void;
  onOpenBrochure: () => void;
  initialFilters?: { college?: string; city?: string; course?: string };
}
const REGION_MAP: Record<string, { cities: string[] }> = {
  "Delhi NCR": {
    cities: [
      "Delhi", "New Delhi", "Noida", "Greater Noida", "Alpha Greater Noida",
      "Gurgaon", "Faridabad", "Ghaziabad", "Dwarka", "Rohini",
      "Hauz Khas", "Kalkaji", "PitamPura", "Vasant Vihar", "Lodhi Garden",
      "I A Surajpur", "Gurugram",
    ]
  },
  "Delhi": {
    cities: [
      "Delhi", "New Delhi", "Hauz Khas", "Kalkaji", "PitamPura",
      "Vasant Vihar", "Lodhi Garden", "Dwarka", "Rohini",
    ]
  },
  "Mumbai": {
    cities: ["Mumbai", "Powai", "Kurla", "Kharghar", "Navi Mumbai", "Thane", "Andheri", "Borivali"],
  },
  "Pune": {
    cities: ["Pune", "Pimpri P F", "Pimpri", "Kothrud", "Pirangut", "Karjat Raigarh MH", "Wakad"],
  },
  "Bangalore": {
    cities: ["Bangalore", "Bengaluru", "Electronic City", "Dommasandra", "Giripeth", "Bannerghatta"],
  },
};

interface FilterSidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClearFilters: () => void;
  forceShow?: boolean;
  colleges: College[];
  compareList: string[];
}

/* ================= UTILS ================= */

const normalize = (s?: string) =>
  typeof s === "string"
    ? s.toLowerCase().replace(/\s+/g, "").replace(/[,.]/g, "")
    : "";

const parseAccreditationString = (value: string): string[] => {
  return value
    .split(/[,|;/]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item.length > 1)
    .filter((item) => !/^\d+$/.test(item));
};

const extractAccreditationTokens = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === "string") {
    return parseAccreditationString(value);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractAccreditationTokens(item));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const directKeys = ["name", "value", "label", "title", "accreditation"];
    const directVals = directKeys
      .filter((k) => typeof obj[k] === "string")
      .map((k) => String(obj[k]));

    if (directVals.length > 0) {
      return directVals.flatMap((v) => parseAccreditationString(v));
    }

    return Object.values(obj).flatMap((v) =>
      typeof v === "string" || Array.isArray(v) ? extractAccreditationTokens(v) : []
    );
  }

  return [];
};

const getCollegeAccreditations = (college: any): string[] => {
  const collected = new Set<string>();

  [
    college?.accreditation,
    college?.accreditations,
    college?.rawScraped?.accreditation,
    college?.rawScraped?.accreditations,
  ].forEach((source) => {
    extractAccreditationTokens(source).forEach((token) => {
      collected.add(token);
    });
  });

  return Array.from(collected);
};

const getCleanStringValue = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const getLocationParts = (college: any): string[] => {
  if (typeof college?.location !== "string") return [];

  return college.location
    .split(",")
    .map((part) => getCleanStringValue(part))
    .filter(Boolean);
};

const getCollegeCityValue = (college: any): string => {
  const directValue = [
    college?.city,
    college?.basic?.city,
    college?.rawScraped?.basic?.city,
  ]
    .map(getCleanStringValue)
    .find(Boolean);

  if (directValue) return directValue;

  return getLocationParts(college)[0] ?? "";
};

const getCollegeStateValue = (college: any): string => {
  const directValue = [
    college?.state,
    college?.basic?.state,
    college?.rawScraped?.basic?.state,
  ]
    .map(getCleanStringValue)
    .find(Boolean);

  if (directValue) return directValue;

  const locationParts = getLocationParts(college);
  return locationParts[locationParts.length - 1] ?? "";
};

const EXCLUDED_COLLEGE_TYPES = new Set(["read college reviews"]);

const getCollegeTypeValue = (college: any): string => {
  const candidates = [
    college?.college_type,               // ✅ API field
    college?.basic?.college_type,        // CMS structure
    college?.rawScraped?.basic?.college_type,
    college?.type                        // fallback
  ];

  const found = candidates
    .map(getCleanStringValue)
    .find(Boolean);

  if (!found) return "";
  if (EXCLUDED_COLLEGE_TYPES.has(found.toLowerCase())) return "";

  return found;
};
const getAccreditationValue = (college: any): string => {
  const value = college?.accreditation;
  return typeof value === "string" ? value.trim() : "";
};

/* ================= ACCORDION ================= */


const parseSeoSlug = (slug?: string) => {
  if (!slug) return {};

  if (slug === "top-colleges") return {};

  const match = slug.match(/^top-colleges-in-(.+)$/);
  if (match) {
    return { location: match[1] }; // uttar-pradesh
  }

  return {};
};


const FilterAccordion: React.FC<{
  title: string;
  children: React.ReactNode;
  maxHeight?: string;
}> = ({ title, children, maxHeight = "240px" }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b pb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-sm font-semibold text-slate-800"
      >
        {title}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div
          className="
            mt-3 space-y-2
            overflow-y-auto
            pr-2
            scrollbar-thin
            scrollbar-thumb-slate-300
            scrollbar-track-transparent
          "
          style={{ maxHeight }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const INDIAN_STATES = new Set([
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Jammu and Kashmir",
  "Chandigarh",
  "Puducherry",
  "Ladakh"
]);
const ENGINEERING_STREAMS = ["B.Tech", "BTech", "BE", "B.E", "Engineering", "B.E / B.Tech", "M.Tech", "MTech", "BCA", "MCA", "Computer Applications", "BCA / MCA"];
const MANAGEMENT_STREAMS = ["MBA", "PGDM", "Management", "BBA", "Business Administration"];
const MEDICAL_STREAMS = ["MBBS", "Medical", "BPharm", "Pharmacy", "BAMS", "BHMS"];
const ARTS_STREAMS = ["BA", "Arts", "B.A", "B.Sc", "BSc", "B.Com", "BCom", "Science", "Commerce"];
const LAW_STREAMS = ["LLB", "Law", "B.A.LLB", "BA LLB", "LLM"];
const DESIGN_STREAMS = ["B.Des", "Design", "Architecture", "Fashion", "M.Des", "MDes", "BArch"];

const COURSE_SLUG_MAP: Record<string, string[]> = {
  // Raw stream values from college data (with non-alpha stripped as key)
  btech: ENGINEERING_STREAMS,
  be: ENGINEERING_STREAMS,
  mtech: ENGINEERING_STREAMS,
  bebtech: ENGINEERING_STREAMS,   // "B.E / B.Tech" → "bebtech"
  bcamca: ENGINEERING_STREAMS,    // "BCA / MCA" → "bcamca"
  bca: ENGINEERING_STREAMS,
  mca: ENGINEERING_STREAMS,
  mba: MANAGEMENT_STREAMS,
  pgdm: MANAGEMENT_STREAMS,
  mbapgdm: MANAGEMENT_STREAMS,
  bba: MANAGEMENT_STREAMS,
  mbbs: MEDICAL_STREAMS,
  bpharm: MEDICAL_STREAMS,
  pharmacy: MEDICAL_STREAMS,
  bams: MEDICAL_STREAMS,
  bhms: MEDICAL_STREAMS,
  bcom: ARTS_STREAMS,
  bsc: ARTS_STREAMS,
  ba: ARTS_STREAMS,
  llb: LAW_STREAMS,
  llm: LAW_STREAMS,
  ballb: LAW_STREAMS,
  bdes: DESIGN_STREAMS,
  mdes: DESIGN_STREAMS,
  barch: DESIGN_STREAMS,
  // URL slug aliases (from /:stream route param)
  engineering: ENGINEERING_STREAMS,
  management: MANAGEMENT_STREAMS,
  medical: MEDICAL_STREAMS,
  arts: ARTS_STREAMS,
  law: LAW_STREAMS,
  design: DESIGN_STREAMS,
};

/* ================= FILTER SIDEBAR ================= */

const toSeoSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.\s]+/g, "-")
    .replace(/\//g, "-")
    .replace(/--+/g, "-");

const getStreamSeoSlug = (stream: string): string => {
  const key = stream.toLowerCase().replace(/[^a-z]/g, "");
  const streamToSlug: Record<string, string> = {
    btech: "engineering", be: "engineering", mtech: "engineering", bebtech: "engineering",
    bca: "engineering", mca: "engineering", engineering: "engineering",
    mba: "management", pgdm: "management", bba: "management", management: "management",
    mbbs: "medical", bpharm: "medical", bams: "medical", bhms: "medical", medical: "medical",
    ba: "arts", bsc: "arts", bcom: "arts", arts: "arts",
    llb: "law", llm: "law", ballb: "law", law: "law",
    bdes: "design", mdes: "design", barch: "design", design: "design",
  };
  return streamToSlug[key] || toSeoSlug(stream);
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  forceShow = false,
  colleges,
  compareList,
}) => {
  const {
    streams,
    states,
    cities,
    collegeTypes,
    accreditations,
    streamCounts,
    stateCounts,
    cityCounts,
    collegeTypeCounts,
    accreditationCounts,
    ratingCounts,
  } = useMemo(() => {
    const streamSet = new Set<string>();
    const typeSet = new Set<string>();
    const stateSet = new Set<string>();
    const citySet = new Set<string>();

    const streamMap = new Map<string, number>();
    const typeMap = new Map<string, number>();
    const stateMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const accreditationMap = new Map<string, number>();
    const accreditationSet = new Set<string>();

    colleges.forEach((c) => {
      const streamValues = Array.isArray(c.stream) ? c.stream : [c.stream];
      streamValues
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .forEach((s) => {
          const key = s.trim();
          streamSet.add(key);
          streamMap.set(key, (streamMap.get(key) ?? 0) + 1);
        });

      const ownershipType = getCollegeTypeValue(c);
      if (ownershipType) {
        const key = ownershipType;
        typeSet.add(key);
        typeMap.set(key, (typeMap.get(key) ?? 0) + 1);
      }

      const stateValue = getCollegeStateValue(c);
      if (stateValue) {
        stateSet.add(stateValue);
        stateMap.set(stateValue, (stateMap.get(stateValue) ?? 0) + 1);
      }

      const cityValue = getCollegeCityValue(c);
      if (cityValue) {
        citySet.add(cityValue);
        cityMap.set(cityValue, (cityMap.get(cityValue) ?? 0) + 1);
      }

      const collegeAccreditationSet = new Set<string>();
      getCollegeAccreditations(c).forEach((token) => {
        const clean = token.trim();
        if (!clean || clean.length < 2) return;
        collegeAccreditationSet.add(clean);
      });

      collegeAccreditationSet.forEach((token) => {
        accreditationSet.add(token);
        accreditationMap.set(token, (accreditationMap.get(token) ?? 0) + 1);
      });
    });

    const ratingMap = new Map<number, number>();
    [4.5, 4.0, 3.5].forEach((threshold) => {
      const count = colleges.filter((c) => Number(c.rating) >= threshold).length;
      ratingMap.set(threshold, count);
    });
    ratingMap.set(0, colleges.length);

    return {
      streams: Array.from(streamSet).sort((a, b) => a.localeCompare(b)),
      states: Array.from(stateSet).sort((a, b) => a.localeCompare(b)),
      cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
      collegeTypes: ["All", ...Array.from(typeSet).sort((a, b) => a.localeCompare(b))],
      accreditations: Array.from(accreditationSet).sort((a, b) => a.localeCompare(b)),
      streamCounts: streamMap,
      stateCounts: stateMap,
      cityCounts: cityMap,
      collegeTypeCounts: typeMap,
      accreditationCounts: accreditationMap,
      ratingCounts: ratingMap,
    };
  }, [colleges]);

  const ratings = [
    { label: "Any", value: 0 },
    { label: "4.5+", value: 4.5 },
    { label: "4.0+", value: 4.0 },
    { label: "3.5+", value: 3.5 },
  ];

  const feeRanges = [
    "Any Fee",
    "Under Rs 5 Lakhs",
    "Rs 5-10 Lakhs",
    "Rs 10-20 Lakhs",
    "Rs 20 Lakhs+",
  ];

  const compareSlots = useMemo(() => {
    const getCompareCode = (name?: string) => {
      const fallback = (name || "").replace(/\s+/g, "").slice(0, 3).toUpperCase();
      const clean = (name || "").replace(/[^A-Za-z ]/g, " ").trim();
      const initials = clean
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

      return initials || fallback || "+";
    };

    const selectedColleges = compareList
      .map((id) => colleges.find((college) => String(college.id) === id))
      .filter((college): college is College => Boolean(college))
      .slice(0, 3);

    return Array.from({ length: 3 }, (_, index) => {
      const college = selectedColleges[index];

      return {
        code: college ? getCompareCode(college.name) : "+",
        isEmpty: !college,
        key: college ? `compare-${String(college.id)}` : `compare-empty-${index}`,
        title: college?.name || "Add college to compare",
      };
    });
  }, [colleges, compareList]);

  const countLabel = (count: number) => `${Math.max(0, count)}+`;

  return (
    <aside
      className={`${forceShow ? "block" : "hidden lg:block"} lg:w-1/4 xl:w-1/5 lg:sticky lg:top-[148px] mt-3 self-start`}
    >
      <div className="rounded-2xl border border-[#d8d1c5] bg-[#f6f3ec] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-[#081f39] px-4 py-3">
          <h3 className="text-white font-semibold text-[10px]">Filter Colleges</h3>
          <button
            onClick={onClearFilters}
            className="text-[#9bc3ff] text-[10px] font-medium hover:text-white"
          >
            Clear all
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Course Type
            </p>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              <label className="flex items-center gap-2 text-[15px] text-slate-800">
                <input
                  type="checkbox"
                  checked={filters.stream === "All"}
                  onChange={() =>
                    setFilters((p) => ({
                      ...p,
                      stream: "All",
                      city: "",
                      region: undefined,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-400"
                />
                <span className="flex-1">All Courses</span>
                <span className="text-slate-700">{countLabel(colleges.length)}</span>
              </label>

              {streams.map((s) => (
                <label key={s} className="flex items-center gap-2 text-[15px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.stream === s}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        stream: p.stream === s ? "All" : s,
                        city: "",
                        region: undefined,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  <span className="flex-1">{s}</span>
                  <span className="text-slate-700">{countLabel(streamCounts.get(s) ?? 0)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              State
            </p>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {states.map((s) => (
                <label key={s} className="flex items-center gap-2 text-[15px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.region === s}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        region: p.region === s ? undefined : s,
                        city: p.region === s ? p.city : "",
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  <span className="flex-1">{s}</span>
                  <span className="text-slate-700">{countLabel(stateCounts.get(s) ?? 0)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              City
            </p>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {cities.map((c) => (
                <label key={c} className="flex items-center gap-2 text-[15px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.city === c}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        city: p.city === c ? "" : c,
                        region: undefined,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  <span className="flex-1">{c}</span>
                  <span className="text-slate-700">{countLabel(cityCounts.get(c) ?? 0)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Ownership
            </p>
            <div className="space-y-2">
              {collegeTypes.map((t) => (
                <label key={t} className="flex items-center gap-2 text-[15px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.collegeType === t}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        collegeType: p.collegeType === t ? "All" : t,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  <span className="flex-1">{t === "All" ? "All Types" : t}</span>
                  {t !== "All" && (
                    <span className="text-slate-700">
                      {countLabel(collegeTypeCounts.get(t) ?? 0)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Accreditation
            </p>
            <div className="space-y-2">
              {accreditations.map((a) => (
                <label key={a} className="flex items-center gap-2 text-[15px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.accreditation === a}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        accreditation: p.accreditation === a ? "" : a,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  <span className="flex-1">{a}</span>
                  <span className="text-slate-700">
                    {countLabel(accreditationCounts.get(a) ?? 0)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Rating
            </p>
            <div className="space-y-2">
              {ratings.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-[15px] text-slate-800">
                  <input
                    type="checkbox"
                    checked={filters.minRating === r.value}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        minRating: p.minRating === r.value ? 0 : r.value,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  <span className="flex-1">{r.label}</span>
                  <span className="text-slate-700">
                    {countLabel(ratingCounts.get(r.value) ?? 0)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold tracking-wide text-[#6d7f95] uppercase">
              Annual Fee Range (Rs Lakhs)
            </p>
            <select
              value={filters.feeRange}
              onChange={(e) =>
                setFilters((p) => ({
                  ...p,
                  feeRange: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-[#d6d1c7] bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            >
              {feeRanges.map((feeOption) => (
                <option key={feeOption} value={feeOption}>
                  {feeOption}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setFilters((p) => ({ ...p }))}
            className="w-full rounded-lg bg-[#1E4A7A] py-3 text-base font-semibold text-white"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-[18px] bg-gradient-to-br from-[#081f39] to-[#132a4a] px-4 py-4 text-white shadow-sm">
        <h4 className="text-[18px] leading-none text-[#f2ab2b] mb-2 font-serif font-semibold text-center pb-2">⚖ Compare Colleges</h4>
        <p className="text-[10px] text-slate-200 leading-snug text-center pb-2 ">
          Add up to 3 colleges to compare fees, cutoffs and placements side by side.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {compareSlots.map((slot) => (
            <span
              key={slot.key}
              title={slot.title}
              className={`inline-flex h-10 min-w-0 items-center justify-center rounded-lg border border-dashed px-2 text-xs font-medium ${
                slot.isEmpty
                  ? "border-white/15 bg-white/5 text-white/35"
                  : "border-[#1abac5]/70 bg-[#0c304f] text-[#2ed2db]"
              }`}
            >
              <span className="max-w-full truncate">{slot.code}</span>
            </span>
          ))}
        </div>

        <Link
          to="/compare"
          className="mt-4 block w-full rounded-xl bg-[#f0a018] py-2.5 text-center text-[10px] font-semibold text-slate-900"
        >
          Compare Now
        </Link>
      </div>
    </aside>
  );
};

const ListingPage: React.FC<ListingPageProps> = ({

  colleges,
  compareList,
  onCompareToggle,
  onOpenApplyNow,
  onOpenBrochure,
  initialFilters,
}) => {

  const { stream, seoSlug } = useParams();


  const navigate = useNavigate();
  const location = useLocation();

  const [filters, setFilters] = useState<Filters>({
    college: "",
    city: "",
    course: "",
    stream: stream
      ? stream
        .replace(/-/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase())
      : "All",
    collegeType: "All",
    accreditation: "",
    minRating: 0,
    feeRange: "Any Fee",
  });
  const lastUrlRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    if (!filters.stream || filters.stream === "All") return;
    // Map display stream names → clean URL slugs
    // Preserve natural names like "engineering", "management" for SEO
    const streamKey = filters.stream.toLowerCase().replace(/[^a-z]/g, "");
    const streamSlugMap: Record<string, string> = {
      "engineering": "engineering",
      "management": "management",
      "medical": "medical",
      "artsscience": "arts",
      "arts": "arts",
      "law": "law",
      "design": "design",
      // common raw stream values from college data (dots/slashes stripped)
      "bebtech": "engineering",
      "btech": "engineering",
      "be": "engineering",
      "mtech": "engineering",
      "bca": "engineering",
      "mca": "engineering",
      "mba": "management",
      "pgdm": "management",
      "mbapgdm": "management",
      "bba": "management",
      "mbbs": "medical",
      "bpharm": "medical",
      "pharmacy": "medical",
      "bams": "medical",
      "bhms": "medical",
      "ba": "arts",
      "bsc": "arts",
      "bcom": "arts",
      "llb": "law",
      "llm": "law",
      "ballb": "law",
      "bdes": "design",
      "mdes": "design",
      "barch": "design",
      "architecture": "design",
    };
    const streamSlug = streamSlugMap[streamKey] ?? toSeoSlug(filters.stream);

    let nextUrl = `/${streamSlug}/top-colleges`;

    if (filters.city) {
      nextUrl += `-in-${toSeoSlug(filters.city)}`;
    } else if (filters.region) {
      nextUrl += `-in-${toSeoSlug(filters.region)}`;
    }
    if (lastUrlRef.current === nextUrl) return;
    lastUrlRef.current = nextUrl;

    navigate(nextUrl, { replace: true });
  }, [filters.stream, filters.city, filters.region, navigate]);







  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;

    const nextFilters: Partial<Filters> = {};

    // STREAM — keep as raw URL slug so COURSE_SLUG_MAP can look it up directly
    if (stream) {
      // Preserve the raw stream slug (e.g. "engineering", "management") so
      // COURSE_SLUG_MAP can resolve it directly via the key lookup.
      // Capitalize only for display; key lookup uses lowercase.
      nextFilters.stream = stream.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    // LOCATION FROM SEO SLUG
    const parsed = parseSeoSlug(seoSlug);

    if (parsed.location) {
      if (colleges.length === 0) return;

      const raw = parsed.location.replace(/-/g, " ");
      const normalized = normalize(raw);

      const matchedState = colleges
        .map((college) => getCollegeStateValue(college))
        .find((stateValue) => normalize(stateValue) === normalized)
        ?? Array.from(INDIAN_STATES).find(
          (stateValue) => normalize(stateValue) === normalized
        );

      const matchedCity = colleges
        .map((college) => getCollegeCityValue(college))
        .find((cityValue) => normalize(cityValue) === normalized);

      if (matchedState) {
        nextFilters.region = matchedState;
        nextFilters.city = "";
      } else if (matchedCity) {
        nextFilters.city = matchedCity;
        nextFilters.region = undefined;
      } else {
        nextFilters.city = raw.replace(/\b\w/g, l => l.toUpperCase());
        nextFilters.region = undefined;
      }
    }

    setFilters(p => ({ ...p, ...nextFilters }));
    hasInitializedRef.current = true;

  }, [stream, seoSlug, colleges]);


  const selectedRegion = location.state?.region || null;

  const normalizeText = (s = "") =>
    s.toLowerCase().replace(/\s+/g, "").replace(/[.,]/g, "");

  const filterByRegion = (college, region) => {
    if (!region) return true;

    const loc = normalizeText(college.location || "");
    const collegeState = normalizeText(getCollegeStateValue(college));
    const collegeCity = normalizeText(getCollegeCityValue(college));
    const regionNorm = normalizeText(region);

    // REGION_MAP: match by city list (handles NCR, Delhi, Mumbai, Bangalore, Pune)
    const regionConfig = REGION_MAP[region];
    if (regionConfig) {
      return regionConfig.cities.some(city => {
        const cityNorm = normalizeText(city);
        return (
          collegeCity === cityNorm ||
          loc.includes(cityNorm) ||
          collegeState === cityNorm
        );
      });
    }

    // For states: match state field directly, then location string
    return (
      collegeState === regionNorm ||
      loc.includes(regionNorm) ||
      collegeCity === regionNorm
    );
  };



  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("most-popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(18);
  const [heroStats, setHeroStats] = useState({
    colleges: 0,
    states: 0,
    disciplines: 0,
  });
  const hasRunHeroStatsRef = useRef(false);

  useEffect(() => {
    if (hasRunHeroStatsRef.current) return;
    hasRunHeroStatsRef.current = true;

    const frames = [
      { colleges: 220, states: 7, disciplines: 1 },
      { colleges: 340, states: 13, disciplines: 4 },
      { colleges: 5450, states: 41, disciplines: 9 },
      { colleges: 500, states: 28, disciplines: 6 },
    ];

    const timers = frames.map((vals, idx) =>
      window.setTimeout(() => {
        setHeroStats(vals);
      }, idx * 170)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);


  useEffect(() => {
    if (initialFilters) {
      setFilters(p => ({ ...p, ...initialFilters }));
    }

    if (location.state && typeof location.state === "object") {
      const navState = location.state as any;

      setFilters(p => ({
        ...p,
        ...navState,      // college, city, course
        region: navState.region ?? undefined,
      }));
    }
  }, [initialFilters, location.state]);

  const HERO_TITLE_MAP: Record<string, string> = {
    mba: "Top MBA Colleges",
    btech: "Top Engineering Colleges",
    bca: "Top BCA Colleges",
    mbbs: "Top Medical Colleges",
  };

  const topBarOptions = useMemo(() => {
    const streamSet = new Set<string>();
    const citySet = new Set<string>();

    colleges.forEach((c) => {
      if (Array.isArray(c.stream)) {
        c.stream
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .forEach((s) => streamSet.add(s.trim()));
      } else if (typeof c.stream === "string" && c.stream.trim()) {
        streamSet.add(c.stream.trim());
      }

      const cityValue = getCollegeCityValue(c);
      if (cityValue) citySet.add(cityValue);
    });

    return {
      streams: Array.from(streamSet).sort((a, b) => a.localeCompare(b)),
      cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
    };
  }, [colleges]);

  const FEE_RANGE_OPTIONS = [
    "Any Fee",
    "Under Rs 5 Lakhs",
    "Rs 5-10 Lakhs",
    "Rs 10-20 Lakhs",
    "Rs 20 Lakhs+",
  ];

  const getFeeLakhs = (college: College): number => {
    const minFees = Number(college?.feesRange?.min ?? 0);
    if (Number.isFinite(minFees) && minFees > 0) return minFees / 100000;

    const maxFees = Number(college?.feesRange?.max ?? 0);
    if (Number.isFinite(maxFees) && maxFees > 0) return maxFees / 100000;

    return 0;
  };

  const matchesFeeRange = (college: College, selectedRange: string): boolean => {
    if (!selectedRange || selectedRange === "Any Fee") return true;

    const feeLakhs = getFeeLakhs(college);
    if (feeLakhs <= 0) return false;

    if (selectedRange === "Under Rs 5 Lakhs") return feeLakhs < 5;
    if (selectedRange === "Rs 5-10 Lakhs") return feeLakhs >= 5 && feeLakhs <= 10;
    if (selectedRange === "Rs 10-20 Lakhs") return feeLakhs > 10 && feeLakhs <= 20;
    if (selectedRange === "Rs 20 Lakhs+") return feeLakhs > 20;

    return true;
  };


  const clearFilters = () =>
    setFilters({
      college: "",
      city: "",
      region: undefined,
      course: "",
      stream: "All",
      collegeType: "All",
      accreditation: "",
      minRating: 0,
      feeRange: "Any Fee",
    });

  const parseMoney = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;
    const cleaned = value.toLowerCase().replace(/,/g, "").trim();
    const base = Number(cleaned.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(base)) return 0;
    if (cleaned.includes("cr") || cleaned.includes("crore")) return base * 10000000;
    if (cleaned.includes("lpa") || cleaned.includes("lac") || cleaned.includes("lakh") || cleaned.includes("l")) {
      return base * 100000;
    }
    return base;
  };



  const filteredColleges = useMemo(() => {

    return colleges.filter((c) => {
      if (filters.college) {
        const searchText = filters.college.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(searchText);
        const matchesLocation = c.location?.toLowerCase().includes(searchText);
        if (!matchesName && !matchesLocation) return false;
      }
      if (filters.city) {
        const cityNorm = normalize(filters.city);
        const loc = normalize(c.location);
        const collegeCity = normalize(getCollegeCityValue(c));
        // Check if REGION_MAP has city entries (e.g. "Delhi" maps to neighborhoods)
        const regionConfig = REGION_MAP[filters.city];
        const cityMatch = regionConfig
          ? regionConfig.cities.some(rc => loc.includes(normalize(rc)) || collegeCity === normalize(rc))
          : (loc.includes(cityNorm) || collegeCity === cityNorm);
        if (!cityMatch) return false;
      }
      if (filters.course) {
        const courses = c.rawScraped?.courses;
        if (!Array.isArray(courses)) return true;

        const hasCourse = courses.some(co =>
          co.name?.toLowerCase().includes(filters.course.toLowerCase())
        );
        if (!hasCourse) return false;
      }
      if (filters.stream !== "All") {
        const collegeStreamsRaw = Array.isArray(c.stream)
          ? c.stream
          : [c.stream];

        const normalizeStream = (v: unknown) => {
          if (typeof v !== "string") return "";
          return v.toLowerCase().replace(/[^a-z]/g, "");
        };

        const normalizedCollege = collegeStreamsRaw
          .map(normalizeStream)
          .filter(Boolean);

        const key = filters.stream.toLowerCase().replace(/[^a-z]/g, "");
        const allowed = COURSE_SLUG_MAP[key] ?? [filters.stream];

        const normalizedAllowed = allowed
          .map(normalizeStream)
          .filter(Boolean);

        const match = normalizedCollege.some(cs =>
          normalizedAllowed.some(as =>
            cs.includes(as) || as.includes(cs)
          )
        );

        if (!match) return false;
      }
      if (filters.collegeType !== "All") {
        const ownershipType = getCollegeTypeValue(c);
        if (!ownershipType || ownershipType !== filters.collegeType) return false;
      }
      if (filters.accreditation) {
        const collegeAccreditations = getCollegeAccreditations(c).map((item) =>
          normalize(item)
        );
        if (!collegeAccreditations.includes(normalize(filters.accreditation))) {
          return false;
        }
      }
      if (filters.minRating > 0) {
        const rating = Number(c.rating);
        if (!rating || rating < filters.minRating) return false;
      }
      if (!matchesFeeRange(c, filters.feeRange)) return false;
      if (!filters.city && filters.region && !filterByRegion(c, filters.region)) {
        return false;
      }


      return true;
    });
  }, [colleges, filters]);

  const sortedColleges = useMemo(() => {
    const list = [...filteredColleges];

    if (sortBy === "fee-low-high") {
      return list.sort((a, b) => getFeeLakhs(a) - getFeeLakhs(b));
    }

    if (sortBy === "fee-high-low") {
      return list.sort((a, b) => getFeeLakhs(b) - getFeeLakhs(a));
    }

    if (sortBy === "highest-placement") {
      return list.sort((a, b) => {
        const aPlacement = parseMoney((a as any)?.placements?.highestPackage ?? (a as any)?.placements?.averagePackage);
        const bPlacement = parseMoney((b as any)?.placements?.highestPackage ?? (b as any)?.placements?.averagePackage);
        return bPlacement - aPlacement;
      });
    }

    if (sortBy === "highest-rated") {
      return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list.sort((a, b) => {
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number((b as any).reviewCount || 0) - Number((a as any).reviewCount || 0);
    });
  }, [filteredColleges, sortBy]);

  const visibleColleges = useMemo(
    () => sortedColleges.slice(0, visibleCount),
    [sortedColleges, visibleCount]
  );

  const hasMoreColleges = visibleCount < sortedColleges.length;

  useEffect(() => {
    setVisibleCount(18);
  }, [filters, sortBy]);

  const compareIdSet = useMemo(
    () => new Set(compareList.map((id) => String(id))),
    [compareList]
  );

  const toLakhLabel = (value: number) => {
    if (!value || value <= 0) return "N/A";
    return `₹${(value / 100000).toFixed(value >= 1000000 ? 0 : 1)}L`;
  };

  const getCollegeRoute = (college: College) => {
    const slug = (college.name || "")
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return `/university/${college.id}-${slug}`;
  };


  const seoLocation = filters.city || filters.region || "";
  const seoStream = filters.stream && filters.stream !== "All" ? filters.stream : "";

  const seoTitle = (() => {
    if (seoStream && seoLocation) {
      return `Best ${seoStream} Colleges in ${seoLocation} 2026 - Fees, Ranking, Admission | StudyCups`;
    }
    if (seoStream) {
      return `Top ${seoStream} Colleges in India 2026 - Fees, Ranking, Admission | StudyCups`;
    }
    if (seoLocation) {
      return `Best Colleges in ${seoLocation} 2026 - Rankings, Fees, Admissions | StudyCups`;
    }
    return "Top Colleges in India 2026 - Rankings, Fees, Admissions | StudyCups";
  })();

  const seoDescription = (() => {
    if (seoStream && seoLocation) {
      return `Explore the best ${seoStream} colleges in ${seoLocation}. Compare fees, rankings, placements, cutoffs and admission process for 2026. Get free expert counselling.`;
    }
    if (seoStream) {
      return `Find top ${seoStream} colleges in India 2026. Compare fees, NIRF rankings, placements and admission process. Apply now with StudyCups.`;
    }
    if (seoLocation) {
      return `Discover the best colleges in ${seoLocation}. Compare MBA, B.Tech, MBBS, BCA colleges by fees, rankings and placements for 2026.`;
    }
    return "Compare top colleges in India 2026 by fees, NIRF rankings, placements, cutoffs and admission process. Free expert counselling.";
  })();

  const seoKeywords = (() => {
    const parts: string[] = [];
    if (seoStream && seoLocation) {
      parts.push(
        `best ${seoStream} colleges in ${seoLocation}`,
        `top ${seoStream} colleges ${seoLocation}`,
        `${seoStream} admission ${seoLocation} 2026`,
        `${seoStream} colleges fees ${seoLocation}`
      );
    } else if (seoStream) {
      parts.push(
        `top ${seoStream} colleges in India`,
        `best ${seoStream} colleges 2026`,
        `${seoStream} colleges fees rankings`,
        `${seoStream} admission 2026`
      );
    } else if (seoLocation) {
      parts.push(
        `best colleges in ${seoLocation}`,
        `top colleges ${seoLocation} 2026`,
        `colleges in ${seoLocation} fees admission`
      );
    }
    parts.push("college admission 2026", "StudyCups", "compare colleges India");
    return parts.join(", ");
  })();

  const seoImageUrl = "https://studycups.in/logos/StudyCups.png";
  const seoCanonical = `https://studycups.in${location.pathname}`;


  return (



    <div className="bg-[#f5f7fb] min-h-screen">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <link rel="canonical" href={seoCanonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={seoCanonical} />
        <meta property="og:image" content={seoImageUrl} />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImageUrl} />

        {/* JSON-LD: BreadcrumbList */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in" },
            ...(seoStream ? [{ "@type": "ListItem", "position": 2, "name": `${seoStream} Colleges`, "item": `https://studycups.in/${(stream || "colleges").toLowerCase()}/top-colleges` }] : [{ "@type": "ListItem", "position": 2, "name": "All Colleges", "item": "https://studycups.in/colleges" }]),
            ...(seoLocation ? [{ "@type": "ListItem", "position": seoStream ? 3 : 2, "name": `Colleges in ${seoLocation}`, "item": seoCanonical }] : []),
          ]
        })}</script>

        {/* JSON-LD: ItemList of colleges */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": seoTitle,
          "description": seoDescription,
          "url": seoCanonical,
          "numberOfItems": filteredColleges.length,
          "itemListElement": filteredColleges.slice(0, 10).map((c: any, idx: number) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": c.name || c.basic?.name || "",
            "url": `https://studycups.in/university/${c.id}-${(c.name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`
          }))
        })}</script>

        {/* JSON-LD: CollectionPage for AIO/GEO */}
        {(seoStream || seoLocation) && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": seoTitle,
            "description": seoDescription,
            "url": seoCanonical,
            "inLanguage": "en-IN",
            ...(seoLocation ? {
              "spatialCoverage": {
                "@type": "Place",
                "name": seoLocation,
                "addressCountry": "IN"
              }
            } : {}),
            "about": {
              "@type": "EducationalOrganization",
              "name": seoStream ? `${seoStream} Colleges` : "Indian Colleges",
              "description": seoDescription
            },
            "provider": {
              "@type": "Organization",
              "name": "StudyCups",
              "url": "https://studycups.in"
            }
          })}</script>
        )}
      </Helmet>
      {/* ═══ HERO ═══ */}
      <section className="md:mt-[100px] mt-0 mb-0">
        <div className="w-full relative overflow-hidden bg-gradient-to-br from-[#040e1f] via-[#071a35] to-[#0a2347] text-white">

          {/* Decorative glows */}
          <div className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#1f4fa8]/25 blur-[80px]" />
          <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-[#0e6b7a]/20 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full bg-[#f59e0b]/8 blur-[70px]" />

          {/* Subtle dot-grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-8">

            {/* ── Breadcrumb ── */}
            <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[11px] text-white/45 mb-3">
              <Link to="/" className="hover:text-white/80 transition">Home</Link>
              <span>/</span>
              <span className="text-[#f4a71d] font-semibold">College Directory</span>
              {(filters.stream && filters.stream !== "All") && (
                <>
                  <span>/</span>
                  <span className="text-white/60">{filters.stream}</span>
                </>
              )}
              {(filters.city || filters.region) && (
                <>
                  <span>/</span>
                  <span className="text-white/60">{filters.city || filters.region}</span>
                </>
              )}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 lg:gap-8 items-center">

              {/* ── LEFT: Text + Stats ── */}
              <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f4a71d]/30 bg-[#f4a71d]/10 px-3 py-1 mb-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f4a71d] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.1em] text-[#ffc365] uppercase">
                    500+ Partner Colleges · Updated 2026
                  </span>
                </div>

                {/* H1 */}
                <h1 className="text-[20px] sm:text-[26px] md:text-[34px] leading-[1.06] font-extrabold tracking-tight">
                  {(!filters.stream || filters.stream === "All") && !filters.city && !filters.region ? (
                    <>
                      Find Your{" "}
                      <span className="relative inline-block">
                        <span className="text-[#f4a71d]">Perfect College</span>
                        <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] opacity-60" />
                      </span>
                      {" "}
                      <span className="text-white/80 font-semibold">
                        Across India
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-white/70 text-[15px] sm:text-[18px] md:text-[22px] font-semibold">Best </span>
                      <span className="text-[#f4a71d]">
                        {filters.stream && filters.stream !== "All" ? `${filters.stream} ` : ""}Colleges
                      </span>
                      {(filters.city || filters.region) && (
                        <span className="text-white"> in {filters.city || filters.region}</span>
                      )}
                    </>
                  )}
                </h1>

                {/* Subtext */}
                <p className="mt-1.5 text-xs md:text-sm text-white/60 max-w-2xl leading-relaxed">
                  Compare fees, NIRF rankings, NAAC accreditation, placements &amp; cutoffs — MBA, B.Tech, MBBS, Law &amp; BCA colleges across India.
                </p>

                {/* ── Stats band ── */}
                <div className="mt-3 grid grid-cols-4 gap-2 max-w-lg">
                  {[
                    { value: `${heroStats.colleges}+`, label: "Colleges", icon: "🏛️" },
                    { value: `${heroStats.states}`, label: "States", icon: "📍" },
                    { value: `${heroStats.disciplines}+`, label: "Disciplines", icon: "📚" },
                    { value: "Free", label: "Counselling", icon: "🎓" },
                  ].map(({ value, label, icon }) => (
                    <div
                      key={label}
                      className="flex flex-col rounded-xl border border-white/10 bg-white/6 backdrop-blur-sm px-3 py-2"
                    >
                      <span className="text-sm mb-0.5">{icon}</span>
                      <span className="text-[#f4a71d] text-base md:text-lg font-extrabold leading-none">
                        {value}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-white/50 mt-0.5 leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA row */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="tel:+918081269969"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f59e0b] hover:bg-[#d97706] px-4 py-2 text-xs font-bold text-[#0a1e3a] shadow-[0_4px_14px_rgba(245,158,11,0.40)] transition-all hover:-translate-y-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Free Counselling Call
                  </a>
                  <a
                    href="https://wa.me/918081269969"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/18 px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.882l6.194-1.625A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.213-3.714.974.99-3.616-.234-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                    </svg>
                    WhatsApp Us
                  </a>
                </div>
              </div>

              {/* ── RIGHT: Quick Stats Cards ── */}
              <div className="hidden lg:grid grid-cols-1 gap-2 min-w-[200px]">
                {[
                  { label: "Top MBA Colleges", value: "200+", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-400/20", icon: "💼" },
                  { label: "Medical Colleges", value: "100+", color: "from-red-500/20 to-red-600/10", border: "border-red-400/20", icon: "🏥" },
                  { label: "Engineering Colleges", value: "150+", color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-400/20", icon: "⚙️" },
                  { label: "Avg Placement", value: "7.2 LPA", color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-400/20", icon: "📈" },
                  { label: "Law Colleges", value: "80+", color: "from-amber-500/20 to-amber-600/10", border: "border-amber-400/20", icon: "⚖️" },
                ].map(({ label, value, color, border, icon }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between gap-3 rounded-xl border ${border} bg-gradient-to-r ${color} backdrop-blur-sm px-3 py-2 hover:scale-[1.02] transition-transform`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <span className="text-[11px] text-white/80 font-medium">{label}</span>
                    </div>
                    <span className="text-[#f4a71d] font-extrabold text-sm whitespace-nowrap">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom wave divider */}
          <div className="relative h-5 overflow-hidden">
            <svg viewBox="0 0 1440 20" className="absolute bottom-0 w-full" preserveAspectRatio="none">
              <path d="M0,20 L1440,20 L1440,5 Q1080,20 720,10 Q360,0 0,10 Z" fill="#f5f7fb" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── DESKTOP STICKY FILTER BAR ── */}
      <div className="hidden lg:block sticky top-[74px] z-40 bg-white border-b border-slate-200 shadow-[0_4px_16px_rgba(10,33,74,0.08)]">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">

            {/* Search input */}
            <div className="relative flex-1 min-w-[260px]">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={filters.college}
                onChange={(e) => setFilters((p) => ({ ...p, college: e.target.value }))}
                placeholder="Search college, city or state..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/15 transition"
              />
            </div>

            {/* Divider */}
            <div className="h-7 w-px bg-slate-200" />

            {/* Stream */}
            <select
              value={filters.stream}
              onChange={(e) => setFilters((p) => ({ ...p, stream: e.target.value }))}
              className="h-10 min-w-[150px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#1f4fa8] cursor-pointer transition"
            >
              <option value="All">All Streams</option>
              {topBarOptions.streams.map((streamName) => (
                <option key={streamName} value={streamName}>{streamName}</option>
              ))}
            </select>

            {/* City */}
            <select
              value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value, region: undefined }))}
              className="h-10 min-w-[130px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#1f4fa8] cursor-pointer transition"
            >
              <option value="">All Cities</option>
              {topBarOptions.cities.map((cityName) => (
                <option key={cityName} value={cityName}>{cityName}</option>
              ))}
            </select>

            {/* Fee */}
            <select
              value={filters.feeRange}
              onChange={(e) => setFilters((p) => ({ ...p, feeRange: e.target.value }))}
              className="h-10 min-w-[145px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-[#1f4fa8] cursor-pointer transition"
            >
              {FEE_RANGE_OPTIONS.map((feeOption) => (
                <option key={feeOption} value={feeOption}>{feeOption}</option>
              ))}
            </select>

            {/* Divider */}
            <div className="h-7 w-px bg-slate-200" />

            {/* Result count pill */}
            <div className="flex items-center gap-1.5 rounded-xl bg-[#0a214a] px-4 py-2 whitespace-nowrap">
              <span className="text-[#f4a71d] font-extrabold text-sm">{sortedColleges.length}</span>
              <span className="text-white/70 text-xs font-medium">colleges found</span>
            </div>
          </div>
        </div>
      </div>


      {/* ONLY MOBILE SEARCH + FILTER (UPPER ONE) */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 -mt-3 mb-4">
        <div className="bg-white rounded-xl border-none shadow-none flex items-center gap-3 px-4 py-3">
          <input
            placeholder="Search college, city, course..."
            className="
      flex-1 text-sm
      bg-transparent
      border-0
      outline-none
      ring-0
      focus:ring-0
      focus:outline-none
      shadow-none
    "
            value={filters.college}
            onChange={(e) =>
              setFilters((p) => ({ ...p, college: e.target.value }))
            }
          />
          <button
            onClick={() => setShowMobileFilters(true)}
            className="text-sm font-semibold text-[var(--primary-medium)]"
          >
            Filters
          </button>
        </div>

      </div>

      {/* ── POPULAR SEARCHES – SEO keyword chips ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Popular:</span>
          {[
            "MBA Colleges", "B.Tech Colleges", "MBBS Colleges", "Law Colleges",
            "BBA Colleges", "BCA Colleges", "Colleges in Delhi", "Colleges in Mumbai",
            "Colleges in Bangalore", "Colleges in Pune", "NAAC A+ Colleges",
            "Government Colleges", "Private Universities", "Top Ranked Colleges 2026",
          ].map((chip) => {
            const isStream = ["MBA Colleges","B.Tech Colleges","MBBS Colleges","Law Colleges","BBA Colleges","BCA Colleges"].includes(chip);
            const isCity = chip.startsWith("Colleges in ");
            const city = isCity ? chip.replace("Colleges in ", "") : "";
            const streamName = isStream ? chip.replace(" Colleges", "") : "";
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  if (isStream) setFilters(p => ({ ...p, stream: streamName }));
                  else if (isCity) setFilters(p => ({ ...p, city, region: undefined }));
                  else if (chip === "NAAC A+ Colleges") setFilters(p => ({ ...p, accreditation: "A+" }));
                  else if (chip === "Government Colleges") setFilters(p => ({ ...p, collegeType: "Government" }));
                  else if (chip === "Private Universities") setFilters(p => ({ ...p, collegeType: "Private" }));
                }}
                className="inline-block text-[11px] font-medium px-3 py-1 rounded-full
                  bg-white border border-slate-200 text-slate-600
                  hover:bg-[#1f4fa8] hover:text-white hover:border-[#1f4fa8]
                  transition-all duration-150 cursor-pointer"
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20 overflow-visible">
        <div className="flex flex-col lg:flex-row gap-10 items-stretch">

          {/* DESKTOP FILTER */}
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            onClearFilters={clearFilters}
            colleges={colleges}
            compareList={compareList}
          />


          <main className="flex-1 flex flex-col">

            {/* DESKTOP SORT + VIEW */}
            <div className="hidden lg:flex items-center justify-between mb-5 mt-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="min-w-[190px] rounded-xl border border-[#d8d3c8] bg-white px-3 py-2.5 text-sm text-slate-800 outline-none"
              >
                <option value="most-popular">Sort: Most Popular</option>
                <option value="fee-low-high">Fee: Low to High</option>
                <option value="fee-high-low">Fee: High to Low</option>
                <option value="highest-placement">Highest Placement</option>
                <option value="highest-rated">Highest Rated</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center ${viewMode === "grid"
                      ? "bg-[#081f39] text-white border-[#081f39]"
                      : "bg-white text-slate-600 border-[#d8d3c8]"
                    }`}
                  aria-label="Grid View"
                >
                  <span className="grid grid-cols-2 gap-[2px]">
                    <span className="h-[4px] w-[4px] bg-current rounded-[1px]" />
                    <span className="h-[4px] w-[4px] bg-current rounded-[1px]" />
                    <span className="h-[4px] w-[4px] bg-current rounded-[1px]" />
                    <span className="h-[4px] w-[4px] bg-current rounded-[1px]" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`h-8 w-8 rounded-lg border flex items-center justify-center ${viewMode === "list"
                      ? "bg-[#081f39] text-white border-[#081f39]"
                      : "bg-white text-slate-600 border-[#d8d3c8]"
                    }`}
                  aria-label="List View"
                >
                  <span className="space-y-[2px]">
                    <span className="block h-[2px] w-3 bg-current rounded" />
                    <span className="block h-[2px] w-3 bg-current rounded" />
                    <span className="block h-[2px] w-3 bg-current rounded" />
                  </span>
                </button>
              </div>
            </div>

            {/* CARDS */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center md:justify-items-stretch">
                {visibleColleges.map((college) => (
                  <CollegeCard
                    key={college.id}
                    college={college}
                    isCompared={compareIdSet.has(String(college.id))}
                    onCompareToggle={onCompareToggle as any}
                    isListingCard
                    onOpenApplyNow={onOpenApplyNow}
                    onOpenBrochure={onOpenBrochure}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleColleges.map((college) => {
                  const streamLabel = Array.isArray((college as any).stream)
                    ? (college as any).stream[0]
                    : (college as any).stream;
                  const ownershipType = getCollegeTypeValue(college);
                  const annualFee = toLakhLabel(Number((college as any)?.feesRange?.max ?? 0));
                  const catLikePercent = `${Math.round(Number(college.rating || 0) * 20)}+`;
                  const totalReviews = Number((college as any)?.reviewCount ?? 0);
                  const reviewsLabel = Number.isFinite(totalReviews)
                    ? totalReviews.toLocaleString("en-IN")
                    : "0";

                  return (
                    <article
                      key={college.id}
                      className="rounded-2xl border border-[#d8d2c5] bg-white overflow-hidden"
                    >
                      <div className="border-l-4 border-[#148d99] p-4 md:p-5">
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                          <div>
                            <div className="flex items-start gap-4">
                              <img
                                src={college.logoUrl || (college as any)?.rawScraped?.logo || "/no-image.jpg"}
                                alt={college.name}
                                className="h-14 w-14 rounded-xl border border-[#ddd5c8] bg-[#f4f1ea] object-contain p-2"
                              />
                              <div className="min-w-0">
                                <p className="text-[#167f8b] text-xs md:text-sm font-semibold">
                                  {streamLabel || "Courses Available"}
                                </p>
                                <Link
                                  to={getCollegeRoute(college)}
                                  className="block mt-0.5 text-lg md:text-[28px] leading-tight font-serif font-semibold text-[#10233e] hover:underline"
                                >
                                  {college.name}
                                </Link>
                                <p className="text-slate-500 text-sm mt-1">{college.location}</p>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 rounded-xl border border-[#d7d1c5] overflow-hidden text-center">
                              <div className="py-2 border-r border-[#d7d1c5]">
                                <p className="font-serif text-[18px] md:text-[20px] text-[#10233e] leading-none">{annualFee}</p>
                                <p className="text-[11px] text-slate-500 mt-1">Annual Fee</p>
                              </div>
                              <div className="py-2 border-r border-[#d7d1c5]">
                                <p className="font-serif text-[18px] md:text-[20px] text-[#10233e] leading-none">{catLikePercent}</p>
                                <p className="text-[11px] text-slate-500 mt-1">CAT %ile</p>
                              </div>
                              <div className="py-2">
                                <p className="font-serif text-[18px] md:text-[20px] text-[#10233e] leading-none">{reviewsLabel}</p>
                                <p className="text-[11px] text-slate-500 mt-1">Total Reviews</p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-[#d8d2c5] bg-[#f6f2e9] px-3 py-1 text-xs text-[#10233e]">
                                {Number(college.rating || 0).toFixed(1)} Rating
                              </span>
                              {ownershipType && (
                                <span className="rounded-full border border-[#d8d2c5] bg-[#f6f2e9] px-3 py-1 text-xs text-[#10233e]">
                                  {ownershipType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex xl:flex-col gap-2 xl:justify-center xl:min-w-[170px]">
                            <button
                              onClick={onOpenApplyNow}
                              className="rounded-xl bg-[#ee9b16] px-5 py-2.5 text-sm font-semibold text-[#10233e]"
                            >
                              Get Guidance →
                            </button>
                            <Link
                              to={getCollegeRoute(college)}
                              className="inline-flex items-center justify-center rounded-xl bg-[#0f6f79] px-5 py-2.5 text-sm font-semibold text-white"
                            >
                              Check Details
                            </Link>
                            <button
                              onClick={() => onCompareToggle(String(college.id))}
                              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold ${compareIdSet.has(String(college.id))
                                  ? "bg-[#1e7d43] text-white"
                                  : "bg-[#132a4a] text-white"
                                }`}
                            >
                              {compareIdSet.has(String(college.id)) ? "Compared" : "Compare"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center">
              {hasMoreColleges && (
                <button
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(prev + 18, sortedColleges.length)
                    )
                  }
                  className="rounded-full border border-[#d3cdbf] bg-white px-8 py-3 text-base md:text-lg font-semibold text-[#10233e]"
                >
                  Load More Colleges ↓
                </button>
              )}
              <p className="mt-3 text-sm md:text-base text-slate-500">
                Showing {Math.min(visibleCount, sortedColleges.length)} of {sortedColleges.length}+ partner colleges
              </p>
            </div>

            {/* ── SEO TEXT BLOCK – for Google crawlers ── */}
            <div className="mt-10 rounded-2xl border border-slate-100 bg-white px-6 py-7 text-sm text-slate-600 leading-relaxed">
              <h2 className="text-base font-bold text-slate-800 mb-3">
                {seoStream && seoLocation
                  ? `Top ${seoStream} Colleges in ${seoLocation} 2026 – Fees, Rankings & Admissions`
                  : seoStream
                  ? `Top ${seoStream} Colleges in India 2026 – Rankings, Fees & Admission`
                  : seoLocation
                  ? `Best Colleges in ${seoLocation} 2026 – Rankings & Admissions`
                  : "Top Colleges in India 2026 – Rankings, Fees, Cutoffs & Admissions"}
              </h2>
              <p className="mb-2">
                StudyCups lists <strong>{sortedColleges.length}+</strong> top-ranked colleges
                {seoStream ? ` offering ${seoStream} programmes` : ""}
                {seoLocation ? ` in ${seoLocation}` : " across India"}.
                Compare fees, NIRF rankings, NAAC accreditation, placement packages and admission
                cutoffs all in one place. Whether you are looking for MBA, B.Tech, MBBS, Law, BBA
                or BCA colleges, our database is updated for 2026.
              </p>
              <p className="mb-2">
                Our free counselling service connects you with expert advisors who guide you through
                entrance exams (JEE, NEET, CAT, CLAT), application forms, eligibility criteria and
                scholarship opportunities at NIRF-ranked institutions.
              </p>
              <p>
                Popular streams:&nbsp;
                {["MBA", "B.Tech", "MBBS", "Law", "BBA", "BCA", "B.Sc", "M.Tech", "M.Sc"].map((s, i, arr) => (
                  <span key={s}>
                    <button
                      type="button"
                      onClick={() => setFilters(p => ({ ...p, stream: s }))}
                      className="text-blue-600 hover:underline"
                    >
                      {s} Colleges
                    </button>
                    {i < arr.length - 1 && " · "}
                  </span>
                ))}.
              </p>
            </div>

            <div className="mt-8 lg:mt-auto rounded-[32px] bg-[#1E4A7A] px-5 py-6 md:px-10 md:py-8 text-white relative overflow-hidden">
              <div className="absolute -right-12 top-8 h-36 w-36 rounded-full bg-white/5 blur-xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <h3 className="text-[30px] md:text-[30px] leading-[1.08] tracking-tight font-serif font-semibold text-white">
                  Can't Find the Right College?
                </h3>
                <p className="mt-3 max-w-2xl text-[15px] md:text-[17px] leading-[1.6] text-white/90">
                  Our counsellors know 500+ colleges inside out. Tell us your score,
                  budget and goals and we will find the perfect match for you in
                  24 hours. Completely free.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href="tel:+918081269969"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm md:text-base font-semibold text-[#0f6f79]"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#f06292]/20">
                      <span className="h-2 w-2 rounded-full bg-[#f06292]" />
                    </span>
                    Call 8081269969
                  </a>
                  <a
                    href="https://wa.me/918081269969"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm md:text-base font-semibold text-white"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE FILTER BOTTOM SHEET */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:hidden">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto p-6 animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-red-600 font-semibold text-sm"
              >
                Close
              </button>
            </div>

            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              onClearFilters={clearFilters}
              colleges={colleges}
              compareList={compareList}
              forceShow
            />

            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-6 bg-[--primary-medium] text-white py-3 rounded-xl font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>
    </div>

  );

};

export default ListingPage;
