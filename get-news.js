const Parser = require("rss-parser");

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
  },
});

// Coordinate Database for auto-geotagging
const LOCATIONS = {
  "bermuda": { lat: 32.3078, lng: -64.7505 },
  "london": { lat: 51.5074, lng: -0.1278 },
  "uk": { lat: 54.5, lng: -4.0 },
  "u.k.": { lat: 54.5, lng: -4.0 },
  "united kingdom": { lat: 54.5, lng: -4.0 },
  "lloyd's": { lat: 51.5130, lng: -0.0822 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "nyc": { lat: 40.7128, lng: -74.0060 },
  "florida": { lat: 27.6648, lng: -81.5158 },
  "california": { lat: 36.7783, lng: -119.4179 },
  "texas": { lat: 31.9686, lng: -99.9018 },
  "louisiana": { lat: 30.9843, lng: -91.9623 },
  "zurich": { lat: 47.3769, lng: 8.5417 },
  "swiss": { lat: 46.8182, lng: 8.2275 },
  "munich": { lat: 48.1351, lng: 11.5820 },
  "hannover": { lat: 52.3759, lng: 9.7320 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "singapore": { lat: 1.3521, lng: 103.8198 },
  "hong kong": { lat: 22.3193, lng: 114.1694 },
  "tokyo": { lat: 35.6762, lng: 139.6503 },
  "japan": { lat: 36.2048, lng: 138.2529 },
  "australia": { lat: -25.2744, lng: 133.7751 },
  "sydney": { lat: -33.8688, lng: 151.2093 },
  "canada": { lat: 56.1304, lng: -106.3468 },
  "germany": { lat: 51.1657, lng: 10.4515 },
  "france": { lat: 46.2276, lng: 2.2137 },
  "italy": { lat: 41.8719, lng: 12.5674 },
  "spain": { lat: 40.4637, lng: -3.7492 },
  "china": { lat: 35.8617, lng: 104.1954 },
  "india": { lat: 20.5937, lng: 78.9629 },
  "dubai": { lat: 25.2048, lng: 55.2708 },
  "uae": { lat: 23.4241, lng: 53.8478 },
  "usa": { lat: 37.0902, lng: -95.7129 },
  "us": { lat: 37.0902, lng: -95.7129 },
  "america": { lat: 37.0902, lng: -95.7129 },
  "caribbean": { lat: 15.3275, lng: -61.3726 },
  "vietnam": { lat: 14.0583, lng: 108.2772 },
  "jamaica": { lat: 18.1096, lng: -77.2975 },
  "basel": { lat: 47.5596, lng: 7.5886 },
  "seattle": { lat: 47.6062, lng: -122.3321 }
};

const findLocation = (text) => {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATIONS)) {
    // Regex matches whole words only (prevents matching "us" in "virus")
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lowerText)) {
      return { name: key.charAt(0).toUpperCase() + key.slice(1), ...coords };
    }
  }
  return null;
};

exports.handler = async function (event) {
  const { query = "", type = "" } = event.queryStringParameters || {};

  let articles = [];

  const classify = (title = "") => {
    const text = title.toLowerCase();
    if (/\b(merger|acquisition|takeover|agrees|buy|sold|buying|stake|m&a)\b/.test(text)) {
      return "Mergers & Acquisitions";
    }
    if (
      /\b(loss|catastrophe|hurricane|wildfire|flood|cyber|earthquake|typhoon|storm|disaster|claims|insured loss|nat cat)\b/.test(
        text
      )
    ) {
      return "Major Loss";
    }
    return "General";
  };

  try {
    const feeds = [
      { url: "https://www.reinsurancene.ws/feed/", source: "Reinsurance News" },
      { url: "https://www.artemis.bm/feed/", source: "Artemis" },
      { url: "https://www.insurancejournal.com/rss/news/international/", source: "Insurance Journal (Intl)" },
      { url: "https://www.insurancebusinessmag.com/us/rss/", source: "Insurance Business" },
      { url: "https://www.canadianunderwriter.ca/feed/", source: "Canadian Underwriter" },
      { url: "https://www.insurancetimes.co.uk/rss/news", source: "Insurance Times" }
    ];

    const feedPromises = feeds.map(async (feed) => {
      try {
        const feedResult = await parser.parseURL(feed.url);
        return feedResult.items.map((item) => {
            const combinedText = (item.title + " " + (item.contentSnippet || "")).toLowerCase();
            const location = findLocation(item.title) || findLocation(item.contentSnippet);
            
            return {
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              content: item.contentSnippet || item.content || "",
              source: feed.source,
              category: classify(combinedText),
              location: location // Returns {lat, lng, name} or null
            };
        });
      } catch (err) {
        console.error(`Error fetching ${feed.source}:`, err.message);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    articles = results.flat();

    // Deduplicate
    const uniqueArticles = [];
    const seenTitles = new Set();
    
    articles.forEach(article => {
        const normalizedTitle = article.title.toLowerCase().trim().substring(0, 60); 
        if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            uniqueArticles.push({
                ...article,
                id: Math.random().toString(36).substr(2, 9)
            });
        }
    });
    
    articles = uniqueArticles;

    // Client Filters
    if (type) {
      articles = articles.filter((a) => a.category === type);
    }
    if (query) {
       const q = query.toLowerCase();
       articles = articles.filter(a => a.title.toLowerCase().includes(q));
    }

    // Sort
    articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // Limit
    articles = articles.slice(0, 300);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300", 
      },
      body: JSON.stringify({ articles }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch news", details: error.message }),
    };
  }
};