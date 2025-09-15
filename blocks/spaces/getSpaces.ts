import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const getSpaces: AppBlock = {
  name: "Get Spaces",
  description: "Retrieve a list of spaces from Confluence",
  category: "Spaces",

  inputs: {
    default: {
      config: {
        limit: {
          name: "Limit",
          description:
            "Maximum number of spaces to return (default: 25, max: 250)",
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
          name: "Space IDs",
          description: "Filter spaces by specific IDs",
          type: ["string"],
          required: false,
        },
        keys: {
          name: "Space Keys",
          description: "Filter spaces by specific keys",
          type: ["string"],
          required: false,
        },
        type: {
          name: "Space Type",
          description: "Filter spaces by type",
          type: {
            type: "string",
            enum: ["global", "personal"],
          },
          required: false,
        },
        status: {
          name: "Space Status",
          description: "Filter spaces by status",
          type: {
            type: "string",
            enum: ["current", "archived"],
          },
          required: false,
        },
        labels: {
          name: "Labels",
          description: "Filter spaces by labels",
          type: ["string"],
          required: false,
        },
        favouritedBy: {
          name: "Favorited By",
          description:
            "Filter spaces favorited by a specific user (account ID)",
          type: "string",
          required: false,
        },
        sort: {
          name: "Sort",
          description: "Sort the results",
          type: {
            type: "string",
            enum: [
              "id",
              "key",
              "name",
              "type",
              "status",
              "created-date",
              "modified-date",
            ],
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
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const {
          limit = 25,
          cursor,
          ids,
          keys,
          type,
          status,
          labels,
          favouritedBy,
          sort,
          descending = false,
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
          ids.forEach((id: any) => params.append("id", id));
        }
        if (keys && keys.length > 0) {
          keys.forEach((key: any) => params.append("key", key));
        }
        if (type) params.append("type", type);
        if (status) params.append("status", status);
        if (labels && labels.length > 0) {
          labels.forEach((label: any) => params.append("label", label));
        }
        if (favouritedBy) params.append("favourited-by", favouritedBy);
        if (sort) params.append("sort", sort);
        if (descending) params.append("descending", "true");

        const queryString = params.toString();
        const endpoint = queryString ? `/spaces?${queryString}` : "/spaces";

        try {
          const response = await confluenceClient.get<{
            results: Array<{
              id: string;
              key: string;
              name: string;
              type: string;
              status: string;
              authorId: string;
              createdAt: string;
              homepageId: string;
              description?: {
                representation: string;
                value: string;
              };
              icon?: {
                path: string;
                width: number;
                height: number;
                isDefault: boolean;
              };
              _links: {
                webui: string;
              };
            }>;
            _links: {
              next?: string;
              base: string;
            };
          }>(endpoint);

          await events.emit({
            spaces: response.results,
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
            `Failed to retrieve Confluence spaces: ${errorMessage}`,
          );
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Spaces",
      description: "List of spaces retrieved from Confluence",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          spaces: {
            type: "array",
            description: "Array of space objects",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the space",
                },
                key: {
                  type: "string",
                  description: "The key of the space",
                },
                name: {
                  type: "string",
                  description: "The name of the space",
                },
                type: {
                  type: "string",
                  description: "The type of the space (global or personal)",
                },
                status: {
                  type: "string",
                  description: "The status of the space (current or archived)",
                },
                authorId: {
                  type: "string",
                  description: "The ID of the space author",
                },
                createdAt: {
                  type: "string",
                  description: "The creation timestamp",
                },
                homepageId: {
                  type: "string",
                  description: "The ID of the space homepage",
                },
                description: {
                  type: "object",
                  description: "The space description",
                  properties: {
                    representation: { type: "string" },
                    value: { type: "string" },
                  },
                },
                icon: {
                  type: "object",
                  description: "The space icon",
                  properties: {
                    path: { type: "string" },
                    width: { type: "number" },
                    height: { type: "number" },
                    isDefault: { type: "boolean" },
                  },
                },
                _links: {
                  type: "object",
                  description: "Links related to the space",
                  properties: {
                    webui: { type: "string" },
                  },
                },
              },
              required: [
                "id",
                "key",
                "name",
                "type",
                "status",
                "authorId",
                "createdAt",
                "homepageId",
              ],
            },
          },
          totalCount: {
            type: "number",
            description: "Number of spaces returned in this response",
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
        required: ["spaces", "totalCount", "hasMore"],
      },
    },
  },
};
