import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const getPage: AppBlock = {
  name: "Get Page",
  description: "Retrieve a single Confluence page by ID",
  category: "Pages",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "The ID of the page to retrieve",
          type: "string",
          required: true,
        },
        bodyFormat: {
          name: "Body Format",
          description: "The format to return the page body content in",
          type: {
            type: "string",
            enum: [
              "storage",
              "atlas_doc_format",
              "view",
              "editor",
              "anonymous_export_view",
            ],
          },
          required: false,
          default: "storage",
        },
        getDraft: {
          name: "Get Draft",
          description: "Whether to retrieve the draft version if available",
          type: "boolean",
          required: false,
          default: false,
        },
        version: {
          name: "Version",
          description: "Specific version number to retrieve (optional)",
          type: "number",
          required: false,
        },
        includeLabels: {
          name: "Include Labels",
          description: "Whether to include page labels in the response",
          type: "boolean",
          required: false,
          default: false,
        },
        includeProperties: {
          name: "Include Properties",
          description: "Whether to include page properties in the response",
          type: "boolean",
          required: false,
          default: false,
        },
        includeOperations: {
          name: "Include Operations",
          description:
            "Whether to include available operations in the response",
          type: "boolean",
          required: false,
          default: false,
        },
        includeLikes: {
          name: "Include Likes",
          description: "Whether to include like information in the response",
          type: "boolean",
          required: false,
          default: false,
        },
        includeVersions: {
          name: "Include Versions",
          description: "Whether to include version history in the response",
          type: "boolean",
          required: false,
          default: false,
        },
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const {
          pageId,
          bodyFormat = "storage",
          getDraft = false,
          version,
          includeLabels = false,
          includeProperties = false,
          includeOperations = false,
          includeLikes = false,
          includeVersions = false,
        } = input.event.inputConfig;

        const confluenceClient = createConfluenceClient({
          confluenceUrl,
          email,
          apiToken,
        });

        // Build query parameters
        const params = new URLSearchParams();

        if (bodyFormat) params.append("body-format", bodyFormat);
        if (getDraft) params.append("get-draft", "true");
        if (version) params.append("version", version.toString());
        if (includeLabels) params.append("include-labels", "true");
        if (includeProperties) params.append("include-properties", "true");
        if (includeOperations) params.append("include-operations", "true");
        if (includeLikes) params.append("include-likes", "true");
        if (includeVersions) params.append("include-versions", "true");

        const queryString = params.toString();
        const endpoint = queryString
          ? `/pages/${pageId}?${queryString}`
          : `/pages/${pageId}`;

        try {
          const page = await confluenceClient.get<{
            id: string;
            status: string;
            title: string;
            spaceId: string;
            parentId?: string;
            authorId: string;
            ownerId: string;
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
            labels?: Array<{
              id: string;
              name: string;
              prefix: string;
            }>;
            properties?: Array<{
              id: string;
              key: string;
              value: any;
              version: {
                number: number;
                createdAt: string;
                authorId: string;
              };
            }>;
            operations?: Array<{
              operation: string;
              targetType: string;
            }>;
            likes?: {
              count: number;
              isLiked: boolean;
            };
            versions?: {
              results: Array<{
                number: number;
                createdAt: string;
                minorEdit: boolean;
                authorId: string;
                message: string;
              }>;
            };
            _links: {
              editui: string;
              webui: string;
              self: string;
            };
          }>(endpoint);

          await events.emit({
            pageId: page.id,
            title: page.title,
            status: page.status,
            spaceId: page.spaceId,
            parentId: page.parentId,
            authorId: page.authorId,
            ownerId: page.ownerId,
            createdAt: page.createdAt,
            version: page.version,
            body: page.body,
            labels: page.labels,
            properties: page.properties,
            operations: page.operations,
            likes: page.likes,
            versions: page.versions,
            editUrl: page._links.editui,
            webUrl: page._links.webui,
            apiUrl: page._links.self,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(
            `Failed to retrieve Confluence page: ${errorMessage}`,
          );
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Page",
      description: "The retrieved Confluence page",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "The ID of the page",
          },
          title: {
            type: "string",
            description: "The title of the page",
          },
          status: {
            type: "string",
            description: "The status of the page",
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
          ownerId: {
            type: "string",
            description: "The ID of the page owner",
          },
          createdAt: {
            type: "string",
            description: "The creation timestamp",
          },
          version: {
            type: "object",
            description: "Version information of the page",
            properties: {
              createdAt: { type: "string" },
              message: { type: "string" },
              number: { type: "number" },
              minorEdit: { type: "boolean" },
              authorId: { type: "string" },
            },
          },
          body: {
            type: "object",
            description: "The body content of the page",
            properties: {
              representation: { type: "string" },
              value: { type: "string" },
            },
          },
          labels: {
            type: "array",
            description: "Page labels (if included)",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                prefix: { type: "string" },
              },
            },
          },
          properties: {
            type: "array",
            description: "Page properties (if included)",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                key: { type: "string" },
                value: { type: "object" },
                version: {
                  type: "object",
                  properties: {
                    number: { type: "number" },
                    createdAt: { type: "string" },
                    authorId: { type: "string" },
                  },
                },
              },
            },
          },
          operations: {
            type: "array",
            description: "Available operations (if included)",
            items: {
              type: "object",
              properties: {
                operation: { type: "string" },
                targetType: { type: "string" },
              },
            },
          },
          likes: {
            type: "object",
            description: "Like information (if included)",
            properties: {
              count: { type: "number" },
              isLiked: { type: "boolean" },
            },
          },
          versions: {
            type: "object",
            description: "Version history (if included)",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    number: { type: "number" },
                    createdAt: { type: "string" },
                    minorEdit: { type: "boolean" },
                    authorId: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
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
          apiUrl: {
            type: "string",
            description: "The API URL for the page",
          },
        },
        required: [
          "pageId",
          "title",
          "status",
          "spaceId",
          "authorId",
          "ownerId",
          "createdAt",
          "version",
        ],
      },
    },
  },
};
