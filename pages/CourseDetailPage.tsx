import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import FlexibleBlockRenderer from "./FlexibleBlockRenderer";
import { buildCourseDetailPath } from "./Seo";

interface CourseDetailPageProps {
  onOpenApplyNow: () => void;
  onOpenBrochure: () => void;
}

type CourseTab = "Overview" | "Syllabus" | "Top Colleges";

const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";

const CTA_TEXTS = new Set([
  "apply now",
  "check eligibility",
  "get updates",
]);

const getTextValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "value" in value) {
    return String((value as { value?: unknown }).value ?? "").trim();
  }
  return "";
};

const replaceBrand = (text = "") => text.replace(/collegedunia/gi, "StudyCups");

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const shouldHideText = (text = "") => {
  const normalized = normalizeText(text);
  return !normalized || CTA_TEXTS.has(normalized);
};

const slugify = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toSeoSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const formatCourseTitle = (title = "") => title.replace(/\s+/g, " ").trim();

const formatHeroCourseTitle = (title = "") =>
  formatCourseTitle(title)
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatFees = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return "₹" + value.toLocaleString("en-IN");
  }

  if (typeof value === "string" && value.trim()) return value.trim();

  return "N/A";
};

const formatFeeLabel = (value: unknown) => {
  const formatted = formatFees(value);
  return formatted.startsWith("INR ") ? formatted : formatted.replace(/^â‚¹/, "INR ");
};

const getTextList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => getTextList(item)).filter(Boolean);
  }

  const text = getTextValue(value);
  return text ? [text] : [];
};

const pickFirstText = (...values: unknown[]) =>
  values.flatMap((value) => getTextList(value)).find(Boolean) || "";

const startCaseFromSlug = (value = "") =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getCourseFamily = (...parts: string[]) => {
  const combined = parts.join(" ").toLowerCase();

  if (/(mba|pgdm|management|business|executive|bba)/.test(combined)) {
    return "management";
  }

  if (
    /(b\.?tech|btech|m\.?tech|mtech|engineering|technology|computer|data science|artificial intelligence|machine learning)/.test(
      combined
    )
  ) {
    return "engineering";
  }

  if (/(mbbs|medical|health|nursing|dental|pharma)/.test(combined)) {
    return "medical";
  }

  if (/(llb|llm|law|legal)/.test(combined)) {
    return "law";
  }

  if (/(b\.?com|commerce|account|finance|economics)/.test(combined)) {
    return "commerce";
  }

  if (/(ba|arts|humanities|social|psychology|journalism)/.test(combined)) {
    return "arts";
  }

  return "general";
};

const getDerivedCourseLevel = (title = "") => {
  const lowerTitle = title.toLowerCase();

  if (
    /(mba|pgdm|master|postgraduate|post-graduate|m\.?tech|mca|msc|m\.?com|ma|llm)/.test(
      lowerTitle
    )
  ) {
    return "Postgraduate";
  }

  if (
    /(bachelor|undergraduate|under-graduate|b\.?tech|btech|bca|bba|b\.?com|ba|bsc|mbbs|llb)/.test(
      lowerTitle
    )
  ) {
    return "Undergraduate";
  }

  return "Program";
};

const COURSE_EXAM_NAMES = [
  "CAT",
  "XAT",
  "MAT",
  "CMAT",
  "SNAP",
  "GMAT",
  "NMAT",
  "ATMA",
  "CUET",
  "JEE Main",
  "JEE Advanced",
  "GATE",
  "NEET",
  "CLAT",
  "AILET",
  "NIMCET",
  "NBSAT",
];

const getAcceptedExams = (course: any, title = "", categorySlug = "") => {
  const textSources = [
    course?.exams_accepted,
    course?.exam_accepted,
    course?.accepted_exams,
    course?.accepted_exam,
    course?.entrance_exam,
    course?.entrance_exams,
    course?.eligibility,
  ]
    .flatMap((value) => getTextList(value))
    .map((value) => normalizeText(value));

  const matchedExams = COURSE_EXAM_NAMES.filter((exam) =>
    textSources.some((text) => text.includes(normalizeText(exam)))
  );

  if (matchedExams.length > 0) {
    return Array.from(new Set(matchedExams)).join(" / ");
  }

  const family = getCourseFamily(
    title,
    pickFirstText(course?.stream, course?.course_stream, course?.stream_name),
    categorySlug
  );
  const lowerTitle = title.toLowerCase();

  switch (family) {
    case "management":
      return "CAT / XAT / MAT / CMAT / SNAP";
    case "engineering":
      return /(m\.?tech|mtech)/.test(lowerTitle)
        ? "GATE"
        : "JEE Main / JEE Advanced";
    case "medical":
      return "NEET";
    case "law":
      return /llm/.test(lowerTitle) ? "CLAT PG" : "CLAT / AILET";
    default:
      return "Entrance / merit based";
  }
};

const getDefaultEligibility = (title = "", family = "general", level = "") => {
  const lowerTitle = title.toLowerCase();
  const normalizedLevel = level.toLowerCase();

  switch (family) {
    case "management":
      return "Graduation from a recognized university";
    case "engineering":
      return /(m\.?tech|mtech)/.test(lowerTitle)
        ? "B.E. / B.Tech in a relevant discipline"
        : "Class 12 with PCM from a recognized board";
    case "medical":
      return "Class 12 with PCB from a recognized board";
    case "law":
      return /llm/.test(lowerTitle)
        ? "LLB from a recognized university"
        : "Class 12 from a recognized board";
    default:
      return normalizedLevel.includes("post")
        ? "Graduation from a recognized university"
        : "Class 12 from a recognized board";
  }
};

const getStudyCupsOffer = (family = "general") => {
  switch (family) {
    case "management":
      return "Up to INR 1 Lakh scholarship + counselling";
    case "engineering":
      return "Free counselling and college shortlist";
    case "medical":
      return "Admission guidance and counselling support";
    case "law":
      return "Application guidance and shortlist support";
    default:
      return "Free counselling and admission support";
  }
};

const buildHeroDescription = (course: any, title = "", totalColleges = 0) => {
  const customDescription = pickFirstText(
    course?.short_description,
    course?.description,
    course?.overview,
    course?.summary
  );

  if (customDescription) {
    return replaceBrand(customDescription);
  }

  const details = [
    pickFirstText(course?.duration),
    pickFirstText(course?.mode),
    totalColleges > 0 ? `${totalColleges}+ colleges` : "",
  ].filter(Boolean);

  const detailText = details.length ? ` with ${details.join(", ")}.` : ".";

  return `Explore ${title} admission 2026 with fees, eligibility, syllabus, and colleges offering this course${detailText}`;
};

const formatCollegeFeeLabel = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "N/A";

  const lakhs = Math.round((value / 100000) * 100) / 100;
  return `INR ${lakhs}L`;
};

const getCollegeTypeLabel = (college: any) =>
  [
    college?.college_type,
    college?.basic?.college_type,
    college?.rawScraped?.basic?.college_type,
    college?.type,
  ]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean) || "";

const getCollegeRoute = (college: any) =>
  `/university/${college.id}-${toSeoSlug(college.name || "")}`;

const normalizeTableRows = (value: unknown): string[][] => {
  if (!Array.isArray(value) || value.length === 0) return [];

  if (Array.isArray(value[0])) {
    return value
      .map((row) =>
        Array.isArray(row)
          ? row.map((cell) => replaceBrand(getTextValue(cell))).filter(Boolean)
          : [replaceBrand(getTextValue(row))].filter(Boolean)
      )
      .filter((row) => row.length > 0);
  }

  return [
    value
      .map((cell) => replaceBrand(getTextValue(cell)))
      .filter(Boolean),
  ].filter((row) => row.length > 0);
};

const normalizeBlock = (block: any) => {
  if (!block) return null;

  const blockType =
    typeof block?.type === "string" ? block.type.toLowerCase() : "text";

  if (blockType === "text") {
    const value = replaceBrand(getTextValue(block?.value ?? block));
    if (shouldHideText(value)) return null;
    return { type: "text", value };
  }

  if (blockType === "list") {
    const value = (Array.isArray(block?.value) ? block.value : [])
      .map((item: unknown) => replaceBrand(getTextValue(item)))
      .filter((item: string) => !shouldHideText(item));

    return value.length ? { type: "list", value } : null;
  }

  if (blockType === "table") {
    const value = normalizeTableRows(block?.value);
    return value.length ? { type: "table", value } : null;
  }

  if (blockType === "image") {
    const src = getTextValue(block?.src || block?.value);
    return src ? { type: "image", src } : null;
  }

  if (blockType === "video") {
    const src = getTextValue(block?.src || block?.value);
    return src ? { type: "video", src } : null;
  }

  if (blockType === "heading") {
    const value = replaceBrand(getTextValue(block?.value));
    return value ? { type: "heading", value, level: block?.level || "h3" } : null;
  }

  const fallback = replaceBrand(getTextValue(block));
  return shouldHideText(fallback) ? null : { type: "text", value: fallback };
};

const normalizeBlocksArray = (data: unknown) => {
  if (!data) return [];

  if (!Array.isArray(data)) {
    const normalized = normalizeBlock(data);
    return normalized ? [normalized] : [];
  }

  return data.map(normalizeBlock).filter(Boolean);
};

const stripDuplicateHeading = (blocks: any[], heading = "") => {
  if (!blocks.length || !heading) return blocks;

  const firstBlock = blocks[0];
  if (
    firstBlock?.type === "text" &&
    normalizeText(firstBlock.value) === normalizeText(heading)
  ) {
    return blocks.slice(1);
  }

  if (
    firstBlock?.type === "heading" &&
    normalizeText(firstBlock.value) === normalizeText(heading)
  ) {
    return blocks.slice(1);
  }

  return blocks;
};

const hasStructuredContent = (data: any) => {
  if (!data) return false;

  if (normalizeBlocksArray(data?.about).length > 0) {
    return true;
  }

  if (Array.isArray(data?.toc_sections)) {
    return data.toc_sections.some(
      (section: any) => normalizeBlocksArray(section?.content).length > 0
    );
  }

  return normalizeBlocksArray(data).length > 0;
};

const StructuredCourseContent: React.FC<{
  title: string;
  data: any;
  emptyMessage: string;
}> = ({ title, data, emptyMessage }) => {
  const aboutBlocks = useMemo(() => normalizeBlocksArray(data?.about), [data]);
  const tocSections = useMemo(
    () => (Array.isArray(data?.toc_sections) ? data.toc_sections : []),
    [data]
  );

  if (!aboutBlocks.length && tocSections.length === 0) {
    return (
      <section className="bg-white border rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {aboutBlocks.length > 0 && (
        <section className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">
            {title}
          </h2>
          <FlexibleBlockRenderer blocks={aboutBlocks as any} />
        </section>
      )}

      {tocSections.length > 1 && (
        <section className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Table of Contents
          </h2>
          <div className="flex flex-wrap gap-2">
            {tocSections.map((section: any, index: number) => {
              const sectionTitle = getTextValue(section?.section);
              if (!sectionTitle) return null;

              return (
                <a
                  key={`${sectionTitle}-${index}`}
                  href={`#${slugify(sectionTitle)}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-200 hover:text-blue-700"
                >
                  {sectionTitle}
                </a>
              );
            })}
          </div>
        </section>
      )}

      {tocSections.map((section: any, index: number) => {
        const sectionTitle = getTextValue(section?.section) || `Section ${index + 1}`;
        const blocks = stripDuplicateHeading(
          normalizeBlocksArray(section?.content),
          sectionTitle
        );

        if (!blocks.length) return null;

        return (
          <section
            key={`${sectionTitle}-${index}`}
            id={slugify(sectionTitle)}
            className="bg-white border rounded-2xl p-6 shadow-sm scroll-mt-28"
          >
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">
              {sectionTitle}
            </h3>
            <FlexibleBlockRenderer blocks={blocks as any} />
          </section>
        );
      })}
    </div>
  );
};

const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ onOpenApplyNow }) => {
  const { categorySlug, courseSlug } = useParams<{
    categorySlug: string;
    courseSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<CourseTab>("Overview");
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comparedCollegeIds, setComparedCollegeIds] = useState<string[]>([]);

  const exactName = useMemo(
    () => new URLSearchParams(location.search).get("name") || "",
    [location.search]
  );

  useEffect(() => {
    setActiveTab("Overview");
    setComparedCollegeIds([]);
  }, [courseSlug]);

  useEffect(() => {
    if (!courseSlug) {
      setCourse(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const requestUrl = exactName
      ? `${API_BASE}/course/${courseSlug}?name=${encodeURIComponent(exactName)}`
      : `${API_BASE}/course/${courseSlug}`;

    fetch(requestUrl)
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => {
        if (data?.success && data?.course) {
          setCourse({
            ...data.course,
            collegesOffering: Array.isArray(data.collegesOffering)
              ? data.collegesOffering
              : [],
            allCollegesData: Array.isArray(data.allCollegesData)
              ? data.allCollegesData
              : [],
          });
          return;
        }

        setCourse(null);
      })
      .catch((err) => {
        console.error("Course detail API error:", err);
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [courseSlug, exactName]);

  const collegesOffering = useMemo(() => {
    const source = Array.isArray(course?.collegesOffering) ? course.collegesOffering : [];
    return [...new Map(source.map((item: any) => [String(item?.id), item])).values()];
  }, [course?.collegesOffering]);
  const canonicalPath = useMemo(() => {
    if (!course) return "";

    const resolvedTitle = course?.course_name || course?.name || "";
    const resolvedCategory = pickFirstText(
      course?.stream,
      course?.course_stream,
      course?.stream_name,
      categorySlug ? startCaseFromSlug(categorySlug) : ""
    );

    return buildCourseDetailPath(resolvedCategory || categorySlug || "general", resolvedTitle);
  }, [categorySlug, course]);
  const canonicalUrl = useMemo(() => {
    if (!canonicalPath) return "";
    if (typeof window === "undefined") return canonicalPath;
    return `${window.location.origin}${canonicalPath}`;
  }, [canonicalPath]);
  const hasSyllabusContent = useMemo(
    () => hasStructuredContent(course?.syllabus_detail),
    [course?.syllabus_detail]
  );
  const availableTabs = useMemo(() => {
    const tabs: CourseTab[] = ["Overview"];
    if (hasSyllabusContent) tabs.push("Syllabus");
    tabs.push("Top Colleges");
    return tabs;
  }, [hasSyllabusContent]);

  useEffect(() => {
    if (activeTab === "Syllabus" && !hasSyllabusContent) {
      setActiveTab("Overview");
    }
  }, [activeTab, hasSyllabusContent]);

  useEffect(() => {
    if (!course || !canonicalPath) return;

    const searchParams = new URLSearchParams(location.search);
    searchParams.delete("name");

    const nextSearch = searchParams.toString();
    const nextUrl = nextSearch ? `${canonicalPath}?${nextSearch}` : canonicalPath;
    const currentUrl = `${location.pathname}${location.search}`;

    if (currentUrl !== nextUrl) {
      navigate(nextUrl, { replace: true });
    }
  }, [canonicalPath, course, location.pathname, location.search, navigate]);

  const toggleComparedCollege = (collegeId: string) => {
    setComparedCollegeIds((prev) =>
      prev.includes(collegeId)
        ? prev.filter((id) => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const courseTitle = course?.course_name || course?.name || "Course";
  const avgRating = Number(course?.avgRating || 0);
  const totalColleges = Number(course?.totalColleges ?? course?.total_college_count ?? 0) || 0;
  const streamLabel = replaceBrand(
    pickFirstText(
      course?.stream,
      course?.course_stream,
      course?.stream_name,
      categorySlug ? startCaseFromSlug(categorySlug) : ""
    ) || "General Program"
  );
 const rawLevelLabel = pickFirstText(course?.course_level, course?.level);
 const levelLabel =
  rawLevelLabel && !["n/a", "na", "not available"].includes(normalizeText(rawLevelLabel))
    ? rawLevelLabel
    : getDerivedCourseLevel(courseTitle);
  const courseFamily = getCourseFamily(courseTitle, streamLabel, categorySlug || "");
  const acceptedExams = getAcceptedExams(course, courseTitle, categorySlug || "");
  const eligibilityText = replaceBrand(
    pickFirstText(course?.eligibility, course?.min_eligibility, course?.eligibility_text) ||
      getDefaultEligibility(courseTitle, courseFamily, levelLabel)
  );
  const studyCupsOffer = getStudyCupsOffer(courseFamily);
  const heroDescription = buildHeroDescription(course, courseTitle, totalColleges);
  const quickFactsTitle = formatCourseTitle(courseTitle);
  const courseQuickFacts = [
    { label: "Duration", value: pickFirstText(course?.duration) || "N/A" },
    { label: "Level", value: replaceBrand(levelLabel) || "N/A" },
    { label: "Min. Eligibility", value: eligibilityText || "N/A" },
    { label: "Main Exams", value: acceptedExams || "N/A" },
    { label: "Fee Range", value: formatFeeLabel(course?.avg_fees ?? course?.fees) },
    { label: "Partner Colleges", value: totalColleges > 0 ? `${totalColleges}+` : "N/A" },
    { label: "StudyCups Offer", value: studyCupsOffer || "N/A" },
  ];
  const currentContent =
    activeTab === "Syllabus" && hasSyllabusContent
      ? course?.syllabus_detail
      : course?.course_detail;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading course data...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Course not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-10">
      <Helmet>
        <title>{`${courseTitle} 2026 | Fees, Syllabus, Eligibility, Colleges | StudyCups`}</title>
        <meta name="description" content={`Explore ${courseTitle} 2026 in India. Check fees, duration, eligibility, syllabus and top colleges offering ${courseTitle}. Get free admission guidance on StudyCups.`} />
        <meta name="keywords" content={`${courseTitle}, ${courseTitle} fees, ${courseTitle} syllabus, ${courseTitle} eligibility, ${courseTitle} colleges India, best ${courseTitle} colleges 2026, ${courseTitle} admission 2026`} />
        {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content={`${courseTitle} 2026 | Fees, Syllabus, Colleges | StudyCups`} />
        <meta property="og:description" content={`Explore ${courseTitle} 2026 in India. Fees, eligibility, syllabus and top colleges.`} />
        {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${courseTitle} 2026 | Fees, Syllabus, Colleges | StudyCups`} />
        <meta name="twitter:description" content={`Explore ${courseTitle} 2026. Fees, eligibility, syllabus and top colleges in India.`} />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />

        {/* JSON-LD: Course */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          "name": courseTitle,
          "description": `${courseTitle} - Fees, syllabus, eligibility and top colleges in India 2026`,
          "provider": {
            "@type": "Organization",
            "name": "StudyCups",
            "url": "https://studycups.in"
          },
          "url": canonicalUrl || `https://studycups.in/courses`,
          "educationalLevel": levelLabel || "Higher Education",
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "onsite",
            "inLanguage": "en"
          }
        })}</script>
        {canonicalUrl && <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://studycups.in" },
            { "@type": "ListItem", "position": 2, "name": "Courses", "item": "https://studycups.in/courses" },
            { "@type": "ListItem", "position": 3, "name": courseTitle, "item": canonicalUrl }
          ]
        })}</script>}
      </Helmet>

      {/* ===== HERO ===== */}
      <div className="bg-gradient-to-br from-[#0f2952] via-[#1E4A7A] to-[#0d3d6e] pt-[84px] pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigate("/")} className="hover:text-white transition">Home</button>
            <span>›</span>
            <button type="button" onClick={() => navigate("/courses")} className="hover:text-white transition">Courses</button>
            <span>›</span>
            <span className="text-white/80 truncate max-w-[200px]">{formatCourseTitle(courseTitle)}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
            {/* Left: title + info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold uppercase tracking-wider">
                  {replaceBrand(levelLabel)}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  {streamLabel}
                </span>
                {avgRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-200 text-[11px] font-bold">
                    ★ {avgRating.toFixed(1)} Rating
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {formatHeroCourseTitle(courseTitle)}
              </h1>
              <p className="text-amber-300 font-bold text-base sm:text-lg mt-0.5">Admission 2026</p>

              <p className="text-sm text-white/65 leading-relaxed mt-3 max-w-2xl line-clamp-3">
                {heroDescription}
              </p>

              {/* Key stat chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: "Duration", value: pickFirstText(course?.duration) || "N/A" },
                  { label: "Avg Fees", value: formatFeeLabel(course?.avg_fees ?? course?.fees) },
                  { label: "Colleges", value: totalColleges > 0 ? `${totalColleges}+` : "N/A" },
                  { label: "Mode", value: pickFirstText(course?.mode, course?.study_mode) || "N/A" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/8 border border-white/12 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">{s.label}</p>
                    <p className="text-sm font-bold text-white mt-0.5 truncate">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: snapshot card */}
            <div className="w-full lg:w-[280px] flex-shrink-0">
              <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur p-5 shadow-xl">
                <p className="text-[10px] text-white/45 uppercase tracking-widest font-bold mb-3">Course Snapshot</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Eligibility", value: eligibilityText },
                    { label: "Main Exams", value: acceptedExams },
                    { label: "StudyCups Offer", value: studyCupsOffer },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-start gap-2 border-b border-white/8 pb-2 last:border-0 last:pb-0">
                      <span className="text-[11px] text-white/50 flex-shrink-0">{item.label}</span>
                      <span className="text-[11px] font-semibold text-white text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={onOpenApplyNow}
                  className="mt-4 w-full bg-white text-[#1E4A7A] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition"
                >
                  Apply Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STICKY TAB BAR ===== */}
      <div className="sticky top-[70px] z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto no-scrollbar">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-[3px] px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "border-[#1E4A7A] text-[#1E4A7A]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2 space-y-6">
            {activeTab === "Top Colleges" ? (
              <section className="bg-white border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold text-blue-900">
                  Colleges Offering This Course
                </h2>

                {collegesOffering.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {collegesOffering.map((college: any) => {
                      const collegeId = String(college?.id ?? "");
                      const collegeType = getCollegeTypeLabel(college);
                      const annualFee = formatCollegeFeeLabel(
                        Number(college?.feesRange?.min ?? course?.avg_fees ?? course?.fees ?? 0)
                      );
                      const ratingValue = Number(college?.rating ?? 0);
                      const catLikePercent = ratingValue > 0 ? `${Math.round(ratingValue * 20)}+` : "N/A";
                      const totalReviews = Number(college?.reviewCount ?? college?.reviews ?? 0);
                      const reviewsLabel =
                        Number.isFinite(totalReviews) && totalReviews > 0
                          ? totalReviews.toLocaleString("en-IN")
                          : "0";
                      const cardLabel = formatHeroCourseTitle(courseTitle) || streamLabel;
                      const collegeLogo =
                        college?.logo ||
                        college?.logoUrl ||
                        college?.image ||
                        college?.rawScraped?.logo ||
                        "/no-image.jpg";
                      const isCompared = comparedCollegeIds.includes(collegeId);

                      return (
                        <article
                          key={college.id}
                          className="overflow-hidden rounded-2xl border border-[#d8d2c5] bg-white"
                        >
                          <div className="border-l-4 border-[#148d99] p-4 md:p-5">
                            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                              <div>
                                <div className="flex items-start gap-4">
                                  <img
                                    src={collegeLogo}
                                    alt={college.name || "College"}
                                    className="h-14 w-14 rounded-xl border border-[#ddd5c8] bg-[#f4f1ea] object-contain p-2"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[#167f8b] md:text-sm">
                                      {cardLabel || "Courses Available"}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => navigate(getCollegeRoute(college))}
                                      className="mt-0.5 block text-left text-lg font-semibold leading-tight text-[#10233e] hover:underline md:text-[28px]"
                                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                                    >
                                      {college.name}
                                    </button>
                                    <p className="mt-1 text-sm text-slate-500">
                                      {college.location || "Location not available"}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-[#d7d1c5] text-center">
                                  <div className="border-r border-[#d7d1c5] py-2">
                                    <p className="font-serif text-[18px] leading-none text-[#10233e] md:text-[20px]">
                                      {annualFee}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">Annual Fee</p>
                                  </div>
                                  <div className="border-r border-[#d7d1c5] py-2">
                                    <p className="font-serif text-[18px] leading-none text-[#10233e] md:text-[20px]">
                                      {catLikePercent}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">CAT %ile</p>
                                  </div>
                                  <div className="py-2">
                                    <p className="font-serif text-[18px] leading-none text-[#10233e] md:text-[20px]">
                                      {reviewsLabel}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500">Total Reviews</p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-[#d8d2c5] bg-[#f6f2e9] px-3 py-1 text-xs text-[#10233e]">
                                    {ratingValue > 0 ? `${ratingValue.toFixed(1)} Rating` : "Rating N/A"}
                                  </span>
                                  {collegeType && (
                                    <span className="rounded-full border border-[#d8d2c5] bg-[#f6f2e9] px-3 py-1 text-xs text-[#10233e]">
                                      {collegeType}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 xl:min-w-[170px] xl:flex-col xl:justify-center">
                                <button
                                  type="button"
                                  onClick={onOpenApplyNow}
                                  className="rounded-xl bg-[#ee9b16] px-5 py-2.5 text-sm font-semibold text-[#10233e]"
                                >
                                  Get Guidance
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(getCollegeRoute(college))}
                                  className="inline-flex items-center justify-center rounded-xl bg-[#0f6f79] px-5 py-2.5 text-sm font-semibold text-white"
                                >
                                  Check Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleComparedCollege(collegeId)}
                                  className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold ${
                                    isCompared ? "bg-[#1e7d43] text-white" : "bg-[#132a4a] text-white"
                                  }`}
                                >
                                  {isCompared ? "Compared" : "Compare"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No colleges linked for this course yet.
                  </p>
                )}
              </section>
            ) : (
              <StructuredCourseContent
                title={
                  activeTab === "Overview"
                    ? `About ${formatCourseTitle(courseTitle)}`
                    : `${formatCourseTitle(courseTitle)} Syllabus`
                }
                data={currentContent}
                emptyMessage={
                  activeTab === "Overview"
                    ? "Course details are not available right now."
                    : "Syllabus details are not available right now."
                }
              />
            )}
          </main>

          <aside className="space-y-4 w-full">
            <div className="lg:sticky lg:top-[130px] space-y-4">

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-[#1E4A7A] to-[#0f2952] text-white rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span>🎓</span>
                  <h3 className="font-bold text-base">Free Counselling</h3>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-amber-300 text-xs">★★★★★</span>
                  <span className="text-white/55 text-xs">4.6/5 · 1,065 reviews</span>
                </div>
                <p className="text-xs text-white/65 mb-4">Expert counsellors — 100% Free</p>
                <button
                  onClick={onOpenApplyNow}
                  className="w-full bg-white text-[#1E4A7A] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition mb-2"
                >
                  Apply Now →
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:+918081269969"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-400 text-amber-900 font-bold text-xs hover:bg-amber-300 transition"
                  >
                    📞 Call Us
                  </a>
                  <a
                    href="https://wa.me/918081269969"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-500 transition"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>

              {/* Quick Facts */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-500">{quickFactsTitle} — Quick Facts</h4>
                <div className="space-y-2">
                  {courseQuickFacts.map((fact) => (
                    <div key={fact.label} className="flex justify-between items-start gap-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs text-slate-400 flex-shrink-0">{fact.label}</span>
                      <span className="text-xs font-semibold text-slate-800 text-right max-w-[55%]">{fact.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scholarships */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-widest text-slate-500">Scholarships</h4>
                <div className="space-y-2.5">
                  {[
                    { title: "StudyCups Partner Scholarship", value: "Up to ₹1,00,000 off" },
                    { title: "Merit-based (High CAT/JEE)", value: "10–50% tuition waiver" },
                    { title: "SBI / HDFC Education Loan", value: "Up to ₹40L @ 8.5% p.a." },
                    { title: "College Diversity Scholarships", value: "Varies by college" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs font-bold text-[#1E4A7A] mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
