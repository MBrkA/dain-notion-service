import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import { Client } from "@notionhq/client";

import {
  AlertUIBuilder,
  TableUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const getAllPagesConfig: ToolConfig = {
  id: "get-all-pages",
  name: "Get All Notion Pages",
  description: "Retrieves all pages accessible to the integration",
  input: z.object({
    startCursor: z.string().optional().describe("Cursor for pagination"),
    pageSize: z.number().optional().describe("Number of pages to return per request")
  }),
  output: z.any(),
  handler: async (
    { startCursor, pageSize = 100 },
    agentInfo,
    { app }
  ) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    // Handle authentication
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("notion", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Notion Authentication")
        .content("Please authenticate with Notion")
        .logo("https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png")
        .url(authUrl)
        .provider("notion");

      return {
        text: "Authentication required",
        data: [],
        ui: oauthUI.build(),
      };
    }

    try {
      const notion = new Client({ auth: tokens.accessToken });

      const response = await notion.search({
        filter: {
          property: "object",
          value: "page"
        },
        start_cursor: startCursor,
        page_size: pageSize
      });

      // Transform pages for table display
      const pages = response.results.map((page: any) => ({
        id: page.id,
        title: page.properties.title?.title?.[0]?.plain_text || "Untitled",
        created: new Date(page.created_time).toLocaleDateString(),
        lastEdited: new Date(page.last_edited_time).toLocaleDateString(),
        url: page.url
      }));

      const tableUI = new TableUIBuilder()
        .addColumns([
          { key: "title", header: "Title", type: "text" },
          { key: "created", header: "Created", type: "text" },
          { key: "lastEdited", header: "Last Edited", type: "text" },
          { key: "url", header: "URL", type: "link" }
        ])
        .rows(pages)
        .build();

      return {
        text: `Retrieved ${pages.length} pages`,
        data: {
          pages: response.results,
          next_cursor: response.next_cursor,
          has_more: response.has_more
        },
        ui: tableUI,
      };
    } catch (error: any) {
      console.error("Error fetching pages:", error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error Fetching Pages")
        .message(error.message || "Failed to fetch pages");

      return {
        text: "Failed to fetch pages from Notion",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};

export { getAllPagesConfig };
