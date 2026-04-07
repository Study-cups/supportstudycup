import React, { useState, useEffect } from "react";

interface ApplyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "apply" | "brochure";
}

/* const API_BASE = "https://studycupsbackend-wb8p.onrender.com"; */
const API_BASE = "https://studycupsbackend-wb8p.onrender.com"; // LOCAL DEV
const APPLY_MODAL_IMAGE_SRC = "/images/Registeredimg-optimized.png";

let applyModalImagePromise: Promise<void> | null = null;

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const decodeIfPossible = () => {
      if (typeof image.decode === "function") {
        image.decode().catch(() => undefined).finally(finish);
        return;
      }
      finish();
    };

    image.onload = decodeIfPossible;
    image.onerror = finish;
    image.src = src;

    if (image.complete) {
      decodeIfPossible();
    }
  });

const preloadApplyNowModalImage = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!applyModalImagePromise) {
    applyModalImagePromise = preloadImage(APPLY_MODAL_IMAGE_SRC);
  }

  return applyModalImagePromise;
};

const ApplyNowModal: React.FC<ApplyNowModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    city: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void preloadApplyNowModalImage();
  }, []);

  /* 🔒 Prevent background scroll */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    sessionStorage.setItem("applyFormSubmitted", "true");
    try {
      const response = await fetch(`${API_BASE}/api/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          intent: mode,
        }),
      });

      if (!response.ok) {
        alert("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch {
      alert("Server error. Please try later.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setLoading(false);
    setFormData({ name: "", email: "", phone: "", course: "", city: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 transition-all"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-[2rem] bg-white text-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-20 h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 transition-colors shadow-sm"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSubmitted ? (
          <>
            {/* LEFT SIDE: Brand Branding & Illustration */}
            <div className="hidden md:flex flex-col items-center justify-center w-5/12 bg-[#0B2B5E] relative overflow-hidden p-10">
              {/* Background Geometric Shapes inspired by screenshot */}
              <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[#123b7a] rounded-bl-[100px] transform rotate-12 translate-x-1/4 -translate-y-1/4 opacity-50"></div>
              <div className="absolute bottom-[-10%] left-[-20%] w-64 h-64 bg-[#F5A623] rounded-full blur-3xl opacity-20"></div>
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center text-white">
                <img
                  src={APPLY_MODAL_IMAGE_SRC}
                  alt="Student Illustration"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-64 h-auto drop-shadow-2xl mb-8"
                />
                <h2 className="text-3xl font-bold leading-tight mb-3">
                  Find Your <span className="text-[#F5A623]">Dream</span> College
                </h2>
                <p className="text-[#93A5C9] text-base px-4">
                  Compare colleges, courses, fees, and real placement outcomes — all in one place.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE: Form */}
            <div className="w-full md:w-7/12 p-8 sm:p-12 bg-white relative">
              <div className="max-w-md mx-auto">
                <div className="mb-8 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {mode === "brochure"
                      ? "Register to Download Brochure"
                      : "Get Free Counselling"}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Fill out the form below and our experts will guide you to the right path.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      name="name"
                      placeholder="Full Name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all placeholder-slate-400"
                    />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Mobile Number"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all placeholder-slate-400"
                    />
                  </div>

                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all placeholder-slate-400"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      name="city"
                      type="text"
                      placeholder="City"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all placeholder-slate-400"
                    />
                    <select
                      name="course"
                      required
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                    >
                      <option value="" disabled className="text-slate-400">Select Course Level</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Diploma">Diploma</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-3 mt-4 mb-6 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required 
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-[#F5A623] focus:ring-[#F5A623]"
                    />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I agree to the{" "}
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654"
                        className="text-[#0B2B5E] font-medium hover:underline"
                      >
                        Terms & Privacy Policy
                      </a>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-[#F5A623] hover:bg-[#E09612] shadow-[0_8px_20px_rgba(245,166,35,0.25)] transition-all transform hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none text-base"
                  >
                    {loading
                      ? "Submitting..."
                      : mode === "brochure"
                      ? "REGISTER & DOWNLOAD"
                      : "Start My Journey"}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Thank You!</h2>
            <p className="text-slate-500 max-w-sm mb-8">
              Your details have been successfully submitted. Our academic counselor will contact you shortly.
            </p>
            <button
              onClick={handleClose}
              className="px-10 py-3 rounded-xl font-bold text-white bg-[#0B2B5E] hover:bg-[#123b7a] transition-colors shadow-md"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyNowModal;
