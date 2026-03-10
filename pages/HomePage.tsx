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
import ContactForm from "../components/ContactForm";
import { useLocation } from "react-router-dom";
import { TESTIMONIALS } from "@/LandingPage/constants";




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
   onOpenBrochure: () => void;
   onCompareToggle: (id: string) => void;
  compareList: string[]; // 🔥 ADD THIS

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



const HomePage: React.FC<HomePageProps> = ({

  colleges,
  exams,
  onOpenBrochure,
  onCompareToggle,
  compareList

}) => {
  useEffect(() => {

  }, [colleges, exams]);

  const navigate = useNavigate();
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [heroCollege, setHeroCollege] = useState("");
const [heroCity, setHeroCity] = useState("");


  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroFilters, setHeroFilters] = useState({
    college: "",
    city: "",
    course: "",
  });

  useEffect(() => {
  console.log("TESTIMONIALS =>", TESTIMONIALS);
}, []);


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
        <title>
          StudyCups – Compare Colleges, Courses & Exams in India
        </title>
        <meta
          name="description"
          content="StudyCups helps students compare colleges, courses, fees, placements and exams across India. Find your dream college today."
        />
        <link rel="canonical" href="https://studycups.in/" />
      </Helmet>
<section className="relative w-full h-[600px] max-md:h-auto max-md:pt-20 max-md:pb-4 overflow-hidden bg-white">
  {/* ================= BACKGROUND GLOWS ================= */}
  <div className="absolute top-[-10%] left-[10%] w-[35%] h-[45%] rounded-full bg-[#E6F0FF] blur-[120px] opacity-80 pointer-events-none" />
  <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[40%] rounded-full bg-[#EDF4FF] blur-[100px] opacity-70 pointer-events-none" />
  <div className="absolute bottom-[5%] right-[-5%] w-[25%] h-[35%] rounded-full bg-[#EBF3FF] blur-[90px] opacity-60 pointer-events-none" />

  {/* ================= ABSTRACT SHAPES (DESKTOP ONLY) ================= */}
 <div
  className="
    absolute
    top-[56px] md:top-0
    right-[-20%] md:right-[-2%] 
    hidden md:block
    w-[220px] md:w-[60%]
    h-[180px] md:h-auto
    pointer-events-none
    z-[2]
  "
>

    <div
      className="absolute right-[10%]"
      style={{
        width: "450px",
        height: "520px",
        top: "20%",
        background: "#D9A83E",
        borderRadius: "120px",
        transform: "rotate(32deg)",
      }}
    />

    <div
      className="absolute right-[12%] overflow-hidden"
      style={{
        miwidth: "400px", 
        width: "450px",
        height: "500px",
        top: "24%",
        background: "#164585",
        borderRadius: "100px",
        transform: "rotate(-28deg)",
        boxShadow: "40px 60px 120px rgba(0,0,0,0.25)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e4b8f] to-[#163d7a]" />
      <div
        className="absolute inset-0"
        style={{
          clipPath: "polygon(40% 0%, 100% 0%, 100% 65%, 45% 45%)",
          background: "linear-gradient(135deg, #2b63b3, #1c4a8f)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          clipPath: "polygon(0% 65%, 45% 45%, 100% 65%, 100% 100%, 0% 100%)",
          background: "linear-gradient(180deg, #103163, #0c254d)",
        }}
      />
    </div>

    <img
      src={HERO_HUMAN_IMAGE}
      alt="Students"
      className="absolute top-[200px] left-[200px] w-[420px] h-[340px] object-contain"
    />
  </div> 
{ /* ================= ABSTRACT SHAPES (MOBILE ONLY) ================= */}
  <div
  className="
    absolute
    top-0
    right-[-72px]
    w-[250px]
    h-[150px]
    pointer-events-none
    z-[2]
    block md:hidden
  "
>
  {/* YELLOW SHAPE (BEHIND) */}
  <div
    className="absolute top-[8px] right-[58px] w-[182px] h-[112px] rounded-[36px] bg-[#D9A83E]"
    style={{ transform: "rotate(26deg)" }}
  />

  {/* BLUE SHAPE (FRONT) */}
  <div
    className="absolute top-[12px] right-[4px] w-[160px] h-[98px] rounded-[38px] overflow-hidden shadow-[0_18px_42px_rgba(0,0,0,0.22)]"
    style={{ transform: "rotate(-20deg)" }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#1e4b8f] to-[#163d7a]" />
    <div
      className="absolute inset-0 opacity-85"
      style={{
        clipPath: "polygon(38% 0%, 100% 0%, 100% 64%, 44% 44%)",
        background: "linear-gradient(135deg, #2b63b3, #1c4a8f)"
      }}
    />
    <div
      className="absolute inset-0 opacity-95"
      style={{
        clipPath: "polygon(0% 66%, 44% 44%, 100% 64%, 100% 100%, 0% 100%)",
        background: "linear-gradient(180deg, #103163, #0c254d)"
      }}
    />
  </div>

  {/* CORNER GLOW */}
  <div
    className="absolute -top-1 right-[70px] w-[130px] h-[64px] bg-[#4f7ec8]/35 blur-[20px] rounded-full"
  />
</div>


  {/* ================= CONTENT ================= */}
  <div className="relative z-10 md:mt-30 mt-0">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="max-w-xl">
        {/* HEADING */}
        <h1 className="text-slate-900 font-extrabold tracking-tight
          text-[25px] md:text-[36px] md:leading-[44px] leading-[30px]
          sm:text-[42px] sm:leading-[52px]
          md:text-[52px] md:leading-[64px]">
          Find Your <br />
          <span>Dream College.</span>
        </h1>

        {/* SUBTEXT */}
        <p className="text-slate-600 mt-4 text-base sm:text-lg font-medium max-w-md hidden md:block">
          Compare colleges, courses, fees, and
          <span className="font-semibold text-slate-900">
            {" "}real placement outcomes
          </span>{" "}
          — all in one place.
        </p> 
           <p className="text-slate-600 mt-3 text-[13px] font-medium max-w-md block md:hidden">
        Discover Colleges, courses, and
          <span className="font-semibold text-slate-900">
            {" "}placement 
          </span>{" "}
          for your future.
        </p>


        {/* TAGS */}
    <div
  className="
    mt-3
    flex
    flex-nowrap
   
    gap-1
    md:flex-wrap
    md:gap-3
  "
>
  {HERO_TAGS.map(({ label, stream, Icon }) => (
    <button
      key={label}
      type="button"
      onClick={() =>
        navigate("/courses", {
          state: { initialStream: stream },
        })
      }
      className="
        flex items-center gap-1
        px-2 py-1
        bg-white
        border border-slate-200
        rounded-full
        text-[9.5px] md:text-[11px]
        font-semibold text-slate-700
        whitespace-nowrap
        leading-none
        shadow-[0_2px_4px_rgba(0,0,0,0.05)]
        hover:bg-slate-50
        hover:border-slate-300
        transition
        cursor-pointer 
        
      "
    >
      <Icon />
      <span>{label}</span>
    </button>
  ))}
</div>




        {/* SEARCH (STACKS ON MOBILE) */}
     <form 
      onSubmit={(e) => {
    e.preventDefault();

    navigate("/colleges", {
      state: {
        college: heroCollege.trim(),
        city: heroCity.trim(),
      },
    });
  }}
  className="
    mt-6
    hidden md:flex
    w-full max-w-2xl
    items-center
    bg-white
    border border-slate-100
    rounded-2xl
    shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]
    p-2
    gap-2
  "
>
  {/* College Name */}
  <div className="flex items-center px-4 flex-1">
    <span className="mr-2 text-slate-400">🔍</span>
    <input
  type="text"
  placeholder="College Name"
  value={heroCollege}
  onChange={(e) => setHeroCollege(e.target.value)}
  className="w-full py-3 text-sm outline-none placeholder-slate-400"
/>
  </div>

  {/* Divider */}
  <div className="w-px h-8 bg-slate-200" />

  {/* City */}
  <div className="flex items-center px-4 flex-1">
    <span className="mr-2 text-slate-400">📍</span>
  <input
  type="text"
  placeholder="City or Region"
  value={heroCity}
  onChange={(e) => setHeroCity(e.target.value)}
  className="w-full py-3 text-sm outline-none placeholder-slate-400"
/>
  </div>

  {/* Button */}
  <button
    type="submit"
    className="
      px-8 py-3
      bg-[#f4a71d]
      text-white
      font-semibold
      rounded-xl
      hover:opacity-90
      transition
      whitespace-nowrap
    "
  >
    Search
  </button>
</form>

{/* MOBILE SEARCH FORM */}
<form
 onSubmit={(e) => {
    e.preventDefault();

    navigate("/colleges", {
      state: {
        college: heroCollege.trim(),
        city: heroCity.trim(),
      },
    });
  }}
  className="
    mt-6
    w-full
    max-w-md
    bg-white
    rounded-2xl
    shadow-[0_20px_40px_rgba(0,0,0,0.12)]
    p-3
    flex
    flex-col
    gap-3 
    block md:hidden
  "
>
  {/* INPUT ROW */}
  <div
    className="
      flex
      items-center
      gap-2
      bg-white
      border
      border-slate-200
      rounded-xl
      px-2
    "
  >
    {/* College Name */}
    <div className="flex items-center gap-2 flex-1 px-2">
      <span className="text-slate-400 text-sm">🔍</span>
    <input
  type="text"
  placeholder="College Name"
  value={heroCollege}
  onChange={(e) => setHeroCollege(e.target.value)}
  className="w-full py-3 text-sm outline-none placeholder-slate-400"
/>
    </div>

    {/* Divider */}
    <div className="w-px h-6 bg-slate-200" />

    {/* City */}
    <div className="flex items-center gap-2 flex-1 px-2">
      <span className="text-slate-400 text-sm">📍</span>
     <input
  type="text"
  placeholder="City or Region"
  value={heroCity}
  onChange={(e) => setHeroCity(e.target.value)}
  className="w-full py-3 text-sm outline-none placeholder-slate-400"
/>
    </div>
  </div>

  {/* SEARCH BUTTON */}
  <button
    type="submit"
    className="
      w-full
      py-3
      rounded-xl
      bg-[#f4a71d]
      text-white
      font-semibold
      text-sm
      shadow-[0_10px_25px_rgba(255,120,60,0.45)]
      active:scale-[0.98]
      transition
    "
  >
    Search
  </button>
</form>



        {/* TRUST */}
        <div className="mt-6">
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-3">
            Trusted by 10,000+ Students
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {HERO_COLLEGES.map((college) => (
              <div key={college.name} className="flex items-center gap-2 opacity-60">
                <img src={college.logo} alt={college.name} className="h-6 sm:h-8 w-auto" />
                <span className=" text-[11px] font-semibold text-slate-700">
                  {college.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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



      {/* -------------------------------------------------- */}
      {/* TOP COURSES / STUDY GOAL (Image 1 middle row)     */}
      {/* -------------------------------------------------- */}

      <div className="bg-white">
  <section className="pb-10 pt-2 md:pt-5 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* HEADER */}
      <div className="mb-6 md:mb-8">
        <h2
          className="
            text-[18px] md:text-[32px]
             text-[#0A214A]
            leading-tight tracking-tight
          "
        >
          Top Courses · Select Your Study Goal
        </h2>

        <p className="text-sm md:text-base text-slate-600 mt-1">
          Explore curated course categories tailored to your academic interests.
        </p>
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
                  <h2
                    className="text-[20px] md:text-[32px]  tracking-tight text-slate-900"
                    style={{ fontFamily: "Roboto, sans-serif" }}
                  >
                    Top Universities / Colleges
                  </h2>

                  <p
                    className="text-sm md:text-base text-slate-500 mt-1"
                    style={{ fontFamily: "Roboto, sans-serif" }}
                  >
                    Find Your Ideal College
                  </p>
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
          <h2 className="text-center text-[18px] md:text-[28px] md:text-[32px] font-bold text-[#0A225A] leading-[38px] md:leading-[42px] mt-4">
            Find Colleges Near You!
          </h2>

          <p className="text-[14px] md:text-[16px] leading-[20px] md:leading-[24px] text-black text-center mt-1">
            Search by city to{" "}
            <span className="text-[#f4a71d] font-semibold">
              Explore Top Colleges
            </span>{" "}
            in your area.
          </p>

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
            <div className="flex items-center gap-3 mb-2 md:mb-6">
              <svg width="35" height="35" viewBox="0 0 24 24" stroke="#0A225A" fill="none">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4h16v12H4z M4 16l8 4 8-4" />
              </svg>
              <h2 className="text-2xl md:text-[3xl] text-[#0A225A]">
                Explore Courses
              </h2>
            </div>

            {/* FILTER BY LEVEL ONLY */}
            <div className="mb-8">
              <h3 className="text-sm md:text-lg text-[#0A225A] mb-3">Filter by Level</h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">

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
          <div className="mb-6">
            <h2 className="text-[24px] md:text-[28px] text-slate-900">
              Top Exams
            </h2>
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
                    onClick={() => navigate(`/exam/${exam.id}`)}

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
   
{/* ================= STUDENT UPDATE STRIP ================= */}
<section className="bg-slate-50 py-6 sm:py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
    <div className="relative rounded-3xl bg-white shadow-xl shadow-blue-900/5 overflow-hidden border border-slate-100">
      
      {/* Container: Always Row */}
      <div className="flex flex-row min-h-[300px] sm:min-h-[450px]">

        {/* ================= LEFT : NEWS (60% on Mobile) ================= */}
        <div className="w-[62%] sm:w-[55%] p-4 sm:p-10 flex flex-col">
          
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              Live Updates
            </div>
            <h2 className="text-[15px] sm:text-2xl font-bold text-slate-900 leading-tight">
              Latest Education <span className="text-blue-600">News</span>
            </h2>
          </div>

          {/* News List */}
          <div className="relative flex-1 overflow-hidden">
            <div className="h-[220px] sm:h-[320px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {loopingNews.map((news, i) => (
                <div
                  key={i}
                  className="flex gap-2 sm:gap-4 items-center p-1.5 sm:p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  {/* Thumbnail */}
                  <img
                    src={news.imageUrl}
                    alt=""
                    className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                  />

                  <div className="min-w-0">
                    {/* Title: 2 Lines on mobile for professional look */}
                    <p className="text-[10px] sm:text-[15px] font-semibold text-slate-800 leading-[1.3] line-clamp-2">
                      {news.title}
                    </p>
                    <p className="text-[8px] sm:text-xs text-slate-500 mt-0.5">
                      {news.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </div>
        </div>

        {/* ================= RIGHT : IMAGE (38% on Mobile) ================= */}
        <div className="w-full sm:w-[45%] relative">
          <img
            src="./icons/latestnews.png"
            alt="Student"
            className="w-[180px] xs:w-[200px]
      h-auto
      object-contain
      sm:absolute sm:inset-0 sm:w-full sm:h-full
      sm:object-cover sm:object-center"
          /> 
          <img
    src="https://media.gettyimages.com/id/1920428247/vector/online-examinations-illustrations-concept-trendy-vector-style-confirmation.jpg?s=612x612&w=0&k=20&c=yOGQmJD3DcSh4A1Tb4pqqW6aHc8DS4ONLH2MH7temtY="
    alt="Education Illustration"
    className=" 
      
      block sm:hidden
      w-full
      max-w-[260px]
      h-auto
      opacity-90
    "
  />
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
        </div>

      </div>
    </div>
  </div>

  <style jsx>{`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `}</style>
</section>

        {/* Trusted by Students Section */}
 <section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-6 text-center">

    <h2 className="text-lg md:text-xl font-semibold text-[#0A225A] mb-10">
      Top Universities We Work With
    </h2>

    <div className="overflow-hidden relative">
      <div className="flex items-center gap-6 animate-logoScroll whitespace-nowrap">

        {/* BOX */}
        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/doon.png" className="h-8 md:h-10 object-contain" />
        </div>

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/download.jpg" className="h-8 md:h-10 object-contain" />
        </div>

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/ITM.png" className="h-8 md:h-10 object-contain" />
        </div>

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/NBS.jpg" className="h-8 md:h-10 object-contain" />
        </div>

        {/* Duplicate for infinite scroll */}

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/doon.png" className="h-8 md:h-10 object-contain" />
        </div> 

        

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/download.jpg" className="h-8 md:h-10 object-contain" />
        </div>

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/ITM.png" className="h-8 md:h-10 object-contain" />
        </div>

        <div className="bg-white border rounded-lg shadow-sm px-6 py-3 flex items-center justify-center">
          <img src="/logos/NBS.jpg" className="h-8 md:h-10 object-contain" />
        </div>
 
 
      </div>
    </div>
  </div>
</section>


     {/*   <section className="py-16 bg-[#f4f6fb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <h2 className="text-xl md:text-2xl text-slate-900 mb-8">
            Latest from our Blog
          </h2>

         
          <div
            className="
        flex md:hidden 
        gap-4 overflow-x-auto scroll-smooth 
        snap-x snap-mandatory pb-4 scrollbar-hide
      "
          >
            {BLOG_POSTS_DATA.slice(0, 3).map((post, index) => (
              <div
                key={post.id}
                onClick={() => navigate(`/blog/${post.id}`)}

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

      
          <div className="hidden md:grid grid-cols-3 gap-6">
            {BLOG_POSTS_DATA.slice(0, 3).map((post, index) => (
              <AnimatedContainer key={post.id} delay={index * 80}>
                <div
                  onClick={() => navigate(`/blog/${post.id}`)}

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
      </section> /*}

      {/* -------------------------------------------------- */}
      {/* COLLEGE RANKING TABLE (Image 2 middle)            */}
      {/* -------------------------------------------------- */}

      {/* Ranking Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md mt-8 max-w-7xl mx-auto">

        {/* TABLE HEAD SECTION */}
        <div className="px-5 pt-6 pb-3">
          <h2 className="text-2xl text-slate-900">Top 10 Colleges</h2>
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
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">Our <span className="text-[#f4a71d]">Alumni</span> Success</h2>
            <p className="text-slate-500 mt-5 text-base sm:text-xl">Students from our partner schools now at top global firms.</p>
          </div>
          <SuccessCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>
   
      <section className="py-16 md:py-2 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Have questions? We’ve got answers. You can also reach out to us
              directly from the contact section.
            </p>
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
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Get In Touch
            </h2>
            <p className="text-lg text-slate-500 mt-2 max-w3xl mx-auto">
              Have questions about admissions, courses, or anything else? We're here to help.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4 md:pb-0">

            {/* LEFT SIDE IMAGE + CONTACT INFO CARD */}
            <div className="flex flex-col gap-4 h-auto md:h-[520px]">

              {/* IMAGE BLOCK */}
              <div className="w-full h-[200px] md:h-[260px] rounded-3xl overflow-hidden shadow-md flex-shrink-0">
                <img
                  src="/icons/studycups_contact.png"
                  alt="StudyCups Support"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* CONTACT INFO CARD */}
              <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] 
                                border border-slate-100 p-4 space-y-3 md:flex-1">

                <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Fill out the form and our team will get back to you within 24 hours.
                  You can also reach us through the contact details below.
                </p>

                <div className="space-y-4">

                  {/* PHONE */}
                  <div className="flex items-center gap-4 bg-white shadow-md px-5 py-4 
                                        rounded-2xl border border-slate-100">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[#0F2D52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2h-1C10.82 19 5 13.18 5 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Phone</p>
                      <a href="tel:+918081269969"
                        className="text-slate-600 hover:text-[#0F2D52] text-sm">
                        +91 8081269969
                      </a>
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="flex items-center gap-4 bg-white shadow-md px-5 py-4 
                                        rounded-2xl border border-slate-100">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[#0F2D52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Email</p>
                      <a href="mailto:Support@studycups.in"
                        className="text-slate-600 hover:text-[#0F2D52] text-sm">
                        Support@studycups.in
                      </a>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* RIGHT SIDE FORM */}
            <AnimatedContainer delay={150}>
              <ContactForm />
            </AnimatedContainer>

          </div>
        </div>
      </section>



    </div>
  );
};

export default HomePage;
