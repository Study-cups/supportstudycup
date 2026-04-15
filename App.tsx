import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

/* ===== COMMON COMPONENTS ===== */
import Header from "./components/Header";
import Footer from "./components/Footer";
import ApplyNowModal from "./components/ApplyNowModal";
import LandingApp from "./LandingPage/LandingApp"; 

/* ===== PAGES ===== */
import HomePage from "./pages/HomePage";
import ListingPage from "./pages/ListingPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import ExamsPage from "./pages/ExamsPage";
import ExamDetailPage from "./pages/ExamDetailPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import ComparePage from "./pages/ComparePage";
import DetailPage from "./pages/DetailPage";
import ErrorBoundary from "./pages/ErrorBoundary";
import CollegePredictorPage from "./pages/CollegePredictorPage";
import ROICalculatorPage from "./pages/ROICalculatorPage";
import NIRFInsightsPage from "./pages/NIRFInsightsPage";
import AICollegeFinderPage from "./pages/AICollegeFinderPage";
import FreeCounsellingPage from "./pages/FreeCounsellingPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import NotFoundPage from "./pages/NotFoundPage";
import ChatbotWidget from "./components/ChatWidget";
import CTASection from "./components/CTASection";

/* ===== TYPES ===== */
import type { College } from "./types";
import { useParams } from "react-router-dom";
const toSeoSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.\s]+/g, "-")   // 🔥 removes dots AND spaces
    .replace(/\//g, "-")
    .replace(/--+/g, "-");

const getPopupKeyForRoute = (pathname: string) =>
`popup_shown_${pathname}`;

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

  const handleBrochure = (college) => {
    setApplyMode("brochure");
    setApplyModalOpen(true);
  };

  const handleBrochureSimple = () => {
    setApplyMode("brochure");
    setApplyModalOpen(true);
  };



  /* 🔥 GLOBAL DATA – FAST (ONLY ONCE) */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/colleges?all=true`).then(r => r.json()),
      fetch(`${API_BASE}/exams`).then(r => r.json()),
      fetch(`${API_BASE}/blogs`).then(r => r.json()),
    ])
      .then(([c, e, b]) => {
        // 🔥 DIRECT SET — NO GUARDS
        setColleges(c.data);
        setExams(e.data);
        setBlogs(b.data);
      })
      .catch(err => {
        console.error("API ERROR", err);
      })
      .finally(() => setLoading(false));
  }, []);

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

      <Routes>

        <Route path="/registration" element={<LandingApp />} />
        <Route
          path="/"
          element={
            <HomePage
              colleges={colleges}
              exams={exams}
              blogs={blogs}
              loading={loading}
              onOpenBrochure={handleBrochure}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
            />
          }
        />




        {/* ================= PRIMARY SEO LISTING ROUTES ================= */}

        <Route
          path="/:stream/top-colleges"
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

        {/* 🔁 LEGACY SEO REDIRECT - removed: caused RR v7 to match all single-segment paths */}

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
            <ListingPage
              colleges={colleges}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochure}
            />
          }
        />










        {/* ALL COLLEGES */}
        <Route
          path="/colleges"
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
            <DetailPage
              colleges={colleges}
              compareList={compareList}
              onCompareToggle={handleCompareToggle}
              onOpenApplyNow={handleApplyNow}
              onOpenBrochure={handleBrochure}
            />
          }
        />
      

        <Route
          path="/courses"
          element={<CoursesPage />}
        />

      <Route
  path="/university/:collegeIdSlug/:courseSlug"
  element={
    <DetailPage
      colleges={colleges}
      compareList={compareList}
      onCompareToggle={handleCompareToggle}
      onOpenApplyNow={handleApplyNow}
      onOpenBrochure={handleBrochure}
    />
  }
/>
      <Route
  path="/university/:collegeIdSlug/course/:courseSlug"
  element={
    <DetailPage
      colleges={colleges}
      compareList={compareList}
      onCompareToggle={handleCompareToggle}
      onOpenApplyNow={handleApplyNow}
      onOpenBrochure={handleBrochure}
    />
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

        <Route path="/college-predictor" element={<CollegePredictorPage />} />
        <Route path="/roi-calculator" element={<ROICalculatorPage />} />
        <Route path="/nirf-insights" element={<NIRFInsightsPage />} />
        <Route path="/ai-college-finder" element={<AICollegeFinderPage />} />
        <Route path="/free-counselling" element={<FreeCounsellingPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/events" element={<Navigate to="/coming-soon" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* ================= APPLY MODAL ================= */}
      <ApplyNowModal
        isOpen={applyModalOpen}
        mode={applyMode}
        onClose={() => {
          sessionStorage.setItem(getPopupKeyForRoute(location.pathname), "1");
          setApplyModalOpen(false);
        }}
      />

      {/* ================= CTA SECTION ================= */}
      {!isLanding && <CTASection />}

      {/* ================= FOOTER ================= */}
      {!isLanding && (
        <Footer
          exams={exams}
          colleges={colleges}
          hideNewsletterOnMobile={hideNewsletterOnMobile}
        />
      )}
  <ChatbotWidget />
    </>
  );

};

export default App;
