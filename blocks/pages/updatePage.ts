import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const updatePage: AppBlock = {
  name: "Update Page",
  description: "Update an existing Confluence page",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "The ID of the page to update",
          type: "string",
          required: true,
        },
        title: {
          name: "Title",
          description: "The new title of the page",
          type: "string",
          required: false,
        },
        status: {
          name: "Status",
          description: "The status of the page (current or draft)",
          type: {
            type: "string",
            enum: ["current", "draft"],
          },
          required: false,
        },
        bodyValue: {
          name: "Body Content",
          description: "The new content value of the page",
          type: "string",
          required: false,
        },
        bodyRepresentation: {
          name: "Body Representation",
          description:
            "The representation format (storage, atlas_doc_format, wiki)",
          type: {
            type: "string",
            enum: ["storage", "atlas_doc_format", "wiki"],
          },
          required: false,
          default: "storage",
        },
        versionNumber: {
          name: "Version Number",
          description:
            "The current version number of the page (required for updates)",
          type: "number",
          required: true,
        },
        versionMessage: {
          name: "Version Message",
          description: "Optional message describing the changes made",
          type: "string",
          required: false,
        },
        minorEdit: {
          name: "Minor Edit",
          description: "Whether this is a minor edit (doesn't notify watchers)",
          type: "boolean",
          required: false,
          default: false,
        },
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const {
          pageId,
          title,
          status,
          bodyValue,
          bodyRepresentation = "storage",
          versionNumber,
          versionMessage,
          minorEdit = false,
        } = input.event.inputConfig;

        const confluenceClient = createConfluenceClient({
          confluenceUrl,
          email,
          apiToken,
        });

        // Build the update data
        const updateData: any = {
          version: {
            number: versionNumber,
            minorEdit,
          },
        };

        // Add version message if provided
        if (versionMessage) {
          updateData.version.message = versionMessage;
        }

        // Add title if provided
        if (title) {
          updateData.title = title;
        }

        // Add status if provided
        if (status) {
          updateData.status = status;
        }

        // Add body if provided
        if (bodyValue) {
          updateData.body = {
            representation: bodyRepresentation,
            value: bodyValue,
          };
        }

        try {
          const updatedPage = await confluenceClient.put<{
            id: string;
            status: string;
            title: string;
            spaceId: string;
            parentId?: string;
            authorId: string;
            createdAt: string;
            version: {
              createdAt: string;
              message: string;
              number: number;
              minorEdit: boolean;
              authorId: string;
            };
            body?: {
              representation: string;
              value: string;
            };
            _links: {
              editui: string;
              webui: string;
            };
          }>(`/pages/${pageId}`, updateData);

          await events.emit({
            pageId: updatedPage.id,
            title: updatedPage.title,
            status: updatedPage.status,
            spaceId: updatedPage.spaceId,
            parentId: updatedPage.parentId,
            authorId: updatedPage.authorId,
            createdAt: updatedPage.createdAt,
            version: updatedPage.version,
            editUrl: updatedPage._links.editui,
            webUrl: updatedPage._links.webui,
            body: updatedPage.body,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to update Confluence page: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Updated Page",
      description: "Details of the successfully updated page",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "The ID of the updated page",
          },
          title: {
            type: "string",
            description: "The title of the updated page",
          },
          status: {
            type: "string",
            description: "The status of the updated page",
          },
          spaceId: {
            type: "string",
            description: "The ID of the space containing the page",
          },
          parentId: {
            type: "string",
            description: "The ID of the parent page (if any)",
          },
          authorId: {
            type: "string",
            description: "The ID of the page author",
          },
          createdAt: {
            type: "string",
            description: "The original creation timestamp",
          },
          version: {
            type: "object",
            description: "Version information of the updated page",
            properties: {
              createdAt: { type: "string" },
              message: { type: "string" },
              number: { type: "number" },
              minorEdit: { type: "boolean" },
              authorId: { type: "string" },
            },
          },
          editUrl: {
            type: "string",
            description: "The edit URL for the page",
          },
          webUrl: {
            type: "string",
            description: "The web URL for the page",
          },
          body: {
            type: "object",
            description: "The body content of the page",
            properties: {
              representation: { type: "string" },
              value: { type: "string" },
            },
          },
        },
        required: [
          "pageId",
          "title",
          "status",
          "spaceId",
          "authorId",
          "createdAt",
          "version",
          "editUrl",
          "webUrl",
        ],
      },
    },
  },
};
