export default async function handler(req, res) {
  try {
    const response = await fetch("https://studycupsbackend-wb8p.onrender.com/api", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
      },
    });

    res.status(200).json({
      ok: response.ok,
      status: response.status,
    });
  } catch {
    res.status(500).json({
      ok: false,
    });
  }
}
