require 'pathname'
require 'find'

def format_md_files(directory = '.')
  md_files = Find.find(directory).select { |path| path.end_with?('.md') }

  if md_files.empty?
    puts "No HEIC files found in #{directory}"
    return
  end

  md_files.each do |md_file|
    puts "Processing: #{md_file}"
    begin
      recipe_contents = File.read(md_file)
    rescue Errno::ENOENT => e
      puts "Error reading #{md_file}: #{e}. Skipping."
      next
    end

    lms_chat_command = "lms chat --prompt \
\"The following text is a loosely formatted recipe in markdown. I want you to reformat it into a structured markdown file with frontmatter suitable for Astro. The frontmatter should match this schema:

    z.object({
  // inferred from path by default
  title: z.string().optional(),
  category: z.string(),
  author: z.string(),
  // if given a record, splits the ingredient list into sections
  ingredients: z.union([z.array(z.string()), z.record(z.array(z.string()))]),
  notes: z.string().optional(),
})

For example:

---
category: drinks
author: Sam
ingredients:
  - 1.5 oz rye whiskey (Hard Truth Cask Strength Rye)
  - 3 oz apple cider
  - ½ oz brown sugar simple
  - 5 dashes Fee Brothers Cardamom Bitters
  - Juice from one lemon
  - 2 spritz of saline solution
  - 1 egg white (optional)
---

The body of the markdown file should just be the instructions to make the recipe, as a numbered list with no headings. It should not include the recipe's title—you can put that in the title field in the frontmatter. Body example:

1. Shake all ingredients well.
2. Double strain and garnish with three coffee beans.

Output ONLY the reformatted file. Do not output a markdown fence. If the given recipe appears to be two separate recipes, treat them as independent recipes and output two markdown files back to back, i.e. frontmatter, body, frontmatter, body, and don't try to combine them. Apply minimal editorialization—keep it word-for-word as much as possible.

Recipe:

#{recipe_contents}\""

    puts "Running: #{lms_chat_command}"
    output = `#{lms_chat_command}`

    File.write(md_file, output)

    puts "Wrote cleaned recipe to: #{md_file}"
  end
end

format_md_files('.')

puts "Finished processing md files."
