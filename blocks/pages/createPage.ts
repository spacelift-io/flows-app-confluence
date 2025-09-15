import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const createPage: AppBlock = {
  name: "Create Page",
  description: "Create a new Confluence page with specified details",
  category: "Pages",

  inputs: {
    default: {
      config: {
        spaceId: {
          name: "Space ID",
          description: "The ID of the space where the page will be created",
          type: "string",
          required: true,
        },
        title: {
          name: "Title",
          description: "The title of the page",
          type: "string",
          required: true,
        },
        status: {
          name: "Status",
          description: "The status of the page (current or draft)",
          type: {
            type: "string",
            enum: ["current", "draft"],
          },
          required: false,
          default: "current",
        },
        parentId: {
          name: "Parent Page ID",
          description:
            "The ID of the parent page (optional, creates a child page)",
          type: "string",
          required: false,
        },
        bodyValue: {
          name: "Body Content",
          description: "The content value of the page",
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
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const {
          spaceId,
          title,
          status = "current",
          parentId,
          bodyValue,
          bodyRepresentation = "storage",
        } = input.event.inputConfig;

        const confluenceClient = createConfluenceClient({
          confluenceUrl,
          email,
          apiToken,
        });

        // Build the page data
        const pageData: any = {
          spaceId,
          status,
          title,
        };

        // Add parent if specified
        if (parentId) {
          pageData.parentId = parentId;
        }

        // Add body if provided
        if (bodyValue) {
          pageData.body = {
            representation: bodyRepresentation,
            value: bodyValue,
          };
        }

        try {
          const createdPage = await confluenceClient.post<{
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
          }>("/pages", pageData);

          await events.emit({
            pageId: createdPage.id,
            title: createdPage.title,
            status: createdPage.status,
            spaceId: createdPage.spaceId,
            parentId: createdPage.parentId,
            authorId: createdPage.authorId,
            createdAt: createdPage.createdAt,
            version: createdPage.version,
            editUrl: createdPage._links.editui,
            webUrl: createdPage._links.webui,
            body: createdPage.body,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to create Confluence page: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Created Page",
      description: "Details of the successfully created page",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "The ID of the created page",
          },
          title: {
            type: "string",
            description: "The title of the created page",
          },
          status: {
            type: "string",
            description: "The status of the created page",
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
            description: "The creation timestamp",
          },
          version: {
            type: "object",
            description: "Version information of the created page",
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
