import React from "react";

const STATS = [
  { value: "50,000+", label: "Students Guided" },
  { value: "500+", label: "Partner Colleges" },
  { value: "98%", label: "Admission Success" },
  { value: "100%", label: "Free Counselling" },
];

const FEATURES = [
  "Personalised college shortlist based on your score & budget",
  "Expert guidance for MBA, B.Tech, MBBS, Law & Design admissions",
  "Scholarship & fee waiver assistance up to ₹1 Lakh",
  "Application strategy, SOP writing & deadline tracking",
];

const CTASection: React.FC = () => {
  return (
    <section
      aria-label="Free College Admission Counselling"
      className="relative overflow-hidden bg-[#0f2952]"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18)_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.10)_0%,transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-500/15 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 left-10 w-56 h-56 rounded-full bg-amber-400/10 blur-[70px]" />

      <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-16">

        {/* Top label */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/10 rounded-full px-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-300">
              100% Free · No Hidden Charges · Expert Counsellors
            </span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* LEFT — copy */}
          <div>
            <h2 className="text-[28px] sm:text-[34px] md:text-[42px] font-extrabold text-white leading-[1.15] mb-4">
              Get Expert{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                College Admission
              </span>{" "}
              Guidance — Completely Free
            </h2>

            <p className="text-white/60 text-[14px] sm:text-[15px] leading-relaxed mb-6 max-w-lg">
              India's most trusted college counselling platform. Our certified advisors
              help you navigate MBA, B.Tech, MBBS, Law & Design admissions — from
              shortlisting colleges to securing your seat.
            </p>

            {/* Feature checklist */}
            <ul className="space-y-2.5 mb-7">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[13px] text-white/75">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 text-emerald-400 text-[10px] font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <a
                href="tel:+918081269969"
                className="flex items-center gap-2.5 bg-white text-[#0f2952] font-extrabold text-[14px] px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Call 8081269969
              </a>
              <a
                href="https://wa.me/918081269969"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#25d366] text-white font-extrabold text-[14px] px-6 py-3 rounded-full shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Us
              </a>
            </div>

            {/* Contact meta */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-white/40 text-[12px]">
              {["support@studycups.in", "0512-4061386", "Kanpur & New Delhi"].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-white/30" />{item}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — stats card */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(s => (
              <div key={s.label}
                className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 text-center hover:bg-white/[0.09] transition">
                <p className="text-[30px] md:text-[36px] font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-[12px] text-white/50 font-medium">{s.label}</p>
              </div>
            ))}

            {/* Trust badges */}
            <div className="col-span-2 bg-white/[0.06] border border-white/10 rounded-2xl p-4 flex flex-wrap gap-3 justify-center">
              {[
                "🎓 IIM · IIT · NIT Colleges",
                "📋 NAAC A++ Listed",
                "✅ UGC Approved",
                "🏆 NIRF Ranked",
              ].map(badge => (
                <span key={badge} className="text-[11px] font-semibold text-white/60 bg-white/10 px-3 py-1 rounded-full">
                  {badge}
                </span>
              ))}
            </div>

            {/* Availability */}
            <div className="col-span-2 flex items-center gap-3 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <p className="text-[13px] text-emerald-300 font-semibold">
                Counsellors available Mon–Sat · 9AM to 8PM IST · Average response in 2 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
