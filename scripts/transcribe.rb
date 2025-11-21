require 'pathname'
require 'find'

def process_heic_files(directory = '.')
  # Find all HEIC files in the specified directory (defaults to current directory)
  heic_files = Find.find(directory).select { |path| path.end_with?('.HEIC') }

  if heic_files.empty?
    puts "No HEIC files found in #{directory}"
    return
  end

  heic_files.each do |heic_file|
    puts "Processing: #{heic_file}"

    # 1. OCR to recipe.txt
    ocr_command = "shortcuts run ocr -i \"#{heic_file}\" -o recipe.txt"
    puts "Running: #{ocr_command}"
    system(ocr_command)

    # Check if the OCR command was successful.  Important!
    if $?.exitstatus != 0
      puts "OCR failed for #{heic_file}. Skipping."
      next # Skip to the next file if OCR fails.
    end

    # 2. Read contents of recipe.txt
    begin
      recipe_contents = File.read('recipe.txt')
    rescue Errno::ENOENT => e
      puts "Error reading recipe.txt: #{e}. Skipping."
      next # Skip to the next file if recipe.txt is missing
    end

    # 3. LMS Chat Prompt and Write to TXT file
    lms_chat_command = "lms chat --prompt \"The following text is a recipe extracted from an image. There are formatting issues. Please clean up the recipe to match the most likely intent. If the wording is already syntactically correct, do not change it. Recipe:\n\n#{recipe_contents}\""
    puts "Running: #{lms_chat_command}"

    # Capture the output of lms chat
    output = `#{lms_chat_command}`
    title = `lms chat --prompt "The following text is a recipe. Find the title of the recipe and output only the title, in title-case. Recipe:\n\n#{output}"`

    # Create the output filename based on the HEIC file's name
    output_filename = "#{title.gsub(/\W+/, '-')}.txt"

    # Write the output to the TXT file
    File.write(output_filename, output)

    puts "Wrote cleaned recipe to: #{output_filename}"
  end
end


# Run the script
process_heic_files('.') # Process files in the current directory

puts "Finished processing HEIC files."
