// src/utils/seo.ts

export const toSeoSlug = (text: string = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const toCourseSlug = (name: string = "") => {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
};

export const buildCourseDetailPath = (
  categorySlug: string = "",
  courseName: string = "",
  courseSlug: string = "",
  tabSlug: string = ""
) => {
  const normalizedCategory = toSeoSlug(categorySlug) || "general";
  const normalizedName = courseName.trim();
  const normalizedSlug =
    courseSlug.trim() || toCourseSlug(normalizedName) || toSeoSlug(normalizedName);
  const normalizedTabSlug = toSeoSlug(tabSlug);
  return normalizedTabSlug
    ? `/courses/${normalizedCategory}/${normalizedSlug}/${normalizedTabSlug}`
    : `/courses/${normalizedCategory}/${normalizedSlug}`;
};

export const normalize = (text?: string | null) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]/g, "");
};

