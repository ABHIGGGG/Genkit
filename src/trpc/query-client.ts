//This file creates and configures how caching works for API data.
//We use TanStack Query's QueryClient for this purpose.


import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 30 seconds stale time that means data will be fresh for 30 seconds and after that it will be considered stale
        // during this time if a query is requested again, it will use the cached data
        // after that it will fetch new data from the server
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
