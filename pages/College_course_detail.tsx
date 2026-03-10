import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import FlexibleBlockRenderer from "./FlexibleBlockRenderer";

const getTextValue = (value: any): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.value || "";
  return "";
};

const normalizeBlocks = (content: any[] = []) => {
  return content
    .map((block: any) => {
      if (!block) return null;

      if (block.type === "image") {
        return { type: "image", src: block.src || block.value || "" };
      }

      if (block.type === "video") {
        return { type: "video", src: block.src || block.value || "" };
      }

      if (block.type === "heading") {
        return {
          type: "heading",
          value: getTextValue(block.value),
          level: block.level || "h3",
        };
      }

      if (block.type === "list") {
        return {
          type: "list",
          value: Array.isArray(block.value) ? block.value : [],
        };
      }

      if (block.type === "table") {
        return {
          type: "table",
          value: Array.isArray(block.value) ? block.value : [],
        };
      }

      return { type: "text", value: getTextValue(block.value || block) };
    })
    .filter(Boolean);
};

export default function CollegeCourseDetail() {
  const { collegeSlug, courseSlug } = useParams();
  const collegeId = collegeSlug?.split("-")[0];

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!collegeId || !courseSlug) {
      setLoading(false);
      setError("Invalid course URL");
      return;
    }

    const loadCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`https://studycupsbackend-wb8p.onrender.com/api/college-course/college/${collegeId}`);
        const payload = await res.json();
        const docs = Array.isArray(payload?.data) ? payload.data : [];

        let matchedCourse: any = null;

        for (const doc of docs) {
          const courses = Array.isArray(doc?.courses) ? doc.courses : [];

          const directCourse = courses.find((c: any) => c?.slug_url === courseSlug);
          if (directCourse) {
            matchedCourse = directCourse;
            break;
          }

          for (const parentCourse of courses) {
            const subCourses = Array.isArray(parentCourse?.sub_courses) ? parentCourse.sub_courses : [];
            const subCourse = subCourses.find(
              (sc: any) => getTextValue(sc?.slug_url) === courseSlug
            );

            if (subCourse) {
              matchedCourse = {
                ...subCourse,
                course_name: getTextValue(subCourse?.name) || parentCourse?.course_name,
                rating: getTextValue(subCourse?.rating) || parentCourse?.rating,
                reviews: getTextValue(subCourse?.reviews) || parentCourse?.reviews,
                total_fees: getTextValue(subCourse?.fees) || parentCourse?.total_fees,
                application_date:
                  getTextValue(subCourse?.application_date) || parentCourse?.application_date,
                course_detail: subCourse?.course_detail || parentCourse?.course_detail,
              };
              break;
            }
          }

          if (matchedCourse) break;
        }

        if (!matchedCourse) {
          setError("Course detail not found");
          setCourse(null);
          return;
        }

        setCourse(matchedCourse);
      } catch (err) {
        console.error("Course detail fetch error:", err);
        setError("Failed to load course details");
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [collegeId, courseSlug]);

  const tocSections = useMemo(() => {
    return Array.isArray(course?.course_detail?.toc_sections)
      ? course.course_detail.toc_sections
      : [];
  }, [course]);

  if (loading) {
    return <div className="p-10 text-center">Loading course details...</div>;
  }

  if (error || !course) {
    return <div className="p-10 text-center">{error || "Course detail not found"}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
       
 <h1 className="text-2xl font-bold text-blue-900">{course.course_name}</h1>
        <div className="mt-4 text-sm text-black flex flex-wrap gap-4">
          
          {course.rating && <span>Rating: {course.rating}</span>}
          {course.reviews && <span>{course.reviews} Reviews</span>}
          {course.duration && <span>{course.duration}</span>}
          {course.mode && <span>{course.mode}</span>}
        </div>

        <div className="mt-4 text-sm text-black space-y-1">
          {course.eligibility && (
            <p>
              <strong>Eligibility:</strong> {course.eligibility}
            </p>
          )}
          {course.application_date && (
            <p>
              <strong>Application Date:</strong> {course.application_date}
            </p>
          )}
          {course.total_fees && (
            <p className="text-green-700 font-bold text-lg">{course.total_fees}</p>
          )}
        </div>
      </div>

      {tocSections.map((section: any, index: number) => (
        <section key={`${section?.section || "section"}-${index}`} className="bg-white border rounded-xl p-5">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {section?.section || "Details"}
          </h2>
          <FlexibleBlockRenderer blocks={normalizeBlocks(section?.content || []) as any} />
        </section>
      ))}
    </div>
  );
}
