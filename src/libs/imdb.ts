import * as cheerio from "cheerio";
import { getContext } from "hono/context-storage";

type Response =
  | {
    errors: {
      message: string;
      path: string[];
    }[];
    data: {
      title: null;
    };
  }
  | {
    errors: undefined;
    data: {
      title: {
        id: string;
        type: "tvSeries" | "movie";
        start_year: number;
        primary_title: string;
      };
    };
  };

const creditMap: Record<string, string> = {
  cast: "actor",
};

const TYPE_FILTER = {
  movie: ["tvMovie", "movie"],
  series: ["tvSeries"],
};

export default async function getImdb(id: string) {
  const kv = getContext<{ Bindings: CloudflareBindings }>().env.imdb;
  const data = await kv.get(id);
  if (data) {
    return JSON.parse(data) as Response;
  }

  const response = await fetch("https://graph.imdbapi.dev/v1", {
    method: "POST",
    headers: {
      "Content-Type": " application/json",
    },
    body: JSON.stringify({
      query: `
        query {
          title(id: "${id}") {
            id
            type
            start_year
            primary_title
          }
        }
      `.trim(),
    }),
  });

  const apiData = await response.json<Response>();
  await kv.put(id, JSON.stringify(apiData));
  return apiData;
}

export async function getImdbList(url: string, type: "movie" | "series") {
  const response = await fetch(url);
  const $ = cheerio.load(await response.text());
  const data = JSON.parse($("script#__NEXT_DATA__").text());
  const items =
    data.props.pageProps.mainColumnData.predefinedList.titleListItemSearch.edges.map(
      (edge) => edge.listItem,
    );
  const result = items
    .filter((item) => TYPE_FILTER[type].includes(item.titleType.id))
    .map((item) => {
      const links = item.principalCredits.flatMap((principalCredit) =>
        principalCredit.credits.map((credit) => ({
          category:
            creditMap[principalCredit.category.id] ??
            principalCredit.category.id,
          name: credit.name.nameText.text,
          url: `stremio:///search?search=${credit.name.nameText.text}`,
        })),
      );
      return {
        id: item.id,
        type,
        name: item.originalTitleText.text,
        poster: item.primaryImage.url,
        genres: item.titleGenres.genres.map((genre) => genre.genre.text),
        description: item.plot.plotText.plainText,
        releaseInfo: TYPE_FILTER[type].includes(item.titleType.id)
          ? item.releaseYear.year
          : `${item.releaseYear.year}-${item.releaseYear.endYear ?? ""}`,
        imdbRating: String(item.ratingsSummary.aggregateRating),
        runtime: type === "movie" ? `${item.runtime.seconds / 60} min` : undefined,
        cast: links
          .filter((link) => link.category === "actor")
          .map((link) => link.name),
        director: links
          .filter((link) => link.category === "director")
          .map((link) => link.name),
        links,
      };
    });
  return result;
}
