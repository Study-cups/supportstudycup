import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

const ROICalculatorPage: React.FC = () => {
  const navigate = useNavigate();

  // ROI Calculator state
  const [totalFees, setTotalFees] = useState("1200000");
  const [duration, setDuration] = useState("2");
  const [expectedSalary, setExpectedSalary] = useState("800000");
  const [currentSalary, setCurrentSalary] = useState("0");

  // EMI Calculator state
  const [loanAmount, setLoanAmount] = useState("1000000");
  const [interestRate, setInterestRate] = useState("9.5");
  const [loanTenure, setLoanTenure] = useState("7");
  const [activeTab, setActiveTab] = useState<"roi" | "emi">("roi");

  const roiResults = useMemo(() => {
    const fees = parseFloat(totalFees) || 0;
    const salary = parseFloat(expectedSalary) || 0;
    const prevSalary = parseFloat(currentSalary) || 0;
    const years = parseFloat(duration) || 1;

    const incrementalSalary = salary - prevSalary;
    const annualROI = fees > 0 ? ((incrementalSalary / fees) * 100) : 0;
    const paybackMonths = incrementalSalary > 0 ? Math.ceil((fees / (incrementalSalary / 12))) : 0;
    const fiveYearGain = (incrementalSalary * 5) - fees;
    const tenYearGain = (incrementalSalary * 10) - fees;
    const roiMultiple = fees > 0 ? (incrementalSalary / fees).toFixed(1) : "0";

    return { annualROI, paybackMonths, fiveYearGain, tenYearGain, roiMultiple, incrementalSalary };
  }, [totalFees, expectedSalary, currentSalary, duration]);

  const emiResults = useMemo(() => {
    const principal = parseFloat(loanAmount) || 0;
    const rate = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = (parseFloat(loanTenure) || 1) * 12;

    if (rate === 0) return { emi: principal / n, totalPayable: principal, totalInterest: 0 };

    const emi = (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - principal;

    return { emi, totalPayable, totalInterest };
  }, [loanAmount, interestRate, loanTenure]);

  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7]">
      <Helmet>
        <title>ROI Calculator & Education Loan EMI Calculator 2026 | StudyCups</title>
        <meta name="description" content="Calculate your MBA/B.Tech education ROI and EMI for education loans. Know your payback period, salary gain and return on investment before choosing a college." />
        <meta name="keywords" content="education ROI calculator, college ROI India, MBA ROI calculator, education loan EMI, B.Tech ROI, college fee calculator 2026, StudyCups" />
        <link rel="canonical" href="https://studycups.in/roi-calculator" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="ROI & EMI Calculator for Education 2026 | StudyCups" />
        <meta property="og:description" content="Calculate your education return on investment and loan EMI. Free tool." />
        <meta property="og:url" content="https://studycups.in/roi-calculator" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />
      </Helmet>

      {/* HERO */}
      <section className="relative md:mt-[100px] mt-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-amber-400/10 blur-[60px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-5xl mx-auto px-4 py-7 md:py-10 text-center">
          <nav aria-label="breadcrumb" className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
            <a href="/" className="hover:text-white transition">Home</a>
            <span>/</span>
            <span className="text-amber-400 font-medium">ROI & EMI Calculator</span>
          </nav>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">FREE CALCULATOR · EDUCATION RETURNS</span>
          </div>
          <h1 className="text-[26px] sm:text-[34px] md:text-[42px] font-extrabold leading-tight text-white mb-3">
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">ROI & EMI</span> Calculator
          </h1>
          <p className="text-white/65 text-[13px] md:text-[15px] leading-relaxed max-w-xl mx-auto">
            Calculate your <strong className="text-white/90">education return on investment</strong> and education loan EMI before choosing your college.
          </p>
        </div>
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f2f4f7">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 pb-16">
        {/* Tab selector */}
        <div className="flex gap-2 mb-6 bg-white border border-slate-100 rounded-2xl p-1.5 w-fit shadow-sm">
          {([["roi", "📈 ROI Calculator"], ["emi", "🏦 EMI Calculator"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#1f4fa8] to-[#0a214a] text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "roi" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* ROI Inputs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-[16px] font-bold text-slate-900 mb-5">📊 ROI Inputs</h2>
              {[
                { label: "Total Course Fees (₹)", value: totalFees, setter: setTotalFees, placeholder: "e.g. 1200000" },
                { label: "Course Duration (Years)", value: duration, setter: setDuration, placeholder: "e.g. 2" },
                { label: "Expected Package After Degree (₹/yr)", value: expectedSalary, setter: setExpectedSalary, placeholder: "e.g. 800000" },
                { label: "Current Salary / Before Degree (₹/yr)", value: currentSalary, setter: setCurrentSalary, placeholder: "e.g. 0 (if fresher)" },
              ].map(field => (
                <div key={field.label} className="mb-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{field.label}</label>
                  <input
                    type="number"
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10"
                  />
                </div>
              ))}
            </div>

            {/* ROI Results */}
            <div className="space-y-4">
              {[
                { label: "ROI Multiple", value: `${roiResults.roiMultiple}x`, desc: "Return per rupee invested", color: "from-emerald-500 to-teal-600", icon: "📈" },
                { label: "Annual ROI %", value: `${roiResults.annualROI.toFixed(1)}%`, desc: "Return on investment per year", color: "from-blue-500 to-indigo-600", icon: "💹" },
                { label: "Payback Period", value: roiResults.paybackMonths > 0 ? `${Math.floor(roiResults.paybackMonths / 12)}yr ${roiResults.paybackMonths % 12}mo` : "N/A", desc: "Time to recover course fees", color: "from-amber-400 to-orange-500", icon: "⏱️" },
                { label: "5-Year Net Gain", value: fmt(Math.max(0, roiResults.fiveYearGain)), desc: "Salary gain minus fees (5 years)", color: "from-violet-500 to-purple-600", icon: "💰" },
                { label: "10-Year Net Gain", value: fmt(Math.max(0, roiResults.tenYearGain)), desc: "Salary gain minus fees (10 years)", color: "from-rose-500 to-pink-600", icon: "🚀" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl flex-shrink-0`}>{stat.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-[22px] font-extrabold text-slate-900 leading-none">{stat.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "emi" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* EMI Inputs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-[16px] font-bold text-slate-900 mb-5">🏦 Loan EMI Inputs</h2>
              {[
                { label: "Loan Amount (₹)", value: loanAmount, setter: setLoanAmount, placeholder: "e.g. 1000000" },
                { label: "Annual Interest Rate (%)", value: interestRate, setter: setInterestRate, placeholder: "e.g. 9.5" },
                { label: "Loan Tenure (Years)", value: loanTenure, setter: setLoanTenure, placeholder: "e.g. 7" },
              ].map(field => (
                <div key={field.label} className="mb-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{field.label}</label>
                  <input
                    type="number"
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#1f4fa8] focus:ring-2 focus:ring-[#1f4fa8]/10"
                  />
                </div>
              ))}
              <div className="bg-blue-50 rounded-xl p-3 mt-2">
                <p className="text-[11px] text-blue-700 font-semibold">💡 Tip: SBI Education Loan rate is 8.15%–11.15%. Check with your bank for exact rates.</p>
              </div>
            </div>

            {/* EMI Results */}
            <div className="space-y-4">
              {[
                { label: "Monthly EMI", value: fmt(emiResults.emi), desc: "Amount payable every month", color: "from-blue-500 to-indigo-600", icon: "📅" },
                { label: "Total Payable", value: fmt(emiResults.totalPayable), desc: "Principal + total interest", color: "from-amber-400 to-orange-500", icon: "💳" },
                { label: "Total Interest", value: fmt(emiResults.totalInterest), desc: "Extra cost of borrowing", color: "from-rose-500 to-pink-600", icon: "📊" },
                { label: "Loan Amount", value: fmt(parseFloat(loanAmount) || 0), desc: "Principal borrowed", color: "from-emerald-500 to-teal-600", icon: "🏦" },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl flex-shrink-0`}>{stat.icon}</div>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-[22px] font-extrabold text-slate-900 leading-none">{stat.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stat.desc}</p>
                  </div>
                </div>
              ))}
              <div className="bg-gradient-to-br from-[#0a214a] to-[#1f4fa8] rounded-2xl p-4 text-center">
                <p className="text-white font-bold text-[14px] mb-1">Worried about fees?</p>
                <p className="text-white/60 text-[12px] mb-3">We help students find scholarships & affordable colleges</p>
                <button onClick={() => navigate("/free-counselling")} className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] font-bold rounded-xl text-[12px]">
                  Get Free Guidance →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ROICalculatorPage;
