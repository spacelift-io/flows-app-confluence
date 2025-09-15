import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const deletePage: AppBlock = {
  name: "Delete Page",
  description: "Delete a Confluence page by ID",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "The ID of the page to delete",
          type: "string",
          required: true,
        },
        purge: {
          name: "Purge",
          description:
            "Whether to permanently delete the page (true) or move to trash (false)",
          type: "boolean",
          required: false,
          default: false,
        },
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const { pageId, purge = false } = input.event.inputConfig;

        const confluenceClient = createConfluenceClient({
          confluenceUrl,
          email,
          apiToken,
        });

        // Build query parameters
        const params = new URLSearchParams();
        if (purge) {
          params.append("purge", "true");
        }

        const queryString = params.toString();
        const endpoint = queryString
          ? `/pages/${pageId}?${queryString}`
          : `/pages/${pageId}`;

        try {
          // DELETE request typically returns no content (204) or minimal response
          await confluenceClient.delete(endpoint);

          await events.emit({
            pageId,
            deleted: true,
            purged: purge,
            message: purge
              ? "Page has been permanently deleted"
              : "Page has been moved to trash",
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to delete Confluence page: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Delete Result",
      description: "Result of the page deletion operation",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "The ID of the deleted page",
          },
          deleted: {
            type: "boolean",
            description: "Whether the deletion was successful",
          },
          purged: {
            type: "boolean",
            description:
              "Whether the page was permanently deleted (purged) or moved to trash",
          },
          message: {
            type: "string",
            description: "Descriptive message about the deletion result",
          },
        },
        required: ["pageId", "deleted", "purged", "message"],
      },
    },
  },
};
