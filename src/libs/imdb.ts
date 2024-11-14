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
