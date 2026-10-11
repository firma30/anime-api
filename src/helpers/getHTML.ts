import errorinCuy from "./errorinCuy.js";
import sanitizeHtml from "sanitize-html";
import https from "node:https";

export const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0";

function requestWithHttps(
  url: URL,
  headers: Record<string, string>,
  redirectCount = 0,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Terlalu banyak redirect"));
      return;
    }

    const request = https.get(
      url,
      { headers },
      (response) => {
        const statusCode = response.statusCode ?? 0;

        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          response.headers.location
        ) {
          const redirectUrl = new URL(response.headers.location, url);

          response.resume();

          requestWithHttps(redirectUrl, headers, redirectCount + 1)
            .then(resolve)
            .catch(reject);

          return;
        }

        let body = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          if (statusCode < 200 || statusCode >= 300) {
            reject(
              new Error(
                `HTTP ${statusCode} ketika mengambil ${url.toString()}`,
              ),
            );
            return;
          }

          resolve(body);
        });
      },
    );

    request.on("error", reject);
  });
}

export default async function getHTML(
  baseUrl: string,
  pathname: string,
  ref?: string,
  sanitize = false,
): Promise<string> {
  const url = new URL(pathname, baseUrl);

  const headers: Record<string, string> = {
    "User-Agent": userAgent,
  };

  if (ref) {
    // Sengaja mengikuti behavior repo original.
    headers.Refferer = ref.startsWith("http")
      ? ref
      : new URL(ref, baseUrl).toString();
  }

  let html: string;

  try {
    if (typeof fetch === "function") {
      const response = await fetch(url, {
        headers,
        redirect: "manual",
      });

      if (!response.ok) {
        response.status > 399
          ? errorinCuy(response.status)
          : errorinCuy(404);
      }

      html = await response.text();
    } else {
      html = await requestWithHttps(url, headers);
    }
  } catch (error) {
    console.error("Gagal mengambil HTML:", error);
    errorinCuy(500);
    throw error;
  }

  if (!html.trim()) {
    errorinCuy(404);
  }

  if (sanitize) {
    return sanitizeHtml(html, {
      allowedTags: [
        "address",
        "article",
        "aside",
        "footer",
        "header",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "main",
        "nav",
        "section",
        "blockquote",
        "div",
        "dl",
        "figcaption",
        "figure",
        "hr",
        "li",
        "main",
        "ol",
        "p",
        "pre",
        "ul",
        "a",
        "abbr",
        "b",
        "br",
        "code",
        "data",
        "em",
        "i",
        "mark",
        "span",
        "strong",
        "sub",
        "sup",
        "time",
        "u",
        "img",
      ],
      allowedAttributes: {
        a: ["href", "name", "target"],
        img: ["src"],
        "*": ["class", "id"],
      },
    });
  }

  return html;
}