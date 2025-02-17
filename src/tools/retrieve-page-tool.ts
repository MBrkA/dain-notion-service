import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import { Client } from "@notionhq/client";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const retrievePageConfig: ToolConfig = {
  id: "retrieve-page",
  name: "Retrieve Notion Page",
  description: "Retrieves a specific page from Notion by ID",
  input: z.object({
    pageId: z.string().describe("The ID of the page to retrieve"),
  }),
  output: z.any(),
  handler: async (
    { pageId },
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

      // Retrieve the page
      const page = await notion.pages.retrieve({ page_id: pageId });

      // Get page content (blocks)
      const blocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      const title = page.properties.title?.title?.[0]?.plain_text || "Untitled";

      const cardUI = new CardUIBuilder()
        .title(title)
        .content(`
          Created: ${new Date(page.created_time).toLocaleDateString()}
          Last Edited: ${new Date(page.last_edited_time).toLocaleDateString()}
          URL: ${page.url}
        `)
        .build();

      return {
        text: `Retrieved page: ${title}`,
        data: {
          page,
          blocks: blocks.results
        },
        ui: cardUI,
      };
    } catch (error: any) {
      console.error("Error retrieving page:", error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error Retrieving Page")
        .message(error.message || "Failed to retrieve page");

      return {
        text: "Failed to retrieve page from Notion",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};

export { retrievePageConfig };
