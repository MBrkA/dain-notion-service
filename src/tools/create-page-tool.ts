import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";

import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const PagePropertiesSchema = z.object({
  title: z.array(
    z.object({
      text: z.object({
        content: z.string(),
      }),
    })
  ),
});

const createPageConfig: ToolConfig = {
  id: "create-page",
  name: "Create Notion Page",
  description: "Creates a new page in Notion under a specified parent page",
  input: z.object({
    parentPageId: z.string().describe("The ID of the parent page"),
    title: z.string().describe("The title of the new page"),
  }),
  output: z.any(),
  handler: async (
    { parentPageId, title }: { parentPageId: string; title: string },
    agentInfo,
    { app }
  ) => {
    console.log("Creating page with title:", title);
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
      const response = await axios.post(
        "https://api.notion.com/v1/pages",
        {
          parent: { page_id: parentPageId },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: title,
                  },
                },
              ],
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Page Created")
        .content(`Successfully created page: ${title}`)
        .build();

      return {
        text: `Created Notion page: ${title}`,
        data: response.data,
        ui: cardUI,
      };
    } catch (error: any) {
      console.error("Error creating page:", error.response?.data || error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error Creating Page")
        .message(error.response?.data?.message || "Failed to create page");

      return {
        text: "Failed to create page in Notion",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};

export { createPageConfig };
