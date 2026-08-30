import { defineAction } from "astro:actions";
import { env } from "cloudflare:workers";
import { inputSchema } from "./submitRecipe";

export const prerender = false;

export const server = {
  submitRecipe: defineAction({
    accept: "form",
    input: inputSchema,
    handler: async (input, context) => {
      const workflow = await env.SUBMISSION_WORKFLOW.create({
        params: {
          input,
        },
      });
      console.log(
        `Created workflow ${workflow.id}, status: ${await workflow.status()}`,
      );

      return workflow;
    },
  }),
};
