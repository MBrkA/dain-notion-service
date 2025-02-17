import { createOAuth2Tool, defineDAINService } from "@dainprotocol/service-sdk";
import { getTokenStore } from "./token-store";
import { createPageConfig } from "./tools/create-page-tool";
import { getAllPagesConfig } from "./tools/get-all-pages-tool";
import { retrievePageConfig } from "./tools/retrieve-page-tool";

export const dainService = defineDAINService({
  metadata: {
    title: "Notion Integration",
    description: "A DAIN service for interacting with Notion API",
    version: "1.0.0",
    author: "DAIN",
    tags: ["notion", "productivity"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    createOAuth2Tool("notion"),
    createPageConfig,
    getAllPagesConfig,
    retrievePageConfig,
  ],
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || "http://localhost:2022",
    providers: {
      notion: {
        clientId: process.env.NOTION_CLIENT_ID as string,
        clientSecret: process.env.NOTION_CLIENT_SECRET as string,
        authorizationUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        useBasicAuth: true,
        usePKCE: true,
        scopes: ["page:write"],
        onSuccess: async (agentId, tokens) => {
          console.log("Completed OAuth flow for agent", agentId);
          getTokenStore().setToken(agentId, tokens);
          console.log(`Stored tokens for agent ${agentId}`);
        },
      },
    },
  },
});
