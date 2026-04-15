import React, { useState } from 'react';

const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("https://studycupsbackend-wb8p.onrender.com/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            let data: any = {};
            try { data = await res.json(); } catch { /* no json */ }

            if (!res.ok) throw new Error(data?.message || "API request failed");

            setIsSubmitted(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(10,33,74,0.10)] border border-slate-100 h-full flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Message Sent!</h2>
                <p className="mt-3 text-slate-500 text-sm max-w-xs leading-relaxed">
                    Thank you for reaching out. Our counsellors will respond within <strong>24 hours</strong>.
                </p>
                <button
                    onClick={() => setIsSubmitted(false)}
                    className="mt-7 px-7 py-2.5 rounded-full bg-[#1f4fa8] text-white text-sm font-semibold hover:bg-[#163a85] transition"
                >
                    Send Another Message
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(10,33,74,0.10)] border border-slate-100 overflow-hidden">

            {/* ── Form Header ── */}
            <div className="bg-gradient-to-r from-[#0a214a] to-[#1f4fa8] px-7 py-5">
                <p className="text-[11px] font-bold tracking-[0.12em] text-blue-300 uppercase mb-1">Free Counselling</p>
                <h3 className="text-lg font-bold text-white leading-snug">
                    Ask Us Anything About Admissions
                </h3>
                <p className="text-blue-200 text-xs mt-1">
                    MBA · B.Tech · MBBS · Law · BBA · BCA — We're here to guide you.
                </p>
            </div>

            {/* ── Form Body ── */}
            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">

                {/* Name + Email — 2 column on md+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Full Name */}
                    <div className="relative">
                        <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm
                                           focus:outline-none focus:ring-2 focus:ring-[#1f4fa8]/40 focus:border-[#1f4fa8] transition placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                            Email Address <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@email.com"
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm
                                           focus:outline-none focus:ring-2 focus:ring-[#1f4fa8]/40 focus:border-[#1f4fa8] transition placeholder-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subject" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        I'm inquiring about <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            name="subject"
                            id="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="e.g. MBA Admission, MBBS Counselling, Fee Structure..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-[#1f4fa8]/40 focus:border-[#1f4fa8] transition placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Your Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        name="message"
                        id="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your academic background, preferred colleges, target course or any specific questions..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none
                                   focus:outline-none focus:ring-2 focus:ring-[#1f4fa8]/40 focus:border-[#1f4fa8] transition placeholder-slate-400"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide
                               bg-gradient-to-r from-[#f59e0b] to-[#d97706]
                               shadow-[0_6px_20px_rgba(217,119,6,0.35)]
                               transition-all duration-200
                               ${loading
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:shadow-[0_10px_28px_rgba(217,119,6,0.45)] hover:-translate-y-0.5"
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Sending…
                        </span>
                    ) : "Send Message — Get Free Guidance"}
                </button>

                {/* Trust line */}
                <p className="text-center text-[11px] text-slate-400">
                    🔒 Your data is private &amp; secure. No spam, ever.
                </p>

            </form>
        </div>
    );
};

export default ContactForm;
