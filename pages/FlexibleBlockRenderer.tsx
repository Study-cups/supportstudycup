import React, { useState } from "react";

const SHOW_CONTENT_IMAGES = false;

type Block =
  | { type: "text"; value: string }
  | { type: "list"; value: string[] }
  | { type: "table"; value: string[][] }
  | { type: "image"; value: string }
  | { type: "video"; src: string }
  | { type: "heading"; value: string; level?: string };

interface Props {
  blocks: Block[];
}
const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); 

function cleanContent(blocks:any[]) {

  return blocks.filter((block) => {

    if(block.type !== "text" && block.type !== "image")
      return true;

    const text = block.value?.trim();

    if(!text && block.type === "text") return false;

    // remove (62%) type
    if(/^\(\d+%\)$/.test(text)) return false;

    // remove rating like 4.2
    if(/^\d\.\d$/.test(text)) return false;

    // remove view stats
    if(text?.includes("views last year")) return false;

    // remove interest stats
    if(text?.includes("Students have shown interest")) return false;

    // remove author info
    if(text?.includes("Content Strategist")) return false;

    // remove review meta
    if(text?.includes("Reviewed on")) return false;

    if(text?.includes("Enrolled")) return false;

    // remove ...
    if(text === "...") return false;

    // remove profile images
    if(block.type === "image" && block.src?.includes("profile"))
      return false;

    return true;
  });
}
const FlexibleBlockRenderer: React.FC<Props> = ({ blocks }) => {
  const [expanded, setExpanded] = useState(false);
  if (!blocks || blocks.length === 0) return null;


  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.type) {
       case "text": {
  const text = block.value || "";

  return (
    <div key={i}>
      <p
        className={`text-sm text-black leading-relaxed ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>

      {text.length > 300 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-sm font-semibold mt-2 hover:underline"
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
}
          case "list":
            return (
              <ul key={i} className="list-disc pl-6 text-sm text-black space-y-1">
                {block.value.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            );

          case "table": {
            const rows = block.value || [];

            if (!rows.length) return null;

            const firstRow = rows[0];
            const secondRow = rows[1];

            const isGroupedHeader =
              rows.length > 2 &&
              Array.isArray(firstRow) &&
              Array.isArray(secondRow) &&
              secondRow.length > firstRow.length;

            if (isGroupedHeader) {
              const totalColumns = secondRow.length;
              const groupCount = firstRow.length - 1; // excluding Category
              const subColsPerGroup = (totalColumns) / groupCount;

              return (
                <div key={i} className="overflow-x-auto border rounded-xl">
                  <table className="w-full min-w-[900px] border-collapse text-sm text-black">

                    <thead>

                      {/* GROUP HEADER */}
                      <tr className="bg-slate-200 text-black">
                        <th
                          rowSpan={2}
                          className="border p-3 font-semibold text-left"
                        >
                          {firstRow[0]}
                        </th>

                        {firstRow.slice(1).map((group, gIndex) => (
                          <th
                            key={gIndex}
                            colSpan={subColsPerGroup}
                            className="border p-3 font-semibold text-center"
                          >
                            {group}
                          </th>
                        ))}
                      </tr>

                      {/* SUB HEADER */}
                      <tr className="bg-slate-100 text-black">
                        {secondRow.map((sub, sIndex) => (
                          <th
                            key={sIndex}
                            className="border p-2 text-center"
                          >
                            {sub}
                          </th>
                        ))}
                      </tr>

                    </thead>

                    <tbody>
                      {rows.slice(2).map((row, rIndex) => (
                        <tr key={rIndex} className="hover:bg-slate-50 transition">
                          {row.map((cell, cIndex) => (
                            <td
                              key={cIndex}
                              className={`border p-3 text-center ${cIndex === 0 ? "font-semibold text-left" : ""
                                }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              );
            }

            // NORMAL TABLE FALLBACK
            return (
              <div key={i} className="overflow-x-auto border rounded-xl">
                <table className="w-full border-collapse text-sm text-black">
                  <tbody>
                    {rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="border p-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          case "image":
            // Temporarily hide backend-driven content images on course/college detail pages.
            if (!SHOW_CONTENT_IMAGES) return null;
            console.log("IMAGE BLOCK:", block);
            console.log("IMAGE SRC:", block?.src);
            if (!block.src) return null;

            return (
              <img
                key={i}
                src={block.src}
                alt="Infrastructure"
                className="w-full rounded-xl border my-4"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            );



          case "video":
            if (!block.src) return null;

            return (
              <div key={i} className="my-6 w-full">
                <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden border">
                  <iframe
                    src={block.src}
                    title="Video"
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            );

          case "heading": {
            const level = block.level || "h3";
            const Tag: any = level;

            return (
              <Tag
                key={i}
                id={slugify(block.value)}
                className="font-bold text-slate-900 mt-6 mb-3 scroll-mt-24"
              >
                {block.value}
              </Tag>
            );
          }


          default:
            return null;
        }
      })}
    </div>
  );
};

export default FlexibleBlockRenderer;
