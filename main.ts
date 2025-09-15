import { defineApp } from "@slflows/sdk/v1";
import { blocks } from "./blocks/index";
import { createConfluenceClient } from "./utils/confluenceClient";

export const app = defineApp({
  name: "Confluence Integration",
  installationInstructions:
    "Confluence integration app for managing pages, spaces, and content.\n\nTo install:\n1. Add your Confluence instance URL (e.g., https://your-domain.atlassian.net)\n2. Add your email address\n3. Add your Confluence API token (generate from Account Settings > Security > API tokens)\n4. Start using the blocks in your flows",

  blocks,

  config: {
    confluenceUrl: {
      name: "Confluence URL",
      description:
        "Your Confluence instance URL (e.g., https://your-domain.atlassian.net)",
      type: "string",
      required: true,
    },
    email: {
      name: "Email",
      description: "Your Confluence account email address",
      type: "string",
      required: true,
    },
    apiToken: {
      name: "API Token",
      description:
        "Your Confluence API token (generate from Account Settings > Security > API tokens)",
      type: "string",
      required: true,
      sensitive: true,
    },
  },

  signals: {
    userAccountId: {
      name: "User Account ID",
      description: "The account ID of the authenticated user",
    },
    userDisplayName: {
      name: "User Display Name",
      description: "Display name of the authenticated user",
    },
  },

  async onSync(input) {
    const { confluenceUrl, email, apiToken } = input.app.config;

    try {
      const confluenceClient = createConfluenceClient({
        confluenceUrl,
        email,
        apiToken,
      });

      // Validate credentials by testing API access
      await confluenceClient.get<{
        results: Array<{
          id: string;
          name: string;
        }>;
      }>("/spaces?limit=1");

      return {
        newStatus: "ready",
        signalUpdates: {
          userAccountId: email, // Use email as identifier
          userDisplayName: email, // Use email as display name
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        "Error during Confluence API authentication:",
        errorMessage,
      );

      return {
        newStatus: "failed",
        customStatusDescription: "Authentication error, see logs",
      };
    }
  },
});
