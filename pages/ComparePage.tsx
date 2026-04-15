import React, { useEffect, useMemo, useState } from "react";
import type { College } from "../types";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface ComparePageProps {
  compareList: string[];
  colleges: College[];
}

const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
};

const pickFirst = (...values: unknown[]) => values.find(hasValue);

const cleanText = (value: unknown) => {
  if (!hasValue(value)) return null;
  return String(value).trim().replace(/\s+/g, " ");
};

const collectStrings = (value: unknown, depth = 0): string[] => {
  if (depth > 6 || value === null || value === undefined) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      collectStrings(item, depth + 1)
    );
  }
  return [];
};

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCurrencyValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.replace(/,/g, "").toLowerCase();
  const amountMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!amountMatch) return null;

  let amount = Number(amountMatch[1]);
  if (!Number.isFinite(amount)) return null;

  if (/crore|cr\b/.test(normalized)) {
    amount *= 10000000;
  } else if (/lakh|lakhs|lac|lpa|\bl\b/.test(normalized)) {
    amount *= 100000;
  } else if (/thousand|\bk\b/.test(normalized)) {
    amount *= 1000;
  } else if (/million|\bmn\b/.test(normalized)) {
    amount *= 1000000;
  }

  return amount;
};

const hasMoneyHint = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 10000;
  }

  if (typeof value !== "string") return false;

  return /(rs\.?|inr|₹|â‚¹|\bcr(?:ore)?s?\b|\bcrore(?:s)?\b|\blakh(?:s)?\b|\blac(?:s)?\b|\blpa\b|\bk\b|\bthousand\b|\bmillion\b|\bmn\b)/i.test(
    value
  );
};

const parsePackageAmount = (value: unknown) => {
  if (!hasMoneyHint(value)) return null;
  return parseCurrencyValue(value);
};

const extractMoneySnippet = (value: unknown) => {
  if (!hasValue(value)) return null;

  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (!hasMoneyHint(normalized)) return null;
  const match = normalized.match(
    /(?:rs\.?|inr|₹)?\s*\d+(?:\.\d+)?\s*(?:cr(?:ore)?s?|crores?|lpa|lakh(?:s)?|lac(?:s)?|k|thousand|million|mn)?/i
  );

  return match ? match[0].trim() : null;
};

const formatCompactCurrency = (value: number | null) => {
  if (!value || value <= 0) return "N/A";

  if (value >= 10000000) {
    return `Rs ${(value / 10000000).toFixed(value >= 100000000 ? 0 : 1)} Cr`;
  }

  if (value >= 100000) {
    return `Rs ${(value / 100000).toFixed(value >= 1000000 ? 0 : 1)} L`;
  }

  if (value >= 1000) {
    return `Rs ${(value / 1000).toFixed(0)} K`;
  }

  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
};

const formatCount = (value: number | null, suffix = "") => {
  if (value === null || !Number.isFinite(value) || value < 0) return "N/A";
  return `${Math.round(value).toLocaleString("en-IN")}${suffix}`;
};

const formatDecimal = (value: number | null, digits = 1, suffix = "") => {
  if (value === null || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(digits)}${suffix}`;
};

const getReviewCount = (college: any) =>
  parseNumber(
    pickFirst(
      college?.reviewCount,
      college?.reviews,
      college?.basic?.reviews,
      college?.rawScraped?.basic?.reviews,
      college?.rawScraped?.reviewCount
    )
  );

const getEstablishedValue = (college: any) =>
  cleanText(
    pickFirst(
      college?.established_year,
      college?.establishedYear,
      college?.established,
      college?.basic?.established_year,
      college?.basic?.establishedYear,
      college?.basic?.established,
      college?.rawScraped?.established_year,
      college?.rawScraped?.establishedYear,
      college?.rawScraped?.estd_year,
      college?.rawScraped?.basic?.established_year,
      college?.rawScraped?.basic?.establishedYear,
      college?.rawScraped?.basic?.established
    )
  );

const getCollegeType = (college: any) =>
  cleanText(
    pickFirst(
      college?.type,
      college?.college_type,
      college?.basic?.college_type,
      college?.rawScraped?.college_type,
      college?.rawScraped?.basic?.college_type
    )
  );

const getPackageCandidates = (college: any, kind: "highest" | "average") => [
  kind === "highest"
    ? college?.package_highlights?.highest_package
    : college?.package_highlights?.average_package,
  kind === "highest"
    ? college?.package_highlights?.highestPackage
    : college?.package_highlights?.averagePackage,
  kind === "highest"
    ? college?.placements?.highestPackage
    : college?.placements?.averagePackage,
  kind === "highest"
    ? college?.rawScraped?.package_highlights?.highest_package
    : college?.rawScraped?.package_highlights?.average_package,
  kind === "highest"
    ? college?.rawScraped?.placement?.highest_package
    : college?.rawScraped?.placement?.average_package,
  kind === "highest"
    ? college?.rawScraped?.placement?.highest
    : college?.rawScraped?.placement?.average,
  kind === "highest"
    ? college?.placement?.highest_package
    : college?.placement?.average_package,
  kind === "highest"
    ? college?.placement?.highestPackage
    : college?.placement?.averagePackage,
];

const getCourseTablePackageSource = (college: any, kind: "highest" | "average") => {
  const rows = college?.rawScraped?.courses_full_time;
  if (!Array.isArray(rows)) return null;

  const labelPattern =
    kind === "highest" ? /highest\s+package/i : /average\s+package/i;

  const row = rows.find((item: any) =>
    labelPattern.test(String(pickFirst(item?.course, item?.name, item?.label, "")))
  );

  return cleanText(pickFirst(row?.fees, row?.value, row?.package, row?.amount));
};

const findPackageSourceInText = (college: any, kind: "highest" | "average") => {
  const keywords =
    kind === "highest"
      ? ["highest package", "highest ctc", "top package", "highest salary"]
      : ["average package", "avg package", "average ctc", "average salary"];

  const candidates = [
    ...collectStrings(college?.placement),
    ...collectStrings(college?.rawScraped?.placement),
    ...collectStrings(college?.rawScraped?.placements),
    ...collectStrings(college?.rawScraped?.courses_full_time),
  ];

  const match = candidates.find((entry) => {
    const lower = entry.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword)) && Boolean(extractMoneySnippet(entry));
  });

  return match ? extractMoneySnippet(match) : null;
};

const getPackageValue = (college: any, kind: "highest" | "average") =>
  [
    ...getPackageCandidates(college, kind),
    getCourseTablePackageSource(college, kind),
    findPackageSourceInText(college, kind),
  ]
    .map((candidate) => parsePackageAmount(candidate))
    .find((value): value is number => Number.isFinite(value) && value > 0) ?? null;

const getPackageLabel = (college: any, kind: "highest" | "average") => {
  const source =
    [
      ...getPackageCandidates(college, kind),
      getCourseTablePackageSource(college, kind),
      findPackageSourceInText(college, kind),
    ]
      .map((candidate) => cleanText(candidate))
      .find((candidate) => candidate && parsePackageAmount(candidate) !== null) || null;

  if (source) return source.replace(/\s+/g, " ");

  const numericValue = getPackageValue(college, kind);
  return numericValue ? `${formatCompactCurrency(numericValue)} / yr` : "N/A";
};

const getAnnualFeeValue = (college: any) => {
  const directFeeValue =
    [
      college?.avg_fees,
      college?.fees,
      college?.total_fees,
      college?.rawScraped?.annual_fee,
      college?.rawScraped?.avg_fees,
      college?.rawScraped?.fees,
      college?.courses?.[0]?.fees,
    ]
      .map((value) => parseCurrencyValue(value))
      .find((value): value is number => Number.isFinite(value) && value > 0) ?? null;

  if (directFeeValue) return directFeeValue;

  const minFee = parseCurrencyValue(college?.feesRange?.min);
  const maxFee = parseCurrencyValue(college?.feesRange?.max);

  if (minFee && maxFee) {
    return minFee === maxFee ? minFee : Math.round((minFee + maxFee) / 2);
  }

  if (maxFee) return maxFee;
  if (minFee) return minFee;

  const courseRows = Array.isArray(college?.rawScraped?.courses_full_time)
    ? college.rawScraped.courses_full_time.filter((row: any) => {
        const courseName = String(pickFirst(row?.course, row?.name, row?.label, "")).trim();
        return !/highest\s+package|average\s+package|median\s+package/i.test(courseName);
      })
    : [];

  const courseFeeValue = courseRows
    .map((row: any) => parseCurrencyValue(pickFirst(row?.fees, row?.value, row?.amount)))
    .find((value: number | null) => Number.isFinite(value) && (value ?? 0) > 0);

  if (courseFeeValue) return courseFeeValue;

  return null;
};

const getAnnualFeeLabel = (college: any) => {
  const annualFee = getAnnualFeeValue(college);
  if (annualFee) return `${formatCompactCurrency(annualFee)} / year`;

  const courseRows = Array.isArray(college?.rawScraped?.courses_full_time)
    ? college.rawScraped.courses_full_time.filter((row: any) => {
        const courseName = String(pickFirst(row?.course, row?.name, row?.label, "")).trim();
        return !/highest\s+package|average\s+package|median\s+package/i.test(courseName);
      })
    : [];

  const courseFeeLabel = courseRows
    .map((row: any) => cleanText(pickFirst(row?.fees, row?.value, row?.amount)))
    .find(Boolean);

  if (courseFeeLabel) return courseFeeLabel;

  const source = cleanText(
    pickFirst(
      college?.fees,
      college?.avg_fees,
      college?.total_fees,
      college?.courses?.[0]?.fees,
      college?.rawScraped?.fees,
      college?.rawScraped?.annual_fee,
      college?.rawScraped?.avg_fees
    )
  );

  return source || "N/A";
};

const getPlacementPercentage = (college: any) => {
  const directPercentage = parseNumber(
    pickFirst(
      college?.placements?.placementPercentage,
      college?.rawScraped?.placement?.placement_percentage,
      college?.placement?.placement_percentage
    )
  );

  if (directPercentage !== null) return directPercentage;

  const totalStudents = parseNumber(
    pickFirst(
      college?.rawScraped?.info_yearly_students_placed?.total_students,
      college?.placement?.yearly_students_placed?.total_students
    )
  );

  const studentsPlaced = parseNumber(
    pickFirst(
      college?.rawScraped?.info_yearly_students_placed?.students_placed,
      college?.placement?.yearly_students_placed?.students_placed
    )
  );

  if (!totalStudents || !studentsPlaced) return null;

  return Math.round((studentsPlaced / totalStudents) * 100);
};

const findPlacementPercentageInText = (college: any) => {
  const candidates = [
    ...collectStrings(college?.placement),
    ...collectStrings(college?.rawScraped?.placement),
    ...collectStrings(college?.rawScraped?.placements),
  ];

  const match = candidates.find((entry) => {
    const lower = entry.toLowerCase();
    return (
      /(placement|placed|placement rate|placement percentage|students placed)/.test(lower) &&
      /\d+(?:\.\d+)?\s*%/.test(lower)
    );
  });

  if (!match) return null;

  const percentMatch = match.match(/(\d+(?:\.\d+)?)\s*%/);
  return percentMatch ? Number(percentMatch[1]) : null;
};

const getRoiMetrics = (college: any) => {
  const annualFee = getAnnualFeeValue(college);
  const averagePackage = getPackageValue(college, "average");

  if (!annualFee || !averagePackage) {
    return null;
  }

  const roiMultiple = averagePackage / annualFee;
  const roiPercent = ((averagePackage - annualFee) / annualFee) * 100;
  const paybackYears = annualFee / averagePackage;

  return {
    annualFee,
    averagePackage,
    roiMultiple,
    roiPercent,
    paybackYears,
  };
};

const formatPayback = (years: number | null) => {
  if (years === null || !Number.isFinite(years) || years <= 0) return "N/A";

  if (years < 1) {
    return `~${Math.max(1, Math.round(years * 12))} months`;
  }

  return `~${years.toFixed(years >= 2 ? 0 : 1)} years`;
};

const getRatingLabel = (college: any) => {
  const rating = parseNumber(pickFirst(college?.rating, college?.rawScraped?.rating));
  return rating !== null ? formatDecimal(rating, 1) : "N/A";
};

const getLocationLabel = (college: any) =>
  cleanText(pickFirst(college?.location, college?.city, college?.rawScraped?.location)) || "India";

const getLogoUrl = (college: any) =>
  cleanText(pickFirst(college?.logoUrl, college?.rawScraped?.logo));

const ComparePage: React.FC<ComparePageProps> = ({ compareList, colleges }) => {
  const navigate = useNavigate();
  const [detailMap, setDetailMap] = useState<Record<string, any>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const selectedBaseColleges = useMemo(
    () =>
      Array.from(new Set(compareList))
        .map((id) => colleges.find((college) => String(college.id) === id))
        .filter((college): college is College => Boolean(college)),
    [colleges, compareList]
  );

  useEffect(() => {
    const collegeIdsToLoad = selectedBaseColleges
      .map((college) => String(college.id))
      .filter((id) => !detailMap[id]);

    if (collegeIdsToLoad.length === 0) return;

    let cancelled = false;

    const loadDetails = async () => {
      try {
        setLoadingDetails(true);

        const results = await Promise.all(
          collegeIdsToLoad.map(async (id) => {
            try {
              const response = await fetch(`${API_BASE}/colleges/${id}`);
              const json = await response.json();

              if (json?.success && json?.data) {
                return [id, json.data] as const;
              }
            } catch (error) {
            }

            return [id, null] as const;
          })
        );

        if (cancelled) return;

        setDetailMap((prev) => {
          const next = { ...prev };

          results.forEach(([id, data]) => {
            if (data) {
              next[id] = data;
            }
          });

          return next;
        });
      } finally {
        if (!cancelled) {
          setLoadingDetails(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [detailMap, selectedBaseColleges]);

  const selectedColleges = useMemo(
    () =>
      selectedBaseColleges.map((college) => {
        const detailCollege = detailMap[String(college.id)];

        if (!detailCollege) return college;

        return {
          ...college,
          ...detailCollege,
          id: college.id,
          name: detailCollege.name || college.name,
          location: detailCollege.location || college.location,
          logoUrl: detailCollege.logoUrl || college.logoUrl,
          feesRange: detailCollege.feesRange || college.feesRange,
          placements: detailCollege.placements || college.placements,
          rawScraped: detailCollege.rawScraped || college.rawScraped,
          placement: detailCollege.placement || (college as any).placement,
          basic: detailCollege.basic || (college as any).basic,
        };
      }),
    [detailMap, selectedBaseColleges]
  );

  const comparisonFields = useMemo(
    () => [
      {
        label: "Rating",
        getValue: (college: College) => getRatingLabel(college),
      },
      {
        label: "Reviews",
        getValue: (college: College) => formatCount(getReviewCount(college), " Reviews"),
      },
      {
        label: "Established",
        getValue: (college: College) => getEstablishedValue(college) || "N/A",
      },
      {
        label: "Type",
        getValue: (college: College) => getCollegeType(college) || "N/A",
      },
      {
        label: "Annual Fee",
        getValue: (college: College) => getAnnualFeeLabel(college),
      },
      {
        label: "Highest Package",
        getValue: (college: College) => getPackageLabel(college, "highest"),
      },
      {
        label: "Average Package",
        getValue: (college: College) => getPackageLabel(college, "average"),
      },
      {
        label: "Placement %",
        getValue: (college: College) =>
          formatCount(
            getPlacementPercentage(college) ?? findPlacementPercentageInText(college),
            "%"
          ),
      },
      {
        label: "Estimated ROI",
        getValue: (college: College) => {
          const roi = getRoiMetrics(college);
          return roi ? `${roi.roiMultiple.toFixed(1)}x` : "N/A";
        },
      },
      {
        label: "ROI Gain",
        getValue: (college: College) => {
          const roi = getRoiMetrics(college);
          return roi ? `${Math.round(roi.roiPercent)}%` : "N/A";
        },
      },
      {
        label: "Payback Period",
        getValue: (college: College) => {
          const roi = getRoiMetrics(college);
          return formatPayback(roi?.paybackYears ?? null);
        },
      },
    ],
    []
  );

  if (selectedColleges.length < 2) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center bg-white rounded-2xl shadow-[0_8px_40px_rgba(10,33,74,0.10)] border border-slate-100 p-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1f4fa8] to-[#0a214a] flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#0a214a] mb-3">Compare Colleges</h1>
          <p className="text-slate-500 text-sm mb-2">Select at least <strong className="text-slate-700">2 colleges</strong> to compare fees, placements, ROI, NAAC accreditation and rankings side by side.</p>
          <p className="text-[11px] text-slate-400 mb-6">Use the <strong className="text-slate-500">Compare</strong> button on any college card in the listings.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/colleges")}
              className="px-5 py-2.5 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-[#0a1628] font-bold rounded-xl text-sm shadow hover:opacity-90 transition"
            >
              Browse Colleges →
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-[#0a214a] text-white font-semibold rounded-xl text-sm hover:bg-[#1f4fa8] transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <Helmet>
        <title>Compare Colleges Side by Side 2026 – Fees, Placements, ROI | StudyCups</title>
        <meta name="description" content="Compare top colleges side by side – fees, placement packages, ROI, NAAC accreditation, rankings and more. Make informed admission decisions for MBA, B.Tech, MBBS 2026." />
        <meta name="keywords" content="compare colleges India 2026, college comparison fees placement, MBA college compare, B.Tech college ROI, NIRF ranking comparison, StudyCups compare" />
        <link rel="canonical" href="https://studycups.in/compare" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content="Compare Colleges Side by Side 2026 | StudyCups" />
        <meta property="og:description" content="Compare fees, placements, ROI & rankings of top colleges. Make smarter admission decisions." />
        <meta property="og:url" content="https://studycups.in/compare" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Compare Colleges 2026 – Fees, Placements, ROI | StudyCups" />
        <meta name="twitter:description" content="Compare top colleges fees, packages and ROI side by side." />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />
      </Helmet>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0f7a86]">
          Side by Side Comparison
        </p>
        <h1 className="mt-2 text-[22px] md:text-[30px] font-extrabold text-[#10233e]">
          Comparing {selectedColleges.length} Colleges Side by Side
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          ROI is estimated from average package versus listed annual fee, so treat it as a quick decision aid.
        </p>
        {loadingDetails && (
          <p className="mt-2 text-xs font-medium text-[#0f7a86]">
            Loading detailed college data for packages, placements and ROI...
          </p>
        )}
      </div>

      <section className="mb-10 rounded-[28px] border border-[#dbe4ee] bg-gradient-to-br from-[#f7fbff] via-white to-[#eef8f7] p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f7a86]">
              ROI Snapshot
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#10233e]">
              College ROI Overview
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Based on detailed college page data, average package and current annual fee available for each college.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {selectedColleges.map((college) => {
            const roi = getRoiMetrics(college);
            const logoUrl = getLogoUrl(college);

            return (
              <div
                key={`roi-${college.id}`}
                className="rounded-[24px] border border-[#d7e5ef] bg-white p-5 shadow-[0_12px_30px_rgba(16,35,62,0.05)]"
              >
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={college.name}
                      className="h-14 w-14 rounded-2xl border border-[#e5edf5] bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10233e] text-sm font-bold text-white">
                      {college.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-[#10233e]">
                      {college.name}
                    </h3>
                    <p className="truncate text-sm text-slate-500">
                      {getLocationLabel(college)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f7f9fc] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Annual Fee
                    </p>
                    <p className="mt-1 text-base font-bold text-[#10233e]">
                      {getAnnualFeeLabel(college)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f7f9fc] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Avg Package
                    </p>
                    <p className="mt-1 text-base font-bold text-[#10233e]">
                      {getPackageLabel(college, "average")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#eef8f7] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0f7a86]">
                      Estimated ROI
                    </p>
                    <p className="mt-1 text-base font-bold text-[#0b5b64]">
                      {roi ? `${roi.roiMultiple.toFixed(1)}x` : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#fff6e6] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b97000]">
                      Payback
                    </p>
                    <p className="mt-1 text-base font-bold text-[#8a5900]">
                      {formatPayback(roi?.paybackYears ?? null)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="overflow-x-auto rounded-[28px] border border-[#dce5ef] bg-white shadow-sm">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="bg-[#f7fafc]">
              <th className="w-[220px] px-5 py-5 text-left text-base font-bold text-[#10233e]">
                Feature
              </th>

              {selectedColleges.map((college) => {
                const logoUrl = getLogoUrl(college);

                return (
                  <th key={college.id} className="px-5 py-5 text-center">
                    <div className="flex flex-col items-center">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={college.name}
                          className="mb-3 h-16 w-16 rounded-full border border-[#e5edf5] bg-white object-contain p-2"
                        />
                      ) : (
                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#10233e] text-lg font-bold text-white">
                          {college.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <p className="text-[18px] font-bold leading-tight text-[#10233e]">
                        {college.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {getLocationLabel(college)}
                      </p>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {comparisonFields.map((field) => (
              <tr key={field.label} className="border-t border-[#e6edf5]">
                <td className="px-5 py-4 font-semibold text-slate-600">
                  {field.label}
                </td>

                {selectedColleges.map((college) => (
                  <td
                    key={`${college.id}-${field.label}`}
                    className="px-5 py-4 text-center font-medium text-[#10233e]"
                  >
                    {field.getValue(college)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
