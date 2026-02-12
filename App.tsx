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




/* ===== API ===== */
const API_BASE = "https://studycupsbackend-wb8p.onrender.com/api";

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



  const handleCompareToggle = (id: string) => {
    setCompareList((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleApplyNow = () => {
    setApplyMode("apply");
    setApplyModalOpen(true);
  };

  const handleBrochure = (college) => {
    setApplyMode("brochure");
    setApplyModalOpen(true);
    console.log("BROCHURE CLICKED");

  };

  const handleBrochureSimple = () => {
    setApplyMode("brochure");
    setApplyModalOpen(true);
    console.log("BROCHURE SIMPLE");
  };



  /* 🔥 GLOBAL DATA – FAST (ONLY ONCE) */
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/colleges`).then(r => r.json()),
      fetch(`${API_BASE}/exams`).then(r => r.json()),
      fetch(`${API_BASE}/blogs`).then(r => r.json()),
    ])
      .then(([c, e, b]) => {
        console.log("APP.TSX → colleges API:", c);
        console.log("APP.TSX → exams API:", e);

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
    console.log("❌ Popup blocked for page:", pathname);
    return;
  }

  const onScroll = () => {
    const scrollTop =
      window.pageYOffset || document.documentElement.scrollTop;

    const windowHeight = window.innerHeight;
    const fullHeight = document.body.scrollHeight;

    const scrollPercent =
      ((scrollTop + windowHeight) / fullHeight) * 100;

    console.log("📜 Scroll %:", scrollPercent.toFixed(2));

    if (scrollPercent >= 20) {
      console.log("✅ Popup opened on:", pathname);

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
              loading={loading}   // 👈 pass loading instead of blocking
              onOpenBrochure={handleBrochure} // ✅ GLOBAL HANDLER 
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
          path="/courses/:categorySlug/:courseSlug"
          element={
            <CourseDetailPage
              colleges={colleges}
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
          element={<CoursesPage colleges={colleges} />}
        />



        <Route
          path="/exams"
          element={<ExamsPage exams={exams} />}
        />

        <Route
          path="/exam/:id"
          element={<ExamDetailPage />}
        />

        <Route
          path="/blog"
          element={<BlogPage blogs={blogs} />}
        />

        <Route
          path="/blog/:id"
          element={<BlogDetailPage />}
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

      {/* ================= APPLY MODAL ================= */}
      <ApplyNowModal
        isOpen={applyModalOpen}
        mode={applyMode}
        onClose={() => {
          sessionStorage.setItem(getPopupKeyForRoute(location.pathname), "1");
          setApplyModalOpen(false);
        }}
      />

      {/* ================= FOOTER ================= */}
      {!isLanding && <Footer exams={exams} colleges={colleges} />}

    </>
  );

};

export default App;
