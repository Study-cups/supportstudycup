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
const REGION_MAP = {
  "Delhi NCR": {
    cities: [
      "Delhi",
      "New Delhi",
      "Noida",
      "Greater Noida",
      "Alpha Greater Noida",
      "Gurgaon",
      "Faridabad",
      "Ghaziabad",
      "Dwarka",
      "Rohini"
    ]
  }
};

interface FilterSidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  onClearFilters: () => void;
  forceShow?: boolean;
  colleges: College[];
  compareList: string[];
  desktopStickyTop?: number;
  sidebarRef?: React.RefObject<HTMLAsideElement | null>;
}

const DESKTOP_FILTER_STICKY_TOP = 148;
const DESKTOP_FILTER_BOTTOM_GAP = 24;

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
          ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¼
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
const getStreamSeoSlug = (stream: string): string => {
  const key = normalize(stream); // Your existing normalize fn
  const mappings: Record<string, string> = {
    ...Object.fromEntries(Object.entries(COURSE_SLUG_MAP).map(([k, v]) => [k, k])),
    engineering: 'btech',
    'b tech': 'btech',
    'b.e': 'btech',
    management: 'mba',
    medical: 'mbbs',
    'computer applications': 'bca'
  };
  return mappings[key] || toSeoSlug(stream);
};

const COURSE_SLUG_MAP: Record<string, string[]> = {
  mba: ["MBA", "PGDM", "Management"],
  btech: ["B.Tech", "BTech", "BE", "B.E", "Engineering"],
  bca: ["BCA", "Computer Applications"],
  mbbs: ["MBBS", "Medical"],
  bcom: ["bcom"],
  bsc: ["bsc"],
  ba: ["ba"],
  bba: ["bba"],
};

/* ================= FILTER SIDEBAR ================= */

const toSeoSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.\s]+/g, "-")   // ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ removes dots AND spaces
    .replace(/\//g, "-")
    .replace(/--+/g, "-");

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  forceShow = false,
  colleges,
  compareList,
  desktopStickyTop = DESKTOP_FILTER_STICKY_TOP,
  sidebarRef,
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
    console.log("FIRST COLLEGE OBJECT:", colleges[0]);
    console.log("BASIC DATA:", colleges[0]?.basic);
    console.log("COLLEGE TYPE:", colleges[0]?.basic?.college_type);
    console.log("RAW SCRAPED:", colleges[0]?.rawScraped);
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
      ref={sidebarRef}
      className={`${forceShow ? "block" : "hidden lg:block"} lg:w-1/4 xl:w-1/5 lg:sticky mt-3 self-start`}
      style={forceShow ? undefined : { top: desktopStickyTop }}
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
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1 lg:max-h-none lg:overflow-visible">
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
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 lg:max-h-none lg:overflow-visible">
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
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 lg:max-h-none lg:overflow-visible">
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
  onOpenBrochure, // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ADD THIS
  initialFilters,
}) => {

  const { stream, seoSlug } = useParams();

  console.log("ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â¢ ROUTE PARAMS:", { stream, seoSlug });

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

    // ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ ALWAYS lowercase SEO slug for route matching
    const streamSlug = toSeoSlug(filters.stream).replace(/engineering|b-tech|btech|be/, 'btech') // Normalize common variants
      .replace(/mba|pgdm|management/, 'mba') // Normalize MBA variants
      .replace(/medical|mbbs/, 'mbbs')
      .replace(/bca|computer-applications/, 'bca');

    let nextUrl = `/${streamSlug}/top-colleges`;

    if (filters.city) {
      nextUrl += `-in-${toSeoSlug(filters.city)}`;
    } else if (filters.region) {
      nextUrl += `-in-${toSeoSlug(filters.region)}`;
    }

    // ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬Ëœ Prevent infinite loops
    if (lastUrlRef.current === nextUrl) return;
    lastUrlRef.current = nextUrl;

    navigate(nextUrl, { replace: true });
  }, [filters.stream, filters.city, filters.region, navigate]);







  const hasInitializedRef = React.useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;

    const nextFilters: Partial<Filters> = {};

    // STREAM
    if (stream) {
      nextFilters.stream = stream
        .replace(/-/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());
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

    console.log("ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ INIT FILTERS FROM URL:", nextFilters);
  }, [stream, seoSlug, colleges]);


  console.log("Applied stream filter:", filters.stream);
  const selectedRegion = location.state?.region || null;

  const normalizeText = (s = "") =>
    s.toLowerCase().replace(/\s+/g, "").replace(/[.,]/g, "");

  const filterByRegion = (college, region) => {
    if (!region) return true;

    const location = normalizeText(college.location || "");
    const collegeState = normalizeText(getCollegeStateValue(college));

    // 1ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ NCR special handling (existing behavior preserved)
    const ncrConfig = REGION_MAP[region];
    if (ncrConfig) {
      return ncrConfig.cities.some(city =>
        location.includes(normalizeText(city))
      );
    }

    // 2ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Prefer direct state field, then fallback to location text
    return collegeState === normalizeText(region) || location.includes(normalizeText(region));
  };



  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("most-popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(18);
  const [desktopSidebarTop, setDesktopSidebarTop] = useState(DESKTOP_FILTER_STICKY_TOP);
  const [heroStats, setHeroStats] = useState({
    colleges: 0,
    states: 0,
    disciplines: 0,
  });
  const hasRunHeroStatsRef = useRef(false);
  const desktopSidebarRef = useRef<HTMLAsideElement | null>(null);

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
        region: navState.region ?? undefined, // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ REGION SAFE
      }));
    }
  }, [initialFilters, location.state]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const node = desktopSidebarRef.current;
    if (!node) return;

    const updateStickyTop = () => {
      if (window.innerWidth < 1024) {
        setDesktopSidebarTop(DESKTOP_FILTER_STICKY_TOP);
        return;
      }

      const sidebarHeight = node.getBoundingClientRect().height;
      const bottomLockedTop =
        window.innerHeight - sidebarHeight - DESKTOP_FILTER_BOTTOM_GAP;

      setDesktopSidebarTop(
        Math.min(DESKTOP_FILTER_STICKY_TOP, Math.round(bottomLockedTop))
      );
    };

    updateStickyTop();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateStickyTop())
        : null;

    resizeObserver?.observe(node);
    window.addEventListener("resize", updateStickyTop);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [colleges.length, compareList.length]);

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
      region: undefined, // ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ REQUIRED
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

      // 1ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ College name / city / state search
      if (filters.college) {
        const searchText = filters.college.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(searchText);
        const matchesLocation = c.location?.toLowerCase().includes(searchText);
        if (!matchesName && !matchesLocation) return false;
      }

      // 2ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ City
      if (filters.city) {
        const loc = normalize(c.location);
        if (!loc.includes(normalize(filters.city))) return false;
      }

      // 3ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Course
      if (filters.course) {
        const courses = c.rawScraped?.courses;
        if (!Array.isArray(courses)) return true;

        const hasCourse = courses.some(co =>
          co.name?.toLowerCase().includes(filters.course.toLowerCase())
        );
        if (!hasCourse) return false;
      }


      // 4ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Stream (FINAL & NULL-SAFE)
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
          .filter(Boolean); // ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥ removes empty strings

        const key = filters.stream.toLowerCase().replace(/\s+/g, "");
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


      // 5ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ College type
      if (filters.collegeType !== "All") {
        const ownershipType = getCollegeTypeValue(c);
        if (!ownershipType || ownershipType !== filters.collegeType) return false;
      }

      // 6ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Accreditation
      if (filters.accreditation) {
        const collegeAccreditations = getCollegeAccreditations(c).map((item) =>
          normalize(item)
        );
        if (!collegeAccreditations.includes(normalize(filters.accreditation))) {
          return false;
        }
      }

      // 7ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Rating
      if (filters.minRating > 0) {
        const rating = Number(c.rating);
        if (!rating || rating < filters.minRating) return false;
      }

      // 8ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Fees range
      if (!matchesFeeRange(c, filters.feeRange)) return false;


      // 9ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã†â€™Ã‚Â£ Region (ONLY when city is NOT selected)
      if (!filters.city && filters.region && !filterByRegion(c, filters.region)) {
        return false;
      }


      return true; // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ONLY BOOLEAN
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


  console.log("FILTER COUNT:", filteredColleges.length);
  const seoTitle = (() => {
    if (filters.stream && filters.stream !== "All") {
      if (filters.region) {
        return `${filters.stream} Colleges in ${filters.region} 2026 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Fees, Ranking, Admission | StudyCups`;
      }
      if (filters.city) {
        return `${filters.stream} Colleges in ${filters.city} 2026 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Fees, Ranking, Admission | StudyCups`;
      }
      return `Top ${filters.stream} Colleges in India 2026 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Fees, Ranking, Admission | StudyCups`;
    }
    return "Top Colleges in India 2026 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Rankings, Fees, Admissions | StudyCups";
  })();

  const seoDescription = (() => {
    if (filters.region || filters.city) {
      return `Explore top ${filters.stream} colleges in ${filters.city || filters.region}. Compare fees, rankings, placements, cutoffs and admission process for 2026.`;
    }
    return "Compare top colleges in India by fees, rankings, placements, cutoffs and admission process.";
  })();

  const heroHeadingContext =
    !filters.stream || filters.stream === "All"
      ? filters.city || filters.region
        ? `Top Colleges in ${filters.city || filters.region}`
        : "Across India"
      : `Top ${filters.stream} Colleges${filters.city ? ` in ${filters.city}` : !filters.city && filters.region ? ` in ${filters.region}` : ""}`;

  const mobileHeroDescription =
    filters.stream && filters.stream !== "All"
      ? `Browse our curated network of ${filters.stream} colleges. Compare fees, cutoffs, placements and get free admission help from our counsellors.`
      : "Browse our curated network of 500+ MBA, MBBS, B.Tech, BBA, Law and Fashion Design colleges. Compare fees, cutoffs and placements, then get free admission help from our counsellors.";


  return (



    <div className="bg-[#f5f7fb] min-h-screen">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link
          rel="canonical"
          href={`https://studycups.in${location.pathname}`}
        />
      </Helmet>
      {/* HERO */}
      <section className="mt-0 mb-0 md:mt-20">

        {/* MOBILE: full width | DESKTOP: centered */}
        <div className="w-full">

          <div
            className="
        relative overflow-hidden
        bg-gradient-to-br from-[#07192f] via-[#082540] to-[#0f3a5f]
        text-white
        rounded-none
        border border-[#20476c]/60
      "
          >
            <div className="absolute -top-20 -left-16 w-52 h-52 bg-[#2f6cb9]/20 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-12 right-0 w-44 h-44 bg-[#1b8a8a]/20 blur-[60px] rounded-full pointer-events-none" />

            <div className="relative z-10 px-4 py-5 md:px-6 md:py-5">
              <div className="md:hidden">
                <div className="text-[13px] text-white/65">
                  Home <span className="mx-1">&rsaquo;</span>{" "}
                  <span className="font-semibold text-[#f4a71d]">College Directory</span>
                </div>

           
                <h1
                  className="mt-8 pt-4 max-w-[320px] text-[2.1rem] leading-[0.92] tracking-[-0.04em] text-white"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Find Your{" "}
                  <span className="font-semibold italic text-[#f4a71d]">Perfect</span>
                  <br />
                  <span className="font-semibold italic text-[#f4a71d]">College</span>
                  <br />
                  <span className="text-slate-50">{heroHeadingContext}</span>
                </h1>

                <p className="mt-5 pt-2 max-w-[320px] text-[1rem] leading-7 text-slate-200/88">
                  {mobileHeroDescription}
                </p>

                <div className="mt-9 grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p
                      className="text-[1.5rem] leading-none font-semibold text-[#f4a71d]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {heroStats.colleges}+
                    </p>
                    <p className="mt-1 text-[0.9rem] leading-5 text-white/70">Partner Colleges</p>
                  </div>

                  <div>
                    <p
                      className="text-[1.5rem] leading-none font-semibold text-[#f4a71d]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {heroStats.states}
                    </p>
                    <p className="mt-1 text-[0.9rem] leading-5 text-white/70">States Covered</p>
                  </div>

                  <div>
                    <p
                      className="text-[1.5rem] leading-none font-semibold text-[#f4a71d]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {heroStats.disciplines}
                    </p>
                    <p className="mt-1 text-[0.9rem] leading-5 text-white/70">Disciplines</p>
                  </div>

                  <div>
                    <p
                      className="text-[1.5rem] leading-none font-semibold text-[#f4a71d]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Free
                    </p>
                    <p className="mt-1 text-[0.9rem] leading-5 text-white/70">Counselling</p>
                  </div>
                </div>
              </div>

              <div className="hidden grid-cols-1 items-start gap-4 md:grid md:grid-cols-12 md:gap-5">
                <div className="md:col-span-9 pl-2 md:pl-5">
                  <div className="text-[11px] md:text-xs text-white/60 mb-2">
                    Home <span className="mx-1">&rsaquo;</span>{" "}
                    <span className="text-[#f4a71d] font-semibold">College Directory</span>
                  </div>

                  <div className="inline-flex items-center rounded-full border border-[#f4a71d]/35 bg-[#f4a71d]/10 px-2.5 py-1 text-[10px] md:text-[11px] font-semibold tracking-wide text-[#ffc365]">
                    500+ PARTNER COLLEGES - UPDATED 2026
                  </div>

                  <h1 className="mt-3 text-[18px] md:text-[36px] leading-[1.08] font-bold tracking-tight">
                    Find Your{" "}
                    <span className="text-[#f4a71d] font-serif italic font-semibold">
                      Perfect College
                    </span>
                    <br className="hidden md:block" />
                    <span className="text-slate-100">{heroHeadingContext}</span>
                  </h1>

                  <p className="mt-2 text-xs md:text-sm text-slate-200/90 max-w-xl">
                    Browse our curated network of colleges. Compare fees, cutoffs,
                    placements and admission details with one clean view.
                  </p>

                  <div className="mt-3 grid grid-cols-4 gap-2.5 max-w-xl">
                    <div>
                      <p className="text-[#f4a71d] text-[15px] md:text-[24px] leading-none font-semibold font-serif">
                        {heroStats.colleges}+
                      </p>
                      <p className="text-[8px] md:text-[11px] text-white/75 mt-1">Partner Colleges</p>
                    </div>
                    <div>
                      <p className="text-[#f4a71d] text-[15px] md:text-[24px] leading-none font-semibold font-serif">
                        {heroStats.states}
                      </p>
                      <p className="text-[8px] md:text-[11px] text-white/75 mt-1">States Covered</p>
                    </div>
                    <div>
                      <p className="text-[#f4a71d] text-[15px] md:text-[24px] leading-none font-semibold font-serif">
                        {heroStats.disciplines}
                      </p>
                      <p className="text-[8px] md:text-[11px] text-white/75 mt-1">Disciplines</p>
                    </div>
                    <div>
                      <p className="text-[#f4a71d] text-[15px] md:text-[24px] leading-none font-semibold font-serif">
                        Free
                      </p>
                      <p className="text-[8px] md:text-[11px] text-white/75 mt-1">Counselling</p>
                    </div>
                  </div>


                </div>

                <div className="md:col-span-3">
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
                    {[
                      ["Top MBA Colleges", "200+"],
                      ["Medical Colleges", "100+"],
                      ["Engineering Colleges", "150+"],
                      ["Avg Placement Package", "7.2Lpa"],
                      ["Law Colleges", "80+"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className={`rounded-xl border border-white/12 bg-white/8 backdrop-blur px-2.5 py-2 ${label === "Top MBA Colleges" || label === "Avg Placement Package"
                            ? ""
                            : "hidden md:block"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] md:text-[12px] text-white/80">{label}</span>
                          <span className="text-[#f4a71d] font-semibold text-xs md:text-sm">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DESKTOP TOP FILTER BAR */}
      <div className="hidden lg:block sticky top-[74px] z-40 bg-[#f5f7fb] border-b border-[#d9d4ca] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="w-full px-0 py-0">
          <div className="rounded-none border-0 bg-[#f2efe7] px-4 py-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 min-w-[280px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4a7aa5]">
                  🔍
                </span>
                <input
                  value={filters.college}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      college: e.target.value,
                    }))
                  }
                  placeholder="Search college name, city or state..."
                  className="h-11 w-full rounded-[10px] border border-[#d8d3c8] bg-white pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-[#9daab8]"
                />
              </div>

              <select
                value={filters.stream}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    stream: e.target.value,
                  }))
                }
                className="h-11 min-w-[140px] rounded-[10px] border border-[#d8d3c8] bg-white px-3 text-sm text-slate-700 outline-none"
              >
                <option value="All">All Courses</option>
                {topBarOptions.streams.map((streamName) => (
                  <option key={streamName} value={streamName}>
                    {streamName}
                  </option>
                ))}
              </select>

              <select
                value={filters.city}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    city: e.target.value,
                    region: undefined,
                  }))
                }
                className="h-11 min-w-[130px] rounded-[10px] border border-[#d8d3c8] bg-white px-3 text-sm text-slate-700 outline-none"
              >
                <option value="">All Cities</option>
                {topBarOptions.cities.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>

              <select
                value={filters.feeRange}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    feeRange: e.target.value,
                  }))
                }
                className="h-11 min-w-[140px] rounded-[10px] border border-[#d8d3c8] bg-white px-3 text-sm text-slate-700 outline-none"
              >
                {FEE_RANGE_OPTIONS.map((feeOption) => (
                  <option key={feeOption} value={feeOption}>
                    {feeOption}
                  </option>
                ))}
              </select>

              <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
                {sortedColleges.length} colleges found
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* ONLY MOBILE SEARCH + FILTER (UPPER ONE) */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 mt-3 mb-4">
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

      {/* CONTENT */}
      <div className="max-w-full mx-auto px-4 md:px-6 pb-20 overflow-visible">
        <div className="flex flex-col lg:flex-row gap-10 items-stretch">

          {/* DESKTOP FILTER */}
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            onClearFilters={clearFilters}
            colleges={colleges}
            compareList={compareList}
            desktopStickyTop={desktopSidebarTop}
            sidebarRef={desktopSidebarRef}
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
