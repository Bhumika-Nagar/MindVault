const YOUTUBE_HOSTNAMES = new Set([
  "youtu.be",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

const extractYoutubeVideoId = (parsedUrl: URL): string | null => {
  const hostname = parsedUrl.hostname.toLowerCase();
  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

  if (hostname === "youtu.be") {
    return pathSegments[0] ?? null;
  }

  if (
    !YOUTUBE_HOSTNAMES.has(hostname) &&
    hostname.endsWith(".youtube.com") === false
  ) {
    return null;
  }

  if (parsedUrl.pathname === "/watch") {
    return parsedUrl.searchParams.get("v");
  }

  if (pathSegments[0] === "shorts" || pathSegments[0] === "embed") {
    return pathSegments[1] ?? null;
  }

  return null;
};

const isValidYoutubeVideoId = (value: string): boolean =>
  /^[a-zA-Z0-9_-]{11}$/.test(value);

export const normalizeYoutubeUrl = (inputUrl: string): string | null => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(inputUrl.trim());
  } catch {
    return null;
  }

  const videoId = extractYoutubeVideoId(parsedUrl);

  if (!videoId || !isValidYoutubeVideoId(videoId)) {
    return null;
  }

  // Keep only the video id so playlist, timestamp, shorts, and tracking params do not leak downstream.
  return `https://www.youtube.com/watch?v=${videoId}`;
};

export const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);

    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");

    u.searchParams.sort();

    return u.toString();
  } catch {
    return url.trim();
  }
};
