import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditorRenderer from "./EditorRenderer";
import { Helmet } from "react-helmet-async";
const toBlogSlug = (blog: any) =>
  blog.title
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const BlogDetailPage: React.FC<{ blogs: any[] }> = ({ blogs }) => {

  const { blogSlug } = useParams<{ blogSlug: string }>();
  const id = blogSlug; // Assuming slug is unique and can be used as ID for fetching
  const navigate = useNavigate();

  const [blog, setBlog] = useState<any>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!blogSlug || !Array.isArray(blogs) || blogs.length === 0) return;

  const matchedBlog = blogs.find(
    (b) => toBlogSlug(b) === blogSlug
  );

  if (!matchedBlog) {
    setBlog(null);
    setLoading(false);
    return;
  }

  const fetchBlogById = async () => {
    try {
      const res = await fetch(
        `https://studycupsbackend-wb8p.onrender.com/api/blogs/${matchedBlog.id}`
      );
      const json = await res.json();

      if (json.success) {
        setBlog(json.data);
      } else {
        setBlog(null);
      }
    } catch (err) {
      console.error("Blog API Error", err);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  };

  fetchBlogById();
}, [blogSlug, blogs]);


  if (loading) {
    return <p className="text-center py-32">Loading blog...</p>;
  }

  if (!blog) {
    return (
      <div className="text-center py-32">
        <h2 className="text-xl font-bold">Blog not found</h2>
        <button
          onClick={() => navigate("/blog")}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  const blogTitle = blog.title || "Blog Article";
  const blogDesc = (typeof blog.excerpt === "string" && blog.excerpt.trim())
    || (typeof blog.description === "string" && blog.description.substring(0, 160).trim())
    || `Read ${blogTitle} on StudyCups - India's trusted college admission guidance portal.`;
  const blogImage = blog.imageUrl || blog.coverImage || "https://studycups.in/logos/StudyCups.png";
  const blogCanonical = `https://studycups.in/blog/${blogSlug}`;
  const blogDate = blog.date || blog.createdAt || new Date().toISOString();

  return (
    <div className="bg-[#f5f7fb] min-h-screen pt-14 md:pt-[100px] pb-20">
      <Helmet>
        <title>{`${blogTitle} | StudyCups`}</title>
        <meta name="description" content={blogDesc} />
        <meta name="keywords" content={`${blogTitle}, college admission 2026, StudyCups blog, education news India`} />
        <link rel="canonical" href={blogCanonical} />

        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="StudyCups" />
        <meta property="og:title" content={`${blogTitle} | StudyCups`} />
        <meta property="og:description" content={blogDesc} />
        <meta property="og:url" content={blogCanonical} />
        <meta property="og:image" content={blogImage} />
        <meta property="og:locale" content="en_IN" />
        {blog.date && <meta property="article:published_time" content={blogDate} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${blogTitle} | StudyCups`} />
        <meta name="twitter:description" content={blogDesc} />
        <meta name="twitter:image" content={blogImage} />

        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": blogTitle,
          "description": blogDesc,
          "image": blogImage,
          "url": blogCanonical,
          "datePublished": blogDate,
          "author": {
            "@type": "Organization",
            "name": blog.author || "StudyCups Editorial Team"
          },
          "publisher": {
            "@type": "Organization",
            "name": "StudyCups",
            "logo": {
              "@type": "ImageObject",
              "url": "https://studycups.in/logos/StudyCups.png"
            }
          }
        })}</script>
      </Helmet>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ================= LEFT: BLOG CONTENT ================= */}
        <div className="lg:col-span-2">
          <button
            onClick={() => navigate("/blog")}
            className="text-sm text-blue-600 font-semibold mb-6"
          >
            ← Back to Blogs
          </button>

          <img
            src={blog.imageUrl}
            alt={blog.title}
            className="w-full h-[420px] object-cover rounded-2xl shadow"
          />

          <div className="mt-6">
            <span className="text-xs font-semibold text-blue-600">
              {blog.category}
            </span>

            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
              {blog.title}
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              By {blog.author} •{" "}
              {new Date(blog.date || blog.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>

          <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm">
           <EditorRenderer data={blog.content || { blocks: [] }} />

          </div>
        </div>

        {/* ================= RIGHT: SIDEBAR ================= */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-bold text-lg mb-4">Related Blogs</h3>

            {relatedBlogs.map((rb) => (
              <div
                key={rb._id}
                onClick={() => navigate(`/blog/${toBlogSlug(rb)}`)}
                className="flex gap-3 mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <img
                  src={rb.imageUrl}
                  alt={rb.title}
                  className="w-20 h-16 object-cover rounded"
                />
                <div>
                  <p className="text-sm font-semibold line-clamp-2">
                    {rb.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {rb.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Optional box */}
          <div className="bg-blue-600 text-white rounded-2xl p-5">
            <h4 className="font-bold text-lg">Need Guidance?</h4>
            <p className="text-sm mt-2">
              Get expert help for colleges, exams & admissions.
            </p>
            <button className="mt-4 bg-white text-blue-600 px-4 py-2 rounded font-semibold">
              Apply Now
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default BlogDetailPage;
