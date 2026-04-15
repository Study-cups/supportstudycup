import React, { useEffect, useMemo, useState } from "react";
import type { View, College } from "../types";
import { getCollegeImages } from "../collegeImages";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import FlexibleBlockRenderer from './FlexibleBlockRenderer'
import { toCourseSlug, toSeoSlug } from "./Seo"
import { Helmet } from "react-helmet-async"

import {
  Monitor,
  Dumbbell,
  Stethoscope,
  Coffee,
  BookOpen,
  Building2,
  BedDouble,
  Trophy,
  Wifi,
  Car,
  FlaskConical,
  Users
} from "lucide-react";

// FACILITY ICON MAP (Homepage only)
const FACILITY_ICON_MAP: Record<string, React.ReactNode> = {
  comp_labs: <Monitor size={16} />,
  sports: <Trophy size={16} />,
  gym: <Dumbbell size={16} />,
  medical: <Stethoscope size={16} />,
  cafeteria: <Coffee size={16} />,
  library: <BookOpen size={16} />,
  auditorium: <Building2 size={16} />,
  hostel: <BedDouble size={16} />,

  // future (safe)
  wifi: <Wifi size={16} />,
  parking: <Car size={16} />,
  labs: <FlaskConical size={16} />,
  classrooms: <Users size={16} />
};

const TAB_SLUG_TO_KEY: Record<string, string> = {
  basic: "basic",
  info: "basic",
  "courses-fees": "Courses & Fees",
  admission: "admission",
  placement: "placement",
  cutoff: "cutoff",
  scholarship: "scholarship",
  ranking: "ranking",
  faculty: "faculty",
  qna: "qna",
  reviews: "reviews",
  gallery: "gallery"
};

const TAB_KEY_TO_SLUG: Record<string, string> = {
  basic: "",
  "Courses & Fees": "courses-fees",
  admission: "admission",
  placement: "placement",
  cutoff: "cutoff",
  scholarship: "scholarship",
  ranking: "ranking",
  faculty: "faculty",
  qna: "qna",
  reviews: "reviews",
  gallery: "gallery"
};

const normalizeCollegeSlugSource = (text: string = "") => {
  if (!text) return "";

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const withoutDescription =
    normalized.split(/\s+(?:is|was|has|have|offers?|offering|ranked|established|founded|approved|affiliated|located|admission|note)\b/i)[0]?.trim() ||
    normalized;

  const firstChunk = withoutDescription.split(/[|,:;]+/)[0]?.trim() || withoutDescription;
  return firstChunk.replace(/[-\s|,:;]+$/g, "").trim();
};

const extractCollegeNameFromAbout = (aboutText: string = "") => {
  const cleaned = normalizeCollegeSlugSource(aboutText);
  if (cleaned.length < 6) return "";
  return cleaned;
};

const buildCollegeCodePrefix = (shortName: string = "") => {
  const words = shortName
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length < 2) return "";

  const first = words[0].replace(/[^A-Za-z]/g, "");
  const second = words[1].replace(/[^A-Za-z]/g, "");

  if (!first || first !== first.toUpperCase() || first.length < 2) return "";
  if (!second) return first.toLowerCase();

  return `${first.toLowerCase()}${second[0].toLowerCase()}`;
};


interface DetailPageProps {

  compareList: string[];
  onCompareToggle: (id: string) => void;
  onOpenApplyNow: () => void;
  onOpenBrochure: () => void;
}


type CollegeDetail = {
  overview?: string;
  courses?: any[];
  fees?: any;
  placements?: any;
  reviews?: any[];
  gallery?: string[];

  ranking_data?: any[];
  rawScraped?: any;
  type?: string;
};

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-xl bg-slate-50 border p-3 text-center">
    <p className="text-lg font-bold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
  </div>
);

const InfoRow = ({ label, value }: any) => (
  <div className="flex justify-between text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

const buildRankingTable = (rawData: any[]) => {
  const table: Record<string, Record<string, any>> = {};
  const yearsSet = new Set<string>();

  rawData.forEach(entry => {
    const stream = entry.stream || "Overall";
    const lines = normalizeRankingText(entry.ranking);

    lines.forEach(line => {
      const parsed = parseRankingLine(line);
      if (!parsed.year) return;

      yearsSet.add(parsed.year);

      // Ignore international here (optional: separate table later)
      if (parsed.isInternational) return;

      // Only India rankings participate in main table
      if (!parsed.isIndia) return;

      if (!table[stream]) table[stream] = {};

      const current = table[stream][parsed.year];

      // ✅ BEST ranking per year (lower rank = better)
      if (!current || isBetterRank(parsed.rank!, current.rank)) {
        table[stream][parsed.year] = {
          rank: parsed.rank,
          main: parsed.raw,
          state: current?.state || null
        };
      }

      // ✅ Attach state ranking only ONCE
      if (
        parsed.isState &&
        table[stream][parsed.year] &&
        !table[stream][parsed.year].state
      ) {
        table[stream][parsed.year].state = parsed.raw;
      }
    });
  });

  const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  return { table, years };
};





const buildCourseSlug = (name: string) => {
  return encodeURIComponent(
    name
      .toLowerCase()
      .trim()
  );
};

type DescriptionBlock =
  | { type: "text"; content: string }
  | { type: "list"; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] };

const normalizeDescription = (description: any): DescriptionBlock[] => {
  if (!description) return [];

  const blocks: DescriptionBlock[] = [];

  // ✅ CASE 1: description is string
  if (typeof description === "string") {
    return [{ type: "text", content: description }];
  }

  // ✅ CASE 2: description is object
  if (typeof description === "object") {

    // handle numeric / unknown keys → text
    Object.keys(description).forEach((key) => {
      if (key !== "blocks" && typeof description[key] === "string") {
        blocks.push({
          type: "text",
          content: description[key]
        });
      }
    });

    // handle structured blocks safely
    if (Array.isArray(description.blocks)) {
      description.blocks.forEach((block: any) => {

        // TEXT
        if (block.type === "text" && block.content) {
          blocks.push({
            type: "text",
            content: block.content
          });
        }

        // LIST (SAFE)
        if (
          block.type === "list" &&
          Array.isArray(block.data?.items)
        ) {
          blocks.push({
            type: "list",
            items: block.data.items
          });
        }

        // TABLE (SAFE)
        if (
          block.type === "table" &&
          Array.isArray(block.data?.columns) &&
          Array.isArray(block.data?.rows)
        ) {
          blocks.push({
            type: "table",
            columns: block.data.columns,
            rows: block.data.rows
          });
        }
      });
    }
  }

  return blocks;
};

const parseRankingLine = (line: string) => {
  const rankMatch = line.match(/#(\d+|\d+-\d+)/);
  const yearMatch = line.match(/(20\d{2})/);

  return {
    raw: line.trim(),
    rank: rankMatch ? rankMatch[1] : null,
    year: yearMatch ? yearMatch[1] : null,
    isIndia: /india/i.test(line),
    isState: /uttar pradesh/i.test(line),
    isInternational: /international/i.test(line)
  };
};
const isBetterRank = (a?: string, b?: string) => {
  if (!a) return false;
  if (!b) return true;

  const aNum = parseInt(a);
  const bNum = parseInt(b);

  if (isNaN(aNum)) return false;
  if (isNaN(bNum)) return true;

  return aNum < bNum; // smaller = better
};


const normalizeRankingText = (ranking: any): string[] => {
  // case 1: simple string
  if (typeof ranking === "string") {
    return ranking
      .split("#")
      .map(t => t.trim())
      .filter(Boolean);
  }

  // case 2: object {0:"",1:""}
  if (ranking && typeof ranking === "object") {
    return Object.values(ranking)
      .filter(v => typeof v === "string")
      .flatMap(v =>
        v
          .split("#")
          .map(t => t.trim())
          .filter(Boolean)
      );
  }

  return [];
};

const renderFlexibleText = (value: any): React.ReactNode => {
  // Case 1: string
  if (typeof value === "string") {
    return value;
  }

  // Case 2: number
  if (typeof value === "number") {
    return String(value);
  }

  // Case 3: array
  if (Array.isArray(value)) {
    return value.map((v, i) => (
      <div key={i}>{renderFlexibleText(v)}</div>
    ));
  }

  // Case 4: object (THIS IS YOUR CASE)
  if (value && typeof value === "object") {
    return Object.values(value).map((v, i) => (
      <div key={i}>{renderFlexibleText(v)}</div>
    ));
  }

  return "-";
};
const renderRankingCell = (value: any) => {
  // ✅ CASE 1: array of strings (MAIN CASE)
  if (Array.isArray(value)) {
    return value.length > 0 ? (
      <ul className="list-disc pl-4 space-y-1">
        {value.map((v, i) => (
          <li key={i} className="text-sm">
            {v}
          </li>
        ))}
      </ul>
    ) : (
      "-"
    );
  }

  // ✅ CASE 2: single string
  if (typeof value === "string") {
    return <div className="whitespace-pre-line">{value}</div>;
  }

  // ✅ CASE 3: object (safety for bad data)
  if (value && typeof value === "object") {
    return (
      <ul className="list-disc pl-4 space-y-1">
        {Object.values(value).map((v, i) => (
          <li key={i} className="text-sm">
            {String(v)}
          </li>
        ))}
      </ul>
    );
  }

  return "-";
};





const DetailPage: React.FC<DetailPageProps> = ({

  compareList,
  onCompareToggle,
  setView,
  onOpenApplyNow,
  onOpenBrochure
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("basic");
  const [detail, setDetail] = useState<CollegeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseOfferingColleges, setCourseOfferingColleges] = useState<College[]>([]);
  const [loadingCourseOfferingColleges, setLoadingCourseOfferingColleges] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [newsOpen, setNewsOpen] = useState<boolean[]>([]);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllExpired, setShowAllExpired] = useState(false);

 
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const [showVisited, setShowVisited] = useState(false);
  const [showAllFeeNotes, setShowAllFeeNotes] = useState(false);
  const [openSubCourseIndex, setOpenSubCourseIndex] = useState<number | null>(null);
  const [showFullAdmissionText, setShowFullAdmissionText] = useState(false);
  const [showAllAdmissionBullets, setShowAllAdmissionBullets] = useState(false);
  const [showAllLikes, setShowAllLikes] = useState(false);
  const [showAllDislikes, setShowAllDislikes] = useState(false);
  const [showAllStudentLikes, setShowAllStudentLikes] = useState(false);
  const [showAllStudentDislikes, setShowAllStudentDislikes] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [courses, setCourses] = useState<any[]>([]);
const [loadingCourses, setLoadingCourses] = useState(false);



  const { collegeIdSlug, courseSlug } = useParams<{ collegeIdSlug: string; courseSlug?: string }>();
  const [college, setCollege] = useState<any>(null);
  const [loadingCollege, setLoadingCollege] = useState(true);
  const isCourseRoute = location.pathname.includes("/course/");

  const tabFromRoute = useMemo(() => {
    if (!courseSlug || isCourseRoute) return null;
    return TAB_SLUG_TO_KEY[courseSlug.toLowerCase()] || null;
  }, [courseSlug, isCourseRoute]);

  const activeCourseSlug = useMemo(() => {
    if (!courseSlug) return "";
    if (isCourseRoute) return courseSlug;
    if (tabFromRoute) return "";
    return courseSlug;
  }, [courseSlug, isCourseRoute, tabFromRoute]);


  // URL example:
  // /university/25946-iiml-indian-institute-of-management-lucknow
  const collegeId = useMemo(() => {
    if (!collegeIdSlug) return null;
    return Number(collegeIdSlug.split("-")[0]);
    // 🔥 ID always first
  }, [collegeIdSlug]);


  const id = collegeId;



 const upcoming =
  college?.admission?.important_dates?.important_events || [];

const expired =
  college?.admission?.important_dates?.expired_events || [];

  const descriptionBlocks = useMemo(() => {
    return normalizeDescription(
      detail?.description ?? college?.description
    );
  }, [detail?.description, college?.description]);


  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.replace("~", "").trim().charAt(0).toUpperCase();
  };

  type ReviewCardProps = {
    content: string;
    username: string;
    color: "green" | "red";
  };

  const ReviewCard: React.FC<ReviewCardProps> = ({
    content,
    username,
    color
  }) => {
    return (
      <div className="flex gap-4 p-4 border rounded-xl bg-white shadow-sm">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center 
        font-bold text-white text-sm
        ${color === "green" ? "bg-green-600" : "bg-red-600"}`}
        >
          {username?.replace("~", "").trim().charAt(0).toUpperCase() || "A"}
        </div>

        <div className="flex-1">
          <p className="text-sm text-slate-800 leading-relaxed">{content}</p>
          <p className="mt-1 text-xs text-slate-500">
            {username || "~ Anonymous"}
          </p>
        </div>
      </div>
    );
  };

  const handleBack = () => {
    navigate(-1); // previous page (college listing)
  };
 

useEffect(() => {
  if (tabFromRoute) {
    setActiveTab(tabFromRoute);
    return;
  }

  if (activeCourseSlug) {
    setActiveTab("Courses & Fees");
    return;
  }

  setActiveTab("basic");
}, [tabFromRoute, activeCourseSlug]);

useEffect(() => {

  if (activeTab !== "Courses & Fees") return;
  if (!collegeId) return;

  const loadCourses = async () => {

    try {

      setLoadingCourses(true);

      const res = await fetch(
        `https://studycupsbackend-wb8p.onrender.com/api/college-course/college/${collegeId}`
      );

      const json = await res.json();

      if (json.success && json.data?.length) {
  setCourses(json.data[0].courses || []);
}
console.log("COURSE API RESPONSE:", json);

    } catch (err) {
      console.error("Courses API error", err);
    } finally {
      setLoadingCourses(false);
    }

  };

  loadCourses();

}, [activeTab, collegeId]);

  const sliceForMobile = (arr: string[], count = 5) =>
    arr.slice(0, count);
  const sliceSix = (arr: string[], showAll: boolean) =>
    showAll ? arr : arr.slice(0, 6);


  const admissionSections = detail?.rawScraped?.admission || [];



  const openLightbox = (img: string) => {
    setActiveImage(img);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setActiveImage(null);
  };



  // QNA STATES FIX (ADDED)
  const [qnaOpen, setQnaOpen] = useState<boolean[]>([]);


  useEffect(() => {
    if (detail?.rawScraped?.qna?.length > 0) {
      setQnaOpen(Array(detail.rawScraped.qna.length).fill(false));
    }
  }, [detail]);

  const cleanedAboutText = useMemo(() => {
    const raw =
      detail?.rawScraped?.about_text ?? college?.description ?? "";

    // 🛡️ SAFETY GUARD
    if (typeof raw !== "string") return "";

    if (raw.includes("Read More")) {
      return raw.split("Read More")[0].trim();
    }

    return raw.trim();
  }, [detail?.rawScraped?.about_text, college?.description]);


  const textBlocks = descriptionBlocks.filter(b => b.type === "text");
  const nonTextBlocks = descriptionBlocks.filter(b => b.type !== "text");

  useEffect(() => {
    if (!activeCourseSlug) {
      setCourseOfferingColleges([]);
      setLoadingCourseOfferingColleges(false);
      return;
    }

    let isCancelled = false;

    const getRawValue = (value: any): string => {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") return value.value || "";
      return "";
    };

    const courseMatchesSlug = (items: any[] = []) =>
      items.some((courseItem: any) => {
        if (courseItem?.slug_url === activeCourseSlug) return true;

        const subCourses = Array.isArray(courseItem?.sub_courses)
          ? courseItem.sub_courses
          : [];

        return subCourses.some(
          (subCourse: any) => getRawValue(subCourse?.slug_url) === activeCourseSlug
        );
      });

    const fetchCourseOfferingColleges = async () => {
      try {
        setLoadingCourseOfferingColleges(true);

        const pageSize = 100;
        const collegesRes = await fetch(`https://studycupsbackend-wb8p.onrender.com/api/colleges?page=1&limit=${pageSize}`);
        const collegesJson = await collegesRes.json();
        const firstPageColleges = Array.isArray(collegesJson?.data)
          ? collegesJson.data.filter((item: College) => item?.id)
          : [];
        const totalColleges = Number(collegesJson?.total) || firstPageColleges.length;
        const totalPages = Math.max(1, Math.ceil(totalColleges / pageSize));

        let allColleges = firstPageColleges;

        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, async (_unused, index) => {
              const page = index + 2;
              const pageRes = await fetch(
                `https://studycupsbackend-wb8p.onrender.com/api/colleges?page=${page}&limit=${pageSize}`
              );
              const pageJson = await pageRes.json();

              return Array.isArray(pageJson?.data)
                ? pageJson.data.filter((item: College) => item?.id)
                : [];
            })
          );

          allColleges = [...firstPageColleges, ...remainingPages.flat()];
        }

        const matchedResults = await Promise.allSettled(
          allColleges.map(async (collegeSummary: College) => {
            const coursesRes = await fetch(
              `https://studycupsbackend-wb8p.onrender.com/api/college-course/college/${collegeSummary.id}`
            );
            const coursesJson = await coursesRes.json();
            const docs = Array.isArray(coursesJson?.data) ? coursesJson.data : [];

            const hasMatch = docs.some((doc: any) =>
              courseMatchesSlug(Array.isArray(doc?.courses) ? doc.courses : [])
            );

            return hasMatch ? collegeSummary : null;
          })
        );

        if (isCancelled) return;

        const matchedColleges = matchedResults.flatMap((result) =>
          result.status === "fulfilled" && result.value ? [result.value] : []
        );

        const uniqueColleges = matchedColleges.filter(
          (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index
        );

        uniqueColleges.sort((a, b) => {
          if (a.id === college?.id) return -1;
          if (b.id === college?.id) return 1;
          return (a.name || "").localeCompare(b.name || "");
        });

        setCourseOfferingColleges(uniqueColleges);
      } catch (err) {
        console.error("Course offering colleges API error", err);
        if (!isCancelled) {
          setCourseOfferingColleges([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingCourseOfferingColleges(false);
        }
      }
    };

    fetchCourseOfferingColleges();

    return () => {
      isCancelled = true;
    };
  }, [activeCourseSlug, college?.id]); 

 const schema = college
  ? {
      "@context": "https://schema.org",
      "@type": "CollegeOrUniversity",

      name: college?.basic?.name || college?.name || "",
      url: typeof window !== "undefined" ? window.location.href : "",
      logo: college?.basic?.logo || college?.logoUrl || "",
      description: college?.basic?.about
        || college?.overview
        || `${college?.basic?.name || college?.name || "College"} – admissions, courses, fees, placements and rankings.`,

      address: {
        "@type": "PostalAddress",
        addressLocality: college?.basic?.city || "",
        addressRegion: college?.basic?.state || "",
        addressCountry: "IN"
      },

      ...(college?.basic?.rating ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: college.basic.rating,
          bestRating: 5,
          worstRating: 1,
          reviewCount: college?.basic?.reviews || 10
        }
      } : {}),

      ...(Array.isArray(college?.courses) && college.courses.length > 0 ? {
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          "name": "Courses Offered",
          "itemListElement": college.courses.slice(0, 5).map((c: any) => ({
            "@type": "Offer",
            "itemOffered": {
              "@type": "Course",
              "name": c.name || c.course_name || c
            }
          }))
        }
      } : {})
    }
  : null;
  // ================= NORMALIZATION LAYER =================
  // Converts new MongoDB schema → old rawScraped shape
  // UI WILL NOT CHANGE

  const normalizedCollege = useMemo(() => {
    if (!college) return null;

    return {
      ...college,

      rawScraped: {
        // BASIC
        college_name: college?.basic?.name,
        logo: college?.basic?.logo,

        // ABOUT
        about_text: college?.about?.value,

        // ADMISSION
        admission: college?.admission?.toc_sections || [],

        // RANKING
        ranking_data: college?.ranking?.toc_sections || [],

        // PLACEMENT
        placement: {
          about: college?.placement?.about || [],
          toc_sections: college?.placement?.toc_sections || []
        },

        // REVIEWS
        reviews_data: college?.reviews_page || {},

        // GALLERY
        gallery: college?.gallery?.map(g => g.src) || [],

        // QNA
        questions_answers: college?.qna?.map(q => ({
          question: q.question,
          answer_text: Array.isArray(q.answers)
            ? q.answers.flatMap(a => a.answer).join(" ")
            : ""
        })) || []
      }
    };

  }, [college]);
const getTabHeading = () => {
  const name = college?.basic?.name || "College";

  switch (activeTab) {

    case "basic":
      return `${name}: Admission 2026, Fees, Courses, Cutoff, Ranking, Placement`;

    case "admission":
      return `${name} Course Admission 2026: Dates, Fees, Eligibility, Application Process, Selection Criteria`;

    case "placement":
      return `${name} Placement 2025: Highest Package, Average Package, Top Recruiters`;

    case "cutoff":
      return `${name} Cutoff 2025: Check Category-wise and Round-wise Cutoff`;

    case "scholarship":
      return `${name} Scholarship 2026`;

    case "ranking":
      return `${name} Ranking 2025`;

    case "faculty":
      return `${name} Faculty`;

    case "qna":
      return `${name} Verified Answers`;

    case "gallery":
      return `${name} Gallery`;
    
      case "reviews":
        return `${name} Student Reviews`;
      case "Courses & Fees":
        return `${name} Courses and Fees 2026`;
    default:
      return `${name} : Admission 2026, Fees, Courses, Cutoff, Ranking, Placement`;
  }
};

  const canonicalCollegeIdSlug = useMemo(() => {
    if (!collegeId) return collegeIdSlug || "";

    const aboutBasedName = extractCollegeNameFromAbout(
      college?.basic?.about?.value ||
      college?.about?.value ||
      ""
    );
    const shortName = normalizeCollegeSlugSource(
      college?.basic?.name || college?.name || ""
    );
    const prefixCode = buildCollegeCodePrefix(shortName);

    const longNameSource = [
      college?.basic?.full_name,
      college?.full_name,
      aboutBasedName,
      normalizedCollege?.rawScraped?.college_name,
      shortName
    ]
      .map((value) => normalizeCollegeSlugSource(typeof value === "string" ? value : ""))
      .find(Boolean) || shortName;
    const longNameSlug = toSeoSlug(longNameSource);

    if (longNameSlug) {
      const fullSlug =
        prefixCode && !longNameSlug.startsWith(`${prefixCode}-`)
          ? `${prefixCode}-${longNameSlug}`
          : longNameSlug;
      return `${collegeId}-${fullSlug}`;
    }

    const rawSlug = typeof college?.slug === "string" ? college.slug.trim() : "";
    if (rawSlug) {
      const cleaned = rawSlug.replace(/^\/+|\/+$/g, "").toLowerCase();
      const parts = cleaned.match(/^(.*)--(\d+)$/);
      const slugPart =
        parts && Number(parts[2]) === collegeId
          ? parts[1]
          : cleaned.replace(/^\d+-/, "");

      const normalizedSlugPart = toSeoSlug(slugPart);
      if (normalizedSlugPart) {
        return `${collegeId}-${normalizedSlugPart}`;
      }
    }

    const currentSlugPart = collegeIdSlug?.split("-").slice(1).join("-") || "";
    if (currentSlugPart) return `${collegeId}-${toSeoSlug(currentSlugPart)}`;
    return String(collegeId);
  }, [collegeId, collegeIdSlug, college?.slug, college?.basic?.about?.value, college?.about?.value, college?.basic?.full_name, college?.full_name, college?.basic?.name, college?.name, normalizedCollege?.rawScraped?.college_name]);

  const baseCollegePath = useMemo(() => {
    const resolvedSlug = canonicalCollegeIdSlug || collegeIdSlug || (collegeId ? String(collegeId) : "");
    return resolvedSlug ? `/university/${resolvedSlug}` : "/university";
  }, [canonicalCollegeIdSlug, collegeIdSlug, collegeId]);

  const buildUniversityPath = (tabKey: string = "basic", nextCourseSlug?: string) => {
    if (nextCourseSlug) {
      return `${baseCollegePath}/course/${nextCourseSlug}`;
    }

    const tabSlug = TAB_KEY_TO_SLUG[tabKey] || "";
    return tabSlug ? `${baseCollegePath}/${tabSlug}` : baseCollegePath;
  };

  useEffect(() => {
    if (!collegeIdSlug || !canonicalCollegeIdSlug || collegeIdSlug === canonicalCollegeIdSlug) return;

    const target = activeCourseSlug
      ? `/university/${canonicalCollegeIdSlug}/course/${activeCourseSlug}`
      : tabFromRoute
        ? buildUniversityPath(tabFromRoute)
        : `/university/${canonicalCollegeIdSlug}`;

    navigate(target, { replace: true });
  }, [collegeIdSlug, canonicalCollegeIdSlug, activeCourseSlug, tabFromRoute, navigate]);


  const isCompared = normalizedCollege
    ? compareList.includes(String(normalizedCollege.id))
    : false;


  const placementPercentage = useMemo(() => {
    const highest = Number(normalizedCollege?.placements?.highestPackage);
    const average = Number(normalizedCollege?.placements?.averagePackage);

    if (!highest || !average) return null;

    return Math.round((average / highest) * 100);
  }, [normalizedCollege]);

  const alumni = useMemo(() => {
    const raw =
      detail?.rawScraped?.placement?.alumni ||
      normalizedCollege?.rawScraped?.placement?.alumni ||
      [];

    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: string) => {
        const match = item.match(/(.+?)\s(\d+%)/);
        if (!match) return null;

        return {
          sector: match[1].trim(),
          percentage: match[2]
        };
      })
      .filter(Boolean);
  }, [detail, normalizedCollege]);



  useEffect(() => {
    if (!collegeId) return;

    const loadCollege = async () => {
      try {
        setLoadingCollege(true);

        const res = await fetch(
          `https://studycupsbackend-wb8p.onrender.com/api/colleges/${collegeId}`
        );

        const json = await res.json();

        if (json.success) {
          setCollege(json.data);
          setDetail(json.data); // full rawScraped etc
        }

      } catch (err) {
        console.error("Detail fetch error", err);
      } finally {
        setLoadingCollege(false);
      }
    };

    loadCollege();
  }, [collegeId]);




  const handleDownloadBrochure = (collegeId: number) => {
    window.open(
      `https://studycupsbackend-wb8p.onrender.com/api/colleges/${collegeId}/brochure`,
      "_blank"
    );
  };

  const MAIN_TABS = [
    "basic",
    "Courses & Fees",
    "admission",
    "placement",
    "cutoff",
    "scholarship",
    "ranking",
    "faculty",
    "qna",
    "reviews",
    "gallery"
  ];

  const TAB_PLACEHOLDER_VALUES = new Set([
    "n/a",
    "na",
    "not available",
    "null",
    "undefined",
  ]);

  const hasMeaningfulText = (value: unknown) => {
    if (typeof value !== "string") return false;
    const normalized = value.trim().toLowerCase();
    return !!normalized && !TAB_PLACEHOLDER_VALUES.has(normalized);
  };

  const hasTabContentValue = (value: any): boolean => {
    if (Array.isArray(value)) {
      return value.some((item) => hasTabContentValue(item));
    }

    if (typeof value === "string") {
      return hasMeaningfulText(value);
    }

    if (typeof value === "number") {
      return Number.isFinite(value) && value > 0;
    }

    if (value && typeof value === "object") {
      if ("value" in value) {
        return hasTabContentValue(value.value);
      }

      return Object.values(value).some((item) => hasTabContentValue(item));
    }

    return false;
  };

  const hasStructuredTabContent = (section: any) => {
    if (!section || typeof section !== "object") return false;

    return (
      [
        section?.about,
        section?.about_highlights,
        section?.about_highlight,
        section?.about_highligh,
      ].some((item) => hasTabContentValue(item)) ||
      (Array.isArray(section?.toc_sections) &&
        section.toc_sections.some((item: any) => hasTabContentValue(item?.content)))
    );
  };

  const getFirstDisplayText = (...values: any[]) => {
    for (const value of values) {
      if (Array.isArray(value)) {
        const match = value.find((item) =>
          typeof item === "string" ? hasMeaningfulText(item) : false
        );
        if (typeof match === "string") return match.trim();
        continue;
      }

      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return String(value);
      }

      if (typeof value === "string" && hasMeaningfulText(value)) {
        return value.trim();
      }
    }

    return "";
  };

  const availableTabs = MAIN_TABS.filter((key) => {
    if (key === "Courses & Fees") return true;
    if (key === "basic") return true;
    if (key === "reviews") {
      return (
        hasTabContentValue(college?.reviews_page?.overall_rating?.score) ||
        hasTabContentValue(college?.reviews_page?.category_ratings) ||
        hasTabContentValue(college?.reviews_page?.what_students_say?.likes) ||
        hasTabContentValue(college?.reviews_page?.what_students_say?.dislikes) ||
        hasTabContentValue(college?.reviews_page?.gallery)
      );
    }

    if (key === "gallery") return hasTabContentValue(college?.gallery);
    if (key === "faculty") return hasTabContentValue(college?.faculty?.members);
    if (key === "qna") return hasTabContentValue(college?.qna);
    if (key === "placement") {
      return (
        hasStructuredTabContent(college?.placement) ||
        hasTabContentValue(detail?.rawScraped?.placement) ||
        hasTabContentValue(detail?.rawScraped?.courses_full_time) ||
        hasTabContentValue(detail?.rawScraped?.info_facilities) ||
        hasTabContentValue(detail?.rawScraped?.info_faculty)
      );
    }

    if (key === "ranking") {
      return (
        hasStructuredTabContent(college?.ranking) ||
        hasTabContentValue(detail?.rawScraped?.ranking_data)
      );
    }

    return hasStructuredTabContent(college?.[key]);
  });


  const ratingDistribution = [
    { stars: 5, percent: 62 },
    { stars: 4, percent: 28 },
    { stars: 3, percent: 4 },
    { stars: 2, percent: 6 },
    { stars: 1, percent: 0 },
  ];
  const rankingDataArray = useMemo(() => {
    const raw = detail?.rawScraped?.ranking_data;

    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") return Object.values(raw);

    return [];
  }, [detail?.rawScraped?.ranking_data]);

  const deriveStream = (courseName: string) => {
    const name = courseName.toLowerCase();




    /* ---------- DOCTORAL ---------- */
    if (
      name.includes("ph.d") ||
      name.includes("phd") ||
      name.includes("post doctoral") ||
      name.includes("doctoral")
    ) {
      return "Doctoral";
    }

    /* ---------- MANAGEMENT ---------- */
    if (
      name.includes("mba") ||
      name.includes("pgdm") ||
      name.includes("management") ||
      name.includes("leadership") ||
      name.includes("strategy") ||
      name.includes("executive")
    ) {
      return "Management";
    }

    /* ---------- ENGINEERING / TECH ---------- */
    if (
      name.includes("b.tech") ||
      name.includes("btech") ||
      name.includes("engineering") ||
      name.includes("technology") ||
      name.includes("data science") ||
      name.includes("artificial intelligence") ||
      name.includes("machine learning") ||
      name.includes("computer") ||
      name.includes("m.sc") ||
      name.includes("msc")
    ) {
      return "Engineering";
    }

    /* ---------- MEDICAL ---------- */
    if (
      name.includes("mbbs") ||
      name.includes("medical") ||
      name.includes("healthcare")
    ) {
      return "Medical";
    }

    /* ---------- COMMERCE ---------- */
    if (
      name.includes("b.com") ||
      name.includes("commerce") ||
      name.includes("account") ||
      name.includes("finance")
    ) {
      return "Commerce";
    }

    /* ---------- ARTS / SOCIAL ---------- */
    if (
      name.includes("arts") ||
      name.includes("humanities") ||
      name.includes("social")
    ) {
      return "Arts";
    }

    return "General";
  };
  const getCategorySlugFromStream = (courseName: string) => {
    return deriveStream(courseName)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };
  const safeArray = (value: any) => (Array.isArray(value) ? value : []);

  const mergeBasicBlocks = (basic: any) => {
    return [
      ...safeArray(basic?.about),
      ...safeArray(basic?.about_highlight),
      ...safeArray(basic?.about_highligh), // typo safe
      ...safeArray(
        basic?.toc_sections?.flatMap((s: any) => safeArray(s?.content))
      ),
    ];
  };
  const normalizeBlock = (block: any) => {
    if (!block) return null;

    // Determine block type
    const blockType = block.type || block.format;

    if (!blockType) return null;

    // TEXT
    if (blockType === "text") {
      return {
        type: "text",
        value: block.value || "",
      };
    }

    // LIST
    if (blockType === "list") {
      return {
        type: "list",
        value: block.value || block.items || [],
      };
    }

    // TABLE
    if (blockType === "table") {
      return {
        type: "table",
        value: block.value || [],
      };
    }


    // IMAGE
    if (blockType === "image") {
      return {
        type: "image",
        src: block.src || block.value || "",
      };
    }
    
    // VIDEO
if (blockType === "video") {
  return {
    type: "video",
    src: block.src || block.value || "",
  };
}
// HEADING
if (blockType === "heading") {
  return {
    type: "heading",
    value: block.value || "",
    level: block.level || "h3",
  };
}
    return null;
  };

  const normalizeBlocksArray = (data: any) => {
    if (!data) return [];

    // If single object (like your about)
    if (!Array.isArray(data)) {
      const normalized = normalizeBlock(data);
      return normalized ? [normalized] : [];
    }

    // If already array
    return data
      .map((b: any) => normalizeBlock(b))
      .filter(Boolean);
  };
  const mergeBlocks = (section: any) => [
    ...(section?.about ?? []),
    ...(section?.toc_sections?.flatMap((s: any) => s.content) ?? []),
  ];
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const getTextValue = (value: any) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") return value.value || "";
    return "";
  };

  const getMetricValue = (value: any) => {
    if (typeof value === "number") return String(value);
    return getTextValue(value);
  };

  const getSubCourseMetricFallback = (
    subCourse: any,
    parentCourse: any,
    metric: "rating" | "reviews"
  ) => {
    const directValue = getMetricValue(subCourse?.[metric]).trim();
    if (directValue) return directValue;

    const parentSections = Array.isArray(parentCourse?.course_detail?.toc_sections)
      ? parentCourse.course_detail.toc_sections
      : [];
    const parentContent = parentSections.flatMap((section: any) =>
      Array.isArray(section?.content) ? section.content : []
    );
    const subCourseUrl = getMetricValue(subCourse?.url).trim();
    const subCourseSlug = getMetricValue(subCourse?.slug_url).trim();

    const linkIndex = parentContent.findIndex((item: any) => {
      if (item?.type !== "link" || typeof item?.href !== "string") return false;
      if (subCourseUrl && item.href === subCourseUrl) return true;
      if (subCourseSlug && item.href.includes(subCourseSlug)) return true;
      return false;
    });

    if (linkIndex >= 0) {
      const nextBlocks = parentContent.slice(linkIndex + 1, linkIndex + 4);

      if (metric === "rating") {
        const ratingBlock = nextBlocks.find((item: any) => {
          const text = getMetricValue(item?.value || item).trim();
          return /^\d+(\.\d+)?$/.test(text);
        });

        if (ratingBlock) {
          return getMetricValue(ratingBlock?.value || ratingBlock).trim();
        }
      }

      if (metric === "reviews") {
        const reviewBlock = nextBlocks.find((item: any) => {
          const text = getMetricValue(item?.label || item?.value || item).trim();
          return /reviews?/i.test(text);
        });

        if (reviewBlock) {
          const reviewText = getMetricValue(
            reviewBlock?.label || reviewBlock?.value || reviewBlock
          ).trim();
          const reviewMatch = reviewText.match(/([\d.]+\s*[kK]?)/);

          if (reviewMatch?.[1]) {
            return reviewMatch[1].replace(/\s+/g, "");
          }
        }
      }
    }

    return getMetricValue(parentCourse?.[metric]).trim();
  };

  const isLikelyAuthorMeta = (text: string) => {
    return /(updated|strategist|editor|author|content|team|months|month|days|day|years|year|ago)/i.test(
      text || ""
    );
  };

  const extractAuthorProfile = (content: any[] = []) => {
    if (!Array.isArray(content) || !content.length) {
      return {
        author: null,
        remainingContent: content,
      };
    }

    const imageIndex = content.findIndex(
      (b: any) => b?.type === "image" && typeof b?.src === "string" && b.src.trim()
    );

    if (imageIndex === -1) {
      return {
        author: null,
        remainingContent: content,
      };
    }

    const imageBlock = content[imageIndex];
    const nextBlock = content[imageIndex + 1];
    const nextNextBlock = content[imageIndex + 2];

    const nameText = getTextValue(nextBlock?.value || nextBlock);
    const metaText = getTextValue(nextNextBlock?.value || nextNextBlock);

    const hasProfileKeywordInUrl = /(profile|author|avatar|user)/i.test(imageBlock?.src || "");
    const looksLikeName = !!nameText && nameText.length <= 80;
    const looksLikeMeta = !!metaText && isLikelyAuthorMeta(metaText);

    const isAuthorProfile = hasProfileKeywordInUrl || (looksLikeName && looksLikeMeta);

    if (!isAuthorProfile) {
      return {
        author: null,
        remainingContent: content,
      };
    }

    const remainingContent = content.filter(
      (_: any, idx: number) => idx !== imageIndex && idx !== imageIndex + 1 && idx !== imageIndex + 2
    );

    return {
      author: {
        image: imageBlock?.src || "",
        name: nameText,
        meta: metaText,
      },
      remainingContent,
    };
  };

  const selectedCourse = useMemo(() => {
    if (!activeCourseSlug) return null;

    for (const course of courses) {
      if (course?.slug_url === activeCourseSlug) return course;

      const subCourses = Array.isArray(course?.sub_courses) ? course.sub_courses : [];
      const subCourse = subCourses.find(
        (sc: any) => getTextValue(sc?.slug_url) === activeCourseSlug
      );

      if (subCourse) {
        return {
          ...subCourse,
          course_name: getTextValue(subCourse?.name) || course?.course_name,
          rating: getTextValue(subCourse?.rating) || course?.rating,
          reviews: getTextValue(subCourse?.reviews) || course?.reviews,
          total_fees: getTextValue(subCourse?.fees) || course?.total_fees,
          application_date:
            getTextValue(subCourse?.application_date) || course?.application_date,
          course_detail: subCourse?.course_detail || course?.course_detail,
        };
      }
    }

    return null;
  }, [courses, activeCourseSlug]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Courses & Fees":
        const courseData = courses;
         if (loadingCourses) {
  return (
    <div className="bg-white border rounded-xl p-6 text-center">
      Loading courses...
    </div>
  );
}
        return (
          <div className="space-y-6 ">
            {activeCourseSlug && (
              <div className="bg-white border rounded-2xl p-6 shadow-sm">
                {selectedCourse ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-900">
                          {selectedCourse.course_name}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                          {selectedCourse.rating && (
                            <span className="font-semibold text-yellow-600">⭐ {selectedCourse.rating}</span>
                          )}
                          {selectedCourse.reviews && <span>{selectedCourse.reviews} Reviews</span>}
                          {selectedCourse.duration && <span>{selectedCourse.duration}</span>}
                          {selectedCourse.mode && <span>{selectedCourse.mode}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(buildUniversityPath("Courses & Fees"))}
                        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                      >
                        View All Courses
                      </button>
                    </div>

                    <div className="text-sm text-slate-700 space-y-1">
                      {selectedCourse.eligibility && (
                        <p>
                          <span className="font-semibold text-slate-900">Eligibility:</span>{" "}
                          {selectedCourse.eligibility}
                        </p>
                      )}
                      {selectedCourse.application_date && (
                        <p>
                          <span className="font-semibold text-slate-900">Application Date:</span>{" "}
                          {selectedCourse.application_date}
                        </p>
                      )}
                      {selectedCourse.total_fees && (
                        <p className="text-xl font-bold text-green-600">{selectedCourse.total_fees}</p>
                      )}
                    </div>

                    {Array.isArray(selectedCourse?.course_detail?.toc_sections) &&
                      selectedCourse.course_detail.toc_sections.map((section: any, idx: number) => (
                        <div key={`${section?.section || "section"}-${idx}`} className="border rounded-xl p-4">
                          <h3 className="text-lg font-bold text-slate-900 mb-3">
                            {section?.section || "Details"}
                          </h3>

                          {(() => {
                            const sectionContent = Array.isArray(section?.content) ? section.content : [];
                            const { author, remainingContent } = extractAuthorProfile(sectionContent);

                            return (
                              <div className="space-y-4">
                                {author && (
                                  <div className="flex items-center gap-3">
                                    {author.image ? (
                                      <img
                                        src={author.image}
                                        alt={author.name || "Author"}
                                        className="h-10 w-10 rounded-full object-cover border"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-slate-200" />
                                    )}

                                    <div className="leading-tight">
                                      {author.name && (
                                        <p className="text-base font-semibold text-[#f97316]">
                                          {author.name}
                                        </p>
                                      )}
                                      {author.meta && (
                                        <p className="text-xs text-slate-600">{author.meta}</p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <FlexibleBlockRenderer
                                  blocks={normalizeBlocksArray(remainingContent)}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Course detail not found for this college.</p>
                )}
              </div>
            )}
   
            {!activeCourseSlug && courseData.map((course: any, index: number) => (
              <div
                key={index}
                className="
    bg-white
    border
    rounded-2xl
    p-6
    shadow-sm
    hover:shadow-md
    transition-all
    space-y-4
  "
              >
                {/* Course Name */}
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    const courseSlug = course?.slug_url || toCourseSlug(course?.course_name || "");
                    if (!courseSlug) return;
                    navigate(buildUniversityPath("Courses & Fees", courseSlug));
                  }}
                  className="
    text-lg
    md:text-xl
    font-bold
    text-blue-900
    hover:underline
    cursor-pointer
  "
                >
                  {course.course_name}
                </h3>


                {/* Top Line */}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">

                  {course.rating && (
                    <span className="flex items-center gap-1 font-semibold text-yellow-600">
                      ⭐ {course.rating}
                    </span>
                  )}

                  {course.reviews && (
                    <span>{course.reviews} Reviews</span> 
                  )}

                  {course.sub_course_count && (
                    <span>{course.sub_course_count} Sub-Courses</span>
                  )}

                  {course.duration && (
                    <span>{course.duration}</span>
                  )}

                  {course.mode && (
                    <span>{course.mode}</span>
                  )}
                </div>

                {/* Horizontal divider */}
                <div className="border-t " />

                {/* Fee + Details */}
                <div className="flex flex-col md:flex-row justify-between gap-4">

                  <div className="text-sm text-slate-700 space-y-1">
                    <p>
                      <span className="font-semibold text-slate-900">
                        Eligibility:
                      </span>{" "}
                      {course.eligibility || "N/A"}
                    </p>

                    {course.application_date && (
                      <p className="mt-1">
                        <span className="font-semibold text-slate-900">
                          Application Dates:
                        </span>{" "}
                        {course.application_date}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {course.total_fees || "N/A"}
                    </p>

                    <p
                      className="text-xs text-blue-600 cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const courseSlug = course?.slug_url || toCourseSlug(course?.course_name || "");
                        if (!courseSlug) return;
                        navigate(buildUniversityPath("Courses & Fees", courseSlug));
                      }}
                    >
                      Check Detailed Fees ›
                    </p>

                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap justify-between md:justify-end gap-3 mt-5">


                  <button
                    onClick={onOpenApplyNow}
                    className="px-5 py-2 bg-orange-500 text-white rounded-full text-xs font-semibold hover:bg-orange-600"
                  >
                    Apply Now
                  </button>

                </div> 
                
              {course.sub_courses?.length > 0 && (
  <div className="mt-4">

    {/* Arrow toggle */}
    <button
      onClick={() =>
        setOpenSubCourseIndex(
          openSubCourseIndex === index ? null : index
        )
      }
      className="text-blue-600 text-sm font-semibold flex items-center gap-1"
    >
      {openSubCourseIndex === index ? "Hide" : "View"}{" "}
      {course.sub_courses.length} Courses
      <span className="text-xs">
        {openSubCourseIndex === index ? "▲" : "▼"}
      </span>
    </button>

    {/* TABLE */}
    {openSubCourseIndex === index && (
      <div className="mt-4 border rounded-xl overflow-hidden">

        <table className="w-full text-sm border-collapse">

          <thead className="bg-slate-100">
            <tr>
              <th className="border p-3 text-left font-semibold">
  {course.course_name?.split("[")[0].trim()} Courses
</th>

              <th className="border p-3 text-left font-semibold">
                Fees
              </th>

              <th className="border p-3 text-left font-semibold">
                Application Date
              </th>

              <th className="border p-3 text-left font-semibold">
                Cutoff
              </th>
            </tr>
          </thead>

          <tbody>
            {course.sub_courses.map((sc: any, i: number) => {
              const subCourseRating = getSubCourseMetricFallback(sc, course, "rating");
              const subCourseReviews = getSubCourseMetricFallback(sc, course, "reviews");

              return (
                <tr
                key={i}
                className="hover:bg-slate-50 transition"
              >

                {/* Course name */}
                <td
                  className="border p-3 text-blue-700 font-semibold cursor-pointer hover:underline"
                  onClick={() => {
                    const subCourseSlug = sc?.slug_url?.value || sc?.slug_url || "";
                    if (!subCourseSlug) return;
                    navigate(buildUniversityPath("Courses & Fees", subCourseSlug));
                  }}
                >
                  {sc.name?.value || "—"}

                  <div className="text-xs text-slate-500 mt-1">
                    {`\u2605 ${subCourseRating || "\u2014"} (${subCourseReviews || 0} Reviews)`}
                  </div>
                </td>

                {/* Fees */}
                <td className="border p-3 font-semibold text-green-700">
                  {sc.fees?.value || "—"}

                  <div className="text-xs text-blue-600 cursor-pointer hover:underline">
                    Check Details
                  </div>
                </td>

                {/* Application date */}
                <td className="border p-3">
                  {sc.application_date?.value || "—"}
                </td>

                {/* Cutoff */}
                <td className="border p-3">
                  {sc.cutoff?.value || "—"}

                  <div className="text-xs text-blue-600 cursor-pointer hover:underline">
                    Check Details
                  </div>
                </td>

                </tr>
              );
            })}
          </tbody>

        </table>

      </div>
    )}

  </div>
)}

              </div>
            ))}

            {courseData.length === 0 && (
              <p className="text-center py-10 text-slate-500 text-sm">
                No course data available
              </p>
            )}

            {detail?.rawScraped?.courses_full_time?.length > 0 && (() => {

              const packageRows = detail.rawScraped.courses_full_time.filter(
                (r: any) =>
                  ["Highest Package", "Median Package", "Average Package"].includes(
                    r.course.trim()
                  )
              );

              const courseRows = detail.rawScraped.courses_full_time.filter(
                (r: any) =>
                  !["Highest Package", "Median Package", "Average Package"].includes(
                    r.course.trim()
                  )
              );

              return (
                <>

                  {/* ===================== ALL COURSES TABLE ===================== */}
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">

                    <h3 className="text-xl font-bold mb-5 text-blue-800">
                      ALL Courses
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-sm">
                            <th className="border p-3 text-left font-semibold">Course</th>
                            <th className="border p-3 text-left font-semibold">Fees</th>
                            <th className="border p-3 text-left font-semibold">Eligibility</th>
                            <th className="border p-3 text-left font-semibold">
                              Application Date
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {courseRows.map((row: any, i: number) => (
                            <tr
                              key={i}
                              className="hover:bg-slate-50 text-sm transition"
                            >
                              <td className="border p-3 font-semibold text-blue-700 min-w-[200px]">
                                {row.course}
                              </td>

                              <td className="border p-3 whitespace-pre-line font-medium text-green-700 min-w-[150px]">
                                {row.fees}
                              </td>

                              <td className="border p-3 text-slate-600 min-w-[200px]">
                                {row.eligibility}
                              </td>

                              <td className="border p-3 text-blue-600 font-semibold min-w-[150px]">
                                {row.date}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                  {detail?.rawScraped?.info_facilities?.length > 0 && (
                    <div className="bg-white border rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-4 text-blue-900">
                        Facilities
                      </h3>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {detail.rawScraped.info_facilities.map(
                          (f: any, i: number) => (
                            <div
                              key={i}
                              className="
              flex flex-col items-center
              gap-2
              text-center
              text-sm
              text-slate-700
            "
                            >
                              <div
                                className="
                p-3
                border
                rounded-xl
                bg-white
                shadow-sm
                hover:shadow-md
                transition
              "
                              >
                                {FACILITY_ICON_MAP[f.icon_key] ?? null}
                              </div>

                              <span className="text-[12px] leading-tight">
                                {f.name}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}


                  {/* ===================== PACKAGE/FEES TABLE ===================== */}

                  {packageRows.length > 0 && (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm mt-10">

                      <h3 className="text-xl font-bold mb-5 text-blue-800">
                        Placement Package & Fees Overview
                      </h3>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[600px]">

                          <thead>
                            <tr className="bg-slate-100 text-slate-700 text-sm">
                              <th className="border p-3 text-left font-semibold w-1/3">
                                Package Type
                              </th>
                              <th className="border p-3 text-left font-semibold w-1/3">
                                Package Amount
                              </th>

                            </tr>
                          </thead>

                          <tbody>
                            {packageRows.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50 text-sm transition">

                                <td className="border p-3 font-semibold text-blue-700">
                                  {row.course}
                                </td>

                                <td className="border p-3 text-green-700 font-bold">
                                  {row.fees || "-"}
                                </td>



                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {detail?.rawScraped?.info_faculty?.length > 0 && (
                    <div className="bg-white border rounded-2xl p-6 mt-10">
                      <h3 className="text-xl font-bold mb-4 text-blue-900">
                        Faculty
                      </h3>

                      {/* MOBILE: horizontal scroll | DESKTOP: grid */}
                      <div
                        className="
        flex gap-4  overflow-x-auto no-scrollbar pb-2
        md:grid md:grid-cols-4 lg:grid-cols-5
        md:overflow-visible
      "
                      >
                        {detail.rawScraped.info_faculty.map(
                          (f: any, i: number) => (
                            <div
                              key={i}
                              className="
              min-w-[180px]
              md:min-w-0
              border rounded-xl
              p-4
              text-center
              shadow-sm
              hover:shadow-md
              transition
              bg-white
            "
                            >
                              {/* Avatar */}
                              <div
                                className="
                w-16 h-16
                mx-auto
                rounded-full
                bg-slate-200
                flex items-center justify-center
                text-slate-500
                font-bold
                text-lg
              "
                              >
                                {f.name?.charAt(0)}
                              </div>

                              {/* Name */}
                              <p className="mt-3 font-semibold text-sm text-slate-900">
                                {f.name}
                              </p>

                              {/* Designation / Qualification */}
                              <p className="text-xs text-slate-600 mt-1">
                                {f.designation || f.qualification || "Faculty Member"}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                </>
              );
            })()}



          </div>
        );

      case "admission": {
        const admissionData = college?.admission ?? {};

        const aboutBlocks = [
          ...normalizeBlocksArray(admissionData?.about),
          ...normalizeBlocksArray(admissionData?.about_highlights),
        ];

        const tocSections = admissionData?.toc_sections ?? [];

        return (

          <div className="bg-white border rounded-2xl p-6 space-y-8">

          
          
            {/* ABOUT SECTION */}
            {aboutBlocks.length > 0 && (
              <FlexibleBlockRenderer blocks={aboutBlocks} />
            )}
              {/* TABLE OF CONTENTS */}
              {tocSections.length > 0 && (
              <div className="flex gap-3 flex-col pb-2 mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl"> 
              <h2 className="text-lg font-bold text-slate-900">Table of Contents</h2>
                {tocSections.map((sec: any, i: number) => (
                  <a
                    key={i}
                    href={`#${slugify(sec.section)}`}
                    className="text-sm font-semibold whitespace-nowrap text-blue-600 hover:underline"
                  >
                    {sec.section}
                  </a>
                ))}
              </div>
            )}

            {/* TOC SECTIONS */}
          
              {tocSections.map((section: any, index: number) => (
  <div
    key={index}
    id={slugify(section.section)}
    className="mt-8 scroll-mt-24"
  >

                {section?.section && (
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    {section.section}
                  </h4>
                )}

                <FlexibleBlockRenderer
                  blocks={normalizeBlocksArray(section?.content)}
                />

              </div>
            ))}

          </div>
        );
      }
    case "placement": {
  const placementData = college?.placement ?? {};

  const blocks = mergeBlocks(placementData);

  const tocSections = placementData?.toc_sections ?? [];

  if (!blocks.length) {
    return (
      <div className="bg-white border rounded-2xl p-6">
        <p className="text-slate-500 text-sm">
          No placement data available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl p-6">

      {/* TABLE OF CONTENTS */}
      {tocSections.length > 0 && (
        <div className="flex gap-3 flex-col pb-2 mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-slate-900">
            Table of Contents
          </h2>

          {tocSections.map((sec: any, i: number) => (
            <a
              key={i}
              href={`#${slugify(sec.section)}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {sec.section}
            </a>
          ))}
        </div>
      )}

     {placementData?.toc_sections?.map((section: any, index: number) => (
  <div
    key={index}
    id={slugify(section.section)}
    className="mt-8 scroll-mt-24"
  >
    {section.section && (
      <h4 className="text-lg font-bold text-slate-900 mb-4">
        {section.section}
      </h4>
    )}

    <FlexibleBlockRenderer
      blocks={normalizeBlocksArray(section?.content)}
    />
  </div>
))}

    </div>
  );
}

      case "ranking": {
  const rankingData = college?.ranking ?? {};

  const tocSections = rankingData?.toc_sections ?? [];

  return (
    <div className="bg-white border rounded-2xl p-6 space-y-8">

      {/* TABLE OF CONTENTS */}
      {tocSections.length > 0 && (
        <div className="flex gap-3 flex-col pb-2 mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-slate-900">
            Table of Contents
          </h2>

          {tocSections.map((sec: any, i: number) => (
            <a
              key={i}
              href={`#${slugify(sec.section)}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {sec.section}
            </a>
          ))}
        </div>
      )}

      {/* RANKING SECTIONS */}
      {tocSections.map((section: any, index: number) => (
        <div
          key={index}
          id={slugify(section.section)}
          className="mt-8 scroll-mt-24"
        >
          {section.section && (
            <h4 className="text-lg font-bold text-slate-900 mb-4">
              {section.section}
            </h4>
          )}

          <FlexibleBlockRenderer
            blocks={normalizeBlocksArray(section?.content)}
          />
        </div>
      ))}

    </div>
  );
}
     case "cutoff": {
  const cutoffData = college?.cutoff ?? {};

  const aboutBlocks = normalizeBlocksArray(cutoffData?.about);

  const tocSections = cutoffData?.toc_sections ?? [];

  return (
    <div className="bg-white border rounded-2xl p-6 space-y-8">

      {/* INTRO / ABOUT */}
      {aboutBlocks.length > 0 && (
        <FlexibleBlockRenderer blocks={aboutBlocks} />
      )}

      {/* TABLE OF CONTENTS (MIDDLE) */}
      {tocSections.length > 0 && (
        <div className="flex gap-3 flex-col pb-2 mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-slate-900">
            Table of Contents
          </h2>

          {tocSections.map((sec: any, i: number) => (
            <a
              key={i}
              href={`#${slugify(sec.section)}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {sec.section}
            </a>
          ))}
        </div>
      )}

      {/* SECTIONS */}
      {tocSections.map((section: any, index: number) => (
        <div
          key={index}
          id={slugify(section.section)}
          className="mt-8 scroll-mt-24"
        >
          {section.section && (
            <h4 className="text-lg font-bold text-slate-900 mb-4">
              {section.section}
            </h4>
          )}

          <FlexibleBlockRenderer
            blocks={normalizeBlocksArray(section?.content)}
          />
        </div>
      ))}

    </div>
  );
}
      case "scholarship": {
  const scholarshipData = college?.scholarship ?? {};

  const aboutBlocks = normalizeBlocksArray(scholarshipData?.about);

  const tocSections = scholarshipData?.toc_sections ?? [];

  return (
    <div className="bg-white border rounded-2xl p-6 space-y-8">

      {/* INTRO / ABOUT */}
      {aboutBlocks.length > 0 && (
        <FlexibleBlockRenderer blocks={aboutBlocks} />
      )}

      {/* TABLE OF CONTENTS (MIDDLE) */}
      {tocSections.length > 0 && (
        <div className="flex gap-3 flex-col pb-2 mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-slate-900">
            Table of Contents
          </h2>

          {tocSections.map((sec: any, i: number) => (
            <a
              key={i}
              href={`#${slugify(sec.section)}`}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              {sec.section}
            </a>
          ))}
        </div>
      )}

      {/* SCHOLARSHIP SECTIONS */}
      {tocSections.map((section: any, index: number) => (
        <div
          key={index}
          id={slugify(section.section)}
          className="mt-8 scroll-mt-24"
        >
          {section.section && (
            <h4 className="text-lg font-bold text-slate-900 mb-4">
              {section.section}
            </h4>
          )}

          <FlexibleBlockRenderer
            blocks={normalizeBlocksArray(section?.content)}
          />
        </div>
      ))}

    </div>
  );
}
     case "faculty": {
  const facultyMembers = college?.faculty?.members ?? [];

  if (!facultyMembers.length) {
    return (
      <div className="bg-white border rounded-2xl p-6">
        <p className="text-sm text-slate-500">
          No faculty information available.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl p-6">

      <h3 className="text-xl font-bold mb-6">
        Faculty Members
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        {facultyMembers.map((f: any, i: number) => (
          <div
            key={i}
            className="border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition bg-white"
          >

            {/* Avatar */}
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">
              {f.name?.charAt(0)}
            </div>

            {/* Name */}
            <p className="mt-4 font-semibold text-sm text-slate-900">
              {f.name}
            </p>

            {/* Designation */}
            <p className="text-xs text-slate-600 mt-1">
              {f.designation || "Faculty Member"}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}


  case "qna": {

  const questions = college?.qna ?? [];

  if (!questions.length) {
    return (
      <div className="bg-white border rounded-2xl p-6">
        <p className="text-slate-500 text-sm">
          No Q&A available.
        </p>
      </div>
    );
  }

  return (

    <div className="space-y-6">

      {questions.map((q: any, qi: number) => (

        <div
          key={qi}
          className="bg-white border rounded-2xl p-6"
        >

          {/* QUESTION */}

          <h3 className="text-lg font-bold text-blue-700 mb-6">
            {q.question}
          </h3>


          {/* ANSWERS */}

          <div className="space-y-8">

            {q.answers?.map((ans: any, ai: number) => {

              const initials =
                ans.author?.charAt(0)?.toUpperCase() ?? "A";

              return (

                <div
                  key={ai}
                  className="flex gap-4"
                >

                  {/* AUTHOR DP */}

                  <div
                    className="
                    h-10 w-10
                    rounded-full
                    bg-blue-600
                    text-white
                    flex items-center justify-center
                    font-bold text-sm
                  "
                  >
                    {initials}
                  </div>


                  {/* ANSWER BODY */}

                  <div className="flex-1">

                    {/* AUTHOR INFO */}

                    <div className="mb-2">

                      <p className="font-semibold text-slate-900 text-sm">
                        {ans.author}
                      </p>

                      {ans.qualification && (
                        <p className="text-xs text-slate-500">
                          {ans.qualification}
                        </p>
                      )}

                      {ans.posted_on && (
                        <p className="text-xs text-slate-400 mt-1">
                          Answered on {ans.posted_on}
                        </p>
                      )}

                    </div>


                    {/* ANSWER TEXT */}

                    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">

                      {ans.answer?.map((para: string, pi: number) => (

                        <p key={pi}>
                          {para}
                        </p>

                      ))}

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      ))}

    </div>

  );
}


    case "reviews": {

  const reviews = college?.reviews_page ?? {};

  const overall = reviews?.overall_rating ?? {};
  const categories = reviews?.category_ratings ?? {};
  const say = reviews?.what_students_say ?? {};

  const likes = say?.likes ?? [];
  const dislikes = say?.dislikes ?? [];

  /* ================= IMAGE LOGIC ================= */

  const reviewImages = (() => {

    const reviewGallery = reviews?.gallery ?? [];

    if (Array.isArray(reviewGallery) && reviewGallery.length > 0) {
      return reviewGallery.slice(0, 3);
    }

    const mainGallery =
  college?.gallery ||
  college?.rawScraped?.gallery ||
  [];

    if (Array.isArray(mainGallery)) {
      return mainGallery.slice(0, 3);
    }

    return [];

  })();


  return (

    <div className="space-y-8">

      {/* ================= IMAGE SECTION ================= */}

    {reviewImages.map((img: any, i: number) => {

  const imageUrl =
    typeof img === "string"
      ? img
      : img?.src || img?.url || "";

  if (!imageUrl) return null;

  return (
    <img
      key={i}
      src={imageUrl}
      alt="Campus"
      className="h-[170px] w-full object-cover rounded-lg"
    />
  );

})}

      {/* ================= OVERALL RATING ================= */}

      <div className="bg-white border rounded-2xl p-6">

        <h3 className="text-xl text-red-600 font-bold mb-6">
          Reviews & Rating
        </h3>

        <div className="flex items-center gap-6">

          <div>
            <p className="text-4xl font-bold text-slate-900">
              {overall.score ?? "N/A"}
            </p>

            <p className="text-sm text-slate-600">
              ({overall.total_reviews ?? 0} Verified Reviews)
            </p>
          </div>

        </div>

      </div>


      {/* ================= CATEGORY RATINGS ================= */}

      {Object.keys(categories).length > 0 && (

        <div className="bg-white border rounded-2xl p-6">

          <h3 className="text-lg font-bold mb-4">
            Category Ratings
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {Object.entries(categories).map(([label, rating], i) => (

              <div
                key={i}
                className="border rounded-xl p-4 text-center"
              >

                <p className="text-sm text-slate-600">
                  {label}
                </p>

                <p className="text-lg font-bold text-yellow-600 ">
                  {rating} ★
                </p>

              </div>

            ))}

          </div>

        </div>

      )}


      {/* ================= WHAT STUDENTS SAY ================= */}

      {(likes.length > 0 || dislikes.length > 0) && (

        <div className="bg-white border rounded-2xl p-6">

          <h3 className="text-lg font-bold mb-6">
            What Students Say
          </h3>

          <div className="grid md:grid-cols-2 gap-6">

            {/* LIKES */}

            {likes.length > 0 && (

              <div className="border border-green-200 bg-green-50 rounded-xl p-5">

                <h4 className="font-semibold text-green-800 mb-3">
                  👍 Likes
                </h4>

                <ul className="space-y-2 text-sm">

                  {likes.slice(0, 5).map((item: string, i: number) => (

                    <li key={i} className="flex gap-2">

                      <span className="text-green-600">•</span>
                      {item}

                    </li>

                  ))}

                </ul>

              </div>

            )}

            {/* DISLIKES */}

            {dislikes.length > 0 && (

              <div className="border border-red-200 bg-red-50 rounded-xl p-5">

                <h4 className="font-semibold text-red-800 mb-3">
                  👎 Dislikes
                </h4>

                <ul className="space-y-2 text-sm">

                  {dislikes.slice(0, 5).map((item: string, i: number) => (

                    <li key={i} className="flex gap-2">

                      <span className="text-red-600">•</span>
                      {item}

                    </li>

                  ))}

                </ul>

              </div>

            )}

          </div>

          <p className="text-xs text-slate-500 mt-4">
            Insights automatically extracted from student reviews
          </p>

        </div>

      )}

    </div>
  );
}
     case "gallery": {

  const images = college?.gallery ?? [];

  if (!images.length) {
    return (
      <div className="bg-white border rounded-2xl p-6">
        <p className="text-slate-500 text-sm">
          No gallery images available.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 md:columns-3 gap-4 space-y-4">

        {images.map((img: any, i: number) => {

          const src =
            typeof img === "string"
              ? img
              : img?.src || img?.url;

          if (!src) return null;

          return (
            <img
              key={i}
              src={src}
              onClick={() => {
                setActiveImage(src);
                setLightboxOpen(true);
              }}
              className="w-full rounded-xl object-cover border break-inside-avoid cursor-pointer hover:opacity-90 transition"
            />
          );
        })}

      </div>

      {lightboxOpen && activeImage && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold"
            >
              ×
            </button>

            <img
              src={activeImage}
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
      default: {
  const basicData =
    college?.basic ??
    college?.overview ??
    college?.rawScraped?.basic ??
    {};

  const tocSections = Array.isArray(basicData?.toc_sections)
    ? basicData.toc_sections
    : [];

  const aboutBlocks = [
    ...normalizeBlocksArray(basicData?.about),
    ...normalizeBlocksArray(basicData?.about_highlights),
    ...normalizeBlocksArray(basicData?.about_highlight),
    ...normalizeBlocksArray(basicData?.about_highligh),
  ];

  return (
    <div className="space-y-8">

      <div className="bg-white border rounded-2xl p-6">

        <h3 className="text-xl font-bold mb-6">
          About {college?.name ?? "College"}
        </h3>

        {/* ABOUT */}
        {aboutBlocks.length > 0 && (
          <FlexibleBlockRenderer blocks={aboutBlocks} />
        )}

        {/* TABLE OF CONTENTS */}
        {tocSections.length > 0 && (
          <div className="flex gap-4 flex-col pb-2 mb-6 mt-8 bg-[#eee] border p-4 rounded-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Table of Contents
            </h2>

            {tocSections.map((sec: any, i: number) => (
              <a
                key={i}
                href={`#${slugify(sec.section)}`}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {sec.section}
              </a>
            ))}
          </div>
        )}

        {/* SECTIONS */}
        {tocSections.map((section: any, index: number) => (
          <div
            key={index}
            id={slugify(section.section)}
            className="mt-8 scroll-mt-24"
          >
            {section?.section && (
              <h4 className="text-lg font-bold text-slate-900 mb-4">
                {section.section}
              </h4>
            )}

            <FlexibleBlockRenderer
              blocks={normalizeBlocksArray(section?.content)}
            />
          </div>
        ))}

        {/* BASIC INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 text-sm">

          {college?.established && (
            <InfoRow label="Established" value={college.established} />
          )}

          {(college?.type || detail?.type) && (
            <InfoRow
              label="Type"
              value={detail?.type ?? college?.type}
            />
          )}

          {college?.location && (
            <InfoRow label="Location" value={college.location} />
          )}

          {college?.rating && (
            <InfoRow
              label="Rating"
              value={`${college.rating}/5 (${college.reviewCount ?? 0})`}
            />
          )}

        </div>

      </div>

    </div>
  );
}

    }
  };
  // ✅ SAFE RENDER GUARD — AFTER ALL HOOKS
  if (loadingCollege) {
    return (
      <div className="mt-[120px] text-center text-slate-500">
        Loading college details...
      </div>
    );
  }

  if (!college) {
    return (
      <div className="mt-[120px] text-center text-red-500">
        College not found
      </div>
    );
  }





  /* ===================== PAGE JSX RETURN ===================== */
  const placementRateValue = (() => {
    const highestStr =
      detail?.rawScraped?.placement?.highest ||
      college?.rawScraped?.placement?.highest_package;

    const averageStr =
      detail?.rawScraped?.placement?.average ||
      college?.rawScraped?.placement?.average_package;

    if (!highestStr || !averageStr) return "N/A";

    const highest = parseFloat(highestStr.toString().replace(/[^0-9.]/g, ""));
    const average = parseFloat(averageStr.toString().replace(/[^0-9.]/g, ""));

    if (!highest || !average) return "N/A";

    const rate = Math.round((average / highest) * 100);
    return `${rate}%`;
  })();

  const establishedYearLabel = getFirstDisplayText(
    college?.basic?.established_year,
    detail?.basic?.established_year,
    college?.established_year,
    detail?.established_year,
    college?.established
  );

  const accreditationLabel = getFirstDisplayText(
    college?.accreditation,
    detail?.accreditation,
    college?.basic?.accreditation,
    detail?.basic?.accreditation
  );

  const affiliationLabel = getFirstDisplayText(
    college?.affiliations,
    detail?.affiliations,
    college?.basic?.affiliations,
    detail?.basic?.affiliations
  );

  const collegeName = college?.basic?.name || college?.name || "College";
  const courseMetaName = selectedCourse?.course_name || selectedCourse?.name || "";
  const collegeLocation = [college?.basic?.city, college?.basic?.state]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(", ");
  const collegeTypeLabel =
    detail?.type || college?.basic?.college_type || college?.type || "";
  const canonicalPath = activeCourseSlug
    ? buildUniversityPath("Courses & Fees", activeCourseSlug)
    : tabFromRoute
      ? buildUniversityPath(tabFromRoute)
      : baseCollegePath;
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${canonicalPath}`
      : canonicalPath;
  const metaImage =
    college?.heroImages || college?.basic?.logo || college?.logoUrl || "";
  const metaTitle = (() => {
    if (activeCourseSlug && courseMetaName) {
      return `${courseMetaName} at ${collegeName} 2026: Fees, Eligibility, Admission | StudyCups`;
    }

    switch (activeTab) {
      case "Courses & Fees":
        return `${collegeName} Courses & Fees 2026: Eligibility, Duration, Admission | StudyCups`;
      case "admission":
        return `${collegeName} Admission 2026: Dates, Eligibility, Cutoff, Selection Process | StudyCups`;
      case "placement":
        return `${collegeName} Placements 2025: Highest Package, Average Package, Recruiters | StudyCups`;
      case "cutoff":
        return `${collegeName} Cutoff 2025: Round-wise, Category-wise Cutoff | StudyCups`;
      case "scholarship":
        return `${collegeName} Scholarships 2026: Eligibility, Amount, Application Process | StudyCups`;
      case "ranking":
        return `${collegeName} Ranking 2025: NIRF, Outlook, India Today | StudyCups`;
      case "faculty":
        return `${collegeName} Faculty 2026: Departments, Teachers, Reviews | StudyCups`;
      case "qna":
        return `${collegeName} Q&A 2026: Student Questions and Answers | StudyCups`;
      case "reviews":
        return `${collegeName} Reviews 2026: Rating, Student Feedback, Campus Life | StudyCups`;
      case "gallery":
        return `${collegeName} Photos 2026: Campus, Hostel, Events, Infrastructure | StudyCups`;
      default:
        return `${collegeName} 2026: Admission, Courses, Fees, Cutoff, Placement, Ranking | StudyCups`;
    }
  })();
  const metaDescription = (() => {
    if (activeCourseSlug && courseMetaName) {
      return `Check ${courseMetaName} at ${collegeName}${collegeLocation ? `, ${collegeLocation}` : ""} including fees, eligibility, admission process, duration and key course details for 2026.`;
    }

    switch (activeTab) {
      case "Courses & Fees":
        return `Explore ${collegeName}${collegeLocation ? `, ${collegeLocation}` : ""} courses and fees for 2026. Check eligibility, duration, fee structure and admission details by program.`;
      case "admission":
        return `Get ${collegeName} admission 2026 details including eligibility, entrance exams, important dates, selection process and application steps.`;
      case "placement":
        return `Explore ${collegeName} placements 2025 with highest package, average package${placementRateValue !== "N/A" ? `, estimated placement rate ${placementRateValue}` : ""} and top recruiters.`;
      case "cutoff":
        return `Check ${collegeName} cutoff 2025 including round-wise and category-wise cutoff trends, qualifying exams and admission benchmarks.`;
      case "scholarship":
        return `Find ${collegeName} scholarship details for 2026 including eligibility, scholarship amount, available schemes and application process.`;
      case "ranking":
        return `View ${collegeName} ranking 2025 across top surveys and agencies along with reputation, academic performance and key highlights.`;
      case "faculty":
        return `Know more about ${collegeName} faculty, departments, academic expertise and teaching support for students.`;
      case "qna":
        return `Read verified ${collegeName} student questions and answers covering admission, placements, fees, hostel, campus life and academics.`;
      case "reviews":
        return `Read ${collegeName} reviews, student ratings and feedback on placements, faculty, infrastructure, hostel and overall campus experience.`;
      case "gallery":
        return `Browse ${collegeName} campus photos covering classrooms, hostel, events, infrastructure and student life.`;
      default:
        return `Explore ${collegeName}${collegeLocation ? `, ${collegeLocation}` : ""}${collegeTypeLabel ? `, ${collegeTypeLabel}` : ""}${establishedYearLabel ? ` established in ${establishedYearLabel}` : ""}. Check admission 2026, courses, fees, cutoff, placements, ranking and reviews.`;
    }
  })();
  const collegeStream = college?.stream || college?.basic?.stream || "";

  const metaKeywords = [
    `${collegeName} admission 2026`,
    `${collegeName} fees`,
    `${collegeName} courses`,
    `${collegeName} cutoff`,
    `${collegeName} placements`,
    `${collegeName} ranking`,
    `${collegeName} reviews`,
    collegeLocation ? `${collegeName} ${collegeLocation}` : "",
    collegeLocation ? `best college in ${collegeLocation}` : "",
    collegeLocation ? `top college ${collegeLocation} 2026` : "",
    collegeStream ? `best ${collegeStream} college in India` : "",
  ]
    .filter(Boolean)
    .join(", ");
 

  return ( 
    <> 
  <Helmet>
    <title>{metaTitle}</title>
    <meta name="description" content={metaDescription} />
    <meta name="keywords" content={metaKeywords} />
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={metaTitle} />
    <meta property="og:description" content={metaDescription} />
    <meta property="og:url" content={canonicalUrl} />
    {metaImage ? <meta property="og:image" content={metaImage} /> : null}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={metaTitle} />
    <meta name="twitter:description" content={metaDescription} />
    {metaImage ? <meta name="twitter:image" content={metaImage} /> : null}
    {schema && (
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    )}
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in" },
        { "@type": "ListItem", "position": 2, "name": "Colleges", "item": "https://studycups.in/colleges" },
        { "@type": "ListItem", "position": 3, "name": collegeName, "item": canonicalUrl }
      ]
    })}</script>
  </Helmet>
   
    <div>
      {/* ===== HERO BANNER ===== */}
      <div className="mt-[76px] w-full">
        {/* Banner Image */}
        <div className="relative h-[180px] sm:h-[240px] w-full overflow-hidden">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-black/55 hover:bg-black/75 text-white rounded-full backdrop-blur transition text-xs sm:text-sm font-semibold"
            aria-label="Back"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back</span>
          </button>
          <img
            src={college.heroImages}
            alt={collegeName}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Action buttons on banner */}
          <div className="absolute bottom-3 right-4 z-30 flex gap-2">
            <button
              onClick={onOpenApplyNow}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-[#1877F2] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg transition"
            >
              Enquire Now
            </button>
            <button
              onClick={onOpenBrochure}
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 text-xs sm:text-sm font-bold shadow-lg transition"
            >
              Brochure
            </button>
          </div>
        </div>

        {/* ===== COLLEGE INFO BAR (CollegeDunia-style) ===== */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Logo + Name block */}
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={college.basic.logo}
                    alt={collegeName}
                    className="w-full h-full object-contain"
                    onError={(e: any) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {/* Breadcrumb */}
                  <nav className="flex items-center gap-1 text-[11px] text-slate-400 mb-1" aria-label="Breadcrumb">
                    <button onClick={() => navigate("/")} className="hover:text-blue-600 transition">Home</button>
                    <span>›</span>
                    <button onClick={() => navigate("/colleges")} className="hover:text-blue-600 transition">Colleges</button>
                    <span>›</span>
                    <span className="text-slate-500 truncate max-w-[160px] sm:max-w-xs">{collegeName}</span>
                  </nav>
                  <h1 className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">{getTabHeading()}</h1>
                  {/* Chips row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {collegeLocation && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        📍 {collegeLocation}
                      </span>
                    )}
                    {(detail?.type || college?.basic?.college_type) && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        {detail?.type || college.basic.college_type}
                      </span>
                    )}
                    {accreditationLabel && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100">
                        🏅 {accreditationLabel}
                      </span>
                    )}
                    {affiliationLabel && (
                      <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100 max-w-[200px] truncate">
                        {affiliationLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating + Actions (desktop) */}
              <div className="hidden sm:flex flex-col items-end gap-2.5 flex-shrink-0">
                {college?.basic?.rating && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-green-600 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
                      ★ {college.basic.rating}
                    </span>
                    <span className="text-xs text-slate-400">({college?.basic?.reviews || 0} reviews)</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => onCompareToggle(String(college.id))}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition ${isCompared ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    {isCompared ? "✓ Compared" : "⊕ Compare"}
                  </button>
                  <button
                    onClick={onOpenApplyNow}
                    className="px-5 py-1.5 rounded-lg bg-[#1E4A7A] hover:bg-blue-900 text-white text-sm font-bold transition"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>

            {/* Key Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {establishedYearLabel && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Established</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{establishedYearLabel}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Type</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{detail?.type || college?.basic?.college_type || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Rating</p>
                <p className="text-sm font-bold text-yellow-600 mt-0.5">⭐ {college?.basic?.rating || "N/A"}/5</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Location</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{collegeLocation || "India"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STICKY TAB BAR ===== */}
      <div className="bg-white border-b border-slate-200 md:sticky md:top-[70px] z-30 shadow-sm mt-0">
        <div className="max-w-7xl mx-auto px-4 flex gap-0 overflow-x-auto no-scrollbar">
          {availableTabs.map((key) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                navigate(buildUniversityPath(key));
              }}
              className={`py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm whitespace-nowrap border-b-[3px] transition-colors ${
                activeTab === key
                  ? "border-[#1E4A7A] text-[#1E4A7A]"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {key === "basic" ? "Overview" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* LAYOUT */}
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">


        <div className="lg:col-span-2">{renderTabContent()}</div>

       <aside className="space-y-4 w-full hidden lg:block lg:sticky lg:top-[140px] self-start">

          {/* CTA Card */}
          <div className="bg-gradient-to-br from-[#1E4A7A] to-[#0f2952] text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-0.5">
              <span>🎓</span>
              <h3 className="font-bold text-base">Free Counselling</h3>
            </div>
            <p className="text-xs text-white/75 mb-4">Expert admission guidance — 100% Free</p>
            <button
              onClick={onOpenApplyNow}
              className="w-full bg-white text-[#1E4A7A] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition"
            >
              Apply Now →
            </button>
            <button
              onClick={onOpenBrochure}
              className="mt-2 w-full border border-white/30 text-white py-2 rounded-xl font-semibold text-sm hover:bg-white/10 transition"
            >
              Download Brochure
            </button>
          </div>

          {/* Quick Facts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-500">Quick Facts</h4>
            <div className="space-y-2.5">
              {[
                { label: "Established", value: establishedYearLabel || "N/A" },
                { label: "Type", value: detail?.type || college?.basic?.college_type || "N/A" },
                { label: "Accreditation", value: accreditationLabel || "N/A" },
                { label: "Location", value: collegeLocation || "India" },
                { label: "Rating", value: college?.basic?.rating ? `${college.basic.rating}/5` : "N/A" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-2 text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 text-xs flex-shrink-0">{label}</span>
                  <span className="font-semibold text-slate-800 text-right text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compare Button */}
          <button
            onClick={() => onCompareToggle(String(college.id))}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm border transition ${
              isCompared
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isCompared ? "✓ Added to Compare" : "⊕ Compare College"}
          </button>


          {/* ================= Latest News ================= */}




          {/* ================= IMPORTANT DATES SECTION ================= */}

         {(upcoming.length > 0 || expired.length > 0) && (
            <div className="bg-white border rounded-2xl p-6 mt-10 overflow-x-auto bg-white p-6 rounded-xl shadow-sm border ">

              <h3 className="text-xl font-bold mb-4">
                Important Dates & Admission Events
              </h3>

              {/* TABS */}
         <div className="flex gap-2 mb-4">
      <button
        onClick={() => setShowAllExpired(false)}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
          !showAllExpired
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        Upcoming
      </button>

      <button
        onClick={() => setShowAllExpired(true)}
        className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
          showAllExpired
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        Expired
      </button>
    </div>

              {/* UPCOMING ===================== */}
              {upcoming.length > 0 && !showAllExpired && (
                <div className="w-full overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2 text-left w-3/4">Event</th>
                        <th className="border p-2 text-center w-1/4">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(showAllUpcoming ? upcoming : upcoming.slice(0, 3)).map(
                        (ev: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="border p-2 font-medium">{ev.event}</td>
                            <td className="border p-2 text-center text-blue-700 font-semibold">
                              {ev.date}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>

                  {/* VIEW ALL BTN */}
                  {upcoming.length > 3 && (
                    <button
                      onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                      className="text-blue-600 mt-3 font-semibold text-sm"
                    >
                      {showAllUpcoming ? "View Less" : "View All"}
                    </button>
                  )}
                </div>
              )}

              {/* EXPIRED ===================== */}
              {expired.length > 0 && showAllExpired && (
                <div className="w-full overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2 text-left w-3/4">Event</th>
                        <th className="border p-2 text-center w-1/4">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(showAllExpired ? expired : expired.slice(0, 3)).map(
                        (ev: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="border p-2 font-medium">{ev.event}</td>
                            <td className="border p-2 text-center text-red-500 font-semibold">
                              {ev.date}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>

                  {expired.length > 3 && (
                    <button
                      onClick={() => setShowAllExpired(!showAllExpired)}
                      className="text-blue-600 mt-3 font-semibold text-sm"
                    >
                      {showAllExpired ? "View Less" : "View All"}
                    </button>
                  )}
                </div>
              )}

            </div>
          )} 
          {/* ================= COURSE PAGE SIDEBAR ================= */}

{activeCourseSlug && selectedCourse?.sub_courses?.length > 0 && (
  <div className="bg-white border rounded-2xl p-5">

    <h3 className="font-bold text-lg mb-4">
      Related Courses
    </h3>

    <div className="space-y-3">

      {selectedCourse.sub_courses.map((sc:any,i:number)=>{

        const subSlug = sc?.slug_url?.value || sc?.slug_url
        const subCourseRating = getSubCourseMetricFallback(sc, selectedCourse, "rating");
        const subCourseReviews = getSubCourseMetricFallback(sc, selectedCourse, "reviews");

        return (
          <div
            key={i}
            className="flex items-center gap-3 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer"
            onClick={() => {
              if (!subSlug) return;
              navigate(buildUniversityPath("Courses & Fees", subSlug));
            }}
          >

            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
              {sc.name?.value?.charAt(0)}
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-700">
                {sc.name?.value}
              </p>

              <p className="text-xs text-slate-500">
                {`\u2605 ${subCourseRating || "-"} (${subCourseReviews || 0})`}
              </p>
            </div>

          </div>
        )

      })}

    </div>

  </div>
)}
{activeCourseSlug && (
  <div className="bg-white border rounded-2xl p-5">

    <h3 className="font-bold text-lg mb-4">
      Colleges Offering this Course
    </h3>

    {loadingCourseOfferingColleges ? (
      <p className="text-sm text-slate-500">Loading colleges...</p>
    ) : courseOfferingColleges.length > 0 ? (
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">

        {courseOfferingColleges.map((c:any,i:number)=>(
        <div
          key={`${c.id || c.name || "college"}-${i}`}
          className="flex items-center gap-3 border rounded-xl p-3 hover:bg-slate-50 cursor-pointer"
          onClick={() =>
            navigate(
              c?.id
                ? `/university/${c.id}-${toSeoSlug(c.name || "")}`
                : "/university"
            )
          }
        >

          <img
            src={c?.logoUrl || "/no-image.jpg"}
            className="w-9 h-9 rounded-full object-contain bg-white border"
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {c?.name || "College"}
            </p>

            {c?.location && (
              <p className="text-[11px] text-slate-500">
                {c.location}
              </p>
            )}

            <p className="text-xs text-blue-600">
              View Details →
            </p>
          </div>

        </div>
        ))}

      </div>
    ) : (
      <p className="text-sm text-slate-500">
        No colleges found for this course.
      </p>
    )}

  </div>
)}

        </aside> 
      
      </div>
    </div> 
     </>
  );
};

export default DetailPage;
