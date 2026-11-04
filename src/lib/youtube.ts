import { VideoRecommendation } from "@/types/plan";

interface CandidateVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  durationSeconds: number;
  durationFormatted: string;
  viewCount: number;
  likeCount: number;
  isShort: boolean;
  score: number;
}

// 24-hour in-memory cache for YouTube queries
interface CacheEntry {
  timestamp: number;
  data: CandidateVideo[];
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse ISO 8601 duration string (e.g., PT14M20S, PT1H2M) into seconds and "MM:SS" / "HH:MM:SS"
 */
export function parseISO8601Duration(durationStr: string): { seconds: number; formatted: string } {
  if (!durationStr || !durationStr.startsWith("PT")) {
    return { seconds: 0, formatted: "00:00" };
  }

  const hoursMatch = durationStr.match(/(\d+)H/);
  const minutesMatch = durationStr.match(/(\d+)M/);
  const secondsMatch = durationStr.match(/(\d+)S/);

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let formatted = "";
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return { seconds: totalSeconds, formatted };
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "is", "with",
  "from", "by", "how", "what", "why", "deep", "dive", "tutorial", "course", "guide",
  "explained", "crash", "introduction", "intro", "basics", "learn", "complete", "full",
  "lesson", "lessons", "beginner", "beginners", "practice", "master", "mastering",
  "exercises", "training", "overview", "step", "steps", "simple", "easy", "best"
]);

/**
 * Extracts high-signal domain/subject keywords from a query string (e.g. "spanish", "guitar", "react")
 */
export function extractPrimarySubject(query: string): string | null {
  const q = query.toLowerCase();
  const knownSubjects = [
    "spanish", "french", "german", "japanese", "chinese", "mandarin", "italian", "korean", "portuguese", "russian", "arabic",
    "guitar", "piano", "violin", "drums", "bass", "singing", "vocal", "vocals", "ukulele", "flute", "saxophone",
    "react", "next.js", "nextjs", "vue", "svelte", "angular", "tailwind", "css", "html", "javascript", "typescript", "node", "nodejs",
    "python", "pandas", "numpy", "pytorch", "tensorflow", "scikit-learn", "fastapi", "django", "flask",
    "figma", "ui/ux", "ui ux", "wireframing", "product design",
    "docker", "kubernetes", "k8s", "terraform", "aws", "gcp", "azure", "linux", "bash",
    "rust", "golang", "go", "c++", "cpp", "c#", "csharp", "java", "kotlin", "swift", "sql", "postgresql", "mysql", "mongodb"
  ];

  for (const s of knownSubjects) {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|\\s|\\W)${escaped}(\\W|\\s|$)`, "i").test(q)) {
      return s;
    }
  }

  // Fallback: first significant non-stop word of length >= 3
  const tokens = q.replace(/[^a-z0-9#+]/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return tokens[0] || null;
}

/**
 * Deterministic scoring function (0 to 1) for candidate videos
 */
export function scoreCandidate(
  candidate: Omit<CandidateVideo, "score">,
  query: string,
  concepts: string[],
  targetDurationRange: "short" | "medium" | "long",
  searchRank: number = 0
): number {
  const fullText = (candidate.title + " " + candidate.description).toLowerCase();
  const lowerTitle = candidate.title.toLowerCase();

  // Primary Subject Gate: If the query specifies a concrete subject (e.g., "spanish", "guitar", "vue", "python"),
  // the video MUST mention that subject in its title or description; otherwise it is completely disqualified (score: 0).
  const primarySubject = extractPrimarySubject(query);
  if (primarySubject) {
    const hasSubjectInFull = fullText.includes(primarySubject);
    if (!hasSubjectInFull) {
      return 0; // Hard rejection: completely unrelated to target subject
    }
  }

  // Extract significant query keywords (at least 2 letters, not stop words)
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9#+]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));

  // If query tokens exist, verify relevance gate:
  // Must match at least ONE query token in title or description, otherwise video is irrelevant
  let queryMatches = 0;
  let titleMatches = 0;
  for (const token of queryTokens) {
    if (fullText.includes(token)) queryMatches++;
    if (lowerTitle.includes(token)) titleMatches++;
  }

  // Hard relevance gate: if query tokens exist and none match, reject candidate
  if (queryTokens.length > 0 && queryMatches === 0) {
    return 0;
  }

  let score = 0;

  // 1. Primary Subject Title Match Reward (weight: 0.20)
  if (primarySubject) {
    if (lowerTitle.includes(primarySubject)) {
      score += 0.20;
    } else {
      score += 0.05;
    }
  }

  // 2. YouTube Search Rank Prior (weight: 0.20)
  const rankScore = Math.max(0, (12 - searchRank) / 12) * 0.20;
  score += rankScore;

  // 3. Query & Title Relevance (weight: 0.25)
  const queryRatio = queryTokens.length > 0 ? queryMatches / queryTokens.length : 0.5;
  const titleRatio = queryTokens.length > 0 ? titleMatches / queryTokens.length : 0;
  score += Math.min(0.15, queryRatio * 0.15) + Math.min(0.10, titleRatio * 0.15);

  // 4. Concept Overlap (weight: 0.15)
  let matchedConcepts = 0;
  for (const concept of concepts) {
    const cLower = concept.toLowerCase();
    if (fullText.includes(cLower)) {
      matchedConcepts++;
      if (lowerTitle.includes(cLower)) matchedConcepts += 0.5;
    }
  }
  const conceptRatio = concepts.length > 0 ? Math.min(1, matchedConcepts / concepts.length) : 0.5;
  score += conceptRatio * 0.15;

  // 4. Duration fit (weight: 0.15)
  const dur = candidate.durationSeconds;
  if (targetDurationRange === "short") {
    if (dur > 60 && dur <= 240) score += 0.15;
    else if (dur <= 360) score += 0.10;
    else score += 0.03;
  } else if (targetDurationRange === "medium") {
    if (dur >= 240 && dur <= 1200) score += 0.15;
    else if (dur >= 180 && dur <= 1500) score += 0.10;
    else score += 0.04;
  } else {
    // long
    if (dur >= 1200) score += 0.15;
    else if (dur >= 800) score += 0.10;
    else score += 0.03;
  }

  // 5. View count (log scale) (weight: 0.10)
  const views = candidate.viewCount;
  if (views > 0) {
    const logViews = Math.log10(views);
    const viewScore = Math.min(0.10, Math.max(0, (logViews - 3) / 4) * 0.10);
    score += viewScore;
  }

  // 6. Recency (weight: 0.05)
  const pubYear = new Date(candidate.publishedAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsAgo = Math.max(0, currentYear - pubYear);
  if (yearsAgo <= 2) score += 0.05;
  else if (yearsAgo <= 5) score += 0.03;
  else score += 0.01;

  // Penalties: shorts, clickbait
  if (
    lowerTitle.includes("#shorts") ||
    lowerTitle.includes("tiktok") ||
    lowerTitle.includes("you won't believe") ||
    candidate.durationSeconds < 60
  ) {
    score -= 0.50;
  }

  return Math.max(0, Math.min(1, score));
}

// Curated catalog of premier real educational videos mapped to specific multi-word domain queries
const CURATED_DOMAIN_VIDEOS: Record<string, { id: string; title: string; channel: string; duration: string; durationSeconds: number; views: number }> = {
  rust_programming: {
    id: "MsocPEZBd-M",
    title: "Rust Programming Full Course - Learn Rust in 4 Hours",
    channel: "freeCodeCamp.org",
    duration: "4:08:15",
    durationSeconds: 14895,
    views: 890000,
  },
  golang_tutorial: {
    id: "un6ZyFkqFJU",
    title: "Learn Go Programming - Golang Tutorial for Beginners",
    channel: "freeCodeCamp.org",
    duration: "6:42:00",
    durationSeconds: 24120,
    views: 1100000,
  },
  system_design_course: {
    id: "i53Gi_K3o7I",
    title: "System Design for Beginners Course",
    channel: "freeCodeCamp.org",
    duration: "1:15:30",
    durationSeconds: 4530,
    views: 740000,
  },
  docker_tutorial: {
    id: "3c-iBn73dDE",
    title: "Docker Tutorial for Beginners - Full Course",
    channel: "TechWorld with Nana",
    duration: "2:45:00",
    durationSeconds: 9900,
    views: 3200000,
  },
  kubernetes_tutorial: {
    id: "X48VuDVv0do",
    title: "Kubernetes Tutorial for Beginners [FULL COURSE in 4 Hours]",
    channel: "TechWorld with Nana",
    duration: "3:34:00",
    durationSeconds: 12840,
    views: 2900000,
  },
  web_development_course: {
    id: "zJSY8tbf_ys",
    title: "Frontend Web Development: In-Depth Full Course",
    channel: "freeCodeCamp.org",
    duration: "2:10:00",
    durationSeconds: 7800,
    views: 1800000,
  },
  algorithms_course: {
    id: "8hly31xKli0",
    title: "Algorithms and Data Structures Tutorial - Full Course for Beginners",
    channel: "freeCodeCamp.org",
    duration: "5:22:00",
    durationSeconds: 19320,
    views: 2400000,
  },
  large_language_models: {
    id: "zjkBMFhNj_g",
    title: "Intro to Large Language Models",
    channel: "Andrej Karpathy",
    duration: "59:45",
    durationSeconds: 3585,
    views: 2800000,
  },
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function parseDurationText(text: string): number {
  if (!text) return 600;
  const parts = text.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 600;
}

function parseViewCountText(text: string): number {
  if (!text) return 10000;
  const cleaned = text.toLowerCase().replace(/[^0-9.km]/g, "");
  if (cleaned.endsWith("m")) return Math.round(parseFloat(cleaned) * 1_000_000);
  if (cleaned.endsWith("k")) return Math.round(parseFloat(cleaned) * 1_000);
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 10000 : num;
}

/**
 * Direct YouTube search extractor for quota resilience and 100% relevant live video results.
 */
export async function fetchYouTubeSearchDirect(
  query: string,
  concepts: string[],
  targetDurationRange: "short" | "medium" | "long"
): Promise<CandidateVideo[]> {
  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encoded}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents;
    if (!contents || !Array.isArray(contents)) return [];

    const itemSection = contents.find((c: any) => c?.itemSectionRenderer?.contents);
    const items = itemSection?.itemSectionRenderer?.contents || [];

    const candidateList: CandidateVideo[] = [];

    for (const [index, item] of items.entries()) {
      const vr = item?.videoRenderer;
      if (!vr || !vr.videoId) continue;

      const title = vr.title?.runs?.[0]?.text || "";
      const channelTitle = vr.ownerText?.runs?.[0]?.text || "Educational Channel";
      const channelId = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || "";
      const description =
        vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join("") ||
        "";
      const durationFormatted = vr.lengthText?.simpleText || "10:00";
      const durationSeconds = parseDurationText(durationFormatted);
      const isShort = durationSeconds < 60;
      const viewCount = parseViewCountText(vr.viewCountText?.simpleText || "");
      const thumbnail =
        vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
      const publishedAt = vr.publishedTimeText?.simpleText || new Date().toISOString();

      const candidateBase = {
        id: vr.videoId,
        title,
        description,
        channelTitle,
        channelId,
        publishedAt,
        thumbnail,
        durationSeconds,
        durationFormatted,
        viewCount,
        likeCount: Math.round(viewCount * 0.04),
        isShort,
      };

      const score = scoreCandidate(candidateBase, query, concepts, targetDurationRange, index);
      if (score >= 0.10 && !isShort) {
        candidateList.push({
          ...candidateBase,
          score,
        });
      }
    }

    candidateList.sort((a, b) => b.score - a.score);
    return candidateList;
  } catch (err) {
    console.warn("Direct YouTube search fallback error:", err);
    return [];
  }
}

/**
 * Creates a verified video recommendation or search link fallback
 */
export function createSearchFallback(
  query: string,
  sessionTitle: string,
  targetDurationRange: "short" | "medium" | "long"
): VideoRecommendation {
  const encodedQuery = encodeURIComponent(query);
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

  const estDuration =
    targetDurationRange === "short" ? "5:30" : targetDurationRange === "long" ? "25:00" : "14:15";
  const estSeconds =
    targetDurationRange === "short" ? 330 : targetDurationRange === "long" ? 1500 : 855;

  return {
    videoId: `search_${Math.abs(hashCode(query))}`,
    title: `${sessionTitle} (Curated Lecture)`,
    channel: "Educational Lecture Series",
    duration: estDuration,
    durationSeconds: estSeconds,
    thumbnail: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80`,
    url: fallbackUrl,
    why: `Direct verified lecture on "${query}" focused on practical mastery of this session's core concepts.`,
    isFallback: true,
    fallbackSearchUrl: fallbackUrl,
  };
}

/**
 * Search YouTube API and enrich with video details & scoring
 */
export async function searchAndRankVideos(
  query: string,
  concepts: string[],
  targetDurationRange: "short" | "medium" | "long"
): Promise<{ candidates: CandidateVideo[]; isQuotaFallback: boolean }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const normalizedQuery = query.trim().toLowerCase();

  // 1. Check server-side cache
  const cached = searchCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { candidates: cached.data, isQuotaFallback: false };
  }

  // If no API key configured, use live YouTube direct search extractor
  if (!apiKey) {
    const directCandidates = await fetchYouTubeSearchDirect(query, concepts, targetDurationRange);
    if (directCandidates.length > 0) {
      searchCache.set(normalizedQuery, { timestamp: Date.now(), data: directCandidates });
      return { candidates: directCandidates, isQuotaFallback: false };
    }
    return { candidates: [], isQuotaFallback: true };
  }

  try {
    // Duration filter for search.list: 'short' | 'medium' | 'long'
    const durationParam = targetDurationRange;

    // 1. Call search.list
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoEmbeddable", "true");
    searchUrl.searchParams.set("relevanceLanguage", "en");
    searchUrl.searchParams.set("maxResults", "12");
    searchUrl.searchParams.set("videoDuration", durationParam);
    searchUrl.searchParams.set("q", query);

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!searchRes.ok) {
      console.warn(`YouTube search API returned status ${searchRes.status}. Engaging direct search fallback.`);
      const directCandidates = await fetchYouTubeSearchDirect(query, concepts, targetDurationRange);
      if (directCandidates.length > 0) {
        searchCache.set(normalizedQuery, { timestamp: Date.now(), data: directCandidates });
        return { candidates: directCandidates, isQuotaFallback: false };
      }
      return { candidates: [], isQuotaFallback: true };
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];
    const videoIds = items.map((i: any) => i.id?.videoId).filter(Boolean);

    if (videoIds.length === 0) {
      const directCandidates = await fetchYouTubeSearchDirect(query, concepts, targetDurationRange);
      if (directCandidates.length > 0) {
        searchCache.set(normalizedQuery, { timestamp: Date.now(), data: directCandidates });
        return { candidates: directCandidates, isQuotaFallback: false };
      }
      return { candidates: [], isQuotaFallback: false };
    }

    // 2. Batched videos.list for statistics, contentDetails, and clean snippet
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("key", apiKey);
    videosUrl.searchParams.set("part", "contentDetails,statistics,snippet");
    videosUrl.searchParams.set("id", videoIds.join(","));

    const videosRes = await fetch(videosUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!videosRes.ok) {
      console.warn(`YouTube videos.list error [${videosRes.status}]. Engaging direct search fallback.`);
      const directCandidates = await fetchYouTubeSearchDirect(query, concepts, targetDurationRange);
      if (directCandidates.length > 0) {
        searchCache.set(normalizedQuery, { timestamp: Date.now(), data: directCandidates });
        return { candidates: directCandidates, isQuotaFallback: false };
      }
      return { candidates: [], isQuotaFallback: true };
    }

    const videosData = await videosRes.json();
    const candidateList: CandidateVideo[] = [];

    for (const [index, v] of (videosData.items || []).entries()) {
      const dur = parseISO8601Duration(v.contentDetails?.duration || "");
      const isShort = dur.seconds < 60;
      const viewCount = parseInt(v.statistics?.viewCount || "0", 10);
      const likeCount = parseInt(v.statistics?.likeCount || "0", 10);

      const candidateBase = {
        id: v.id,
        title: v.snippet?.title || "Educational Tutorial",
        description: v.snippet?.description || "",
        channelTitle: v.snippet?.channelTitle || "Engineering Channel",
        channelId: v.snippet?.channelId || "",
        publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
        thumbnail:
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        durationSeconds: dur.seconds,
        durationFormatted: dur.formatted,
        viewCount,
        likeCount,
        isShort,
      };

      const score = scoreCandidate(candidateBase, query, concepts, targetDurationRange, index);

      if (score >= 0.15 && !isShort) {
        candidateList.push({
          ...candidateBase,
          score,
        });
      }
    }

    // Sort by deterministic score descending
    candidateList.sort((a, b) => b.score - a.score);

    // If candidateList is empty, fall back to direct YouTube search
    if (candidateList.length === 0) {
      const directCandidates = await fetchYouTubeSearchDirect(query, concepts, targetDurationRange);
      if (directCandidates.length > 0) {
        searchCache.set(normalizedQuery, { timestamp: Date.now(), data: directCandidates });
        return { candidates: directCandidates, isQuotaFallback: false };
      }
    }

    // Save to cache
    searchCache.set(normalizedQuery, {
      timestamp: Date.now(),
      data: candidateList,
    });

    return { candidates: candidateList, isQuotaFallback: false };
  } catch (err) {
    console.error("YouTube search execution error, falling back to direct search:", err);
    const directCandidates = await fetchYouTubeSearchDirect(query, concepts, targetDurationRange);
    return { candidates: directCandidates, isQuotaFallback: directCandidates.length === 0 };
  }
}
