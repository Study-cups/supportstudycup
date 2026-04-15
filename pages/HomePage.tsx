import React, { useState, useMemo, useEffect, useRef } from "react";
import type { View, College } from "../types";
import { PARTNER_LOGOS } from "../logos";
import CollegeCard from "../components/CollegeCard";
import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { buildCourseDetailPath, toCourseSlug } from "./Seo"
import { Helmet } from "react-helmet-async";
import SuccessCarousel from "@/LandingPage/components/SuccessCarousel";

import {

  BLOG_POSTS_DATA,
  TESTIMONIALS_DATA,
  COURSE_STREAMS,
} from "../constants";
import { useOnScreen } from "../hooks/useOnScreen";
import { useLocation } from "react-router-dom";
import { TESTIMONIALS } from "@/LandingPage/constants";




const toExamSlug = (exam: any) =>
  exam.name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") +
  (exam.year ? `-${exam.year}` : "");

const DUMMY_NEWS = [
  {
    id: 1,
    title: "RSB Chennai PGDM Admission 2026 Begins",
    excerpt:
      "RSB Chennai has opened applications for its flagship PGDM programme for the 2026 intake.",
    imageUrl:
      "https://images.unsplash.com/photo-1588072432836-e10032774350",
    date: "Dec 15, 2025",
    author: "StudyCups Editorial Team",
    category: "Admission News",
  },
  {
    id: 3,
    title: "IIM Visakhapatnam Admission 2026 Open",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
    date: "Dec 13, 2025",
  },
  {
    id: 4,
    title: "Top MBA Colleges Accepting CAT 2025 Scores",
    excerpt:
      "List of top MBA colleges in India accepting CAT 2025 scores.",
    imageUrl:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    date: "Dec 12, 2025",
    author: "StudyCups Experts",
    category: "Articles",
  },
  {
    id: 5,
    title: "How to Prepare for Board Exams Effectively",
    excerpt:
      "Proven strategies and study plans to score high in board exams.",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    date: "Dec 11, 2025",
    author: "StudyCups Editorial Team",
    category: "Articles",
  },
 

]; 

const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";

const loopingNews = [...DUMMY_NEWS, ...DUMMY_NEWS];

const PRIORITY_CITIES = [
 "Delhi NCR",
  "Bangalore",
  "Mumbai",
  "Chennai",
  "Pune",
  "Kolkata",
  "Hyderabad",
  "Ahmedabad",
  "Coimbatore",
  "Dehradun",
  "Lucknow"
];

const ADMISSION_TICKER_ITEMS = [
  { icon: "🩺", label: "MBBS Direct Admission Open" },
  { icon: "💻", label: "B.Tech Counselling Available" },
  { icon: "⚖️", label: "Law (LLB) 2026 Applications" },
  { icon: "🎓", label: "MBA Scholarship Up to Rs 1 Lakh" },
  { icon: "📍", label: "Offices in Kanpur, Lucknow, Delhi NCR" }
];


const useScroll = () => {
  const [scrollY, setScrollY] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrollY;
};





const FadeSection = ({ children, delay = 0 }) => {
  const [ref, visible] = useOnScreen<HTMLDivElement>({ threshold: 0.25 });
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`opacity-0 translate-y-10 transition-all duration-[1200ms]
                ${visible ? "opacity-100 translate-y-0" : ""}
            `}
    >
      {children}
    </div>
  );
};


interface HomePageProps {
  colleges: College[];
  exams: any[];
  blogs: any[];
  onOpenBrochure: () => void;
  onCompareToggle: (id: string) => void;
  compareList: string[];
  loading?: boolean;
}

const AnimatedContainer: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen<HTMLDivElement>({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={`opacity-0 ${isVisible ? "animate-fadeInUp" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};




const StreamTag: React.FC<{ stream: string }> = ({ stream }) => {
  const colors: { [key: string]: string } = {
    Engineering: "bg-[--primary-medium]/10 text-[--primary-dark]",
    Medical: "bg-green-100 text-green-800",
    Management: "bg-indigo-100 text-indigo-800",
    Law: "bg-yellow-100 text-yellow-800",
    "Civil Services": "bg-red-100 text-red-800",
  };
  const colorClass = colors[stream] || "bg-slate-100 text-slate-800";
  return (
    <div
      className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}
    >
      {stream}
    </div>
  );
};

const getCourseTextValue = (...values: unknown[]) =>
  values
    .find((value) => typeof value === "string" && value.trim().length > 0)
    ?.toString()
    .trim() || "";

const normalizeCourseKey = (value = "") =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

type HomeExploreLevel =
  | "Postgraduate"
  | "Undergraduate"
  | "Doctoral"
  | "Certificate";

const HOME_EXPLORE_LEVEL_ORDER: HomeExploreLevel[] = [
  "Postgraduate",
  "Undergraduate",
  "Doctoral",
  "Certificate",
];

const HOME_FACET_PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "not available",
  "not applicable",
  "nil",
  "none",
  "null",
  "undefined",
]);

const HOME_MONEY_LIKE_PATTERN =
  /(?:\u20B9|\binr\b|\brs\.?\b|\brupees?\b)|(?:\b\d{1,3}(?:,\d{2,3}){1,}(?:\.\d+)?\b)|(?:\b\d+(?:\.\d+)?\s*(?:lpa|lakh|lakhs|lac|crore|crores|cr|million|mn|thousand|k)\b)/i;

const isNoiseHomeFacetValue = (value = "") => {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  if (!normalized || HOME_FACET_PLACEHOLDER_VALUES.has(normalized)) {
    return true;
  }

  return HOME_MONEY_LIKE_PATTERN.test(value);
};

const normalizeHomeLevelKey = (value = "") =>
  value.toLowerCase().replace(/[^a-z]/g, "");

const isDoctoralCourseValue = (value = "") => {
  const normalized = normalizeHomeLevelKey(value);
  return [
    "doctoral",
    "doctorate",
    "phd",
    "postdoctoral",
    "postdoctorate",
    "dphil",
    "mphil",
  ].some((keyword) => normalized.includes(keyword));
};

const isPostgraduateCourseValue = (value = "") => {
  const normalized = normalizeHomeLevelKey(value);
  return [
    "postgraduate",
    "postgraduation",
    "pg",
    "master",
    "masters",
    "mba",
    "pgdm",
    "mtech",
    "msc",
    "mcom",
    "ma",
    "mca",
    "llm",
  ].some((keyword) => normalized.includes(keyword));
};

const isUndergraduateCourseValue = (value = "") => {
  const normalized = normalizeHomeLevelKey(value);
  return [
    "undergraduate",
    "undergraduation",
    "ug",
    "bachelor",
    "btech",
    "be",
    "bba",
    "bcom",
    "ba",
    "bsc",
    "bca",
    "mbbs",
    "bds",
    "llb",
  ].some((keyword) => normalized.includes(keyword));
};

const isCertificateCourseValue = (value = "") => {
  const normalized = normalizeHomeLevelKey(value);
  return [
    "certificate",
    "certification",
    "certified",
    "diploma",
    "cert",
  ].some((keyword) => normalized.includes(keyword));
};

const normalizeHomeCourseLevel = (value = ""): HomeExploreLevel | null => {
  if (isNoiseHomeFacetValue(value)) return null;
  if (isDoctoralCourseValue(value)) return "Doctoral";
  if (isPostgraduateCourseValue(value)) return "Postgraduate";
  if (isUndergraduateCourseValue(value)) return "Undergraduate";
  if (isCertificateCourseValue(value)) return "Certificate";
  return null;
};

const inferCourseLevel = (course: any, courseName = "") => {
  const explicitLevel = normalizeHomeCourseLevel(
    getCourseTextValue(course?.level, course?.course_level)
  );
  if (explicitLevel) return explicitLevel;

  return normalizeHomeCourseLevel(courseName) || "General";
};

const getCourseTypeValue = (course: any) =>
  getCourseTextValue(course?.mode, course?.study_mode, course?.type) || "Full Time";

const formatCourseFeeValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const lakhs = Math.round((value / 100000) * 100) / 100;
    return `INR ${lakhs} L`;
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .replace(/â‚¹|Ã¢â€šÂ¹/g, "INR ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return "N/A";
};

const preferValue = (currentValue: string, nextValue: string, fallback = "N/A") => {
  if (!currentValue || currentValue === fallback) return nextValue || fallback;
  return currentValue;
};

const extractCourses = (colleges = []) => {
  const map = new Map<string, any>();

  (Array.isArray(colleges) ? colleges : []).forEach(col => {
    const courseArray = col?.rawScraped?.courses;
    if (!Array.isArray(courseArray)) return;

    courseArray.forEach(c => {
      // skip sub-courses
      if (
        c.isSubCourse === true ||
        c.parentCourse ||
        c.parent_course ||
        c.is_sub_course ||
        c.subCourse === true ||
        c.parentId ||
        c.parent_id ||
        c.belongsTo ||
        c.belongs_to
      ) {
        return;
      }

      const courseName = getCourseTextValue(c?.name, c?.course_name);
      const key = normalizeCourseKey(courseName);
      if (!key) return;

      const normalizedCourse = {
        id: c?.id ?? key,
        name: courseName,
        type: getCourseTypeValue(c),
        level: inferCourseLevel(c, courseName),
        duration: getCourseTextValue(c?.duration, c?.course_duration) || "NA",
        fees: formatCourseFeeValue(c?.fees ?? c?.avg_fees ?? c?.total_fees),
        courseKey: key,
        colleges: [col.id],
        courseIds: c?.id ? [c.id] : [],
      };

      if (!map.has(key)) {
        map.set(key, normalizedCourse);
      } else {
        const entry = map.get(key);
        if (!entry.colleges.includes(col.id)) {
          entry.colleges.push(col.id);
          if (c?.id) entry.courseIds.push(c.id);
        }

        entry.type = preferValue(entry.type, normalizedCourse.type, "Full Time");
        entry.level = preferValue(entry.level, normalizedCourse.level, "General");
        entry.duration = preferValue(entry.duration, normalizedCourse.duration, "NA");
        entry.fees = preferValue(entry.fees, normalizedCourse.fees, "N/A");
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    const collegeGap = (b?.colleges?.length || 0) - (a?.colleges?.length || 0);
    if (collegeGap !== 0) return collegeGap;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
};

const normalizeExploreCourse = (course: any) => {
  const courseName = getCourseTextValue(course?.course_name, course?.name);
  const totalColleges = Number(course?.totalColleges ?? course?.total_college_count ?? 0);

  return {
    id: course?.id ?? course?.slug ?? normalizeCourseKey(courseName),
    name: courseName,
    type: getCourseTypeValue(course),
    level: inferCourseLevel(course, courseName),
    duration: getCourseTextValue(course?.duration, course?.course_duration) || "NA",
    fees: formatCourseFeeValue(course?.avg_fees ?? course?.fees ?? course?.total_fees),
    courseKey: normalizeCourseKey(courseName),
    colleges: Array.from({ length: Math.max(totalColleges, 0) }),
    collegeCount: totalColleges,
    slug: course?.slug || "",
  };
};

// src/constants/regionMap.ts
const REGION_MAP = {
  "Delhi NCR": {
    cities: [
      "Delhi",
      "New Delhi",
      "Noida",
      "Greater Noida",
      "Gurgaon",
      "Faridabad",
      "Ghaziabad",
      "Alpha Greater Noida",
      "Dwarka",
      "Rohini",
      "Patel Nagar",
      "Jamia Nagar"
    ]
  }
};



const toBlogSlug = (blog: any) =>
  blog.title
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const HomePage: React.FC<HomePageProps> = ({
  colleges,
  exams,
  blogs,
  onOpenBrochure,
  onCompareToggle,
  compareList,
}) => {
  useEffect(() => {

  }, [colleges, exams]);

  const navigate = useNavigate();
  const logoScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    const checkCenter = () => {
      const container = logoScrollRef.current;
      if (container) {
        const parent = container.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const centerX = parentRect.left + parentRect.width / 2;
          const imgs = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
          let closest: HTMLImageElement | null = null;
          let minDist = Infinity;
          imgs.forEach((img) => {
            const rect = img.getBoundingClientRect();
            const dist = Math.abs(rect.left + rect.width / 2 - centerX);
            if (dist < minDist) { minDist = dist; closest = img; }
          });
          imgs.forEach((img) => {
            img.style.transform = img === closest ? "scale(1.5)" : "scale(1)";
            img.style.transition = "transform 0.3s ease";
            img.style.filter = img === closest ? "drop-shadow(0 4px 12px rgba(0,0,0,0.18))" : "none";
          });
        }
      }
      rafId = requestAnimationFrame(checkCenter);
    };
    rafId = requestAnimationFrame(checkCenter);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [heroCollege, setHeroCollege] = useState("");
const [heroCity, setHeroCity] = useState("");


  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroFilters, setHeroFilters] = useState({
    college: "",
    city: "",
    course: "",
  });

  useEffect(() => {}, []);


  const [query, setQuery] = useState("");
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const [error, setError] = useState("");
  // STREAM FILTER FOR EXPLORE COURSES
  const [exploreLevel, setExploreLevel] = useState("All");
  const [exploreCourses, setExploreCourses] = useState<any[]>([]);
  // UNIQUE STREAMS FROM COURSES
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"apply" | "brochure">("apply");

const location = useLocation();
const selectedRegion = location.state?.region || null;

  const collegeMatchesStream = (college: any, selectedStream: string) => {
    if (!selectedStream || selectedStream === "All Streams") return true;

    const stream = college?.stream; // ✅ TOP LEVEL

    if (!stream) return false;

    if (Array.isArray(stream)) {
      return stream.some(
        s =>
          s.toLowerCase().trim() ===
          selectedStream.toLowerCase().trim()
      );
    }

    return (
      typeof stream === "string" &&
      stream.toLowerCase().trim() ===
      selectedStream.toLowerCase().trim()
    );
  };

  

  const extractCityState = (location?: string) => {
    if (!location || typeof location !== "string") return null;

    const parts = location.split(",").map(p => p.trim());

    return {
      city: parts[0],
      state: parts[1] || null,
    };
  }; 
  const normalize = (s = "") =>
  s.toLowerCase().replace(/\s+/g, "").replace(/\./g, "");
  const resolveRegion = (city?: string) => {
  if (!city) return null;

  const cityKey = normalize(city);

  for (const region in REGION_MAP) {
    const cities = REGION_MAP[region].cities;
    if (cities.some(c => normalize(c) === cityKey)) {
      return region;
    }
  }

  return null;
}; 

const filterByRegion = (college, region) => {
  if (!region) return true;

  const config = REGION_MAP[region];
  if (!config) return true;

  const location = normalize(college.location);

  return config.cities.some(city =>
    location.includes(normalize(city))
  );
};

const regionList = useMemo(() => {
  const set = new Set<string>();

  (Array.isArray(colleges) ? colleges : []).forEach(college => {
    const parsed = extractCityState(college?.location);
    if (!parsed?.city) return;

    const region = resolveRegion(parsed.city);
    if (region) set.add(region);
  });

  return Array.from(set);
}, [colleges]);



  const streamFilters = [
    "BE/B.Tech",
    "MBA/PGDM",
    "MBBS",
    "ME/M.Tech",
    "B.Sc",
    "BA",
    "B.Com",
    "BBA/BMS",
    "B.Sc (Nursing)",
    "Law",
  ];


  const cityStateList = useMemo(() => {
    const map = new Map<string, { city: string; state: string | null }>();

    (Array.isArray(colleges) ? colleges : []).forEach(college => {
      const parsed = extractCityState(college?.location);
      if (!parsed) return;

      const key = parsed.city.toLowerCase();
      if (!map.has(key)) {
        map.set(key, parsed);
      }
    });

    return Array.from(map.values());
  }, [colleges]);
   
  const stateList = useMemo(() => {
  const set = new Set<string>();

  cityStateList.forEach(item => {
    if (item.state) {
      set.add(item.state.trim());
    }
  });

  return Array.from(set);
}, [cityStateList]);
useEffect(() => {
  setFilteredStates(stateList);
}, [stateList]);


  const [selectedtopcollge, setSelectedtopcollge] = useState("");
  const [selectedExamFilter, setSelectedExamFilter] = useState("All");
 const [filteredStates, setFilteredStates] = useState<string[]>([]);



  const cityRefs = useMemo(() => {
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {};
    cityStateList.forEach(c => {
      refs[c.city] = React.createRef();
    });
    return refs;
  }, [cityStateList]);

  const fallbackCourses = useMemo(() => {
    if (!Array.isArray(colleges) || colleges.length === 0) return [];
    return extractCourses(colleges);
  }, [colleges]);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/main-course-card?page=1&limit=60`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load main course cards");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;

        const normalized = Array.isArray(json?.data)
          ? json.data.map((course: any) => normalizeExploreCourse(course))
          : [];

        if (normalized.length > 0) {
          setExploreCourses(normalized);
        } else {
          setExploreCourses(fallbackCourses);
        }
      })
      .catch((err) => {
        console.error("Home explore courses API error", err);
        if (!cancelled) {
          setExploreCourses(fallbackCourses);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackCourses]);

  const courses = exploreCourses.length > 0 ? exploreCourses : fallbackCourses;

   
  const normalizeName = (s = "") =>
  s.toLowerCase().replace(/\s+/g, "").replace(/\./g, "");;

const orderStatesLikeCollegeApply = (states: string[]) => {
  const map = new Map(
    states.map(s => [normalizeName(s), s])
  );

  const priority: string[] = [];
  const others: string[] = [];

  // 1️⃣ priority order preserve karo
  PRIORITY_CITIES.forEach(p => {
    const key = normalizeName(p);
    if (map.has(key)) {
      priority.push(map.get(key)!);
      map.delete(key);
    }
  });

  // 2️⃣ baaki A–Z
  others.push(...Array.from(map.values()).sort((a, b) => a.localeCompare(b)));

  return [...priority, ...others];
};

  const CITY_ICONS = [
    "/icons/gate-of-india.png",
    "/icons/bangalore.png",
    "/icons/red-fort_3806647.png",
    "/icons/arch_2189457.png",
    "/icons/temple_6482997.png",
    "/icons/temple_510019.png",
    "/icons/university.png",
    "/icons/lighthouse_8162871.png",
  ];

const CITY_ICON_MAP: Record<string, string> = {
  "Delhi NCR": "/icons/gate.png",
  "Bangalore": "/icons/bangalore.png",
  "Mumbai": "/icons/gate-of-india.png",
  "Pune": "/icons/pune.png",
  "Hyderabad": "/icons/hyderabad-charminar.png",
  "Chennai": "/icons/monument (1).png",
  "Kolkata": "/icons/monument.png",
  "Ahmedabad": "/icons/landmark.png",
  "Coimbatore": "/icons/temple_510019.png",
  "Dehradun": "/icons/temple_6482997.png",
  "Lucknow": "/icons/red-fort_3806647.png",
};

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeroFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    navigate("/colleges", {
      state: heroFilters,
    });
  };
  
  function orderCities(cities) {
  const priority = [];
  const others = [];

  cities.forEach(city => {
    if (PRIORITY_CITIES.includes(city.name)) {
      priority.push(city);
    } else {
      others.push(city);
    }
  });

  // Optional: baaki cities A–Z
  others.sort((a, b) => a.name.localeCompare(b.name));

  return [...priority, ...others];
}

 const orderedStates = useMemo(
  () => orderStatesLikeCollegeApply(filteredStates),
  [filteredStates]
);

  const handleCitySearch = () => {
  const value = normalize(query.trim());

  // EMPTY → ALL STES
  if (!value) {
    setFilteredStates(stateList);
    setError("");
    return;
  }

  // STATE MATCH
  const matchedStates = stateList.filter(state =>
    normalize(state).includes(value)
  );

  // CITY MATCH → STATE nikaalo
  const cityMatchedStates = cityStateList
    .filter(c => normalize(c.city).includes(value))
    .map(c => c.state)
    .filter(Boolean) as string[];

  const finalStates = Array.from(
    new Set([...matchedStates, ...cityMatchedStates])
  );

  if (finalStates.length === 0) {
    setError("No state found");
    return;
  }

  setFilteredStates(finalStates);
  setError("");
};




  const dynamicStreams = useMemo(() => {
    const set = new Set<string>();

    (Array.isArray(colleges) ? colleges : []).forEach(college => {
      const stream = college?.stream; // ✅ FIX

      if (Array.isArray(stream)) {
        stream.forEach(s => {
          if (typeof s === "string" && s.trim()) set.add(s.trim());
        });
      } else if (typeof stream === "string" && stream.trim()) {
        set.add(stream.trim());
      }
    });

    return Array.from(set).sort();
  }, [colleges]);



const filteredColleges = useMemo(() => {
  if (!Array.isArray(colleges)) return [];

  const filtered = colleges.filter(college => {
    const streamOk = collegeMatchesStream(
      college,
      selectedStream || "All Streams"
    );

    const regionOk = filterByRegion(college, selectedRegion);

    return streamOk && regionOk;
  });

  return filtered.slice(0, 8);
}, [colleges, selectedStream, selectedRegion]);


  const whyChooseUsFeatures = [
    {
      id: "ai",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-[--primary-medium]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: "AI Guidance",
      subtitle: "Personalized recommendations",
    },
    {
      id: "verified",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-[--primary-medium]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Verified Data",
      subtitle: "Authentic information",
    },
    {
      id: "easy-app",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-[--accent-green]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      ),
      title: "Easy Applications",
      subtitle: "Simplified process",
    },
    {
      id: "trusted",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-[--primary-medium]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 11c.5304 0 1.0391-.2107 1.4142-.5858C13.7893 10.0391 14 9.5304 14 9s-.2107-1.0391-.5858-1.4142C13.0391 7.2107 12.5304 7 12 7s-1.0391.2107-1.4142.5858C10.2107 7.9609 10 8.4696 10 9s.2107 1.0391.5858 1.4142C10.9609 10.7893 11.4696 11 12 11z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 22C7.03 22 3 17.97 3 13c0-3.91 2.51-7.24 6-8.48M21 13c0 4.97-4.03 9-9 9"
          />
        </svg>
      ),
      title: "Trusted Platform",
      subtitle: "Secure and reliable",
    },
  ];

  const courseCategories = [
    {
      name: "Engineering",
      description: "Innovate the future with cutting-edge technology.",
      color: "bg-[#1f5fd6]",
      courseCount: COURSE_STREAMS["Engineering"].length,
      iconPath: "/icons/technology.png",

    },
    {
      name: "Management",
      description: "Lead organizations and shape the business world.",
      color: "bg-[#1ea35a]",
      courseCount: COURSE_STREAMS["Management"].length,
      iconPath: "/icons/project-management.png",

    },
    {
      name: "Medical",
      description: "Embark on a journey to heal and care for others.",
      color: "bg-[#f59e0b]",
      courseCount: COURSE_STREAMS["Medical"].length,
      iconPath: "/icons/medical-symbol (1).png",
    },
    {
      name: "Commerce",
      description: "Build strong foundations in finance and trade.",
      color: "bg-[#8b5cf6]",
      courseCount: COURSE_STREAMS["Commerce"]?.length || 90,
      iconPath: "/icons/smart-shopping.png"
      ,
    },
    {
      name: "Arts",
      description: "Explore creativity and the humanities.",
      color: "bg-[#f97316]",
      courseCount: COURSE_STREAMS["Arts & Science"]?.length || 95,
      iconPath:
        "/icons/inspiration.png",
    },
  ];

  const faqs = [
    {
      question: "Is StudyCups counselling free?",
      answer:
        "Yes! Your initial 30-minute profile assessment call is completely free. Our counsellor will review your profile and give honest, personalised guidance at no charge. Paid service packages are available for full application support.",
    },
    {
      question: "Can I get a good MBA with a low CAT score?",
      answer:
        "Absolutely. Many excellent MBA and PGDM colleges in India accept students with 50-70 percentile scores. StudyCups specialises in helping students across all score ranges find the right college with strong placements and a reputable degree.",
    },
    {
      question: "Does StudyCups help with MBBS admissions in India?",
      answer:
        "Yes. We provide guidance for NEET-based counselling, management quota, and direct admission routes at medical colleges across India. Our counsellors are experienced in both government and private medical college admissions.",
    },
    {
      question: "What is the StudyCups MBA Scholarship?",
      answer:
        "StudyCups offers a scholarship of up to Rs 1 lakh per student for MBA admissions in the 2024-26 batch, based on financial need. The scholarship covers tuition fees and books. You can apply through our website at studycups.in/mba-scholarship/",
    },
    {
      question: "Where are StudyCups offices located?",
      answer:
        "We have two offices: our Corporate Office in Lajpat Nagar-1, New Delhi, and our Registered Office at Room No. 219, Kalpana Plaza, Birhana Road, Kanpur (208001), Uttar Pradesh. You can also reach us at 0512-4061386 or 8081269969.",
    },
    {
      question: "How is StudyCups different from Shiksha or Collegedunia?",
      answer:
        "Portals like Shiksha and Collegedunia provide information. StudyCups is a hands-on consulting service. We assign a dedicated counselor, write your SOP, prepare you for interviews, manage your applications, and stay with you until you receive your admission letter.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const blogCategoryColors: { [key: string]: string } = {
    Rankings: "bg-blue-100 text-blue-800",
    "Exam Prep": "bg-orange-100 text-orange-800",
    "Career Advice": "bg-green-100 text-green-800",
  };

  const rankingColleges = [
    {
      id: 1,
      stream: "MBA/PGDM",
      name: "IIMA - Indian Institute of Management",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/IIM%2C_Ahmedabad_Logo.svg/1200px-IIM%2C_Ahmedabad_Logo.svg.png",
      city: "Ahmedabad",
      state: "Gujarat",
      rating: "5/5",
      rankingText: "#2 out of 50 in India 2019",
      cutoffText: "CAT 2024 Cut off 99",
      deadline: "7 July - 08 Sept 2025",
      fees: "₹35,35,000",
    },
    {
      id: 2,
      stream: "BE/B.Tech",
      name: "IIT Bombay - Indian Institute of Technology [IITB]",
      logoUrl: "https://www.som.iitb.ac.in/epm/images/banner.jpg",
      city: "Mumbai",
      state: "Maharashtra",
      rating: "5/5",
      rankingText: "#2 out of 50 in India 2025",
      cutoffText: "JEE-Advanced 2025 Cut off 66",
      deadline: "1 Oct - 05 Nov 2025",
      fees: "₹52,500",
    },
    {
      id: 3,
      stream: "MBBS",
      name: "AIIMS - All India Institute of Medical Sciences",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/All_India_Institute_of_Medical_Sciences%2C_Delhi.svg/1075px-All_India_Institute_of_Medical_Sciences%2C_Delhi.svg.png",
      city: "New Delhi",
      state: "Delhi NCR",
      rating: "4.9/5",
      rankingText: "#8 out of 200 in India 2025",
      cutoffText: "NEET 2025 Cut off 48",
      deadline: "8 Apr - 07 May 2025",
      fees: "₹1,145",
    },
    {
      id: 4,
      stream: "Law",
      name: "National Law School of India University - [NLSIU]",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/6/6d/National_Law_Institute_University_Logo.png",
      city: "Bangalore",
      state: "Karnataka",
      rating: "4.9/5",
      rankingText: "-",
      cutoffText: "CLAT 2025 Cut off 112",
      deadline: "15 Nov - 23 Mar 2026",
      fees: "₹5,00,000",
    },
    {
      id: 5,
      stream: "MBBS",
      name: "Vardhman Mahavir Medical College - [VMMC]",
      logoUrl: "https://neetsupport.com/content/images/2025/01/Vardhman-Mahavir-Medical-College--New-Delhi.webp",
      city: "New Delhi",
      state: "Delhi NCR",
      rating: "4.9/5",
      rankingText: "-",
      cutoffText: "NEET 2025 Cut off 132",
      deadline: "1 Feb - 15 May 2024",
      fees: "₹57,000",
    },
    {
      id: 6,
      stream: "BE/B.Tech",
      name: "IIT Delhi - Indian Institute of Technology [IITD]",
      logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYSMRrwORnDdusOT7bJ3S7WS04C3bPzEGS1Q&s",
      city: "New Delhi",
      state: "Delhi NCR",
      rating: "4.9/5",
      rankingText: "#3 out of 50 in India 2025",
      cutoffText: "JEE-Advanced 2025 Cut off 355",
      deadline: "1 Oct - 05 Nov 2025",
      fees: "₹2,27,750",
    },
    {
      id: 7,
      stream: "MBA/PGDM",
      name: "IIMC - Indian Institute of Management",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/IIM_Calcutta_Logo.svg/1200px-IIM_Calcutta_Logo.svg.png",
      city: "Kolkata",
      state: "West Bengal",
      rating: "4.9/5",
      rankingText: "#99 out of 200 in India 2023",
      cutoffText: "CAT 2024 Cut off 99",
      deadline: "16 Oct - 26 Nov 2025",
      fees: "₹13,50,000",
    },
    {
      id: 8,
      stream: "BA",
      name: "Hindu College",
      logoUrl: "https://we-recycle.org/wp-content/uploads/2014/03/hindu-college.png",
      city: "New Delhi",
      state: "Delhi NCR",
      rating: "4.9/5",
      rankingText: "#1 out of 300 in India 2025",
      cutoffText: "CUET 2025 Cut off 448",
      deadline: "17 June - 10 Aug 2025",
      fees: "₹28,670",
    },
    {
      id: 9,
      stream: "B.Com",
      name: "Shri Ram College of Commerce - [SRCC]",
      logoUrl: "https://srcce.org/public/uploads/logo/1704695206.png",
      city: "New Delhi",
      state: "Delhi NCR",
      rating: "4.9/5",
      rankingText: "#18 out of 300 in India 2025",
      cutoffText: "CUET 2025 Cut off 910",
      deadline: "17 June - 10 Aug 2025",
      fees: "₹32,420",
    },
    {
      id: 10,
      stream: "B.Sc",
      name: "Institute of Hotel Management [IHM], Pusa",
      logoUrl: "https://www.govtjobsblog.in/wp-content/uploads/2023/03/IHM-Pusa.png",
      city: "New Delhi",
      state: "Delhi NCR",
      rating: "4.9/5",
      rankingText: "-",
      cutoffText: "NCHMCT-JEE 2025 Cut off 180",
      deadline: "16 Dec - 15 Mar 2026",
      fees: "₹1,76,515",
    },
  ];

  const displayedColleges =
    selectedtopcollge === "All" || selectedtopcollge === ""
      ? rankingColleges
      : rankingColleges.filter((c) => c.stream === selectedtopcollge);




  const bgImages = [
    "https://res.cloudinary.com/alishakhan987/image/upload/v1765219557/Gemini_Generated_Image_3xjtay3xjtay3xjt-Photoroom_nx9j6s.png",
    "https://res.cloudinary.com/alishakhan987/image/upload/v1765219972/Gemini_Generated_Image_mnbzv6mnbzv6mnbz_1_-Photoroom_f5zilz.png"
  ];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % bgImages.length);
    }, 4000); // every 4 seconds switch

    return () => clearInterval(interval);
  }, []);


  const filteredExams =
    selectedExamFilter === "All"
      ? exams
      : exams.filter((exam) => exam.stream === selectedExamFilter);



  // FILTERED COURSES
  const exploreLevels = useMemo(() => {
    const availableLevels = HOME_EXPLORE_LEVEL_ORDER.filter((level) =>
      courses.some((course) => course.level === level)
    );

    return ["All", ...availableLevels];
  }, [courses]);

  useEffect(() => {
    if (exploreLevel !== "All" && !exploreLevels.includes(exploreLevel)) {
      setExploreLevel("All");
    }
  }, [exploreLevel, exploreLevels]);

const HOME_REGIONS = [
  "Delhi NCR",
  "Uttar Pradesh",
  "Rajasthan",
  "Punjab",
  "Uttarakhand",
  "Himachal Pradesh",
  "Odisha"
]; 

const HOME_CITIES = [
  "Delhi NCR",
  "Bangalore",
  "Mumbai",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Coimbatore",
  "Dehradun",
  "Lucknow"
]; 

const visibleRegions = HOME_CITIES;
 const FireIcon = () => (
  <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.638 5.214 8.251 8.251 0 005.25 9.75c0 2.983 1.64 5.663 4.116 7.09 2.476-1.427 4.116-4.107 4.116-7.09a8.251 8.251 0 00-1.388-4.536z"
    />
  </svg>
);

const EngineeringIcon = () => (
  <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v9.5A2.25 2.25 0 0118.75 17H5.25A2.25 2.25 0 013 14.75v-9.5z"
    />
  </svg>
);

const MedicalIcon = () => (
  <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  </svg>
);

const AbroadIcon = () => (
  <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </svg>
); 

/* ── Typewriter component ── */
const TypewriterWord: React.FC<{ words: string[] }> = ({ words }) => {
  const [display, setDisplay] = React.useState("");
  const [wordIdx, setWordIdx] = React.useState(0);
  const [charIdx, setCharIdx] = React.useState(0);
  const [deleting, setDeleting] = React.useState(false);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 1600);
      return () => clearTimeout(t);
    }
    const current = words[wordIdx];
    if (!deleting) {
      if (charIdx < current.length) {
        const t = setTimeout(() => {
          setDisplay(current.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        }, 80);
        return () => clearTimeout(t);
      } else {
        setPaused(true);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplay(current.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        }, 45);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setWordIdx(i => (i + 1) % words.length);
      }
    }
  }, [charIdx, deleting, paused, wordIdx, words]);

  /* colour per word */
  const colours = ["#fbbf24", "#34d399", "#f97316"];
  const colour = colours[wordIdx % colours.length];

  return (
    <span className="inline-flex items-baseline gap-[2px]" style={{ color: colour, textShadow: `0 0 30px ${colour}55` }}>
      {display}
      <span className="tw-cursor inline-block w-[3px] h-[1em] rounded-sm ml-0.5 align-middle"
        style={{ background: colour, marginBottom: "2px" }} />
    </span>
  );
};

const HERO_COLLEGES = [
  {
    name: "Doon University",
    logo: "https://ik.imagekit.io/syustaging/SYU_PREPROD/LOGO_EgOOMezRU.webp?tr=w-3840",
  },
  {
    name: "Mangalmay University",
    logo: "https://www.mangalmay.org/image/authormangalmay.png",
  },
  {
    name: "Karnavati University",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxrg1rlu8f1cIH6rCoH9QIdLl5kgT2SZPf3A&s",
  },
  
];

const HERO_HUMAN_IMAGE =
  "/icons/Student_img.png"; 
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

const HERO_TAGS = [
  {
    label: "Top MBA",
    stream: "Management",
    Icon: FireIcon,
  },
  {
    label: "Engineering",
    stream: "Engineering",
    Icon: EngineeringIcon,
  },
  {
    label: "Medical",
    stream: "Medical",
    Icon: MedicalIcon,
  },
  {
    label: "Study Abroad",
    stream: "Study Abroad",
    Icon: AbroadIcon,
  },
];

  return (

    <div > 
      <Helmet>
        <title>StudyCups – Best Colleges in India 2026 | Fees, Rankings, Admissions</title>
        <meta name="description" content="Find the best colleges in India 2026. Compare top MBA, B.Tech, MBBS, BCA, BBA colleges by fees, rankings, placements and admissions across Delhi, Mumbai, Bangalore, Chennai, Hyderabad and more." />
        <meta name="keywords" content="best colleges in India, top colleges 2026, MBA colleges, BTech colleges, MBBS colleges, best college in Delhi, best college in Mumbai, best college in Bangalore, top engineering colleges, top management colleges, college admission 2026, StudyCups" />
        <link rel="canonical" href="https://studycups.in/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content="StudyCups – Best Colleges in India 2026 | Fees, Rankings, Admissions" />
        <meta property="og:description" content="Find and compare the best colleges in India 2026. MBA, B.Tech, MBBS and more. Expert guidance, real rankings, latest fees." />
        <meta property="og:url" content="https://studycups.in/" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="StudyCups – Best Colleges in India 2026 | Fees, Rankings, Admissions" />
        <meta name="twitter:description" content="Find and compare the best colleges in India 2026. MBA, B.Tech, MBBS and more." />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />

        {/* JSON-LD: WebSite + Organization */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://studycups.in/#website",
              "url": "https://studycups.in/",
              "name": "StudyCups",
              "description": "India's trusted college comparison and admission guidance portal",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://studycups.in/colleges?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "Organization",
              "@id": "https://studycups.in/#organization",
              "name": "StudyCups",
              "url": "https://studycups.in/",
              "logo": "https://studycups.in/logos/StudyCups.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-8081269969",
                "contactType": "customer service",
                "areaServed": "IN",
                "availableLanguage": ["English", "Hindi"]
              },
              "sameAs": [
                "https://www.instagram.com/studycups/",
                "https://www.facebook.com/studycups/"
              ]
            }
          ]
        })}</script>
      </Helmet>
<style>{`
  @keyframes typewriter-cursor {
    0%,100% { opacity:1; } 50% { opacity:0; }
  }
  .tw-cursor { animation: typewriter-cursor 0.75s step-end infinite; }

  @keyframes hero-float {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .hero-float { animation: hero-float 4s ease-in-out infinite; }

  @keyframes badge-pop {
    0% { transform: scale(0.85); opacity:0; }
    100% { transform: scale(1); opacity:1; }
  }
  .badge-pop { animation: badge-pop 0.5s cubic-bezier(.34,1.56,.64,1) forwards; }

  @keyframes shimmer-bg {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #fff 0%, #fde68a 40%, #f97316 60%, #fff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer-bg 3s linear infinite;
  }

  @keyframes ping-slow {
    0%,100% { transform:scale(1); opacity:.7; }
    50% { transform:scale(1.15); opacity:1; }
  }
  .ping-slow { animation: ping-slow 2s ease-in-out infinite; }

  .hero-saffron-btn:hover { box-shadow: 0 8px 30px rgba(249,115,22,0.55); transform: translateY(-1px); }
  .hero-saffron-btn { transition: all 0.2s ease; }
`}</style>

<section className="relative w-full overflow-hidden" style={{
  background: "linear-gradient(135deg, #03081a 0%, #071230 35%, #0d1f4a 65%, #0a1628 100%)",
  minHeight: "620px"
}}>
  {/* ─── decorative dot grid ─── */}
  <div className="absolute inset-0 opacity-[0.035]" style={{
    backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
    backgroundSize: "28px 28px"
  }} />

  {/* ─── saffron glow top-left ─── */}
  <div className="absolute top-[-80px] left-[-60px] w-[420px] h-[420px] rounded-full pointer-events-none"
    style={{ background: "radial-gradient(circle, rgba(251,146,60,0.18) 0%, transparent 70%)" }} />

  {/* ─── blue glow bottom-right ─── */}
  <div className="absolute bottom-[-60px] right-[5%] w-[380px] h-[380px] rounded-full pointer-events-none"
    style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)" }} />

  {/* ─── green accent dot ─── */}
  <div className="absolute top-[18%] right-[38%] w-2 h-2 rounded-full bg-emerald-400 ping-slow hidden md:block" />
  <div className="absolute top-[55%] left-[42%] w-1.5 h-1.5 rounded-full bg-amber-300 ping-slow hidden md:block" style={{animationDelay:"1s"}} />

  {/* ─── right side: student image + floating cards ─── */}
  <div className="absolute right-0 top-0 h-full w-[50%] hidden md:block pointer-events-none z-[2]">
    {/* image frame */}
    <div className="absolute right-8 bottom-0 w-[380px] h-[520px]">
      {/* soft glow behind image */}
      <div className="absolute inset-0 rounded-[40px]"
        style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.22) 0%, transparent 70%)" }} />
      <img
        src={HERO_HUMAN_IMAGE}
        alt="Indian students celebrating admission"
        className="relative z-10 w-full h-full object-contain object-bottom hero-float"
        style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))" }}
      />
    </div>

    {/* Floating card 1 — placement */}
    <div className="badge-pop absolute top-[18%] right-[42%] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl"
      style={{ animationDelay: "0.3s" }}>
      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wide">Avg. Package</p>
      <p className="text-white font-bold text-[18px] leading-none mt-0.5">₹8.4 <span className="text-[13px] font-semibold text-amber-300">LPA</span></p>
      <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">↑ 22% this year</p>
    </div>

    {/* Floating card 2 — colleges */}
    <div className="badge-pop absolute top-[52%] right-[40%] bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl px-4 py-3 shadow-xl"
      style={{ animationDelay: "0.6s" }}>
      <p className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Colleges Listed</p>
      <p className="text-white font-bold text-[20px] leading-none mt-0.5">500+</p>
      <p className="text-[10px] text-white/80 mt-0.5">Across 20+ states</p>
    </div>

    {/* Floating card 3 — students */}
    <div className="badge-pop absolute bottom-[28%] right-[10%] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl"
      style={{ animationDelay: "0.9s" }}>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {["🧑‍🎓","👩‍🎓","🧑‍💼"].map((e,i) => (
            <span key={i} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm border border-white/30">{e}</span>
          ))}
        </div>
        <div>
          <p className="text-white font-bold text-[13px] leading-none">10,000+</p>
          <p className="text-[10px] text-white/60">Students placed</p>
        </div>
      </div>
    </div>
  </div>

  {/* ================= MAIN CONTENT ================= */}
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 md:pt-16 pb-10 md:pb-0" style={{ minHeight: "inherit" }}>
    <div className="max-w-[580px]">

      {/* trust badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ping-slow" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
          🎓 India's #1 College Admission Portal
        </span>
      </div>

      {/* ── HEADING with TYPEWRITER ── */}
      <h1 className="font-extrabold tracking-tight leading-[1.15] text-white"
        style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
        Find Your Dream<br />
        <span className="inline-flex items-baseline gap-2 flex-wrap">
          <TypewriterWord words={["College", "University", "Course"]} />
          <span className="text-white">.</span>
        </span>
      </h1>

      {/* subheading */}
      <p className="mt-4 text-white/65 text-[14px] md:text-[16px] leading-relaxed max-w-md">
        Compare <span className="text-amber-300 font-semibold">MBA, B.Tech, MBBS &amp; Law</span> colleges by fees, NIRF rankings &amp; real placement outcomes — all in one place.
      </p>

      {/* quick-stream pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { label: "🔥 Top MBA", stream: "Management" },
          { label: "⚙️ Engineering", stream: "Engineering" },
          { label: "🩺 Medical", stream: "Medical" },
          { label: "⚖️ Law", stream: "Law" },
          { label: "✈️ Study Abroad", stream: "Study Abroad" },
        ].map(({ label, stream }) => (
          <button key={label} type="button"
            onClick={() => navigate("/courses", { state: { initialStream: stream } })}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/15 text-white/80 hover:text-white transition whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.08)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >{label}</button>
        ))}
      </div>

      {/* ── SEARCH BOX ── */}
      <form
        onSubmit={(e) => { e.preventDefault(); navigate("/colleges", { state: { college: heroCollege.trim(), city: heroCity.trim() } }); }}
        className="mt-6 w-full max-w-[520px]"
      >
        {/* desktop inline */}
        <div className="hidden md:flex items-center bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden p-1.5 gap-1">
          <div className="flex items-center flex-1 px-3 gap-2">
            <span className="text-slate-400 text-sm">🔍</span>
            <input type="text" placeholder="College or Course name"
              value={heroCollege} onChange={(e) => setHeroCollege(e.target.value)}
              className="w-full py-2.5 text-sm text-slate-800 outline-none placeholder-slate-400 bg-transparent" />
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div className="flex items-center flex-1 px-3 gap-2">
            <span className="text-slate-400 text-sm">📍</span>
            <input type="text" placeholder="City or State"
              value={heroCity} onChange={(e) => setHeroCity(e.target.value)}
              className="w-full py-2.5 text-sm text-slate-800 outline-none placeholder-slate-400 bg-transparent" />
          </div>
          <button type="submit"
            className="hero-saffron-btn px-6 py-2.5 rounded-xl font-bold text-sm text-white whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)" }}>
            Search →
          </button>
        </div>

        {/* mobile stacked */}
        <div className="flex md:hidden flex-col gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5">
            <span className="text-slate-400">🔍</span>
            <input type="text" placeholder="College or Course"
              value={heroCollege} onChange={(e) => setHeroCollege(e.target.value)}
              className="flex-1 text-sm text-slate-800 outline-none placeholder-slate-400 bg-transparent" />
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5">
            <span className="text-slate-400">📍</span>
            <input type="text" placeholder="City or State"
              value={heroCity} onChange={(e) => setHeroCity(e.target.value)}
              className="flex-1 text-sm text-slate-800 outline-none placeholder-slate-400 bg-transparent" />
          </div>
          <button type="submit"
            className="hero-saffron-btn w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #f97316, #f59e0b)" }}>
            🔍 Search Colleges
          </button>
        </div>
      </form>

      {/* ── popular searches ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-white/40 font-medium">Popular:</span>
        {["IIM Ahmedabad", "IIT Delhi", "AIIMS Delhi", "NLU Delhi"].map(q => (
          <button key={q} type="button"
            onClick={() => { setHeroCollege(q); navigate("/colleges", { state: { college: q } }); }}
            className="text-[11px] text-white/60 hover:text-amber-300 transition underline underline-offset-2 decoration-white/20">
            {q}
          </button>
        ))}
      </div>

      {/* ── trust row ── */}
      <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 text-base">★★★★★</span>
          <span className="text-[12px] text-white/70 font-medium">Trusted by <strong className="text-white">10,000+</strong> students</span>
        </div>
        <div className="flex -space-x-2">
          {HERO_COLLEGES.slice(0, 3).map((c) => (
            <img key={c.name} src={c.logo} alt={c.name}
              className="w-8 h-8 rounded-full border-2 border-white/20 object-contain bg-white p-0.5" />
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-[9px] text-white font-bold">+97</div>
        </div>
        <span className="text-[11px] text-white/50">100+ partner colleges</span>
      </div>

    </div>
  </div>

  {/* bottom wave */}
  <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <path d="M0 48 C360 0 1080 0 1440 48 L1440 48 L0 48 Z" fill="white" opacity="0.06"/>
      <path d="M0 48 C360 16 1080 16 1440 48 L1440 48 L0 48 Z" fill="white" opacity="0.04"/>
    </svg>
  </div>
</section>


      <section className="bg-[#1E4A7A] mb-2 md:mb-0">
        <div className="border-y border-[#1f4962] bg-[#1E4A7A] overflow-hidden">
          <div className="homepage-ticker-track py-2 md:py-2.5">
            {[...ADMISSION_TICKER_ITEMS, ...ADMISSION_TICKER_ITEMS].map((item, idx) => (
              <span
                key={`${item.label}-${idx}`}
                className="inline-flex items-center text-[11px] sm:text-[13px] md:text-[15px] font-semibold text-white/95 mr-6 sm:mr-8 md:mr-10 whitespace-nowrap"
              >
                <span className="mr-1.5 sm:mr-2 inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white/20 text-[9px] sm:text-[11px]">
                  {item.icon}
                </span>
                {item.label}
                <span className="ml-4 sm:ml-6 text-white/45">&bull;</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .homepage-ticker-track {
          width: max-content;
          display: flex;
          align-items: center;
          animation: homepageMarquee 30s linear infinite;
          will-change: transform;
        }

        @media (max-width: 640px) {
          .homepage-ticker-track {
            animation-duration: 36s;
          }
        }

        @keyframes homepageMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>



      {/* ================================================== */}
      {/* STATS BAND — Social proof numbers                 */}
      {/* ================================================== */}
      <section className="bg-white py-6 md:py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-between">
            {[
              { icon: "🎓", number: "50,000+", label: "Students Guided", bg: "bg-blue-50" },
              { icon: "🏛️", number: "1,000+",  label: "Colleges Listed",  bg: "bg-indigo-50" },
              { icon: "📚", number: "500+",    label: "Courses Available", bg: "bg-amber-50" },
              { icon: "🆓", number: "100%",    label: "Free Counselling",  bg: "bg-green-50" },
              { icon: "⭐", number: "4.8/5",   label: "Student Rating",    bg: "bg-rose-50" },
            ].map((stat) => (
              <div key={stat.label} className="sc-stat-card">
                <div className={`sc-stat-icon ${stat.bg}`}>{stat.icon}</div>
                <div>
                  <div className="sc-stat-number">{stat.number}</div>
                  <div className="sc-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* STUDENT TOOLS GRID                                */}
      {/* -------------------------------------------------- */}
      <section className="py-8 bg-[#f2f4f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5">
            <span className="sc-section-badge">🛠️ Free Student Tools</span>
            <h2 className="sc-section-title">Smart Tools for Your College Journey</h2>
            <p className="sc-section-desc">Use our free tools to predict colleges, compare ROI, explore NIRF rankings and get expert counselling.</p>
            <div className="sc-section-divider" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: "🎯", label: "College Predictor", desc: "Predict by rank & score", href: "/college-predictor", color: "bg-blue-50 border-blue-100" },
              { icon: "⚖️", label: "Compare Colleges", desc: "Side-by-side comparison", href: "/compare", color: "bg-indigo-50 border-indigo-100" },
              { icon: "📈", label: "ROI Calculator", desc: "Education loan & returns", href: "/roi-calculator", color: "bg-amber-50 border-amber-100" },
              { icon: "📊", label: "NIRF Insights", desc: "Rankings & placement data", href: "/nirf-insights", color: "bg-green-50 border-green-100" },
              { icon: "🤖", label: "AI College Finder", desc: "AI-powered recommendations", href: "/ai-college-finder", color: "bg-purple-50 border-purple-100" },
              { icon: "🆓", label: "Free Counselling", desc: "Talk to an expert today", href: "/free-counselling", color: "bg-rose-50 border-rose-100" },
            ].map(tool => (
              <a
                key={tool.label}
                href={tool.href}
                className={`flex flex-col items-center text-center gap-2 rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all ${tool.color}`}
              >
                <span className="text-3xl">{tool.icon}</span>
                <p className="text-[13px] font-bold text-slate-800">{tool.label}</p>
                <p className="text-[10px] text-slate-500">{tool.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* TOP COURSES / STUDY GOAL (Image 1 middle row)     */}
      {/* -------------------------------------------------- */}

      <div className="bg-white">
  <section className="pb-10 pt-2 md:pt-5 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* HEADER */}
      <div className="mb-6 md:mb-8">
        <span className="sc-section-badge">📖 500+ Courses Available</span>
        <h2 className="sc-section-title">
          Top Courses in India 2026 — <span>Choose Your Study Goal</span>
        </h2>
        <p className="sc-section-desc">
          Explore MBA, B.Tech, MBBS, Law, Commerce &amp; more. Find courses with fees, duration and college count.
        </p>
        <div className="sc-section-divider" />
      </div>

      {/* HORIZONTAL SCROLL GRID */}
      <div
        className="
          flex flex-row
          overflow-x-auto
          scrollbar-hide
          snap-x snap-mandatory
          gap-3 md:gap-6
        "
      >
        {courseCategories.map((category, index) => (
          <AnimatedContainer key={category.name} delay={index * 80}>
            <button
              onClick={() =>
                navigate(`/courses?stream=${encodeURIComponent(category.name)}`, {
                  state: { initialStream: category.name },
                })
              }
              className="
                bg-white
                text-[#0A214A]
                rounded-2xl
                flex-shrink-0

                /* SIZE */
                w-[220px] md:w-[240px]
                h-[150px] md:h-[170px]

                max-md:w-[150px]
                max-md:h-[120px]
                max-md:px-4 max-md:py-4
                px-6 py-6

                /* BORDER + SHADOW */
                border border-slate-200
                shadow-[0_4px_14px_rgba(0,0,0,0.08)]
                hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)]

                transition-all duration-300
                hover:-translate-y-[2px]

                flex flex-col justify-between
              "
            >
              {/* TOP: ICON + TITLE */}
              <div className="flex items-center gap-3 max-md:gap-2">
                <div
                  className="
                    bg-slate-100
                    border border-slate-200
                    rounded-xl
                    flex items-center justify-center
                    md:p-3
                    max-md:p-2 max-md:h-8 max-md:w-8
                  "
                >
                  <img
                    src={category.iconPath}
                    alt={category.name}
                    className="
                      md:h-6 md:w-6
                      max-md:h-5 max-md:w-5
                      object-contain
                    "
                  />
                </div>

                <div className="leading-tight">
                  <p className="font-semibold text-[11px] md:text-[15px]">
                    {category.name}
                  </p>
                  <p className="text-[10px] md:text-[12px] text-slate-500">
                    {category.courseCount}+ courses
                  </p>
                </div>
              </div>

              {/* DESCRIPTION */}
              <p
                className="
                  text-slate-600
                  leading-snug
                  text-[10px] md:text-xs
                  mt-1
                  max-md:line-clamp-2
                "
              >
                {category.description}
              </p>
            </button>
          </AnimatedContainer>
        ))}
      </div>
    </div>
  </section>
</div>


      {/* -------------------------------------------------- */}
      {/* FIND YOUR IDEAL COLLEGE (Top Universities cards)  */}
      {/* -------------------------------------------------- */}

    
        <section

          className="pb-0 md:pb-6 bg-white mt-5 pt-8 shadow-[0_12px_28px_rgba(0,0,0,0.06)] rounded-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 
            {/* Heading */}
            <div className="mb-8">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                {/* LEFT SIDE: Heading */}
                <div className="flex-shrink-0">
                  <span className="sc-section-badge">🏆 Ranked &amp; Verified</span>
                  <h2 className="sc-section-title">
                    Top Colleges in India 2026
                  </h2>
                  <p className="sc-section-desc">
                    Compare fees, placements &amp; rankings for MBA, B.Tech, MBBS, Law &amp; more.
                  </p>
                  <div className="sc-section-divider" />
                </div>

                {/* RIGHT SIDE: Stream Filters */}
                <div className="flex overflow-x-auto
           
            scrollbar-hide
            snap-x snap-mandatory md:flex-wrap gap-1 lg:justify-end lg:max-w-[60%] mb-[3px] md:mb-0 ">
                  {dynamicStreams.map((stream) => (
                    <button
  key={stream}
  onClick={() => setSelectedStream(stream)}
  className={`
    inline-flex items-center
    whitespace-nowrap
    px-3 py-1.5 md:px-5 md:py-2
    rounded-full
    text-[11px] md:text-sm
    font-medium
    border
    transition-all
    ${selectedStream === stream
      ? "bg-[#1f4fa8] text-white border-[#1f4fa8] shadow-md"
      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm"
    }
  `}
  style={{ fontFamily: "Roboto, sans-serif" }}
>
  {stream}
</button>

                  ))}
                </div>

              </div>

            </div>


            {/* Horizontal Carousel */}
            {filteredColleges.length > 0 ? (
              <div className="relative">

                {/* Left Arrow */}
                <button
                  onClick={() =>
                    document
                      .getElementById("collegeCarousel")
                      ?.scrollBy({ left: -350, behavior: "smooth" })
                  }
                  className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2
                    bg-[#1f4fa8] text-white h-12 w-12 rounded-full shadow-xl z-20
                    hover:bg-[#163a7a] transition"
                >
                  <span className="text-xl font-bold">←</span>
                </button>

                {/* Scroll Container */}
                <div
                  id="collegeCarousel"
                  className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-0 px-2"
                >
                  {filteredColleges.map((college, index) => (
                    <div
  key={college.id}
  className="
    flex-shrink-0

    /* MOBILE */
    min-w-[240px]
    max-w-[260px]
    h-[360px]

    /* TABLET */
    sm:min-w-[280px]
    sm:max-w-[300px]
    sm:h-[400px]

    /* DESKTOP (unchanged) */
    lg:min-w-[300px]
    lg:max-w-[330px]
    lg:h-[430px]
  "
>

                      <AnimatedContainer delay={index * 90} className="h-full">
                        <CollegeCard
                          college={college}
                            onOpenBrochure={onOpenBrochure}
                          onCompareToggle={onCompareToggle}
  isCompared={compareList.includes(String(college.id))}
                          className="mb-0" />
                      </AnimatedContainer>
                    </div>
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() =>
                    document
                      .getElementById("collegeCarousel")
                      ?.scrollBy({ left: 350, behavior: "smooth" })
                  }
                  className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2
                    bg-[#1f4fa8] text-white h-12 w-12 rounded-full shadow-xl z-20
                    hover:bg-[#163a7a] transition"
                >
                  <span className="text-xl font-bold">→</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-md border">
                <h3
                  className="text-lg font-semibold text-slate-700"
                  style={{ fontFamily: "Roboto, sans-serif" }}
                >
                  No Colleges Match Your Criteria
                </h3>
                <p className="text-slate-500 mt-2" style={{ fontFamily: "Roboto, sans-serif" }}>
                  Try adjusting your filters or view all colleges.
                </p>
              </div>
            )}

            {/* View All Button */}
           <div className="text-center mt-4 md:mt-0">
  <button
    onClick={() => navigate("/colleges")}
    className="
      rounded-full
      bg-[#1f4fa8]
      text-white
      font-semibold
      shadow-lg
      hover:bg-[#163a7a]
      transition-all
      mb-8

      /* MOBILE */
      px-5 py-2 text-xs

      /* DESKTOP (unchanged) */
      md:px-8 md:py-3 md:text-base
    "
    style={{ fontFamily: "Roboto, sans-serif" }}
  >
    View All Colleges
  </button>
</div>


          </div>
        </section>
    

      {/* Top Study Places Section */}
      <section className="py-3 bg-[#F8F9FA] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-left bg-no-repeat bg-contain opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "url('https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/India_Map.png/960px-India_Map.png?20191107232049')",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-6">

          {/* HEADING */}
          <div className="text-center mt-4">
            <span className="sc-section-badge mx-auto">📍 11 Major Cities Covered</span>
            <h2 className="sc-section-title mx-auto">
              Find Best Colleges by City — <span>Delhi, Mumbai, Bangalore &amp; More</span>
            </h2>
            <p className="sc-section-desc mx-auto text-center" style={{ maxWidth: "600px" }}>
              Search top colleges in your city. Compare admissions in Delhi NCR, Mumbai, Bangalore, Chennai, Pune, Hyderabad &amp; more.
            </p>
            <div className="sc-section-divider mx-auto" />
          </div>

          {/* SEARCH BAR */}
          <div className="mt-6 md:mt-8 flex justify-center">
            <div className="flex gap-3 items-center w-full max-w-2xl max-md:flex-col">

              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search city or location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="
              w-full py-3 md:py-4 pl-12 pr-4 rounded-xl border border-gray-300 
              shadow-sm bg-white text-gray-700 
              focus:ring-2 focus:ring-[#0A225A] focus:border-[#0A225A]
              max-md:text-sm
            "
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                  🔍
                </span>
              </div>

              <button
                onClick={handleCitySearch}
                className="
            px-6 py-3 md:py-4 rounded-xl text-white font-semibold 
            bg-[#0A225A] hover:bg-[#071a3f]
            shadow-md transition
            w-full md:w-auto max-md:text-sm
          "
              >
                Search Now
              </button>

            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
          )}

          {/* CITY SCROLLER */}
          <div className="relative mt-8 md:mt-10">

            {/* LEFT ARROW */}
            <button
              onClick={() =>
                document
                  .getElementById("cityCarousel")
                  ?.scrollBy({ left: -250, behavior: "smooth" })
              }
              className="hidden md:flex items-center justify-center absolute left-[-30px] top-1/2 
        -translate-y-1/2 h-12 w-12 bg-white shadow-lg border border-gray-200 
        rounded-full z-20 hover:scale-110 transition"
            >
              ‹
            </button>

            {/* SCROLLABLE ROW */}
            <div
              id="cityCarousel"
              className="
          flex gap-4 md:gap-6
          overflow-x-auto scroll-smooth scrollbar-hide
          snap-x snap-mandatory
          pb-3 pr-2
          max-md:overflow-x-scroll
          max-md:pl-1
        "
            >
            {visibleRegions.map(region => (
  <div
  key={region}
  onClick={() =>
    navigate("/colleges", {
      state: { region },
    })
  }
  className="
    group
    min-w-[130px] md:min-w-[150px]
    h-[135px] md:h-[150px]
    rounded-2xl
    border border-slate-200
    bg-white
    snap-start p-4 md:p-6 cursor-pointer
    flex flex-col items-center justify-center

    shadow-[0_6px_18px_rgba(0,0,0,0.06)]
    hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)]
    transition-all duration-300
  "
>

    <div className="h-12 w-12 md:h-14 md:w-14">
   <img
  src={CITY_ICON_MAP[region] || "/icons/university.png"}
  alt={region}
  className="
    h-full w-full object-contain
    opacity-70
    grayscale
    transition
    group-hover:opacity-100
    group-hover:grayscale-0
  "
/>

    </div>

   <p
  className="
    font-semibold
    text-sm md:text-base
    text-slate-700
    mt-2 md:mt-3
    text-center truncate
  "


      title={region}
    >
      {region}
    </p>
  </div>
))}


            </div>

            {/* RIGHT ARROW */}
            <button
              onClick={() =>
                document
                  .getElementById("cityCarousel")
                  ?.scrollBy({ left: 250, behavior: "smooth" })
              }
              className="hidden md:flex items-center justify-center absolute right-[-30px] top-1/2 
        -translate-y-1/2 h-12 w-12 bg-white shadow-lg border border-gray-200 
        rounded-full z-20 hover:scale-110 transition"
            >
              ›
            </button>

          </div>

        </div>
      </section>



      {/* EXPLORE COURSES SECTION */}
      <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-6">


            {/* Heading */}
            <div className="mb-2 md:mb-6">
              <span className="sc-section-badge">🔭 Postgraduate · Undergraduate · Doctoral</span>
              <h2 className="sc-section-title">
                Explore All Courses in India 2026 — <span>MBA, B.Tech, MBBS &amp; More</span>
              </h2>
              <p className="sc-section-desc">
                Browse courses by level, duration &amp; average fees. Find the right programme for your career.
              </p>
              <div className="sc-section-divider" />
            </div>

            {/* FILTER BY LEVEL ONLY */}
            <div className="mb-8">
              <h3 className="text-sm md:text-lg text-[#0A225A] mb-3">Filter by Level</h3>
              <div className="flex gap-3 flex-wrap">

                {exploreLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setExploreLevel(level)}
                    className={`
              px-4 py-2 rounded-full border font-medium text-sm transition
              ${exploreLevel === level
                        ? "bg-[#0A225A] text-white border-[#0A225A]"
                        : "bg-white text-[#0A225A] border-gray-300 hover:bg-gray-100"
                      }
            `}
                  >
                    {level}
                  </button>
                ))}

              </div>
            </div>

            {/* FILTERED COURSE LIST */}
            <button
              onClick={() =>
                document.getElementById("courseScroll")?.scrollBy({ left: -300, behavior: "smooth" })
              }
              className="hidden md:flex items-center justify-center absolute left-4 mt-[150px]
      h-10 w-10 bg-white text-[#0A225A] rounded-full shadow-xl hover:scale-110 transition border"
            >
              ←
            </button>

            <div
              id="courseScroll"
              className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {courses
                .filter((course) =>
                  exploreLevel === "All" ? true : course.level === exploreLevel
                )
                .slice(0, 10)
                .map((course, index) => (
                  <div
                    key={index}
                     onClick={(e) => {
                        e.stopPropagation();
                        const categorySlug = getCategorySlugFromStream(course.name);
                        const courseSlug = toCourseSlug(course.name);
                    
                        navigate(buildCourseDetailPath(categorySlug, course.name, courseSlug));
                      }}


                     className="
    snap-start shrink-0 cursor-pointer bg-white border border-gray-200 rounded-xl
    shadow-[0_4px_12px_rgba(0,0,0,0.08)]
    flex flex-col

    /* MOBILE */
    w-[220px]
    min-w-[220px]
    p-3
    h-[260px]

    /* DESKTOP */
    md:w-[260px]
    md:min-w-[260px]
    md:p-5
    md:h-[300px]
  "
                  >
                    {/* Top Tags */}
                    <div className="flex justify-between mb-4 text-xs">
                      <span className="bg-gray-100 px-3 py-1 rounded-md font-semibold text-gray-700">
                        {course.type || "Full Time"}
                      </span>
                      <span className="bg-gray-100 px-3 py-1 rounded-md font-semibold text-gray-700">
                        {course.duration || "NA"}
                      </span>
                    </div>

                    {/* Title */}
                 <h3
  className="
    text-[14px]
    mb-3
    leading-snug
    overflow-hidden
    text-ellipsis
    whitespace-nowrap
    max-w-full
  "
  title={course.name}
>
  {course.name}
</h3>


                    {/* Info Boxes */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs mb-3 mt-3">

                      <div className="bg-gray-50 p-3 rounded-md border border-slate-100 flex flex-col">
                        <span className="text-gray-500 text-[11px]">Duration</span>
                        <span className="font-semibold truncate">{course.duration || "NA"}</span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md border border-slate-100 flex flex-col">
                        <span className="text-gray-500 text-[11px]">Avg. Fees</span>
                        <span className="font-semibold truncate">
                          {course.fees || "NA"}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md border border-slate-100 flex flex-col">
                        <span className="text-gray-500 text-[11px]">Colleges</span>
                        <span className="font-semibold truncate">
                          {course.collegeCount ?? course.colleges?.length ?? 0}
                        </span>
                      </div>


                      <div className="bg-gray-50 p-3 rounded-md border border-slate-100 flex flex-col">
                        <span className="text-gray-500 text-[11px]">Level</span>
                        <span className="font-semibold truncate">
                          {course.level || "General"}
                        </span>
                      </div>

                    </div>

                    {/* Footer */}
                 <div className="mt-auto flex min-h-[44px] items-center justify-between gap-3 border-t pt-2">

                      <button className="text-[#0A225A] text-[10px] md:text-[12px] font-semibold hover:underline whitespace-nowrap">
                        Course Overview →
                      </button>

                      <button className="shrink-0 rounded-full bg-[#f0a018] px-3 py-2 text-[8px] font-semibold text-white md:text-[11px]">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() =>
                document.getElementById("courseScroll")?.scrollBy({ left: 300, behavior: "smooth" })
              }
              className="hidden md:flex items-center justify-center absolute right-4 mt-[-160px]
      h-10 w-10 bg-white text-[#0A225A] rounded-full shadow-xl hover:scale-110 transition border"
            >
              →
            </button>

            {/* VIEW ALL */}
            <div className="flex justify-center mt-7">
              <button
                onClick={() => navigate("/courses")}

                className="
    bg-[#0A225A] text-white rounded-full font-semibold shadow-lg
    px-6 py-2 text-sm
    md:px-10 md:py-3 md:text-lg
  "
              >
                View All Courses
              </button>
            </div>

          </div>
        </section>
      </Suspense>  

         {/* -------------------------------------------------- */}
      {/* EXPLORE EXAMS SECTION (Updated with unique stream filters) */}
      {/* -------------------------------------------------- */}


      <section className="py-10 bg-white">

        {/* Build unique streams from backend exam.stream */}
        {(() => {
          const uniqueStreams = new Set<string>();
          exams.forEach((exam) => {
            if (exam.stream) uniqueStreams.add(exam.stream.trim());
          });
          var examFilters = ["All", ...Array.from(uniqueStreams)];
          return null;
        })()}

        {/* Exam Filters */}


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="sc-section-badge">📝 CAT · JEE · NEET · CLAT &amp; More</span>
              <h2 className="sc-section-title">
                Top Entrance Exams 2026 — <span>Dates, Eligibility &amp; Results</span>
              </h2>
              <p className="sc-section-desc">
                Stay updated on exam schedules, cut-offs and application deadlines for India's top competitive exams.
              </p>
              <div className="sc-section-divider" />
            </div>
            <button
              onClick={() => navigate ? (window.location.href = "/exams") : undefined}
              className="sc-cta-btn shrink-0 self-start sm:self-end"
              style={{ fontSize: "0.82rem", padding: "9px 22px" }}
            >
              View All Exams →
            </button>
          </div>

          {/* Filtered Exams */}
          <div className="relative">
            <div
              id="examCarousel"
              className="flex gap-5 overflow-x-auto scroll-smooth pb-3 px-1 scrollbar-hide"
            >
              {exams
                .filter((exam) =>
                  selectedExamFilter === "All"
                    ? true
                    : exam.stream?.trim() === selectedExamFilter
                )
                .map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => navigate(`/exams/${toExamSlug(exam)}`)}

                    className="
                min-w-[290px] max-w-[290px]
                bg-white border border-gray-200 rounded-xl 
                shadow-sm hover:shadow-md cursor-pointer 
                transition-all p-5
              "
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={exam.logoUrl}
                          className="h-10 w-10 rounded-full border object-contain"
                          alt={exam.name}
                        />
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {exam.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {exam.conductingBody}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                        {exam.stream || "Exam"}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500">Exam Date</p>
                      <p className="font-semibold text-[#1f4fa8] text-sm">
                        {exam.date || "To be announced"}
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between py-2 border-t">
                        <p className="text-sm font-medium text-slate-800">
                          Application Process
                        </p>
                        <span className="text-lg text-slate-600">›</span>
                      </div>

                      <div className="flex justify-between py-2 border-t">
                        <p className="text-sm font-medium text-slate-800">Exam Info</p>
                        <span className="text-lg text-slate-600">›</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() =>
                document
                  .getElementById("examCarousel")
                  ?.scrollBy({ left: 300, behavior: "smooth" })
              }
              className="
          hidden md:flex items-center justify-center
          absolute right-[-25px] top-1/2 -translate-y-1/2
          h-12 w-12 rounded-full shadow-xl bg-white border
          hover:scale-110 transition
        "
            >
              <span className="text-xl">›</span>
            </button>
          </div>

        </div>
      </section>
   
{/* ================= LATEST NEWS SECTION ================= */}
<section className="bg-gradient-to-b from-slate-50 to-white py-5 sm:py-8">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">

    {/* Section Header */}
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <div>
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          Live Updates
        </div>
        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
          Latest Education <span className="gradient-text-blue">News &amp; Updates 2026</span>
        </h2>
      </div>
      <a
        href="/blog"
        className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#1E4A7A] hover:text-blue-700 transition-colors border border-[#1E4A7A]/20 rounded-full px-3 py-1.5 hover:bg-blue-50"
      >
        View All →
      </a>
    </div>

    {/* Main Card */}
    <div className="rounded-2xl overflow-hidden shadow-lg shadow-blue-900/5 border border-slate-100 bg-white">
      <div className="flex flex-row min-h-[180px] sm:min-h-[240px]">

        {/* ===== LEFT: News Feed ===== */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 bg-white">
          <div className="relative flex-1 overflow-hidden">
            <div className="h-[160px] sm:h-[200px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {loopingNews.map((news, i) => (
                <div
                  key={i}
                  className="group flex gap-2 sm:gap-3 items-center p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-lg overflow-hidden shadow-sm ring-1 ring-slate-100">
                    <img
                      src={news.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {news.category && (
                      <span className="inline-block px-1.5 py-0 rounded-full bg-blue-50 text-blue-600 text-[8px] font-semibold uppercase tracking-wider mb-0.5">
                        {news.category}
                      </span>
                    )}
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#1E4A7A] transition-colors">
                      {news.title}
                    </p>
                    <span className="text-[8px] sm:text-[10px] text-slate-400">
                      {news.date}
                    </span>
                  </div>

                  <span className="flex-shrink-0 text-slate-200 group-hover:text-[#1E4A7A] text-base font-light transition-colors">›</span>
                </div>
              ))}
            </div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>

        </div>

        {/* ===== RIGHT: Girl Image ===== */}
        <div className="relative w-[38%] sm:w-[32%] flex-shrink-0 overflow-hidden">
          <img
            src="./icons/latestnews.png"
            alt="Indian Student"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/10" />
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[7px] sm:text-[9px] font-bold uppercase tracking-wider">
              🇮🇳 India Education Hub
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>

        {/* Partner Logos Infinite Scroll */}
<section className="py-14 bg-white">
  <div className="max-w-7xl mx-auto px-6 text-center">
    <span className="sc-section-badge mx-auto mb-2">🤝 Official Admission Partners</span>
    <h2 className="sc-section-title mb-2">
      Top Universities &amp; Colleges <span>We Work With</span>
    </h2>
    <p className="sc-section-desc mx-auto text-center mb-8" style={{ maxWidth: "520px" }}>
      StudyCups is an authorised admission partner for 100+ accredited universities across India.
    </p>

    <div className="overflow-hidden relative">
      {/* fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent z-10" />

      <div
        ref={logoScrollRef}
        className="flex items-center gap-14 animate-logoScroll"
        style={{ width: "max-content" }}
      >
        {/* first set */}
        {colleges
          .filter((c: any) => c.logoUrl || c.logo)
          .slice(0, 40)
          .map((c: any, i: number) => (
            <img
              key={`a-${c.id ?? i}`}
              src={c.logoUrl || c.logo}
              alt={c.name}
              className="h-10 md:h-12 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ))}
        {/* duplicate for seamless loop */}
        {colleges
          .filter((c: any) => c.logoUrl || c.logo)
          .slice(0, 40)
          .map((c: any, i: number) => (
            <img
              key={`b-${c.id ?? i}`}
              src={c.logoUrl || c.logo}
              alt={c.name}
              className="h-10 md:h-12 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ))}
      </div>
    </div>
  </div>
</section>


        <section className="py-16 bg-[#f4f6fb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-8">
            <span className="sc-section-badge">✍️ Expert Articles &amp; Guides</span>
            <h2 className="sc-section-title mt-1">
              College Admission Guides &amp; <span>Exam Tips 2026</span>
            </h2>
            <p className="sc-section-desc">
              Read expert articles on MBA rankings, JEE preparation, NEET counselling, college fees and career advice.
            </p>
            <div className="sc-section-divider mt-2" />
          </div>

          {/* MOBILE: horizontal scroll */}
          <div
            className="
        flex md:hidden
        gap-4 overflow-x-auto scroll-smooth
        snap-x snap-mandatory pb-4 scrollbar-hide
      "
          >
            {blogs.slice(0, 3).map((post, index) => (
              <div
                key={post.id}
                onClick={() => navigate(`/blog/${toBlogSlug(post)}`)}

                className="
            min-w-[85%] snap-start
            bg-white rounded-2xl shadow-md border border-slate-100 
            overflow-hidden cursor-pointer flex flex-col
          "
              >
                <div className="h-36 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="px-5 py-4 flex flex-col">
                  <span
                    className={`
                text-[10px] font-semibold px-2 py-1 rounded-full 
                ${blogCategoryColors[post.category] || "bg-slate-100 text-slate-700"}
              `}
                  >
                    {post.category}
                  </span>

                  <h3 className="text-sm font-semibold text-slate-900 mt-2">
                    {post.title}
                  </h3>

                  <p className="text-[11px] text-slate-600 line-clamp-3 mt-1">
                    {post.excerpt}
                  </p>

                  <span className="mt-3 text-[11px] font-semibold text-[#1f4fa8]">
                    Read More →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: 3 column grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {blogs.slice(0, 3).map((post, index) => (
              <AnimatedContainer key={post.id} delay={index * 80}>
                <div
                  onClick={() => navigate(`/blog/${toBlogSlug(post)}`)}

                  className="
              bg-white rounded-2xl shadow-md border border-slate-100 
              overflow-hidden cursor-pointer flex flex-col h-full
            "
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="px-5 py-4 flex flex-col flex-grow">
                    <span
                      className={`
                  text-[10px] font-semibold px-2 py-1 rounded-full 
                  ${blogCategoryColors[post.category] || "bg-slate-100 text-slate-700"}
                `}
                    >
                      {post.category}
                    </span>

                    <h3 className="text-sm font-semibold text-slate-900 mt-2 flex-grow">
                      {post.title}
                    </h3>

                    <p className="text-[11px] text-slate-600 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <span className="mt-3 text-[11px] font-semibold text-[#1f4fa8]">
                      Read More →
                    </span>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>

          {/* VIEW ALL BUTTON */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/blog")}

              className="
          inline-flex items-center justify-center px-6 py-2.5 rounded-full 
          border border-[#1f4fa8] text-[#1f4fa8] text-sm font-semibold 
          hover:bg-[#1f4fa8]/
        "
            >
              View all articles
            </button>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* COLLEGE RANKING TABLE (Image 2 middle)            */}
      {/* -------------------------------------------------- */}

      {/* Ranking Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md mt-8 max-w-7xl mx-auto">

        {/* TABLE HEAD SECTION */}
        <div className="px-5 pt-6 pb-3">
          <span className="sc-section-badge">📊 NIRF &amp; Placement Data</span>
          <h2 className="sc-section-title mt-1">
            Top 10 Colleges in India 2026 — <span>Rankings, Fees &amp; Cut-offs</span>
          </h2>
          <p className="sc-section-desc">
            Compare admission cut-offs, annual fees and NIRF rankings for MBA, B.Tech, MBBS, Law &amp; more.
          </p>
          <div className="sc-section-divider mt-2 mb-1" />
        </div>

        {/* STREAM FILTERS */}
        <div className="flex flex-row overflow-x-auto scrollbar-hide gap-3 px-5 pb-4 border-b border-slate-200">

          {["All", ...streamFilters].map((item) => (
            <button
              key={item}
              onClick={() => setSelectedtopcollge(item)}
              className={`px-4 py-2 rounded-full text-sm border transition
        ${selectedtopcollge === item
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-slate-300 hover:bg-slate-100"
                }
      `}
            >
              {item}
            </button>
          ))}

        </div>


        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">

            {/* TABLE HEAD */}
            <thead>
              <tr className="bg-slate-100 text-salt-700 text-sm border-b">
                <th className="px-6 py-3 text-left w-20">Rank</th>
                <th className="px-6 py-3 text-left">College</th>
                <th className="px-6 py-3 text-left w-48">Ranking</th>
                <th className="px-6 py-3 text-left w-48">Cutoff</th>
                <th className="px-6 py-3 text-left w-48">Application Deadline</th>
                <th className="px-6 py-3 text-left w-40">Fees</th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {displayedColleges.map((college, index) => (
                <tr
                  key={college.id}
                  className={`
    border-b text-sm
    ${index % 2 === 0 ? "bg-[#f5f9ff]" : "bg-white"}
  `}
                >

                  <td className="px-6 py-4 font-semibold text-slate-900">#{index + 1}</td>

                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={college.logoUrl}
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                      <div>
                        <p className="font-semibold text-[15px] leading-tight text-slate-800">
                          {college.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {college.city}, {college.state} |
                          <span className="ml-1 text-yellow-500 font-semibold">⭐ {college.rating}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-700">{college.rankingText}</td>
                  <td className="px-6 py-4 text-slate-700">{college.cutoffText}</td>
                  <td className="px-6 py-4 text-slate-700">{college.deadline}</td>

                  <td className="px-6 py-4 font-bold text-slate-900">
                    {college.fees}
                    <p className="text-xs text-slate-500 font-normal">1st Year Fees</p>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
 
      {/* -------------------------------------------------- */}
      {/* OPTIONAL: FAQ + BLOG + CONTACT (keep functionality) */}
      {/* (You can remove these if you strictly want home to  */}
      {/* end at the gradient footer below.)                 */}
      {/* -------------------------------------------------- */} 

   
          <section className="py-24 sm:py-32 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="sc-section-badge mx-auto">🏅 Real Students · Real Results</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-2">
              Our <span className="gradient-text-gold">Alumni</span> Success Stories
            </h2>
            <p className="text-slate-500 mt-4 text-sm sm:text-lg max-w-2xl mx-auto">
              StudyCups-guided students now placed at top firms in India &amp; abroad. From admission guidance to career success.
            </p>
            <div className="sc-section-divider mx-auto mt-4" />
          </div>
          <SuccessCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>
   
      <section className="py-16 md:py-2 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="sc-section-badge mx-auto">❓ Quick Answers</span>
            <h2 className="sc-section-title mt-2">
              College Admission <span>FAQs 2026</span>
            </h2>
            <p className="sc-section-desc mx-auto text-center mt-2" style={{ maxWidth: "560px" }}>
              Common questions about MBA, MBBS, B.Tech &amp; Law admissions in India answered by our expert counsellors.
            </p>
            <div className="sc-section-divider mx-auto mt-3" />
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">
                    {faq.question}
                  </span>
                  <span
                    className={`transform transition-transform ${openFaq === index ? "rotate-45" : "rotate-0"
                      }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[--primary-medium]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-4 pt-0 text-xs text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
   


      {/* Contact section */}


    </div>
  );
};

export default HomePage;
