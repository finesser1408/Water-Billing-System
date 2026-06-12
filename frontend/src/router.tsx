import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { convex } from "./lib/convex-client";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient, convex } as { queryClient: QueryClient; convex: typeof convex },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
