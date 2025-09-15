import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const getChildPages: AppBlock = {
  name: "Get Child Pages",
  description: "Retrieve direct child pages of a Confluence page",
  category: "Children",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "The ID of the parent page to get children for",
          type: "string",
          required: true,
        },
        limit: {
          name: "Limit",
          description:
            "Maximum number of child pages to return (default: 25, max: 250)",
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
          description: "Include page body content in specified format",
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
          ? `/pages/${pageId}/direct-children?${queryString}`
          : `/pages/${pageId}/direct-children`;

        try {
          const response = await confluenceClient.get<{
            results: Array<{
              id: string;
              status: string;
              title: string;
              spaceId: string;
              parentId: string;
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
            parentPageId: pageId,
            childPages: response.results,
            totalCount: response.results.length,
            nextCursor: response._links.next
              ? new URL(response._links.next).searchParams.get("cursor")
              : null,
            hasMore: !!response._links.next,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to retrieve child pages: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Child Pages",
      description: "Direct child pages of the specified parent page",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          parentPageId: {
            type: "string",
            description: "The ID of the parent page",
          },
          childPages: {
            type: "array",
            description: "Array of child page objects",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the child page",
                },
                title: {
                  type: "string",
                  description: "The title of the child page",
                },
                status: {
                  type: "string",
                  description: "The status of the child page",
                },
                spaceId: {
                  type: "string",
                  description: "The ID of the space containing the page",
                },
                parentId: {
                  type: "string",
                  description: "The ID of the parent page",
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
                "parentId",
                "authorId",
                "ownerId",
                "createdAt",
                "version",
              ],
            },
          },
          totalCount: {
            type: "number",
            description: "Number of child pages returned in this response",
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
        required: ["parentPageId", "childPages", "totalCount", "hasMore"],
      },
    },
  },
};
