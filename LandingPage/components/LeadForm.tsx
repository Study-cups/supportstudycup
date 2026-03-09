import React, { useState } from 'react';

const LeadForm: React.FC<{ id?: string; className?: string }> = ({ id, className }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    city: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("https://studycupsbackend-wb8p.onrender.com/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          course: formData.program, // ✅ mapping FIX
          city: formData.city
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Submission failed");
      }

      setSubmitted(true); // ✅ success UI
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUCCESS UI ================= */
  if (submitted) {
    return (
      <div
        id={id}
        className={`bg-white rounded-xl shadow-2xl p-6 sm:p-8 border border-green-100 flex flex-col items-center justify-center text-center min-h-[400px] ${className}`}
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
          Application Received!
        </h3>
        <p className="text-sm text-slate-500">
          Our senior counselor will call you within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-blue-600 font-semibold hover:underline"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  /* ================= FORM UI ================= */
  return (
    <div
      id={id}
      className={`landing-root bg-white rounded-lg shadow-2xl p-6 sm:p-8 border border-slate-700 ${className}`}
    >
      <div className="mb-6 text-center">
     <h3 className="text-blue-900 text-lg sm:text-[26px] font-semibold whitespace-nowrap">
  Apply Now For Top B-Schools
</h3>

      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          placeholder="Enter Name"
          className="w-full px-4 py-3.5 rounded-lg border"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />

        <input
          required
          type="email"
          placeholder="Enter Email"
          className="w-full px-4 py-3.5 rounded-lg border"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />

        <input
          required
          placeholder="Enter Phone No."
          className="w-full px-4 py-3.5 rounded-lg border"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
        />

        <select
          required
          className="w-full px-4 py-3.5 rounded-lg border"
          value={formData.program}
          onChange={e => setFormData({ ...formData, program: e.target.value })}
        >
          <option value="" disabled>Program Interested</option>
          <option value="MBA">MBA</option>
          <option value="PGDM">PGDM</option>
          <option value="Executive Management">Executive Management</option>
        </select>

        <input
          required
          placeholder="Your Current City"
          className="w-full px-4 py-3.5 rounded-lg border"
          value={formData.city}
          onChange={e => setFormData({ ...formData, city: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#ff6b00] text-white font-black py-4 rounded-lg text-xl"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;
