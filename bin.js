#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import { bold, cyan, grey, yellow } from "kleur/colors";
import { create } from "./index.js";
import { dist } from "./utils.js";
import { Buffer } from "node:buffer";

const { version } = JSON.parse(
  fs.readFileSync(new URL("package.json", import.meta.url), "utf-8")
);
let cwd = process.argv[2] || ".";

console.log(`
${grey(`create-svelte version ${version}`)}
`);

p.intro("Welcome to SvelteKit!");

if (cwd === ".") {
  const dir = await p.text({
    message: "Where should we create your project?",
    placeholder: "  (hit Enter to use current directory)",
  });

  if (p.isCancel(dir)) process.exit(1);

  if (dir) {
    cwd = /** @type {string} */ (dir);
  }
}

if (fs.existsSync(cwd)) {
  if (fs.readdirSync(cwd).length > 0) {
    const force = await p.confirm({
      message: "Directory not empty. Continue?",
      initialValue: false,
    });

    // bail if `force` is `false` or the user cancelled with Ctrl-C
    if (force !== true) {
      process.exit(1);
    }
  }
}

const options = await p.group(
  {
    template: () =>
      p.select({
        message: "Which Svelte app template?",
        // @ts-expect-error i have no idea what is going on here
        options: fs.readdirSync(dist("templates")).map((dir) => {
          const meta_file = dist(`templates/${dir}/meta.json`);
          const { title, description } = JSON.parse(
            fs.readFileSync(meta_file, "utf8")
          );

          return {
            label: title,
            hint: description,
            value: dir,
          };
        }),
      }),
    types: () =>
      p.select({
        message: "Add type checking with TypeScript?",
        options: [
          {
            label: "Yes, using JavaScript with JSDoc comments",
            // @ts-expect-error :shrug:
            value: "checkjs",
          },
          {
            label: "Yes, using TypeScript syntax",
            // @ts-expect-error :shrug:
            value: "typescript",
          },
          { label: "No", value: null },
        ],
      }),

    features: () =>
      p.multiselect({
        message: "Select additional options (use arrow keys/space bar)",
        required: false,
        options: [
          {
            value: "eslint",
            label: "Add ESLint for code linting",
          },
          {
            value: "prettier",
            label: "Add Prettier for code formatting",
          },
          {
            value: "playwright",
            label: "Add Playwright for browser testing",
          },
          {
            value: "vitest",
            label: "Add Vitest for unit testing",
          },
        ],
      }),
  },
  { onCancel: () => process.exit(1) }
);

await create(cwd, {
  name: path.basename(path.resolve(cwd)),
  template: /** @type {'default' | 'skeleton' | 'skeletonlib'} */ (
    options.template
  ),
  types: options.types,
  prettier: options.features.includes("prettier"),
  eslint: options.features.includes("eslint"),
  playwright: options.features.includes("playwright"),
  vitest: options.features.includes("vitest"),
});

p.outro(`Your project is ready!`);

const currentDirectory = process.cwd()
fs.mkdirSync(`${currentDirectory}//${cwd}/src/routes/api`);
const bufTs = Buffer.from(
  `import type { LayoutServerLoad } from './$types';
  import { cwd } from 'process';
  import fs from 'node:fs';
  
  export const load = (async ({ route }) => {
    const currentDirectory = cwd()
    const fileToRead = route.id == '/' ? \`\${currentDirectory}/src/routes/+page.svelte\` : \`\${currentDirectory}/src/routes/\${route.id}/+page.svelte\`
    const themeFile = \`\${currentDirectory}/static/theme.txt\`
    const content = await fs.promises.readFile(fileToRead);
    const themeContent = await fs.promises.readFile(themeFile);
    return {
      data: {
        source: content.toString('utf8'),
        file: fileToRead,
        theme: JSON.stringify(themeContent.toString('utf8'))
      }
    };
  }) satisfies LayoutServerLoad;
  `,
  "utf8"
);
const bufJs = Buffer.from(
  `import { cwd } from 'process';
	import fs from 'node:fs';
	
	export const load = (async ({ route }) => {
	  const currentDirectory = cwd()
	  const fileToRead = route.id == '/' ? \`\${currentDirectory}/src/routes/+page.svelte\` : \`\${currentDirectory}/src/routes/\${route.id}/+page.svelte\`
    const themeFile = \`\${currentDirectory}/static/theme.txt\`
	  const content = await fs.promises.readFile(fileToRead);
    const themeContent = await fs.promises.readFile(themeFile);
		return {
		  data: {
		  source: content.toString('utf8'),
		  file: fileToRead,
      theme: JSON.stringify(themeContent.toString('utf8'))
		}
		};
	})`,
  "utf8"
);
if (options.types === "typescript") {
  console.log(bold("✔ Typescript"));
  console.log('  Inside Svelte components, use <script lang="ts">\n');
  fs.writeFileSync(
    `${currentDirectory}/${cwd}/src/routes/+layout.server.ts`,
    bufTs
  );
} else if (options.types === "checkjs") {
  console.log(bold("✔ Type-checked JavaScript"));
  console.log(cyan("  https://www.typescriptlang.org/tsconfig#checkJs\n"));
  fs.writeFileSync(
    `${currentDirectory}/${cwd}/src/routes/+layout.server.js`,
    bufJs
  );
} else if (options.template === "skeletonlib") {
  const warning = yellow("▲");
  console.log(
    `${warning} You chose to not add type checking, but TypeScript will still be installed in order to generate type definitions when building the library\n`
  );
} else {
  fs.writeFileSync(
    `${currentDirectory}/${cwd}/src/routes/+layout.server.js`,
    bufJs
  );
}

if (options.features.includes("eslint")) {
  console.log(bold("✔ ESLint"));
  console.log(cyan("  https://github.com/sveltejs/eslint-plugin-svelte3\n"));
}

if (options.features.includes("prettier")) {
  console.log(bold("✔ Prettier"));
  console.log(cyan("  https://prettier.io/docs/en/options.html"));
  console.log(
    cyan("  https://github.com/sveltejs/prettier-plugin-svelte#options\n")
  );
}

if (options.features.includes("playwright")) {
  console.log(bold("✔ Playwright"));
  console.log(cyan("  https://playwright.dev\n"));
}

if (options.features.includes("vitest")) {
  console.log(bold("✔ Vitest"));
  console.log(cyan("  https://vitest.dev\n"));
}

console.log("Install community-maintained integrations:");
console.log(cyan("  https://github.com/svelte-add/svelte-add"));

console.log("\nNext steps:");
let i = 1;

const relative = path.relative(process.cwd(), cwd);
if (relative !== "") {
  console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
}

console.log(`  ${i++}: ${bold(cyan("npm install"))} (or pnpm install, etc)`);
// prettier-ignore
console.log(`  ${i++}: ${bold(cyan('git init && git add -A && git commit -m "Initial commit"'))} (optional)`);
console.log(`  ${i++}: ${bold(cyan("npm run dev -- --open"))}`);

console.log(`\nTo close the dev server, hit ${bold(cyan("Ctrl-C"))}`);
console.log(`\nStuck? Visit us at ${cyan("https://svelte.dev/chat")}`);
