import React from "react";

const EditorRenderer = ({ data }) => {
  if (!data) {
    console.warn("EditorRenderer: no data");
    return null;
  }

  let parsed;
  try {
    parsed = typeof data === "string" ? JSON.parse(data) : data;
  } catch (e) {
    console.error("Invalid EditorJS JSON", e);
    return null;
  }

  if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
    console.warn("EditorRenderer: blocks missing", parsed);
    return null;
  }

  return (
    <div className="blog-content space-y-6 text-slate-800">
      {parsed.blocks.map((block, index) => {
        if (!block || !block.type) return null;

        /* ================= HEADER ================= */
        if (block.type === "header") {
          const Tag = `h${block.data?.level || 2}`;
          return (
        <Tag
  className="font-bold text-slate-900 mt-8"
  dangerouslySetInnerHTML={{
    __html: block.data?.text || ""
  }}
/>

          );
        }

        /* ================= PARAGRAPH ================= */
        if (block.type === "paragraph") {
          return (
            <p
              key={index}
              className="leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: block.data?.text || "",
              }}
            />
          );
        }

        /* ================= LIST ================= */
        if (block.type === "list") {
          const style = block.data?.style || "unordered";
          const items = Array.isArray(block.data?.items)
            ? block.data.items
            : [];

          // CHECKLIST
          if (style === "checklist") {
            return (
              <div key={index} className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={!!item?.meta?.checked}
                      readOnly
                      className="mt-1"
                    />
                    <span>
                      {item?.content || ""}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          // ORDERED / UNORDERED
          const ListTag = style === "ordered" ? "ol" : "ul";

          return (
            <ListTag
              key={index}
              className={`pl-6 ${
                style === "ordered"
                  ? "list-decimal"
                  : "list-disc"
              }`}
            >
              {items.map((item, i) => (
                <li key={i}>
                  {typeof item === "string"
                    ? item
                    : item?.content || ""}
                </li>
              ))}
            </ListTag>
          );
        }

        /* ================= IMAGE ================= */
    if (block.type === "image") {
  const align = block.data?.align || "center";

  const alignClass =
    align === "left"
      ? "mr-auto ml-0"
      : align === "right"
      ? "ml-auto mr-0"
      : "mx-auto";

  return (
    <figure key={index} className="my-8">
      <img
        src={block.data?.file?.url}
        alt={block.data?.caption || ""}
        className={`block ${alignClass} max-w-full rounded-xl`}
        style={{ maxHeight: "420px", objectFit: "contain" }}
      />

      {block.data?.caption && (
        <figcaption className="text-sm text-center text-gray-500 mt-2">
          {block.data.caption}
        </figcaption>
      )}
    </figure>
  );
}


        /* ================= FALLBACK ================= */
        console.warn("Unknown block type:", block);
        return null;
      })}
    </div>
  );
};

export default EditorRenderer;
