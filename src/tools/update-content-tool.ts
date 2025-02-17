import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import { Client } from "@notionhq/client";

import { AlertUIBuilder, OAuthUIBuilder } from "@dainprotocol/utils";

const updateContentConfig: ToolConfig = {
  id: "update-content",
  name: "Update Page Content",
  description: "Updates the content blocks of an existing Notion page",
  input: z.object({
    pageId: z.string().describe("The ID of the page to update"),
    content: z.array(z.object({
      type: z.string().describe("The type of block to add"),
      text: z.string().describe("The text content of the block")
    })).describe("Array of content blocks to add to the page")
  }),
  output: z.any(),
  handler: async ({ pageId, content }, agentInfo, { app }) => {
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

      // Transform content array into Notion blocks
      const blocks = content.map(item => ({
        object: "block",
        type: item.type,
        [item.type]: {
          rich_text: [{
            type: "text",
            text: {
              content: item.text
            }
          }]
        }
      }));

      // Update page content
      const response = await notion.blocks.children.append({
        block_id: pageId,
        children: blocks
      });

      return {
        text: `Updated content of page ${pageId}`,
        data: response,
        ui: undefined
      };
    } catch (error: any) {
      console.error("Error updating page content:", error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error Updating Content")
        .message(error.message || "Failed to update page content");

      return {
        text: "Failed to update page content in Notion",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};

export { updateContentConfig };
