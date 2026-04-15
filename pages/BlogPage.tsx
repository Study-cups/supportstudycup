import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

/* ===================== DUMMY NEWS ===================== */

const DUMMY_NEWS = [
  {
    id: 1,
    title: "RSB Chennai PGDM Admission 2026 Begins",
    excerpt:
      "RSB Chennai has opened applications for its flagship PGDM programme for the 2026 intake.",
    imageUrl:
      "https://images.unsplash.com/photo-1588072432836-e10032774350",
    date: "Dec 15, 2025",
    author: "StudyCups Editorial Team",
    category: "Admission News",
  },
  {
    id: 3,
    title: "IIM Visakhapatnam Admission 2026 Open",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585",
    date: "Dec 13, 2025",
  },
  {
    id: 4,
    title: "Top MBA Colleges Accepting CAT 2025 Scores",
    excerpt:
      "List of top MBA colleges in India accepting CAT 2025 scores.",
    imageUrl:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
    date: "Dec 12, 2025",
    author: "StudyCups Experts",
    category: "Articles",
  },
  {
    id: 5,
    title: "How to Prepare for Board Exams Effectively",
    excerpt:
      "Proven strategies and study plans to score high in board exams.",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    date: "Dec 11, 2025",
    author: "StudyCups Editorial Team",
    category: "Articles",
  },


];

/* ===================== TYPES ===================== */

interface Article {
  _id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
}

/* ===================== FEEDBACK ===================== */

const FeedbackSection = () => (
  <section className="mt-16 bg-gradient-to-br from-[#0a214a] to-[#1f4fa8] py-12">
    <div className="max-w-4xl mx-auto px-6">
      <div className="text-center mb-8">
        <h2 className="text-[22px] md:text-[28px] font-extrabold text-white">Share Your Feedback</h2>
        <p className="text-white/60 text-sm mt-2">Help us improve our content and services for students like you.</p>
      </div>
      <form className="grid gap-4 max-w-xl mx-auto">
        <input placeholder="Your Name" className="border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        <input placeholder="Your Email" className="border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        <textarea rows={4} placeholder="Your feedback..." className="border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 resize-none" />
        <button className="bg-gradient-to-r from-amber-400 to-orange-500 text-[#0a1628] py-3 rounded-xl font-bold hover:opacity-90 transition">
          Submit Feedback
        </button>
      </form>
    </div>
  </section>
);

const toBlogSlug = (blog: any) =>
  blog.title
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");


/* ===================== MAIN PAGE ===================== */

const BlogPage: React.FC = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("https://studycupsbackend-wb8p.onrender.com/api/blogs");
        const json = await res.json();
        setArticles(json.data || []);
      } catch (err) {

      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const featured = DUMMY_NEWS[0];

  return (

    <div className="bg-[#f5f7fb] pt-0 pb-16">
      <Helmet>
        <title>College Admission News & Blog 2026 - Tips, Rankings, Guidance | StudyCups</title>
        <meta name="description" content="Read the latest college admission news, blog articles and expert guidance for 2026. Tips on MBA, BTech, MBBS admissions, entrance exams and scholarship opportunities." />
        <meta name="keywords" content="college admission news 2026, MBA admission blog, BTech admission tips, MBBS admission 2026, entrance exam news, college ranking articles, StudyCups blog" />
        <link rel="canonical" href="https://studycups.in/blog" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content="College Admission News & Blog 2026 | StudyCups" />
        <meta property="og:description" content="Latest college admission news, tips and expert guidance for 2026. MBA, BTech, MBBS and more." />
        <meta property="og:url" content="https://studycups.in/blog" />
        <meta property="og:image" content="https://studycups.in/logos/StudyCups.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="College Admission News & Blog 2026 | StudyCups" />
        <meta name="twitter:description" content="Latest college news and expert guidance for admissions 2026." />
        <meta name="twitter:image" content="https://studycups.in/logos/StudyCups.png" />

        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type":"ListItem","position":1,"name":"Home","item":"https://studycups.in"},
            {"@type":"ListItem","position":2,"name":"Blog & News 2026","item":"https://studycups.in/blog"}
          ]
        })}</script>

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "StudyCups Blog",
          "description": "College admission news, tips and expert guidance",
          "url": "https://studycups.in/blog",
          "publisher": {
            "@type": "Organization",
            "name": "StudyCups",
            "logo": "https://studycups.in/logos/StudyCups.png"
          }
        })}</script>
      </Helmet>

      {/* HERO HEADER */}
      <section className="relative md:mt-[100px] mt-0 overflow-hidden">
        {/* 4-layer gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#030c1a] via-[#061528] to-[#0b2545]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.14)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />

        {/* 3 glow orbs */}
        <div className="pointer-events-none absolute top-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-indigo-600/20 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[-40px] right-[10%] w-[250px] h-[250px] rounded-full bg-sky-500/15 blur-[70px]" />
        <div className="pointer-events-none absolute top-[30%] right-[-40px] w-[200px] h-[200px] rounded-full bg-amber-400/10 blur-[60px]" />

        {/* dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(circle,#fff 1px,transparent 1px)",backgroundSize:"28px 28px"}} />

        <div className="relative max-w-7xl mx-auto px-4 py-5 md:py-8">
          {/* breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1.5 text-[11px] text-white/50">
            <a href="/" className="hover:text-white transition">Home</a>
            <span>/</span>
            <span className="text-amber-400 font-medium">News & Blog</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left content */}
            <div className="flex-1">
              {/* animated badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  LATEST UPDATES · ADMISSIONS 2026 · COLLEGE NEWS
                </span>
              </div>

              <h1 className="text-[22px] sm:text-[30px] md:text-[36px] font-extrabold leading-tight text-white mb-2">
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  College News
                </span>{" "}
                &amp; Expert Blog 2026
              </h1>

              <p className="text-white/65 text-[12px] md:text-[13px] leading-relaxed max-w-xl mb-3">
                Stay updated with <strong className="text-white/90">MBA, B.Tech, MBBS, Law admission news</strong>, entrance exam alerts, NIRF rankings, scholarship announcements &amp; expert guidance for 2026 admissions.
              </p>

              {/* 4 inline stats */}
              <div className="flex flex-wrap gap-4 mt-2 text-white/80 text-[11px]">
                <span>📰 <strong className="text-white">Weekly</strong> Updates</span>
                <span>🏛️ <strong className="text-white">500+</strong> Colleges Covered</span>
                <span>🎓 <strong className="text-white">Expert</strong> Guidance</span>
                <span>📅 <strong className="text-white">2026</strong> Admissions</span>
              </div>
            </div>

            {/* Right stats card */}
            <div className="lg:w-[220px] w-full flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80 mb-1">Content Categories</p>
              <div className="space-y-2 text-[12px] mt-2">
                {[
                  {label:"Admission News", icon:"📋"},
                  {label:"Exam Updates", icon:"📝"},
                  {label:"College Reviews", icon:"🏛️"},
                  {label:"Scholarship Alerts", icon:"💰"},
                  {label:"Expert Articles", icon:"✍️"},
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                    <span>{row.icon}</span>
                    <span className="text-white/70">{row.label}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-[11px] font-bold text-[#0a1628]">
                Subscribe →
              </button>
            </div>
          </div>
        </div>

        {/* Wave SVG divider */}
        <div className="relative w-full overflow-hidden leading-[0] h-6">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full" fill="#f5f7fb">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"/>
          </svg>
        </div>
      </section>

      {/* FEATURED + NEWS */}
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-8 mb-16 items-start mt-8">

        {/* FEATURED */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
          <div className="relative overflow-hidden h-[280px]">
            <img src={featured.imageUrl} className="w-full h-full object-cover" alt={featured.title} loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="p-6">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">FEATURED</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">{featured.title}</h2>
            <p className="text-sm text-slate-500 mt-2">{featured.date}</p>
          </div>
        </div>


    {/* RIGHT NEWS */}
     <aside className="bg-white rounded-2xl  shadow flex flex-col h-[520px]  sticky top-[24px]  self-start">


  {/* Header */}
  <div className="px-5 py-4 border-b">
    <h3 className="font-bold text-slate-900 text-lg">Latest News</h3>
    <p className="text-xs text-slate-500 mt-1">
      Admissions • Exams • Colleges
    </p>
  </div>

  {/* Scroll Wrapper */}
  <div className="relative flex-1 overflow-hidden">

    {/* Fade Top */}
    <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent z-10" />

    {/* Scroll Content */}
    <div className="news-scroll space-y-4 px-4 py-4">
      {[...DUMMY_NEWS.slice(1), ...DUMMY_NEWS.slice(1)].map((news, index) => (
        <div
          key={index}
          className="flex gap-4 items-start"
        >
          <img
            src={news.imageUrl}
            className="w-20 h-16 rounded-md object-cover flex-shrink-0"
          />

          <div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              {news.title}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {news.date}
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* Fade Bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-10" />

  </div>

</aside>

      </div>

      {/* ARTICLES FROM BACKEND */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="mb-6">
          <div className="h-1 w-10 bg-gradient-to-r from-[#1f4fa8] to-amber-400 rounded mb-2" />
          <h2 className="text-[18px] md:text-[22px] font-extrabold text-slate-800">Expert Articles & Admission Guides</h2>
          <p className="text-[12px] text-slate-500 mt-1">In-depth articles on MBA, B.Tech, MBBS admissions, entrance exams, scholarships & career guidance</p>
        </div>

        {loading ? (
          <p>Loading articles...</p>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {articles.map(article => (
    <article
      key={article._id}
      onClick={() => navigate(`/blog/${toBlogSlug(article)}`)}
      aria-label={`${article.title} – StudyCups blog article`}
      className="group bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(10,33,74,0.07)] hover:shadow-[0_12px_35px_rgba(10,33,74,0.14)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={article.imageUrl || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* CATEGORY BADGE */}
        {(article as any).category && (
          <span className="absolute top-3 left-3 bg-[#0A225A] text-white text-[10px] font-bold px-3 py-1 rounded-full">
            {(article as any).category}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-5 flex flex-col flex-1">
        {/* top accent bar */}
        <div className="h-0.5 w-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded mb-3" />

        <h2 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 mb-2">
          {article.title}
        </h2>

        <p className="text-[12px] text-slate-500 line-clamp-3 flex-1">
          {article.excerpt}
        </p>

        {/* FOOTER */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-slate-600">{article.author || "StudyCups Team"}</span>
          <span>
            {new Date(article.publishedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="mt-3">
          <span className="text-[11px] font-bold text-[#1f4fa8]">Read Article →</span>
        </div>
      </div>
    </article>
  ))}
</div>

        )}
      </div>



      <FeedbackSection />
     <style>{`
@keyframes newsScroll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.news-scroll {
  animation: newsScroll 35s linear infinite;
}

.news-scroll:hover {
  animation-play-state: paused;
}
`}</style>


    </div>
  );
};

export default BlogPage;
