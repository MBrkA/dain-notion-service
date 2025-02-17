# Notion Integration DAIN Service

This DAIN service provides integration with Notion, allowing users to create and manage Notion pages through a simple interface.

## Features

- OAuth2 authentication with Notion
- Create new pages under existing pages
- Retrieve pages
- Update pages
- Add content to pages
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

- create-page
- get-all-pages
- retrieve-page
- update-page
- add-content

## Used prompts to generate this application:
- generate a dain application that utilizes notion api. before each tool check for oauth. create one tool: create page
 (Added https://developers.notion.com/reference/create-a-token and https://developers.notion.com/reference/post-page to mentions)
- implement create page using @notionhq/client
- add a tool: get-all-pages
 (Added https://developers.notion.com/reference/post-search to mentions)
- add a tool: retrieve page
 (Added https://developers.notion.com/reference/retrieve-a-page to mentions)
- add a tool: update page. "ui" of return can be undefined. example response of pages.update ```<exampleoutput>```
 (Added https://developers.notion.com/reference/patch-page to mentions)
- add a tool: update content of a page
- change name of update-content-tool to add-content-tool
- add card ui to retrieve-page. this card should show blocks.results