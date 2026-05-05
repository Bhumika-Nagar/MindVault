export const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);

    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");

    // optional: sort params
    u.searchParams.sort();

    return u.toString();
  } catch {
    return url.trim();
  }
};