import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";
import { Octokit } from "octokit";
import type { APIRoute } from "astro";
import { dump } from "js-yaml";

export const prerender = false;

// ---- Constants (override in wrangler.jsonc / secrets) ----
const OWNER = env.GH_OWNER;
const REPO = env.GH_REPO;
const DEFAULT_BRANCH = env.GH_DEFAULT_BRANCH;
const DESTINATION_FOLDER = env.DESTINATION_MARKDOWN_FOLDER;
const MAX_PER_DAY = Number(env.MAX_SUBMISSIONS_PER_DAY);

// Token is a secret, only ever read server-side
const TOKEN = env.GH_TOKEN;

type Env = {
  RECIPE_KV: KVNamespace;
};

const inputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().min(50).max(10_000), // recipes are generally between 400-4000 chars
    name: z.string(),
  }),
  // TODO: image (OCR), link (scrape), file (text or image)
]);
type Input = z.infer<typeof inputSchema>;

export const server = {
  submitRecipe: defineAction({
    accept: "form",
    input: inputSchema,
    handler: async (input) => {
      // global rate limit
      const { success } = await env.RATE_LIMITER.limit({
        key: "recipe-creation",
      });
      if (!success) {
        throw new ActionError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded, try again later.",
        });
      }

      const recipe = await createRecipe(input);
      await submitPr(recipe, input.text);
    },
  }),
};

const recipeSchema = z.object({
  title: z.string().min(3).max(100),
  course: z.enum([
    "entrée",
    "side",
    "salad",
    "soup",
    "breakfast",
    "beverage",
    "dessert",
  ]),
  author: z.string().min(1).max(100),
  ingredients: z.array(z.string()),
  instructions: z.string().min(10).max(10_000),
  photoCaption: z.string().max(1000).nullish(),
});
type Recipe = z.infer<typeof recipeSchema>;

async function createRecipe(input: Input): Promise<Recipe> {
  
  return {
    title: "TODO",
    course: "TODO",
    author: "TODO",
    ingredients: [],
    instructions: "1. TODO\n",
    photoCaption: "TODO",
  };
}

function formatRecipe(recipe: Recipe): string {
  const { instructions, ...rest } = recipe;
  const frontmatter = dump(rest);
  return `---\n${frontmatter}\n---\n\n${instructions}`;
}

async function submitPr(recipe: Recipe, raw: string) {
  // Build a unique new branch for this PR
  const slug = slugify(recipe.title);
  const suffix = `${new Date().toISOString().split("T")[0]}`;
  const branch = `recipe/${slug}-${suffix}`;
  const filePath = `${DESTINATION_FOLDER}/${slug}.md`;
  const fileContent = formatRecipe(recipe);

  const octokit = new Octokit({ auth: TOKEN });
  try {
    // 1. Get current default-branch SHA to fork from
    const { data: headRef } = await octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${DEFAULT_BRANCH}`,
    });

    // 2. Create the new branch pointing at that SHA
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${branch}`,
      sha: headRef.object.sha,
    });

    // 3. Commit the recipe markdown onto that branch
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      message: `feat: add recipe "${recipe.title}"`,
      content: Buffer.from(fileContent, "utf-8").toString("base64"),
      branch,
    });

    // 4. Open the PR, embedding the raw submission in the description
    const rawEscaped = raw.replace(/`/g, "\\`");
    const prBody = [
      `**New recipe submission: ${recipe.title}**`,
      ``,
      `**Formatted recipe:**`,
      `See the file \`${filePath}\` in this PR.`,
      ``,
      `<details>`,
      `<summary>Raw submission</summary>`,
      ``,
      "```text",
      rawEscaped,
      "```",
      ``,
      `</details>`,
    ].join("\n");

    const { data: pr } = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `New recipe: ${name}`,
      head: branch,
      base: DEFAULT_BRANCH,
      body: prBody,
      draft: false,
    });

    return {
      prUrl: pr.html_url,
    };
  } catch (err) {
    throw new ActionError({
      code: "UNPROCESSABLE_CONTENT",
      message: err instanceof Error ? err.message : undefined,
    });
  }
}

// You provide this: format raw natural language into recipe markdown
declare function formatRawSubmissionToMarkdown(raw: string): Promise<string>;

// Simple slugify for a filename
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
