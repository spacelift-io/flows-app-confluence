import { AppBlock, events } from "@slflows/sdk/v1";
import { createConfluenceClient } from "../../utils/confluenceClient";

export const createInlineComment: AppBlock = {
  name: "Create Inline Comment",
  description:
    "Create an inline comment on specific content within a Confluence page",
  category: "Comments",

  inputs: {
    default: {
      config: {
        pageId: {
          name: "Page ID",
          description: "The ID of the page to comment on",
          type: "string",
          required: true,
        },
        bodyValue: {
          name: "Comment Content",
          description: "The content of the comment",
          type: "string",
          required: true,
        },
        bodyRepresentation: {
          name: "Body Representation",
          description: "The representation format of the comment content",
          type: {
            type: "string",
            enum: ["storage", "atlas_doc_format"],
          },
          required: false,
          default: "storage",
        },
        inlineCommentProperties: {
          name: "Inline Comment Properties",
          description:
            "Properties defining where the inline comment is positioned",
          type: {
            type: "object",
            properties: {
              textSelection: {
                type: "string",
                description:
                  "The selected text that the comment is attached to",
              },
              textSelectionMatchIndex: {
                type: "number",
                description:
                  "The index of the text selection match (if multiple matches exist)",
              },
            },
            required: ["textSelection"],
          },
          required: true,
        },
        parentCommentId: {
          name: "Parent Comment ID",
          description:
            "The ID of the parent comment (for replies to inline comments)",
          type: "string",
          required: false,
        },
      },
      onEvent: async (input) => {
        const { confluenceUrl, email, apiToken } = input.app.config;
        const {
          pageId,
          bodyValue,
          bodyRepresentation = "storage",
          inlineCommentProperties,
          parentCommentId,
        } = input.event.inputConfig;

        const confluenceClient = createConfluenceClient({
          confluenceUrl,
          email,
          apiToken,
        });

        // Build the inline comment data
        const commentData: any = {
          pageId,
          body: {
            representation: bodyRepresentation,
            value: bodyValue,
          },
          inlineCommentProperties: {
            textSelection: inlineCommentProperties.textSelection,
          },
        };

        // Add text selection match index if provided
        if (inlineCommentProperties.textSelectionMatchIndex !== undefined) {
          commentData.inlineCommentProperties.textSelectionMatchIndex =
            inlineCommentProperties.textSelectionMatchIndex;
        }

        // Add parent comment if this is a reply
        if (parentCommentId) {
          commentData.parentCommentId = parentCommentId;
        }

        try {
          const createdComment = await confluenceClient.post<{
            id: string;
            status: string;
            title: string;
            pageId: string;
            parentCommentId?: string;
            authorId: string;
            createdAt: string;
            version: {
              createdAt: string;
              message: string;
              number: number;
              minorEdit: boolean;
              authorId: string;
            };
            body: {
              representation: string;
              value: string;
            };
            inlineCommentProperties: {
              textSelection: string;
              textSelectionMatchIndex?: number;
            };
            _links: {
              webui: string;
              self: string;
            };
          }>("/inline-comments", commentData);

          await events.emit({
            commentId: createdComment.id,
            status: createdComment.status,
            title: createdComment.title,
            pageId: createdComment.pageId,
            parentCommentId: createdComment.parentCommentId,
            authorId: createdComment.authorId,
            createdAt: createdComment.createdAt,
            version: createdComment.version,
            body: createdComment.body,
            inlineCommentProperties: createdComment.inlineCommentProperties,
            webUrl: createdComment._links.webui,
            apiUrl: createdComment._links.self,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(`Failed to create inline comment: ${errorMessage}`);
        }
      },
    },
  },

  outputs: {
    default: {
      name: "Created Inline Comment",
      description: "Details of the successfully created inline comment",
      default: true,
      possiblePrimaryParents: ["default"],
      type: {
        type: "object",
        properties: {
          commentId: {
            type: "string",
            description: "The ID of the created comment",
          },
          status: {
            type: "string",
            description: "The status of the comment",
          },
          title: {
            type: "string",
            description: "The title of the comment",
          },
          pageId: {
            type: "string",
            description: "The ID of the page the comment belongs to",
          },
          parentCommentId: {
            type: "string",
            description: "The ID of the parent comment (if this is a reply)",
          },
          authorId: {
            type: "string",
            description: "The ID of the comment author",
          },
          createdAt: {
            type: "string",
            description: "The creation timestamp",
          },
          version: {
            type: "object",
            description: "Version information of the comment",
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
            description: "The body content of the comment",
            properties: {
              representation: { type: "string" },
              value: { type: "string" },
            },
          },
          inlineCommentProperties: {
            type: "object",
            description: "Properties of the inline comment positioning",
            properties: {
              textSelection: { type: "string" },
              textSelectionMatchIndex: { type: "number" },
            },
          },
          webUrl: {
            type: "string",
            description: "The web URL for the comment",
          },
          apiUrl: {
            type: "string",
            description: "The API URL for the comment",
          },
        },
        required: [
          "commentId",
          "status",
          "pageId",
          "authorId",
          "createdAt",
          "version",
          "body",
          "inlineCommentProperties",
          "webUrl",
          "apiUrl",
        ],
      },
    },
  },
};
