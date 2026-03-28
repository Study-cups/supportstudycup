import React from "react";
import type { College } from "../types";
import { useNavigate } from "react-router-dom";

interface CollegeCardProps {
  college: College;
  onCompareToggle?: (id: string) => void;
  isCompared?: boolean;
  onOpenBrochure?: () => void;
  onOpenApplyNow?: () => void;
  isListingCard?: boolean;
  className?: string;
}

const ChevronRight: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 4.5 12.5 10 7 15.5" />
  </svg>
);

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const normalizedRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const fullStars = Math.floor(normalizedRating);

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${index < fullStars ? "text-[#f3af1c]" : "text-[#d7dde8]"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
};

const getCollegeSlug = (collegeName: string) =>
  collegeName
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const getDisplayStream = (collegeData: any) => {
  if (Array.isArray(collegeData?.stream) && collegeData.stream.length > 0) {
    return collegeData.stream[0];
  }

  if (typeof collegeData?.stream === "string" && collegeData.stream.trim()) {
    return collegeData.stream;
  }

  if (typeof collegeData?.rawScraped?.stream === "string" && collegeData.rawScraped.stream.trim()) {
    return collegeData.rawScraped.stream;
  }

  return "Courses Available";
};

const getRankingText = (collegeData: any) => {
  if (typeof collegeData?.ranking === "string" && collegeData.ranking.trim()) {
    return collegeData.ranking.trim();
  }

  if (collegeData?.rawScraped?.ranking_data) {
    const rankingValues = Object.values(collegeData.rawScraped.ranking_data)
      .map((item: any) => (typeof item?.ranking === "string" ? item.ranking.trim() : ""))
      .filter(Boolean);

    if (rankingValues.length > 0) {
      return rankingValues.join(" | ");
    }
  }

  return "N/A";
};

const getRankingSource = (rankingText: string) => {
  if (/nirf/i.test(rankingText)) return "Ranked by NIRF";
  if (/india today/i.test(rankingText)) return "Ranked by India Today";
  if (/outlook/i.test(rankingText)) return "Ranked by Outlook";
  if (/times/i.test(rankingText)) return "Ranked by Times";
  return "Latest ranking details";
};

const getCollegeInitials = (collegeName: string) =>
  collegeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "SC";

const formatFeeText = (collegeData: any) => {
  const rawFee = collegeData?.feesRange?.min ?? collegeData?.feesRange?.max;
  const numericFee = Number(rawFee);

  if (!Number.isFinite(numericFee) || numericFee <= 0) {
    return "N/A";
  }

  return `\u20B9${numericFee.toLocaleString("en-IN")}`;
};

const CollegeCard: React.FC<CollegeCardProps> = ({
  college,
  onCompareToggle,
  isCompared,
  onOpenBrochure,
  isListingCard,
  className,
}) => {
  const collegeData = college as College & Record<string, any>;
  const navigate = useNavigate();

  const route = `/university/${collegeData.id}-${getCollegeSlug(collegeData.name || "")}`;
  const rankingText = getRankingText(collegeData);
  const ratingValue = Number(collegeData?.rating ?? 0);
  const displayRating = Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : "N/A";
  const feeText = formatFeeText(collegeData);
  const displayStream = getDisplayStream(collegeData);
  const logoSrc = collegeData?.logoUrl ?? collegeData?.rawScraped?.logo;
  const isFeaturedCollege =
    typeof collegeData?.featured_college === "string" &&
    collegeData.featured_college.trim().toLowerCase() === "featured";

  const cardPadding = isListingCard ? "p-4 sm:p-5" : "p-4";

  return (
    <div
      className={[
        "relative flex w-full max-w-[360px] self-start flex-col overflow-hidden rounded-[26px] sm:max-w-[370px]",
        "border border-[#e4e8f0] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_58%,#f5f7fb_100%)]",
        "shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)] md:max-w-none",
        className ?? "",
      ].join(" ")}
    >
      <div className={`flex flex-col ${cardPadding}`}>
        {isFeaturedCollege && (
          <span className="inline-flex w-fit items-center rounded-full bg-[#f3ab1b] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#10233e] shadow-[0_8px_18px_rgba(243,171,27,0.24)]">
            Featured
          </span>
        )}

        <button
          type="button"
          onClick={() => navigate(route)}
          className={`flex w-full items-start gap-3 text-left ${isFeaturedCollege ? "mt-4" : ""}`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d8dde8] bg-white shadow-sm sm:h-14 sm:w-14">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={collegeData.name}
                loading="lazy"
                decoding="async"
                className="h-8 w-8 rounded-full object-contain sm:h-9 sm:w-9"
              />
            ) : (
              <span className="text-sm font-semibold tracking-[0.08em] text-[#10233e] sm:text-base">
                {getCollegeInitials(collegeData.name || "")}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[18px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#10233e] sm:text-[21px]">
              {collegeData.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[15px] leading-[1.3] text-[#223a59] sm:text-[13px]">
              {collegeData.location || "Location unavailable"}
            </p>
          </div>
        </button>

        <div className="mt-4 border-t border-[#d9e0ea]" />

        <div className="mt-4">
          <div className="flex flex-row gap-2 sm:flex-row sm:items-start justify-between sm:gap-4">
            <p className="min-w-0 text-[16px] font-semibold leading-tight text-[#10233e] sm:text-[15px]">
              {displayStream}
            </p>

            <div className="shrink-0 text-left sm:text-right">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <span className="text-[16px] font-semibold text-[#f3ab1b] sm:text-[15px]">{displayRating}</span>
                <StarRating rating={ratingValue} />
              </div>
            </div>
          </div>

          <p className="mt-2.5 text-[16px] font-semibold text-[#10233e] sm:text-[15px]">
            {feeText}
            <span className="font-normal text-[#4d5d73]"> / year</span>
          </p>

          <p className="mt-3 text-[14px] font-medium leading-snug text-[#18304d] sm:text-[13px]">
            {rankingText === "N/A" ? "Ranking NIRF 2026" : `Ranked ${rankingText}`}
          </p>
          <p className="mt-1 text-[12px] text-[#8a94a5] sm:text-[13px]">
            {rankingText === "N/A" ? "Latest updates coming soon" : getRankingSource(rankingText)}
          </p>
        </div>

        <div className="mt-4 border-t border-[#d9e0ea]" />

        <div className="mt-2 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => navigate(route)}
            className="flex w-full items-center justify-between rounded-2xl px-2.5 py-2.5 text-left text-[14px] font-medium text-[#10233e] transition hover:bg-[#eef3fa] sm:px-3 sm:text-[15px]"
          >
            <span>View All Courses and Fees</span>
            <ChevronRight className="h-4 w-4 text-[#10233e]" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenBrochure?.();
            }}
            className="flex w-full items-center justify-between rounded-2xl px-2.5 py-2.5 text-left text-[14px] font-medium text-[#10233e] transition hover:bg-[#eef3fa] sm:px-3 sm:text-[15px]"
          >
            <span>Download Brochure</span>
            <ChevronRight className="h-4 w-4 text-[#10233e]" />
          </button>

          <button
            type="button"
            onClick={() => onCompareToggle?.(String(collegeData.id))}
            className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-2.5 text-left text-[14px] font-medium transition sm:px-3 sm:text-[15px] ${
              isCompared
                ? "bg-[#ebf8f0] text-[#1b6b40]"
                : "text-[#10233e] hover:bg-[#eef3fa]"
            }`}
          >
            <span>Compare</span>
            <span className="flex items-center gap-2">
              {isCompared && (
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#1b6b40]">
                  Added
                </span>
              )}
              <ChevronRight className={`h-4 w-4 ${isCompared ? "text-[#1b6b40]" : "text-[#10233e]"}`} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegeCard;
