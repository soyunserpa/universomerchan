const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Replace "import Link from 'next/link'" or "import Link from "next/link""
  if (/import\s+Link\s+from\s+["']next\/link["']/.test(content)) {
    content = content.replace(/import\s+Link\s+from\s+["']next\/link["']/g, 'import { Link } from "@/i18n/routing"');
    changed = true;
  }

  // 2. Handle next/navigation imports (useRouter, redirect, usePathname)
  // We extract them from next/navigation and add them from @/i18n/routing
  
  const navImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+["']next\/navigation["']/);
  if (navImportMatch) {
    const imports = navImportMatch[1].split(',').map(s => s.trim());
    const nextIntlImports = [];
    const nextNavImports = [];
    
    imports.forEach(imp => {
      if (['useRouter', 'redirect', 'usePathname'].includes(imp)) {
        nextIntlImports.push(imp);
      } else if (imp !== '') {
        nextNavImports.push(imp);
      }
    });

    if (nextIntlImports.length > 0) {
      let replacement = '';
      if (nextNavImports.length > 0) {
        replacement = `import { ${nextNavImports.join(', ')} } from "next/navigation";\nimport { ${nextIntlImports.join(', ')} } from "@/i18n/routing";`;
      } else {
        replacement = `import { ${nextIntlImports.join(', ')} } from "@/i18n/routing";`;
      }
      content = content.replace(navImportMatch[0], replacement);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated: " + file);
  }
});

console.log("Done!");
