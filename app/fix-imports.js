const fs = require('fs');
const path = require('path');

const voteComponentsDir = path.join(__dirname, 'src/app/components/vote');

// Read all files in the vote components directory
fs.readdir(voteComponentsDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Filter for TypeScript files
  const tsFiles = files.filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

  // Process each file
  tsFiles.forEach(file => {
    const filePath = path.join(voteComponentsDir, file);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${file}:`, err);
        return;
      }

      // Replace import paths
      let updatedContent = data;
      updatedContent = updatedContent.replace(/@\/app\/components\/ui\//g, '@/components/ui/');
      updatedContent = updatedContent.replace(/@\/app\/lib\/utils/g, '@/lib/utils');
      
      // Add "use client" directive to the top of each file
      if (!updatedContent.startsWith('"use client"')) {
        updatedContent = '"use client"\n\n' + updatedContent;
      }
      
      // Write the updated content back to the file
      fs.writeFile(filePath, updatedContent, 'utf8', err => {
        if (err) {
          console.error(`Error writing file ${file}:`, err);
          return;
        }
        console.log(`Updated import paths in ${file}`);
      });
    });
  });
}); 