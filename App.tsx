import React, { lazy, Suspense, startTransition, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
/* ===== COMMON COMPONENTS ===== */
import Header from "./components/Header";
import SmoothScrollProvider from "./components/SmoothScrollProvider";

/* ===== PAGES ===== */
import HomePage from "./pages/HomePage";

/* ===== TYPES ===== */
import type { College } from "./types";

const Footer = lazy(() => import("./components/Footer"));
const ApplyNowModal = lazy(() => import("./components/ApplyNowModal"));
const LandingApp = lazy(() => import("./LandingPage/LandingApp"));
const ListingPage = lazy(() => import("./pages/ListingPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const ExamsPage = lazy(() => import("./pages/ExamsPage"));
const ExamDetailPage = lazy(() => import("./pages/ExamDetailPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const ErrorBoundary = lazy(() => import("./pages/ErrorBoundary"));
const ChatbotWidget = lazy(() => import("./components/ChatWidget"));
const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((module) => ({ default: module.Analytics }))
);

const toSeoSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.\s]+/g, "-")   // 🔥 removes dots AND spaces
    .replace(/\//g, "-")
    .replace(/--+/g, "-");

const getPopupKeyForRoute = (pathname: string) =>
`popup_shown_${pathname}`;

const withSmoothScroll = (element: React.ReactNode) => (
  <SmoothScrollProvider>{element}</SmoothScrollProvider>
);

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type IdleScheduler = {
  requestIdleCallback?: (
    callback: (deadline: IdleDeadlineLike) => void,
    options?: { timeout?: number }
  ) => number;
  cancelIdleCallback?: (id: number) => void;
};

const getIdleScheduler = (): IdleScheduler => {
  if (typeof window === "undefined") {
    return {};
  }

  return window as Window & typeof globalThis & IdleScheduler;
};

const OldCollegesRedirect = ({ withLocation }: { withLocation?: boolean }) => {
  const { streamSlug, locationSlug } = useParams();

  if (!streamSlug) {
    return <Navigate to="/colleges" replace />;
  }

  const safeStream = toSeoSlug(streamSlug);

  if (withLocation && locationSlug) {
    return (
      <Navigate
        to={`/${safeStream}/top-colleges-in-${toSeoSlug(locationSlug)}`}
        replace
      />
    );
  }

  return <Navigate to={`/${safeStream}/top-colleges`} replace />;
};

const LegacyUniversityCourseRedirect = () => {
  const { collegeIdSlug, courseSlug } = useParams();

  if (!collegeIdSlug || !courseSlug) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <Navigate
      to={`/university/${collegeIdSlug}/course/${courseSlug}`}
      replace
    />
  );
};




/* ===== API ===== 
const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api"; */
const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api"; // LOCAL DEV

const canShowPopup = (pathname: string) => {
  const pagePopupKey = getPopupKeyForRoute(pathname);

  const shownOnThisPage =
    sessionStorage.getItem(pagePopupKey);

  const formSubmitted =
    sessionStorage.getItem("applyFormSubmitted");

  return !shownOnThisPage && !formSubmitted;
};



const App: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyMode, setApplyMode] = useState<"apply" | "brochure">("apply");
  const [showDeferredUi, setShowDeferredUi] = useState(false);
  const collegesFetchStartedRef = useRef(false);
  const examsFetchStartedRef = useRef(false);
  const blogsFetchStartedRef = useRef(false);
  const location = useLocation();
  const isLanding = location.pathname.startsWith("/registration");
  const hideNewsletterOnMobile =
    location.pathname === "/colleges" || location.pathname.includes("top-colleges");



  const handleCompareToggle = (id: string | number) => {
    const normalizedId = String(id);

    setCompareList((prev) => {
      const normalizedPrev = prev.map((value) => String(value));

      if (normalizedPrev.includes(normalizedId)) {
        return normalizedPrev.filter((value) => value !== normalizedId);
      }

      if (normalizedPrev.length >= 3) {
        return normalizedPrev;
      }

      return [...normalizedPrev, normalizedId];
    });
  };

  const handleApplyNow = () => {
    setApplyMode("apply");
    setApplyModalOpen(true);
  };

  const handleBrochure = () => {
    setApplyMode("brochure");
    setApplyModalOpen(true);
  };

  const handleBrochureSimple = () => {
    setApplyMode("brochure");
    setApplyModalOpen(true);
  };

  const loadColleges = () => {
    if (collegesFetchStartedRef.current) return Promise.resolve();
    collegesFetchStartedRef.current = true;

    return fetch(`${API_BASE}/colleges?all=true`)
      .then((response) => response.json())
      .then((payload) => {
        startTransition(() => {
          setColleges(payload?.data || []);
        });
      })
      .catch((err) => {
        console.error("COLLEGES API ERROR", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadExams = () => {
    if (examsFetchStartedRef.current) return Promise.resolve();
    examsFetchStartedRef.current = true;

    return fetch(`${API_BASE}/exams`)
      .then((response) => response.json())
      .then((payload) => {
        startTransition(() => {
          setExams(payload?.data || []);
        });
      })
      .catch((err) => {
        console.error("EXAMS API ERROR", err);
      });
  };

  const loadBlogs = () => {
    if (blogsFetchStartedRef.current) return Promise.resolve();
    blogsFetchStartedRef.current = true;

    return fetch(`${API_BASE}/blogs`)
      .then((response) => response.json())
      .then((payload) => {
        startTransition(() => {
          setBlogs(payload?.data || []);
        });
      })
      .catch((err) => {
        console.error("BLOGS API ERROR", err);
      });
  };



  /* 🔥 GLOBAL DATA – FAST (ONLY ONCE) */
  useEffect(() => {
    const initialPathname = location.pathname;
    const idleScheduler = getIdleScheduler();

    if (initialPathname === "/") {
      if (idleScheduler.requestIdleCallback) {
        const idleId = idleScheduler.requestIdleCallback(() => {
          void loadColleges();
        }, {
          timeout: 2500,
        });

        return () => {
          idleScheduler.cancelIdleCallback?.(idleId);
        };
      }

      const timeoutId = window.setTimeout(() => {
        void loadColleges();
      }, 1200);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    void Promise.all([loadColleges(), loadExams(), loadBlogs()]);
  }, []);

  useEffect(() => {
    if (showDeferredUi) {
      void loadExams();
      void loadBlogs();
    }
  }, [showDeferredUi]);

  useEffect(() => {
    const needsColleges =
      location.pathname === "/colleges" ||
      location.pathname.includes("top-colleges") ||
      location.pathname.startsWith("/university") ||
      location.pathname === "/compare";

    const needsExams = location.pathname.startsWith("/exams");
    const needsBlogs = location.pathname.startsWith("/blog");

    if (needsColleges) {
      void loadColleges();
    }

    if (needsExams) {
      void loadExams();
    }

    if (needsBlogs) {
      void loadBlogs();
    }
  }, [location.pathname]);

useEffect(() => {
  if (location.pathname !== "/") {
    setShowDeferredUi(true);
    return;
  }

  setShowDeferredUi(false);

  const idleScheduler = getIdleScheduler();
  let idleId: number | undefined;
  let timeoutId = 0;

  const revealDeferredUi = () => {
    setShowDeferredUi(true);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pointerdown", revealDeferredUi);
    window.removeEventListener("keydown", revealDeferredUi);
  };

  const handleScroll = () => {
    if (window.scrollY > 480) {
      revealDeferredUi();
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("pointerdown", revealDeferredUi, { passive: true });
  window.addEventListener("keydown", revealDeferredUi);

  if (idleScheduler.requestIdleCallback) {
    idleId = idleScheduler.requestIdleCallback(() => {
      if (window.scrollY > 240) {
        revealDeferredUi();
      }
    }, { timeout: 12000 });
  }

  timeoutId = window.setTimeout(revealDeferredUi, 12000);

  return () => {
    if (idleId !== undefined) {
      idleScheduler.cancelIdleCallback?.(idleId);
    }
    window.clearTimeout(timeoutId);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pointerdown", revealDeferredUi);
    window.removeEventListener("keydown", revealDeferredUi);
  };
}, [location.pathname]);

useEffect(() => {
  const pathname = location.pathname; 

   if (pathname.startsWith("/registration")) {
    return;
  }

  if (!canShowPopup(pathname)) {
    return;
  }

  const onScroll = () => {
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    const windowHeight = window.innerHeight;
    const fullHeight = document.body.scrollHeight;

    const scrollPercent =
      ((scrollTop + windowHeight) / fullHeight) * 100;

    if (scrollPercent >= 20) {
      setApplyMode("apply");
      setApplyModalOpen(true);

      sessionStorage.setItem(
        getPopupKeyForRoute(pathname),
        "1"
      );

      window.removeEventListener("scroll", onScroll);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
  };
}, [location.pathname]);

useEffect(() => {
  if (location.pathname === "/") {
    return;
  }

  let socket: { emit: (...args: any[]) => void; on: (...args: any[]) => void; disconnect: () => void; } | null = null;
  const timeoutId = window.setTimeout(async () => {
    const { io } = await import("socket.io-client");
    socket = io("https://studycupsbackend-wb8p.onrender.com");

    socket.emit("subscribe", "colleges");

    socket.on("college:list:changed", (payload: any) => {
      if (!payload?.listItem) return;

      startTransition(() => {
        setColleges((prev) => {
          const exists = prev.some(
            (c) => String(c.id) === String(payload.listItem.id)
          );

          if (exists) return prev;

          return [payload.listItem, ...prev];
        });
      });
    });
  }, 2000);

  return () => {
    window.clearTimeout(timeoutId);

    if (socket) {
      socket.emit("unsubscribe", "colleges");
      socket.disconnect();
    }
  };
}, [location.pathname]);

  return (
    <>
      {/* ================= HEADER (ALWAYS INSTANT) ================= */}

      {!isLanding && (
        <Header
          onOpenApplyNow={() => {
            setApplyMode("apply");
            setApplyModalOpen(true);
          }}
          colleges={colleges}
          exams={exams}
        />
      )}

      {/* ================= ROUTES (NEVER BLOCKED BY LOADING) ================= */}

      <Suspense fallback={null}>
      <Routes>

        <Route path="/registration" element={<LandingApp />} />
        <Route
          path="/"
          element={
            withSmoothScroll(
              <HomePage
              colleges={colleges}
              exams={exams}
              loading={loading}   // 👈 pass loading instead of blocking
              onOpenBrochure={handleBrochure} // ✅ GLOBAL HANDLER 
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}

              />
            )
          }
        />




        {/* ================= PRIMARY SEO LISTING ROUTES ================= */}

        <Route
          path="/:stream/top-colleges"
          element={
            withSmoothScroll(<ListingPage
              colleges={colleges}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochure}
            />)
          }
        />

        {/* 🔁 LEGACY SEO REDIRECT */}
        <Route
          path="/:courseSlug-colleges"
          element={
            <Navigate
              to={(window.location.pathname.replace("-colleges", "/colleges"))}
              replace
            />
          }
        />

        <Route
          path="/courses/:categorySlug/:courseSlug/:tabSlug"
          element={
            <CourseDetailPage
            
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochureSimple}
            />
          }
        />
        <Route
          path="/courses/:categorySlug/:courseSlug"
          element={
            <CourseDetailPage
            
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochureSimple}
            />
          }
        />
        <Route
          path="/:stream/:seoSlug"
          element={
            withSmoothScroll(<ListingPage
              colleges={colleges}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochure}
            />)
          }
        />










        {/* ALL COLLEGES */}
        <Route
          path="/colleges"
          element={
            withSmoothScroll(<ListingPage
              colleges={colleges}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochure}
            />)
          }
        />
        {/* ================= OLD URL → SEO REDIRECTS ================= */}

        <Route
          path="/colleges/:streamSlug"
          element={<OldCollegesRedirect />}
        />

        <Route
          path="/colleges/:streamSlug/:locationSlug"
          element={<OldCollegesRedirect withLocation />}
        />
        {/* ================= PRIMARY SEO LISTING ROUTES ================= */}

        {/* This route will now match both:
    1. /mba/top-mba-colleges
    2. /mba/top-mba-colleges-in-delhi-ncr 

<Route
  path="/:streamSlug/:seoSlug"
  element={
    <ListingPage
      colleges={colleges}
      compareList={compareList}
      onCompareToggle={handleCompareToggle}
      onOpenApplyNow={handleApplyNow}
      onOpenBrochure={handleBrochure}
    />
  }
/>
*/}

        {/* <Route
  path="/:courseSlug-colleges/:collegeSlug"
  element={
    <DetailPage
      colleges={colleges}
      compareList={compareList}
      onCompareToggle={handleCompareToggle}
      onOpenApplyNow={handleApplyNow}
      onOpenBrochure={handleBrochure}
    />
  }
/> */}



        <Route
          path="/university/:collegeIdSlug"
          element={
            withSmoothScroll(<DetailPage
              colleges={colleges}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochure}
            />)
          }
        />
      

        <Route
          path="/courses"
          element={<CoursesPage 
             onOpenApplyNow={handleApplyNow} />}
        />

      <Route
  path="/university/:collegeIdSlug/:courseSlug"
  element={<LegacyUniversityCourseRedirect />}
/>
      <Route
  path="/university/:collegeIdSlug/course/:courseSlug"
  element={
    withSmoothScroll(<DetailPage
      colleges={colleges}
      compareList={compareList}
      onCompareToggle={handleCompareToggle}
      onOpenApplyNow={handleApplyNow}
      onOpenBrochure={handleBrochure}
    />)
  }
/>

        <Route
          path="/exams"
          element={<ExamsPage exams={exams} />}
        />

       
        <Route
  path="/exams/:examSlug"
  element={<ExamDetailPage exams={exams} />}
/>


        <Route
          path="/blog"
          element={<BlogPage blogs={blogs} />}
        />

       <Route
  path="/blog/:blogSlug"
  element={<BlogDetailPage blogs={blogs} />}
/>


        <Route
          path="/compare"
          element={
            <ComparePage
              colleges={colleges}
              compareList={compareList}
            />
          }
        />

        <Route path="*" element={<ErrorBoundary />} />
      </Routes>
      </Suspense>

      {/* ================= APPLY MODAL ================= */}
      {applyModalOpen && (
        <Suspense fallback={null}>
          <ApplyNowModal
            isOpen={applyModalOpen}
            mode={applyMode}
            onClose={() => {
              sessionStorage.setItem(getPopupKeyForRoute(location.pathname), "1");
              setApplyModalOpen(false);
            }}
          />
        </Suspense>
      )}

      {/* ================= FOOTER ================= */}
      {!isLanding && (showDeferredUi || location.pathname !== "/") && (
        <Suspense fallback={null}>
          <Footer
            exams={exams}
            colleges={colleges}
            hideNewsletterOnMobile={hideNewsletterOnMobile}
          />
        </Suspense>
      )}
      {showDeferredUi && (
        <Suspense fallback={null}>
          <ChatbotWidget />
        </Suspense>
      )}
      {showDeferredUi && (
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      )}
    </>
  );

};

export default App;
