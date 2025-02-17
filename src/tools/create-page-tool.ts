import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import { Client } from "@notionhq/client";

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
    description: z.string().optional().describe("Optional description for the page"),
    icon: z.string().optional().describe("Optional emoji icon for the page"),
    coverUrl: z.string().optional().describe("Optional cover image URL for the page")
  }),
  output: z.any(),
  handler: async (
    { parentPageId, title, description, icon, coverUrl },
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
      const notion = new Client({ auth: tokens.accessToken });

      const pageData: any = {
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
      };

      // Add optional properties if provided
      if (description) {
        pageData.children = [
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  text: {
                    content: description
                  }
                }
              ]
            }
          }
        ];
      }

      if (icon) {
        pageData.icon = {
          type: "emoji",
          emoji: icon
        };
      }

      if (coverUrl) {
        pageData.cover = {
          type: "external",
          external: {
            url: coverUrl
          }
        };
      }

      const response = await notion.pages.create(pageData);

      const cardUI = new CardUIBuilder()
        .title("Page Created")
        .content(`Successfully created page: ${title}`)
        .build();

      return {
        text: `Created Notion page: ${title}`,
        data: response,
        ui: cardUI,
      };
    } catch (error: any) {
      console.error("Error creating page:", error);

      const alertUI = new AlertUIBuilder()
        .variant("error")
        .title("Error Creating Page")
        .message(error.message || "Failed to create page");

      return {
        text: "Failed to create page in Notion",
        data: {},
        ui: alertUI.build(),
      };
    }
  },
};

export { createPageConfig };
