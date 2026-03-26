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
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

        // SAFER JSON HANDLING
        let data: any = {};
        try {
            data = await res.json();
        } catch {
        }

        if (!res.ok) {
            throw new Error(data?.message || "API request failed");
        }

        // Success
        setIsSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });

    } catch (err: any) {
        setError(err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
};


    if (isSubmitted) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border h-full flex flex-col items-center justify-center text-center">
                <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="mt-6 text-2xl font-bold text-slate-800">Thank You!</h2>
                <p className="mt-2 text-slate-600">Your message has been sent. We will get back to you shortly.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Full Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 
                                   focus:outline-none focus:ring-2 focus:ring-[#0F2D52] transition"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 
                                   focus:outline-none focus:ring-2 focus:ring-[#0F2D52] transition"
                    />
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                        Subject
                    </label>
                    <input
                        type="text"
                        name="subject"
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Enter subject"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 
                                   focus:outline-none focus:ring-2 focus:ring-[#0F2D52] transition"
                    />
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                        Message
                    </label>
                    <textarea
                        name="message"
                        id="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Write your message here..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 
                                   focus:outline-none focus:ring-2 focus:ring-[#0F2D52] transition"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                )}

                {/* Submit Button */}
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full px-6 py-3 font-semibold text-white bg-[#f0a018] 
                                   rounded-xl shadow-lg transition-all duration-300
                                   ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#e09010]"}`}
                    >
                        {loading ? "Submitting..." : "Submit Query"}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ContactForm;
