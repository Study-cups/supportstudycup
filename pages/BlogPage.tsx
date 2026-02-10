import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  <section className="mt-20 bg-white py-16 border-t">
    <div className="max-w-4xl mx-auto px-6">
      <h2 className="text-2xl font-bold text-slate-900 text-center">
        Share Your Feedback
      </h2>
      <p className="text-slate-600 text-center mt-2">
        Help us improve our content and services.
      </p>

      <form className="mt-10 grid gap-4">
        <input placeholder="Your Name" className="border rounded-lg px-4 py-3" />
        <input placeholder="Your Email" className="border rounded-lg px-4 py-3" />
        <textarea rows={4} placeholder="Your feedback..." className="border rounded-lg px-4 py-3" />
        <button className="bg-[#0A225A] text-white py-3 rounded-lg font-semibold hover:bg-[#071a3f]">
          Submit Feedback
        </button>
      </form>
    </div>
  </section>
);

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
        console.error("Articles API error");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const featured = DUMMY_NEWS[0];

  return (
    
    <div className="bg-[#f5f7fb]  pt-28 pb-16">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900">News & Blog</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Latest education news, exams, admissions and expert insights.
        </p>
      </div>

      {/* FEATURED + NEWS */}
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-8 mb-16 items-start">

        {/* FEATURED */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
          <img src={featured.imageUrl} className="w-full h-[360px] object-cover" />
          <div className="p-6">
            <span className="text-xs font-bold text-blue-600">FEATURED NEWS</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">{featured.title}</h2>
            <p className="text-sm text-slate-500 mt-2">{featured.date}</p>
          </div>
        </div>

        {/* RIGHT NEWS */}
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
        <h3 className="text-xl font-bold text-slate-900 mb-6">Articles</h3>

        {loading ? (
          <p>Loading articles...</p>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
  {articles.map(article => (
    <article
      key={article._id}
      onClick={() => navigate(`/blog/${article.id}`)}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* IMAGE */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={article.imageUrl || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"}
          alt={article.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* CATEGORY BADGE */}
        {article.category && (
          <span className="absolute top-4 left-4 bg-[#0A225A] text-white text-xs font-semibold px-3 py-1 rounded-full">
            {article.category}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-6 flex flex-col h-full">
        <h4 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">
          {article.title}
        </h4>

        <p className="text-sm text-slate-600 mt-3 line-clamp-3">
          {article.excerpt}
        </p>

        {/* FOOTER */}
        <div className="mt-auto pt-5 flex items-center justify-between text-xs text-slate-500">
          <span>{article.author || "StudyCups Team"}</span>
          <span>
            {new Date(article.publishedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
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
