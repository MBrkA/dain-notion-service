# Notion Integration DAIN Service

This DAIN service provides integration with Notion, allowing users to create and manage Notion pages through a simple interface.

## Features

- OAuth2 authentication with Notion
- Create new pages under existing pages
- Secure token management
- Error handling with user-friendly messages

## Setup

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Set the required environment variables:
   - \`DAIN_API_KEY\`: Your DAIN API key
   - \`NOTION_CLIENT_ID\`: Your Notion integration client ID
   - \`NOTION_CLIENT_SECRET\`: Your Notion integration client secret
   - \`TUNNEL_URL\`: Your public URL for OAuth callbacks (optional for local development)

## Tools

### Create Page Tool
Creates a new page in Notion under a specified parent page.

Required parameters:
- \`parentPageId\`: The ID of the parent page
- \`title\`: The title for the new page

## Used prompts to generate this application:
- generate a dain application that utilizes notion api. before each tool check for oauth. create one tool: create page
 (Added https://developers.notion.com/reference/create-a-token and https://developers.notion.com/reference/post-page to mentions)

