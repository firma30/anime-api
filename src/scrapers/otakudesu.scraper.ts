import otakudesuConfig from "@configs/otakudesu.config.js";
import getHTML, { userAgent } from "@helpers/getHTML.js";
import { parse, type HTMLElement } from "node-html-parser";
import https from "node:https";

const { baseUrl } = otakudesuConfig;

function postAjax(
  body: string,
  referer: string,
): Promise<{ data?: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL("/wp-admin/admin-ajax.php", baseUrl);

    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          "User-Agent": userAgent,
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "Content-Length": Buffer.byteLength(body),
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Origin: baseUrl,
          Referer: referer,
        },
      },
      (response) => {
        let responseBody = "";

        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          responseBody += chunk;
        });

        response.on("end", () => {
          const statusCode = response.statusCode ?? 0;

          if (statusCode < 200 || statusCode >= 300) {
            reject(
              new Error(
                `HTTP ${statusCode} ketika request ${url.toString()}`,
              ),
            );
            return;
          }

          try {
            const result = JSON.parse(responseBody) as {
              data?: string;
            };

            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

const otakudesuScraper = {
  async scrapeDOM(
    pathname: string,
    ref?: string,
    sanitize: boolean = false,
  ): Promise<HTMLElement> {
    const html = await getHTML(
      baseUrl,
      pathname,
      ref,
      sanitize,
    );

    const document = parse(html, {
      parseNoneClosedTags: true,
    });

    return document;
  },

  async scrapeNonce(
    body: string,
    referer: string,
  ): Promise<{ data?: string }> {
    return postAjax(body, referer);
  },

  async scrapeServer(
    body: string,
    referer: string,
  ): Promise<{ data?: string }> {
    return postAjax(body, referer);
  },
};

export default otakudesuScraper;