import { z } from "astro/zod";
import { env } from "cloudflare:workers";
import { Octokit } from "octokit";
import { dump } from "js-yaml";
import { generateText, Output } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// ---- Constants (override in wrangler.jsonc / secrets) ----
const OWNER = env.GH_OWNER;
const REPO = env.GH_REPO;
const DEFAULT_BRANCH = env.GH_DEFAULT_BRANCH;
const DESTINATION_FOLDER = env.DESTINATION_MARKDOWN_FOLDER;

// Token is a secret, only ever read server-side
const TOKEN = env.GH_TOKEN;

export const inputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().min(50).max(10_000), // recipes are generally between 400-4000 chars
    name: z.string(),
  }),
  // TODO: image (OCR), link (scrape), file (text or image)
]);
export type Input = z.infer<typeof inputSchema>;

const recipeSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(100)
    .describe("A short, title-case name for a recipe."),
  course: z.enum([
    "entrée",
    "side",
    "salad",
    "soup",
    "breakfast",
    "beverage",
    "dessert",
  ]),
  author: z
    .string()
    .min(1)
    .max(100)
    .describe("The recipe author's first name."),
  ingredients: z
    .union([z.array(z.string()), z.record(z.string(), z.array(z.string()))])
    .describe(
      "Recipe ingredients in order of usage, formatted as quantity, unit (optional), name, and comma + pre-preparation instructions (optional). Strongly prefer a single array of ingredients, unless the recipe is clearly broken into distinct parts (ex. a dish and an accompanyment), in which case provide an object mapping part names to ingredients for each part.",
    ),
  instructions: z
    .string()
    .min(10)
    .max(10_000)
    .describe(
      "A markdown ordered list describing the recipe steps. No headings. If given an introduction, include it above the list but keep it to 1-2 sentences max.",
    ),
  photoCaption: z
    .string()
    .max(1000)
    .nullish()
    .describe(
      "A concise, food-magazine-style caption describing the visual appearance of the completed recipe.",
    ),
});
export type Recipe = z.infer<typeof recipeSchema>;

const RECIPE_SYSTEM_PROMPT = `Your task is to format the rough content of a recipe provided by the user into structured parts that will be used to format the recipe for a cookbook. You may paraphrase and editorialize the original content as needed such that the formatted recipe is clear, concise, and complete.
Tone: straight-to-business with no fluff.
Recipe instructions: Assume the reader is somewhat knowledgable and don't waste words on the obvious, but don't remove anything important. Keep mentions of ingredient names consistent between the ingredient list and instructions. If minor details seem to be missing, fill them in, but don't change the substance of the recipe. Do the best you can while preserving the user's original intent; that is the top priority.
Example ingredients: ["16 oz pasta", "1 tsp oil", "3 cloves of garlic, minced", ...]
Example instructions: "1. In a pot, cook pasta to al dente and strain, retaining 1/2 cup of pasta water.\\n2. In a small skillet over medium heat, heat the oil and fry the garlic for 1 minute.\\n3. ..."`;

export async function createRecipe(input: Input): Promise<Recipe> {
  const gateway = env.AI.gateway("cookbook");
  const baseUrl = await gateway.getUrl("openrouter");

  const openrouter = createOpenAI({ baseURL: `${baseUrl}/v1` });

  const { output } = await generateText({
    model: openrouter("z-ai/glm-5.3-flash"),
    output: Output.object({
      schema: recipeSchema,
    }),
    instructions: {
      content: `${RECIPE_SYSTEM_PROMPT}\nThe user's name is ${input.name}.`,
      role: "system",
    },
    prompt: input.text,
    providerOptions: {
      openai: { reasoningEffort: "medium" },
    },
  });

  return output;
}

function formatRecipe(recipe: Recipe): string {
  const { instructions, ...rest } = recipe;
  const frontmatter = dump(rest);
  return `---\n${frontmatter}\n---\n\n${instructions}`;
}

export async function submitPr(recipe: Recipe, raw: string) {
  // Build a unique new branch for this PR
  const slug = slugify(recipe.title);
  const suffix = `${new Date().toISOString().split("T")[0]}`;
  const branch = `recipe/${slug}-${suffix}`;
  const filePath = `${DESTINATION_FOLDER}/${slug}.md`;
  const fileContent = formatRecipe(recipe);

  const octokit = new Octokit({ auth: TOKEN });
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
    title: `New recipe: ${recipe.title}`,
    head: branch,
    base: DEFAULT_BRANCH,
    body: prBody,
    draft: false,
  });

  return {
    title: recipe.title,
    prUrl: pr.html_url,
  };
}

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
