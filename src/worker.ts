import { handle } from "@astrojs/cloudflare/handler";
import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from "cloudflare:workers";
import { createRecipe, submitPr, type Input } from "./actions/submitRecipe";

type Params = {
  input: Input;
};

export class SubmissionWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const input = event.payload.input;

    const recipe = await step.do("create recipe", async () => {
      return createRecipe(input);
    });

    const pr = await step.do("create PR", () => {
      return submitPr(recipe, input.text);
    });

    return pr;
  }
}

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
