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
    excerpt: "List of top MBA colleges in India accepting CAT 2025 scores.",
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

type BlogNewsArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string;
};

const API_BASE =
 
  "https://studycupsbackend-wb8p.onrender.com/api";

const BLOG_NEWS_API_URL = `${API_BASE}/news`;

const normalizeBlogNewsText = (value = "") =>
  value.replace(/\s+/g, " ").trim();

const normalizeBlogNewsArticle = (article: any): BlogNewsArticle | null => {
  const title = normalizeBlogNewsText(article?.title || "");
  const link = normalizeBlogNewsText(article?.link || "");

  if (!title || !link) {
    return null;
  }

  return {
    title,
    description: normalizeBlogNewsText(article?.description || ""),
    link,
    pubDate: normalizeBlogNewsText(article?.pubDate || ""),
    image: normalizeBlogNewsText(article?.image || article?.imageUrl || ""),
  };
};

const formatBlogNewsDate = (value = "") => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ===================== TYPES ===================== */

interface Article {
  _id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  category?: string;
}

/* ===================== FEEDBACK ===================== */

const FeedbackSection = () => (
  <section className="mt-20 border-t bg-white py-16">
    <div className="mx-auto max-w-4xl px-6">
      <h2 className="text-center text-2xl font-bold text-slate-900">
        Share Your Feedback
      </h2>
      <p className="mt-2 text-center text-slate-600">
        Help us improve our content and services.
      </p>

      <form className="mt-10 grid gap-4">
        <input
          placeholder="Your Name"
          className="rounded-lg border px-4 py-3"
        />
        <input
          placeholder="Your Email"
          className="rounded-lg border px-4 py-3"
        />
        <textarea
          rows={4}
          placeholder="Your feedback..."
          className="rounded-lg border px-4 py-3"
        />
        <button className="rounded-lg bg-[#0A225A] py-3 font-semibold text-white hover:bg-[#071a3f]">
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
  const [latestNewsItems, setLatestNewsItems] = useState<BlogNewsArticle[]>([]);
  const [latestNewsLoading, setLatestNewsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch(`${API_BASE}/blogs`);
        const json = await res.json();
        setArticles(json.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchLatestNews = async () => {
      setLatestNewsLoading(true);

      try {
        const res = await fetch(BLOG_NEWS_API_URL);
        if (!res.ok) {
          throw new Error("Failed to load blog latest news");
        }

        const json = await res.json();
        const incomingArticles = Array.isArray(json?.articles)
          ? json.articles
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];

        const normalizedArticles = incomingArticles
          .map((article: any) => normalizeBlogNewsArticle(article))
          .filter(Boolean) as BlogNewsArticle[];

        if (!cancelled) {
          setLatestNewsItems(normalizedArticles);
        }
      } catch {
        if (!cancelled) {
          setLatestNewsItems([]);
        }
      } finally {
        if (!cancelled) {
          setLatestNewsLoading(false);
        }
      }
    };

    fetchLatestNews();

    return () => {
      cancelled = true;
    };
  }, []);

  const featured = DUMMY_NEWS[0];

  return (
    <div className="bg-[#f5f7fb] pt-28 pb-16">
      <div className="mx-auto mb-10 max-w-7xl px-6">
        <h1 className="text-4xl font-extrabold text-slate-900">News & Blog</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Latest education news, exams, admissions and expert insights.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl bg-white shadow lg:col-span-2">
          <img
            src={featured.imageUrl} 
            alt={featured.title}
            className="h-[360px] w-full object-cover"
          />
          <div className="p-6">
            <span className="text-xs font-bold text-blue-600">FEATURED NEWS</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {featured.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{featured.date}</p>
          </div>
        </div>

        <aside className="self-start overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-blue-900/5 lg:sticky lg:top-28">
          <div className="flex h-[520px] flex-col">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Live Updates
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                Latest News
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Admissions | Exams | Colleges
              </p>
            </div>

            <div className="relative flex-1 overflow-hidden px-3 py-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-white via-white/95 to-transparent" />

              {latestNewsLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading latest news...
                </div>
              ) : latestNewsItems.length > 0 ? (
                <div className="blog-news-track">
                  {[0, 1].map((loopIndex) => (
                    <div key={loopIndex} className="flex flex-col gap-3">
                      {latestNewsItems.map((news, index) => (
                        <a
                          key={`${news.link}-${loopIndex}-${index}`}
                          href={news.link}
                          className="flex items-center gap-3 rounded-2xl border border-transparent bg-white p-2.5 transition-colors hover:border-slate-100 hover:bg-slate-50"
                        >
                          <img
                            src={news.image || "./icons/latestnews.png"}
                            alt={news.title}
                            className="h-16 w-16 flex-shrink-0 rounded-xl object-cover shadow-sm"
                          />

                          <div className="min-w-0">
                            <p className="blog-news-title text-sm font-semibold leading-[1.35] text-slate-800">
                              {news.title}
                            </p>
                            {news.description && (
                              <p className="blog-news-excerpt mt-1 text-xs leading-5 text-slate-500">
                                {news.description}
                              </p>
                            )}
                            <p className="mt-1.5 text-xs text-slate-500">
                              {formatBlogNewsDate(news.pubDate)}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No latest news available right now.
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-white via-white/95 to-transparent" />
            </div>
          </div>
        </aside>

        <div className="mb-20 lg:col-span-2">
          <h3 className="mb-6 text-xl font-bold text-slate-900">Articles</h3>

          {loading ? (
            <p>Loading articles...</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article._id}
                  onClick={() => navigate(`/blog/${toBlogSlug(article)}`)}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        article.imageUrl ||
                        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"
                      }
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {article.category && (
                      <span className="absolute top-4 left-4 rounded-full bg-[#0A225A] px-3 py-1 text-xs font-semibold text-white">
                        {article.category}
                      </span>
                    )}
                  </div>

                  <div className="flex h-full flex-col p-6">
                    <h4 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">
                      {article.title}
                    </h4>

                    <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                      {article.excerpt}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-5 text-xs text-slate-500">
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
      </div>

      <FeedbackSection />

      <style>{`
        @keyframes blogNewsMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }

        .blog-news-track {
          display: flex;
          flex-direction: column;
          animation: blogNewsMarquee 20s linear infinite;
          will-change: transform;
        }

        .blog-news-title,
        .blog-news-excerpt {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-news-title {
          -webkit-line-clamp: 2;
        }

        .blog-news-excerpt {
          -webkit-line-clamp: 2;
        }

        .blog-news-track:hover {
          animation-play-state: paused;
        }

        @media (max-width: 640px) {
          .blog-news-track {
            animation-duration: 24s;
          }
        }
      `}</style>
    </div>
  );
};

export default BlogPage;
