import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const getVersions: AppBlock = {
  name: "Get Versions",
  description: "Retrieve version history for a Confluence page",
  category: "Versions",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "The ID of the page to get versions for",
          type: "string",
          required: true,
        },
        limit: {
          name: "Limit",
          description:
            "Maximum number of versions to return (default: 25, max: 250)",
          type: "number",
          required: false,
          default: 25,
        },
        cursor: {
          name: "Cursor",
          description:
            "Used for pagination. Use the cursor from the previous response to get the next page",
          type: "string",
          required: false,
        },
        sort: {
          name: "Sort",
          description: "Sort the results by field",
          type: {
            type: "string",
            enum: ["modified-date", "version"],
          },
          required: false,
        },
        descending: {
          name: "Descending",
          description: "Sort in descending order",
          type: "boolean",
          required: false,
          default: false,
        },
        bodyFormat: {
          name: "Body Format",
          description: "Include version body content in specified format",
          type: {
            type: "string",
            enum: ["storage", "atlas_doc_format"],
          },
          required: false,
        },
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const {
          pageId,
          limit = 25,
          cursor,
          sort,
          descending = false,
          bodyFormat,
        } = input.event.inputConfig;

        const confluenceClient = createConfluenceClient({
          confluenceUrl,
          email,
          apiToken,
        });

        // Build query parameters
        const params = new URLSearchParams();

        if (limit) params.append("limit", limit.toString());
        if (cursor) params.append("cursor", cursor);
        if (sort) params.append("sort", sort);
        if (descending) params.append("descending", "true");
        if (bodyFormat) params.append("body-format", bodyFormat);

        const queryString = params.toString();
        const endpoint = queryString
          ? `/pages/${pageId}/versions?${queryString}`
          : `/pages/${pageId}/versions`;

        try {
          const response = await confluenceClient.get<{
            results: Array<{
              createdAt: string;
              message: string;
              number: number;
              minorEdit: boolean;
              authorId: string;
              body?: {
                representation: string;
                value: string;
              };
              _links: {
                self: string;
              };
            }>;
            _links: {
              next?: string;
              base: string;
            };
          }>(endpoint);

          await events.emit({
            pageId,
            versions: response.results,
            totalCount: response.results.length,
            nextCursor: response._links.next
              ? new URL(response._links.next).searchParams.get("cursor")
              : null,
            hasMore: !!response._links.next,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to retrieve page versions: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Page Versions",
      description: "Version history of the specified page",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "The ID of the page",
          },
          versions: {
            type: "array",
            description: "Array of version objects",
            items: {
              type: "object",
              properties: {
                createdAt: {
                  type: "string",
                  description: "When this version was created",
                },
                message: {
                  type: "string",
                  description: "Version message/comment",
                },
                number: {
                  type: "number",
                  description: "Version number",
                },
                minorEdit: {
                  type: "boolean",
                  description: "Whether this was a minor edit",
                },
                authorId: {
                  type: "string",
                  description: "ID of the user who created this version",
                },
                body: {
                  type: "object",
                  description: "Version body content (if requested)",
                  properties: {
                    representation: { type: "string" },
                    value: { type: "string" },
                  },
                },
                _links: {
                  type: "object",
                  description: "Links related to this version",
                  properties: {
                    self: { type: "string" },
                  },
                },
              },
              required: ["createdAt", "number", "minorEdit", "authorId"],
            },
          },
          totalCount: {
            type: "number",
            description: "Number of versions returned in this response",
          },
          nextCursor: {
            type: "string",
            description:
              "Cursor for the next page of results (null if no more results)",
          },
          hasMore: {
            type: "boolean",
            description: "Whether there are more results available",
          },
        },
        required: ["pageId", "versions", "totalCount", "hasMore"],
      },
    },
  },
};
