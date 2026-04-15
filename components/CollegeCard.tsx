import React from "react";
import type { College } from "../types";
import { useNavigate, Link } from "react-router-dom";

interface CollegeCardProps {
  college: College;
  onCompareToggle?: (id: string) => void;
  isCompared?: boolean;
  onOpenBrochure?: () => void;
  onOpenApplyNow?: () => void;
  isListingCard?: boolean;
}

/* ── Helpers ── */
const getSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.min(Math.floor(rating), 5);
  const half = rating - full >= 0.5 && full < 5;
  return (
    <div className="flex items-center gap-[2px]">
      {[...Array(full)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {half && (
        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
    </div>
  );
};

const getAccreditationBadge = (college: any): string => {
  const sources = [
    college?.accreditation,
    college?.rawScraped?.accreditation,
    college?.rawScraped?.accreditations,
  ];
  for (const s of sources) {
    if (typeof s === "string" && s.trim()) return s.trim().split(/[,|;/]/)[0].trim();
    if (Array.isArray(s) && s.length) return String(s[0]).trim();
  }
  return "";
};

const getCollegeType = (college: any): string => {
  const candidates = [
    college?.college_type,
    college?.basic?.college_type,
    college?.rawScraped?.basic?.college_type,
    college?.type,
  ];
  return (
    candidates.map((v) => (typeof v === "string" ? v.trim() : "")).find(Boolean) || ""
  );
};

const getPlacementPkg = (college: any): string => {
  const raw =
    college?.placements?.highestPackage ??
    college?.rawScraped?.placements?.highestPackage ??
    college?.placements?.averagePackage ??
    college?.rawScraped?.placements?.averagePackage;
  if (!raw) return "";
  const num = parseFloat(String(raw).replace(/[^\d.]/g, ""));
  if (!num) return "";
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const getRankingText = (college: any): string => {
  if (typeof college.ranking === "string" && college.ranking.trim()) return college.ranking.trim();
  if (college.rawScraped?.ranking_data) {
    const vals = Object.values(college.rawScraped.ranking_data) as any[];
    const first = vals[0]?.ranking;
    if (first) return String(first);
  }
  return "";
};

const ACCREDITATION_COLOR: Record<string, string> = {
  "A++": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "A+":  "bg-green-100 text-green-700 border-green-200",
  "A":   "bg-blue-100 text-blue-700 border-blue-200",
  "B++": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "B+":  "bg-violet-100 text-violet-700 border-violet-200",
};

const badgeColor = (grade: string) =>
  ACCREDITATION_COLOR[grade] ?? "bg-slate-100 text-slate-600 border-slate-200";

/* ═══════════════════════════════════════════════════════════
   COLLEGE CARD
═══════════════════════════════════════════════════════════ */
const CollegeCard: React.FC<CollegeCardProps> = ({
  college,
  onCompareToggle,
  isCompared,
  onOpenBrochure,
  onOpenApplyNow,
}) => {
  const navigate = useNavigate();

  const mainImage  = college.imageUrl ?? college.heroImages?.[0] ?? "/no-image.jpg";
  const logoSrc    = college.logoUrl ?? (college as any).rawScraped?.logo;
  const slug       = getSlug(college.name);
  const detailUrl  = `/university/${college.id}-${slug}`;
  const accr       = getAccreditationBadge(college);
  const collegeType = getCollegeType(college);
  const placement  = getPlacementPkg(college);
  const rankText   = getRankingText(college);
  const fees       = college.feesRange?.min
    ? `₹${Number(college.feesRange.min).toLocaleString("en-IN")}`
    : "N/A";
  const streamLabel = Array.isArray((college as any).stream)
    ? (college as any).stream[0]
    : (college as any).stream ?? (college as any).rawScraped?.stream ?? "Courses Available";

  return (
    <article
      className="
        group bg-white rounded-2xl border border-slate-100
        shadow-[0_4px_24px_rgba(10,33,74,0.08)]
        hover:shadow-[0_12px_40px_rgba(10,33,74,0.16)]
        hover:-translate-y-1
        transition-all duration-300
        overflow-hidden w-full flex flex-col
      "
      aria-label={`${college.name} – ${streamLabel} college in ${college.location}`}
    >
      {/* ── IMAGE BANNER ── */}
      <div
        className="relative w-full h-[175px] cursor-pointer overflow-hidden"
        onClick={() => navigate(detailUrl)}
        role="link"
        aria-label={`View details of ${college.name}`}
      >
        <img
          src={mainImage}
          alt={`${college.name} campus – ${streamLabel} college in ${college.location}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Accreditation badge – top right */}
        {accr && (
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor(accr)}`}>
            NAAC {accr}
          </span>
        )}

        {/* College type badge – top left */}
        {collegeType && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 border border-white/30 text-white backdrop-blur-sm">
            {collegeType}
          </span>
        )}

        {/* Logo + name overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 flex items-end gap-2.5">
          {logoSrc && (
            <img
              src={logoSrc}
              alt={`${college.name} logo`}
              loading="lazy"
              decoding="async"
              className="flex-shrink-0 h-9 w-9 rounded-lg bg-white shadow-md p-1 object-contain"
            />
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow">
              {college.name}
            </p>
            {college.location && (
              <p className="text-white/80 text-[11px] mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{college.location}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col flex-1 p-4">

        {/* Stream pill + Rating row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[60%]">
            {streamLabel}
          </span>
          <div className="flex items-center gap-1.5">
            <StarRating rating={Number(college.rating) || 0} />
            <span className="text-xs font-semibold text-slate-700">
              {Number(college.rating || 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Stats row: Fees | Placement | Ranking */}
        <div className="grid grid-cols-3 gap-1 mb-3 rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
          <div className="flex flex-col items-center py-2 border-r border-slate-100">
            <span className="text-[12px] font-bold text-[#1f4fa8] leading-tight">{fees}</span>
            <span className="text-[9px] text-slate-500 mt-0.5">/ year</span>
          </div>
          <div className="flex flex-col items-center py-2 border-r border-slate-100">
            <span className="text-[12px] font-bold text-emerald-600 leading-tight">
              {placement || "N/A"}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">Highest Pkg</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-[12px] font-bold text-amber-600 leading-tight truncate max-w-full px-1">
              {rankText ? `#${rankText.replace(/^#/, "")}` : "—"}
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">Rank</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Buttons */}
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenApplyNow?.();
            }}
            className="
              flex-1 py-2.5 rounded-xl text-[12px] font-bold
              bg-gradient-to-r from-[#f59e0b] to-[#d97706]
              text-white shadow-[0_4px_12px_rgba(217,119,6,0.30)]
              hover:shadow-[0_6px_18px_rgba(217,119,6,0.45)]
              hover:-translate-y-0.5 transition-all duration-200
            "
          >
            Apply Now →
          </button>

          <Link
            to={detailUrl}
            className="
              flex-1 py-2.5 rounded-xl text-[12px] font-bold text-center
              bg-[#0a214a] text-white
              hover:bg-[#1f4fa8]
              transition-all duration-200
            "
            aria-label={`View details and courses of ${college.name}`}
          >
            View Details
          </Link>
        </div>

        {/* Secondary row: Brochure + Compare */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBrochure?.();
            }}
            className="text-[11px] text-slate-500 hover:text-[#1f4fa8] flex items-center gap-1 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Brochure
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle?.(String(college.id));
            }}
            className={`text-[11px] flex items-center gap-1 font-semibold transition ${
              isCompared
                ? "text-emerald-600"
                : "text-slate-500 hover:text-[#1f4fa8]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {isCompared ? "✓ Added" : "Compare"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default CollegeCard;
