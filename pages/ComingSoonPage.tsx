import React from "react";
import { useNavigate } from "react-router-dom";

const ComingSoonPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2952] to-[#1e4a7a] text-white px-4">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-extrabold mb-3">Coming Soon</h1>
        <p className="text-white/70 text-lg mb-8">
          We're working hard on this feature. Stay tuned — it'll be live shortly!
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-amber-400 text-[#0f2952] font-bold rounded-full text-sm hover:bg-amber-300 transition"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;
