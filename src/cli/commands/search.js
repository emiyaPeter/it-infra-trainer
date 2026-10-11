// ============================================================
// search 命令 — 搜索课程内容
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'courses');

function searchInDir(dir, keyword, results = [], maxResults = 20) {
  if (!fs.existsSync(dir)) return results;
  if (results.length >= maxResults) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (results.length >= maxResults) break;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchInDir(fullPath, keyword, results, maxResults);
    } else if (entry.name.endsWith('.md')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lowerContent = content.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();

        if (lowerContent.includes(lowerKeyword)) {
          // Extract context around the match
          const idx = lowerContent.indexOf(lowerKeyword);
          const start = Math.max(0, idx - 60);
          const end = Math.min(content.length, idx + keyword.length + 60);
          let snippet = content.slice(start, end).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

          if (start > 0) snippet = '...' + snippet;
          if (end < content.length) snippet = snippet + '...';

          // Extract title from frontmatter
          const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
          const title = titleMatch ? titleMatch[1] : entry.name.replace('.md', '');

          // Determine category
          const category = path.relative(DOCS_DIR, fullPath).split(path.sep)[0];

          results.push({
            title,
            category,
            file: fullPath,
            snippet,
            relPath: path.relative(DOCS_DIR, fullPath),
          });
        }
      } catch {
        // skip unreadable files
      }
    }
  }
  return results;
}

export async function searchContent(keyword) {
  console.log('');
  console.log(chalk.bold.cyan(`🔍 搜索: "${keyword}"`));
  console.log(chalk.gray('─'.repeat(70)));
  console.log('');

  const results = searchInDir(DOCS_DIR, keyword);

  if (results.length === 0) {
    console.log(chalk.yellow(`  未找到与 "${keyword}" 相关的内容。`));
    console.log(chalk.gray('  试试其他关键词？'));
    console.log('');
    return;
  }

  console.log(chalk.gray(`  找到 ${results.length} 个结果:\n`));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const num = chalk.bold(`  ${i + 1}.`);
    const title = chalk.green(r.title);
    const cat = chalk.gray(`[${r.category}]`);

    console.log(`${num} ${title} ${cat}`);
    console.log(`     ${chalk.gray(r.relPath)}`);

    // Highlight keyword in snippet
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlighted = r.snippet.replace(regex, chalk.yellow.bold('$1'));
    console.log(`     ${chalk.gray('"' + highlighted + '"')}`);
    console.log('');
  }

  console.log(chalk.gray(`  访问课程: npm run docs:dev → http://localhost:5173`));
  console.log('');
}
