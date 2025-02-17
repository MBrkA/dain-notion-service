import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import { Client } from "@notionhq/client";

import { AlertUIBuilder, OAuthUIBuilder } from "@dainprotocol/utils";

const updatePageConfig: ToolConfig = {
  id: "update-page",
  name: "Update Notion Page",
  description: "Updates properties of an existing page in Notion",
  input: z.object({
    pageId: z.string().describe("The ID of the page to update"),
    properties: z.record(z.any()).describe("The properties to update"),
    archived: z.boolean().optional().describe("Whether to archive the page"),
    icon: z.object({
      type: z.enum(["emoji"]),
      emoji: z.string()
    }).optional().describe("Page icon"),
    cover: z.object({
      type: z.enum(["external"]),
      external: z.object({
        url: z.string()
      })
    }).optional().describe("Page cover image")
  }),
  output: z.any(),
  handler: async ({ pageId, properties, archived, icon, cover }, agentInfo, { app }) => {
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

      const updateData: any = {
        page_id: pageId,
        properties
      };

      if (archived !== undefined) {
        updateData.archived = archived;
      }

      if (icon) {
        updateData.icon = icon;
      }

      if (cover) {
        updateData.cover = cover;
      }

      const response = await notion.pages.update(updateData);

      return {
        text: `Updated page ${pageId}`,
        data: response,
        ui: undefined
      };
    } catch (error: any) {
      console.error("Error updating page:", error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error Updating Page")
        .message(error.message || "Failed to update page");

      return {
        text: "Failed to update page in Notion",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};

export { updatePageConfig };
