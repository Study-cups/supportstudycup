import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fb] px-4 text-center">
      <img src="/logos/StudyCups.png" alt="StudyCups" className="h-12 mb-8" />

      <div className="text-[120px] font-extrabold text-[#1E4A7A]/10 leading-none select-none">
        404
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#0f2952] -mt-4 mb-3">
        Page Not Found
      </h1>
      <p className="text-slate-500 text-base max-w-sm mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-[#1E4A7A] text-white font-semibold rounded-full text-sm hover:bg-[#163d6b] transition"
        >
          Go to Home
        </button>
        <button
          onClick={() => navigate("/colleges")}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-full text-sm hover:bg-slate-100 transition"
        >
          Browse Colleges
        </button>
        <button
          onClick={() => navigate("/free-counselling")}
          className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-full text-sm hover:bg-slate-100 transition"
        >
          Free Counselling
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-sm text-[#1E4A7A] font-medium">
        {[
          { label: "Engineering Colleges", path: "/engineering/top-colleges" },
          { label: "MBA Colleges", path: "/management/top-colleges" },
          { label: "Medical Colleges", path: "/medical/top-colleges" },
          { label: "Entrance Exams", path: "/exams" },
          { label: "All Courses", path: "/courses" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="hover:underline"
          >
            {item.label} →
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotFoundPage;
