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
    city:"",
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
    setFormData({ name: "", email: "", phone: "", course: "" , city:""});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="
          relative w-full max-w-4xl rounded-[28px]
          bg-[#F2F5FA]
          text-gray-900
          shadow-[0_50px_120px_rgba(0,0,0,0.35)]
          px-6 py-6 md:px-12 md:py-6
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full
                     text-gray-500
                     flex items-center justify-center
                     hover:bg-gray-200 transition"
        >
          ✕
        </button>

        {!isSubmitted ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* LEFT */}
           <div className="hidden md:flex items-center justify-center rounded-[22px]
                bg-[#1E40AF] relative overflow-hidden p-10">

  {/* Decorative circles */}
  <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/30 rounded-full"></div>
  <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 bg-indigo-400/20 rounded-full"></div>

  {/* Content */}
  <div className="relative z-10 text-center text-white max-w-sm">
    <img
      src={APPLY_MODAL_IMAGE_SRC}
      alt="Student Illustration"
      loading="eager"
      decoding="async"
      fetchPriority="high"
      width={512}
      height={512}
      className="mx-auto w-72"
    />

    <h2 className="mt-8 text-2xl font-semibold leading-snug">
      Start Your Academic Journey
    </h2>

    <p className="mt-3 text-sm text-blue-100">
      Discover colleges, courses & expert guidance tailored for you
    </p>
  </div>
</div>


            {/* RIGHT FORM */}
            <div className="bg-white rounded-2xl p-7 md:p-9 shadow-md">
              <h2 className="text-xl font-semibold text-center mb-1">
                {mode === "brochure"
                  ? "Register to Download Brochure"
                  : "Connect With Us Today"}
              </h2>

              <p className="text-center text-gray-500 text-sm mb-6">
                Get details and latest updates
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  name="name"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-light"
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-light"
                />

                <input
                  name="phone"
                  type="tel"
                  placeholder="Mobile Number"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-light"
                /> 
 <input
                  name="city"
                  type="text"
                  placeholder="City"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="input-light"
                />
                <select
                  name="course"
                  required
                  value={formData.course}
                  onChange={handleChange}
                  className="input-light"
                >
                  <option value="">Preferred Course Level</option>
                  <option>Undergraduate</option>
                  <option>Postgraduate</option>
                  <option>Diploma</option>
                </select>

                <label className="flex items-start gap-2 text-xs text-gray-600">
                  <input type="checkbox" required />
                  <span >I agree to <a 
                  target="_blank"
  rel="noopener noreferrer"
                  href="https://www.termsfeed.com/live/417bdd06-e677-4181-b70f-efa4edb0e654" className="text-blue-600 hover:underline">Terms & Privacy Policy</a></span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full mt-2 py-3 rounded-xl font-semibold text-white
                    bg-gradient-to-r from-orange-500 to-orange-600
                    hover:from-orange-600 hover:to-orange-700
                    shadow-md shadow-orange-500/30
                    transition disabled:opacity-60
                  "
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
        ) : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="mt-2 text-gray-600">
              Our team will contact you shortly.
            </p>

            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-xl py-3
                         font-semibold text-white
                         bg-orange-500 hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* INPUT STYLE */}
      <style>
        {`
          .input-light {
            width: 100%;
            padding: 0.75rem 0.95rem;
            border-radius: 0.75rem;
            border: 1px solid #D1D5DB;
            background: #FFFFFF;
            font-size: 14px;
            color: #111827;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .input-light::placeholder {
            color: #9CA3AF;
          }

          .input-light:focus {
            border-color: #F97316;
            box-shadow: 0 0 0 3px rgba(249,115,22,0.15);
          }
        `}
      </style>
    </div>
  );
};

export default ApplyNowModal;
