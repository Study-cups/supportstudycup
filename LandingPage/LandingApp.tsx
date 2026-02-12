
import React, { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import LeadForm from './components/LeadForm';
import CollegeCard from './components/CollegeCard';
import FAQSection from './components/FAQSection';
import StickyFooter from './components/StickyFooter';
import PopupForm from './components/PopupForm';
import SuccessCarousel from './components/SuccessCarousel';
import { Helmet } from "react-helmet-async";

import { COLLEGES, TESTIMONIALS, PARTNERS, FAQS } from './constants';
import './components/Landing.css';

const App: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('studycups_popup_seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsPopupOpen(true);
        sessionStorage.setItem('studycups_popup_seen', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (  
    <>
    <Helmet>
      <title>Best MBA Admission Consultants in India | StudyCups</title>
      <meta
        name="description"
        content="StudyCups helps students get admission in top MBA and PGDM colleges in India with expert counseling, eligibility checks, and scholarship support."
      />
    </Helmet>

   <div className="min-h-screen flex flex-col pb-24 md:pb-32 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden bg-white">

      <Ticker />
      <PopupForm isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />

      {/* Brand Header */}
      <div className="flex justify-between items-center px-4 py-4 bg-white max-w-7xl mx-auto w-full border-b border-slate-50 relative z-[60]">
        <div className="flex items-center">
          <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#3b5998] hover:opacity-80 transition-opacity cursor-pointer">
            Study<span className="text-orange-600">cups</span>
          </span>
        </div>
        <button 
          onClick={openPopup}
          className="bg-[#3b5998] text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-black text-xs sm:text-sm tracking-tight hover:bg-blue-800 transition-all uppercase shadow-lg active:scale-95 bg-gradient-to-r from-pink-500 via-orange-500 to-orange-600
shadow-lg shadow-orange-500/30
active:scale-95 transition-all"
        >
          APPLY NOW
        </button>
      </div>

      {/* Hero Section - Refined Typography & Spacing */}
     <section className="relative px-4 pt-4 md:pt-6 pb-8 mobile-hero-bg overflow-hidden flex items-center">

        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-50 rounded-full blur-[100px] opacity-40 -z-10"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-orange-50 rounded-full blur-[100px] opacity-40 -z-10"></div>

        <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10 w-full">
          {/* Headline Area - Improved Leading and Kerning to prevent clipping */}
       <div className="text-center mb-6 sm:mb-8 px-4">

         <h2 className="text-[#3b5998] text-2xl sm:text-5xl font-[900] tracking-tight leading-tight mb-2">

              MBA / PGDM
            </h2>
            <p className="text-slate-800 text-lg sm:text-3xl lg:text-4xl font-bold tracking-tight opacity-90 mt-0">
              Admissions Open <span className="text-orange-600">2026-28</span>
            </p>
            <div className="h-1.5 w-24 bg-orange-500 mx-auto mt-0 md:mt-6 rounded-full"></div>
          </div>

     <div className="flex flex-col lg:flex-row items-stretch justify-center gap-0 lg:gap-10">


            {/* Left Column: Visual Features */}
            <div className="relative w-full lg:w-1/2 flex justify-center">
              {/* Decorative Geometric Shapes */}
              <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-600/5 rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-blue-100"></div>
              
            <div className="relative z-20 w-full max-w-[340px] sm:max-w-[380px]">

                {/* Feature Info Card */}
             <div className="bg-white rounded-t-[2.5rem] rounded-b-none shadow-md overflow-hidden border border-slate-100">

              <div className="w-full flex justify-center">
  <img
    src="https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTAxL3Jhd3BpeGVsb2ZmaWNlMTJfcGhvdG9fb2ZfeW91bmdfaW5kaWFuX2dpcmxfaG9sZGluZ19zdHVkZW50X2JhY19hNDdmMzk1OS0zZDAyLTRiZWEtYTEzOS1lYzI0ZjdhNjEwZGFfMS5qcGc.jpg"
    alt="MBA Student"
    className="block mx-auto max-w-[220px] sm:max-w-full"
  />
</div>

                  
              <ul className="p-6 sm:p-8 space-y-4 sm:space-y-5 flex hidden md:block">

                    <li className="flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <svg className="w-7 h-7 text-[#00529b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="leading-tight"><span className="text-[#00529b]">AICTE & UGC</span> Recognized</p>
                    </li>
                    <li className="flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <svg className="w-7 h-7 text-[#00529b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <p className="leading-tight"><span className="text-[#00529b]">367+</span> Hiring Partners</p>
                    </li>
                    <li className="flex items-center gap-5 group">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <svg className="w-7 h-7 text-[#00529b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="leading-tight"><span className="text-[#00529b]">Dual Major</span> Options</p>
                    </li>
                  </ul>
                  
                  <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 text-center">
                    <p className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400">Premium Professional Guidance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Lead Form Area */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end z-30">
              <div className="w-full max-w-[460px]">
                <LeadForm id="lead-form" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preferred B-Schools Listing */}
      <section className="bg-slate-900 py-10 sm:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">Elite B-Schools in <span className="text-blue-400">Delhi-NCR</span></h2>
              <p className="text-slate-400 text-base sm:text-xl font-medium">
                Premier campuses accepting applications for the 2026-28 cohort.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="h-1.5 w-12 bg-blue-500 rounded-full"></span>
              <p className="text-white font-bold uppercase tracking-[0.25em] text-xs sm:text-sm">8 Elite Partners</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
            {COLLEGES.map((college) => (
              <CollegeCard key={college.id} college={college} onApply={openPopup} />
            ))}
          </div>
        </div>
        {/* Dark Section Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      </section>

      {/* Program Specializations */}
      <section className="py-0 sm:py-32 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <span className="text-blue-600 font-extrabold uppercase tracking-[0.4em] text-[10px] sm:text-xs">Curated Excellence</span>
             <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 mb-6">Core Specializations</h2>
             <div className="h-1.5 w-20 bg-orange-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {[
              { title: 'Business Analytics', icon: '📊', color: 'bg-blue-50/50' },
              { title: 'Investment Banking', icon: '💰', color: 'bg-green-50/50' },
              { title: 'Digital Marketing', icon: '📱', color: 'bg-purple-50/50' },
              { title: 'HR Management', icon: '🤝', color: 'bg-orange-50/50' }
            ].map((spec) => (
              <div key={spec.title} className={`${spec.color} p-8 sm:p-10 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-500 group cursor-default text-center`}>
                <div className="text-4xl sm:text-6xl mb-6 group-hover:scale-110 transition-transform inline-block">{spec.icon}</div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 mb-3">{spec.title}</h3>
                <p className="text-xs sm:text-base text-slate-500 font-medium">Industry aligned syllabus for modern business.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Studycups? */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 sm:mb-20">
            <span className="text-orange-600 font-extrabold uppercase tracking-[0.5em] text-[10px] sm:text-xs">The Studycups Edge</span>
            <h2 className="text-4xl sm:text-7xl font-black text-slate-900 mt-5 mb-8 tracking-tight">Why <span className="text-[#3b5998]">Studycups?</span></h2>
            <p className="text-slate-500 max-w-3xl mx-auto text-base sm:text-xl font-medium leading-relaxed">
              We bridge the gap between aspirations and outcomes using deep data analysis and industry expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
            {[
              {
                title: "AI-Profile Matching",
                desc: "Data-driven matching of your profile with the best-fit college cutoffs.",
                icon: "⚡",
                color: "text-blue-600",
                bg: "bg-blue-100/40"
              },
              {
                title: "Direct Scholarships",
                desc: "Exclusive access to institutional aid and corporate-sponsored grants.",
                icon: "💎",
                color: "text-orange-600",
                bg: "bg-orange-100/40"
              },
              {
                title: "Expert Mentorship",
                desc: "1:1 coaching from IIM alumni to crack your interviews and GD rounds.",
                icon: "🏆",
                color: "text-green-600",
                bg: "bg-green-100/40"
              },
              {
                title: "No Consultant Fees",
                desc: "Our services are completely free for students. No hidden costs, ever.",
                icon: "🛡️",
                color: "text-purple-600",
                bg: "bg-purple-100/40"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all duration-500 group border border-slate-100 flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${feature.bg} flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform text-2xl`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Partners */}
      <section className="py-16 bg-white border-y border-slate-100 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-12">Premier Recruitment Partners</p>
          <div className="flex justify-center items-center gap-12 sm:gap-24 opacity-30 hover:opacity-100 transition-opacity flex-wrap">
            {PARTNERS.map((p) => (
              <img key={p.name} src={p.logo} alt={p.name} className="h-6 sm:h-10 grayscale hover:grayscale-0 transition-all object-contain" />
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 sm:py-32 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">Our <span className="text-orange-600">Alumni</span> Success</h2>
            <p className="text-slate-500 mt-5 text-base sm:text-xl">Students from our partner schools now at top global firms.</p>
          </div>
          <SuccessCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">Guidance Corner</h2>
            <p className="text-slate-500 font-medium text-base sm:text-xl">Expert answers to your most pressing admission questions.</p>
          </div>
          <FAQSection items={FAQS} />
          
          <div className="mt-20 bg-blue-900 rounded-[3rem] p-10 sm:p-20 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-5xl font-black mb-8 leading-tight">Secure Your Management <br className="hidden sm:block"/> Career Today</h3>
              <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-base sm:text-xl opacity-90 font-medium">
                Seats for the 2026 intake are filling fast. Register now for free personalized counseling and eligibility assessment.
              </p>
              <button 
                onClick={openPopup}
                className="w-full sm:w-auto bg-[#ff6b00] text-white font-black py-5 px-16 rounded-2xl text-lg sm:text-xl shadow-xl hover:bg-orange-600 transition-all transform active:scale-95 uppercase tracking-wide"
              >
                Apply Online Now
              </button>
            </div>
            {/* CTA Decorative Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
          </div>
        </div>
      </section>

      <StickyFooter />
    </div> 
    </>
  );
};

export default App;
