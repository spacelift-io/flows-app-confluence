import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const listPages: AppBlock = {
  name: "List Pages",
  description:
    "Retrieve a list of pages from Confluence with filtering and pagination",
  category: "Pages",

  inputs: {
    default: {
      config: {
        limit: {
          name: "Limit",
          description:
            "Maximum number of pages to return (default: 25, max: 250)",
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
        ids: {
          name: "Page IDs",
          description: "Filter pages by specific IDs",
          type: ["string"],
          required: false,
        },
        spaceIds: {
          name: "Space IDs",
          description: "Filter pages by specific space IDs",
          type: ["string"],
          required: false,
        },
        title: {
          name: "Title",
          description: "Filter pages by title (partial match)",
          type: "string",
          required: false,
        },
        status: {
          name: "Status",
          description: "Filter pages by status",
          type: {
            type: "string",
            enum: ["current", "draft", "archived"],
          },
          required: false,
        },
        authorId: {
          name: "Author ID",
          description: "Filter pages by author account ID",
          type: "string",
          required: false,
        },
        ownerId: {
          name: "Owner ID",
          description: "Filter pages by owner account ID",
          type: "string",
          required: false,
        },
        createdAt: {
          name: "Created At",
          description: "Filter pages by creation date (ISO 8601 format)",
          type: "string",
          required: false,
        },
        createdAtRange: {
          name: "Created At Range",
          description: "Filter pages created within a date range",
          type: {
            type: "object",
            properties: {
              from: {
                type: "string",
                description: "Start date (ISO 8601 format)",
              },
              to: {
                type: "string",
                description: "End date (ISO 8601 format)",
              },
            },
          },
          required: false,
        },
        sort: {
          name: "Sort",
          description: "Sort the results by field",
          type: {
            type: "string",
            enum: ["id", "title", "created-date", "modified-date"],
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
          description: "Include page body in specified format",
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
          limit = 25,
          cursor,
          ids,
          spaceIds,
          title,
          status,
          authorId,
          ownerId,
          createdAt,
          createdAtRange,
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
        if (ids && ids.length > 0) {
          ids.forEach((id: string) => params.append("id", id));
        }
        if (spaceIds && spaceIds.length > 0) {
          spaceIds.forEach((spaceId: string) =>
            params.append("space-id", spaceId),
          );
        }
        if (title) params.append("title", title);
        if (status) params.append("status", status);
        if (authorId) params.append("author-id", authorId);
        if (ownerId) params.append("owner-id", ownerId);
        if (createdAt) params.append("created-at", createdAt);
        if (createdAtRange) {
          if (createdAtRange.from)
            params.append("created-at-from", createdAtRange.from);
          if (createdAtRange.to)
            params.append("created-at-to", createdAtRange.to);
        }
        if (sort) params.append("sort", sort);
        if (descending) params.append("descending", "true");
        if (bodyFormat) params.append("body-format", bodyFormat);

        const queryString = params.toString();
        const endpoint = queryString ? `/pages?${queryString}` : "/pages";

        try {
          const response = await confluenceClient.get<{
            results: Array<{
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
              _links: {
                editui: string;
                webui: string;
                self: string;
              };
            }>;
            _links: {
              next?: string;
              base: string;
            };
          }>(endpoint);

          await events.emit({
            pages: response.results,
            totalCount: response.results.length,
            nextCursor: response._links.next
              ? new URL(response._links.next).searchParams.get("cursor")
              : null,
            hasMore: !!response._links.next,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(
            `Failed to retrieve Confluence pages: ${errorMessage}`,
          );
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Pages",
      description: "List of pages retrieved from Confluence",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            description: "Array of page objects",
            items: {
              type: "object",
              properties: {
                id: {
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
                  description: "The body content of the page (if requested)",
                  properties: {
                    representation: { type: "string" },
                    value: { type: "string" },
                  },
                },
                _links: {
                  type: "object",
                  description: "Links related to the page",
                  properties: {
                    editui: { type: "string" },
                    webui: { type: "string" },
                    self: { type: "string" },
                  },
                },
              },
              required: [
                "id",
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
          totalCount: {
            type: "number",
            description: "Number of pages returned in this response",
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
        required: ["pages", "totalCount", "hasMore"],
      },
    },
  },
};
