import fs from 'node:fs/promises';
import path from 'node:path';

const WORKSPACE_ROOT = process.cwd();

const RUNTIME_ROOTS = ['app', 'components', 'constants', 'hooks', 'lib', 'types', 'styles'];
const DOC_FILES = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  'README.md',
  'UPDATE.MD',
  'SCENE_MAPPER_STATUS.md',
  'SYNTHESISSEQUENCER.md',
  'PROMPT.MD',
  'package.json',
  'tsconfig.json',
  'app.json',
  'eas.json',
  'eslint.config.js',
  'supabase-schema.sql',
];

const BOUNDARY_ROOTS = ['neobrutalist-ui-design', 'assets/images/neo-scroll-master-main'];

const EXCLUDED_PREFIXES = [
  '.git',
  '.expo',
  'node_modules',
  'dist',
  '.vscode',
  '_vscode',
  '.eas',
];

const ANALYZED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql']);
const IMPORTABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  /\bexport\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)['"]([^'"]+)['"]/g,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const HARD_LITERAL_PATTERNS = {
  hexColor: /#[0-9a-fA-F]{3,8}\\b/g,
  rgbaColor: /rgba?\\([^)]*\\)/g,
  tsExpect: /@ts-expect-error|@ts-ignore/g,
  asAny: /\\bas\\s+any\\b/g,
};

function toUnix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function getLayer(relativePath) {
  const first = relativePath.split('/')[0];
  if (RUNTIME_ROOTS.includes(first)) return first;
  if (BOUNDARY_ROOTS.some((root) => relativePath.startsWith(`${root}/`))) return 'boundary';
  if (DOC_FILES.includes(relativePath)) return 'root';
  return 'other';
}

async function exists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(startRelative) {
  const startAbsolute = path.join(WORKSPACE_ROOT, startRelative);
  if (!(await exists(startAbsolute))) return [];

  const out = [];
  const stack = [startAbsolute];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const stat = await fs.stat(current);
    if (stat.isDirectory()) {
      const items = await fs.readdir(current, { withFileTypes: true });
      for (const item of items) {
        const childAbsolute = path.join(current, item.name);
        const childRelative = toUnix(path.relative(WORKSPACE_ROOT, childAbsolute));

        if (item.isDirectory()) {
          const first = childRelative.split('/')[0];
          if (EXCLUDED_PREFIXES.includes(first)) continue;
          stack.push(childAbsolute);
          continue;
        }

        const ext = path.extname(item.name);
        if (ANALYZED_EXTENSIONS.has(ext)) {
          out.push(childRelative);
        }
      }
      continue;
    }

    const ext = path.extname(current);
    if (ANALYZED_EXTENSIONS.has(ext)) {
      out.push(toUnix(path.relative(WORKSPACE_ROOT, current)));
    }
  }

  return out;
}

async function resolveImport(fromRelative, specifier) {
  const fromAbsolute = path.join(WORKSPACE_ROOT, fromRelative);
  const fromDir = path.dirname(fromAbsolute);

  let candidateBase = null;
  if (specifier.startsWith('@/')) {
    candidateBase = path.join(WORKSPACE_ROOT, specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    candidateBase = path.resolve(fromDir, specifier);
  } else {
    return null;
  }

  const withExact = await exists(candidateBase);
  if (withExact) {
    const stat = await fs.stat(candidateBase);
    if (stat.isFile()) return toUnix(path.relative(WORKSPACE_ROOT, candidateBase));
  }

  for (const extension of IMPORTABLE_EXTENSIONS) {
    const withExt = `${candidateBase}${extension}`;
    if (await exists(withExt)) return toUnix(path.relative(WORKSPACE_ROOT, withExt));
  }

  for (const extension of IMPORTABLE_EXTENSIONS) {
    const withIndex = path.join(candidateBase, `index${extension}`);
    if (await exists(withIndex)) return toUnix(path.relative(WORKSPACE_ROOT, withIndex));
  }

  return null;
}

function countMatches(content, pattern) {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function parseImports(content) {
  const specifiers = [];

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const specifier = match[1];
      if (specifier) specifiers.push(specifier);
    }
  }

  return specifiers;
}

function classifyRole(relativePath) {
  if (relativePath.startsWith('app/')) return 'route-or-layout';
  if (relativePath.startsWith('components/')) return 'presentation';
  if (relativePath.startsWith('hooks/')) return 'state-logic';
  if (relativePath.startsWith('lib/')) return 'domain-or-api';
  if (relativePath.startsWith('constants/')) return 'token-or-config';
  if (relativePath.startsWith('types/')) return 'type-contract';
  if (relativePath.startsWith('styles/')) return 'style-shared';
  if (BOUNDARY_ROOTS.some((root) => relativePath.startsWith(`${root}/`))) return 'boundary-reference';
  if (DOC_FILES.includes(relativePath)) return 'doc-or-config';
  return 'other';
}

function scoreRisk(file, graph) {
  let score = 0;
  const reasons = [];

  if (file.layer !== 'boundary' && file.analysis.unresolvedInternalImports.length > 0) {
    score += 4;
    reasons.push('unresolved-internal-imports');
  }

  if (file.analysis.tsEscapeCount > 0) {
    score += 3;
    reasons.push('ts-escape');
  }

  if (file.analysis.asAnyCount > 0) {
    score += 2;
    reasons.push('as-any');
  }

  if (file.analysis.hardColorLiteralCount > 8 && file.layer === 'components') {
    score += 2;
    reasons.push('heavy-hardcoded-style-literals');
  }

  if (file.layer === 'constants' && file.dependents.length === 0) {
    score += 1;
    reasons.push('possibly-unused-constant-file');
  }

  if (file.layer === 'components' && file.dependents.length === 0 && !file.path.includes('/index.')) {
    score += 2;
    reasons.push('possibly-dead-component');
  }

  if (file.path.startsWith('app/') && file.imports.filter((imp) => imp.internal).length === 0) {
    score += 1;
    reasons.push('route-without-internal-dependencies');
  }

  if (graph.duplicateBasenames[file.basename]?.length > 1) {
    score += 1;
    reasons.push('duplicate-basename');
  }

  let severity = 'low';
  if (score >= 7) severity = 'high';
  else if (score >= 4) severity = 'medium';

  return { score, severity, reasons };
}

async function main() {
  const startedAt = new Date().toISOString();

  const runtimeFiles = (await Promise.all(RUNTIME_ROOTS.map((root) => walkFiles(root)))).flat();
  const docFiles = DOC_FILES.filter((file) => true);
  const boundaryFiles = (await Promise.all(BOUNDARY_ROOTS.map((root) => walkFiles(root)))).flat();

  const allTargetFiles = Array.from(new Set([...runtimeFiles, ...docFiles, ...boundaryFiles]));

  const graph = {
    generatedAt: startedAt,
    totals: {
      files: allTargetFiles.length,
      runtimeFiles: runtimeFiles.length,
      docFiles: docFiles.length,
      boundaryFiles: boundaryFiles.length,
    },
    files: {},
    duplicateBasenames: {},
    unresolvedInternalImportCount: 0,
    relationshipCount: 0,
    riskBuckets: { low: 0, medium: 0, high: 0 },
    flowPolicy: {
      canonicalFlow: 'module-flow',
      designSubtree: 'reference-only',
      vendorSubtree: 'vendor-only',
      backendTruth: 'neutral-mismatch-reporting',
    },
  };

  for (const relativePath of allTargetFiles) {
    const absolutePath = path.join(WORKSPACE_ROOT, relativePath);
    let content = '';
    try {
      content = await fs.readFile(absolutePath, 'utf8');
    } catch {
      content = '';
    }

    const ext = path.extname(relativePath);
    const imports = [];
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      const specifiers = parseImports(content);
      for (const specifier of specifiers) {
        const internal = specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('@/');
        imports.push({
          specifier,
          internal,
          resolved: null,
        });
      }
    }

    const basename = path.basename(relativePath);
    graph.duplicateBasenames[basename] = graph.duplicateBasenames[basename] || [];
    graph.duplicateBasenames[basename].push(relativePath);

    graph.files[relativePath] = {
      path: relativePath,
      basename,
      extension: ext,
      layer: getLayer(relativePath),
      role: classifyRole(relativePath),
      imports,
      dependents: [],
      analysis: {
        hardColorLiteralCount: countMatches(content, HARD_LITERAL_PATTERNS.hexColor) + countMatches(content, HARD_LITERAL_PATTERNS.rgbaColor),
        tsEscapeCount: countMatches(content, HARD_LITERAL_PATTERNS.tsExpect),
        asAnyCount: countMatches(content, HARD_LITERAL_PATTERNS.asAny),
        unresolvedInternalImports: [],
      },
    };
  }

  for (const [filePath, file] of Object.entries(graph.files)) {
    for (const item of file.imports) {
      if (!item.internal) continue;

      const resolved = await resolveImport(filePath, item.specifier);
      item.resolved = resolved;

      if (!resolved || !graph.files[resolved]) {
        file.analysis.unresolvedInternalImports.push(item.specifier);
        if (file.layer !== 'boundary') {
          graph.unresolvedInternalImportCount += 1;
        }
        continue;
      }

      graph.files[resolved].dependents.push(filePath);
      graph.relationshipCount += 1;
    }
  }

  for (const file of Object.values(graph.files)) {
    file.dependents = Array.from(new Set(file.dependents)).sort();
    file.analysis.unresolvedInternalImports = Array.from(new Set(file.analysis.unresolvedInternalImports)).sort();
    file.risk = scoreRisk(file, graph);
    graph.riskBuckets[file.risk.severity] += 1;
  }

  const highRisk = Object.values(graph.files)
    .filter((file) => file.risk.severity === 'high')
    .sort((a, b) => b.risk.score - a.risk.score)
    .slice(0, 20)
    .map((file) => ({
      path: file.path,
      score: file.risk.score,
      reasons: file.risk.reasons,
      unresolvedInternalImports: file.analysis.unresolvedInternalImports,
    }));

  const unresolved = Object.values(graph.files)
    .filter((file) => file.analysis.unresolvedInternalImports.length > 0)
    .map((file) => ({
      path: file.path,
      unresolvedInternalImports: file.analysis.unresolvedInternalImports,
    }));

  const byLayer = Object.values(graph.files).reduce((acc, file) => {
    acc[file.layer] = (acc[file.layer] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    generatedAt: startedAt,
    totals: graph.totals,
    relationships: graph.relationshipCount,
    unresolvedInternalImportCount: graph.unresolvedInternalImportCount,
    riskBuckets: graph.riskBuckets,
    filesByLayer: byLayer,
    topHighRisk: highRisk,
    unresolvedInternalImports: unresolved,
  };

  await fs.mkdir(path.join(WORKSPACE_ROOT, 'dist', 'audit'), { recursive: true });
  await fs.writeFile(path.join(WORKSPACE_ROOT, 'dist', 'audit', 'system-audit.json'), JSON.stringify({ summary, files: graph.files }, null, 2));

  const markdownLines = [
    '# System Harmony Audit',
    '',
    `Generated: ${startedAt}`,
    '',
    '## Scope',
    '',
    '- Canonical flow: module flow',
    '- Reference subtree: neobrutalist-ui-design (read-only boundary)',
    '- Vendor subtree: assets/images/neo-scroll-master-main (boundary)',
    '- Backend mismatch policy: neutral reporting',
    '',
    '## Totals',
    '',
    `- Files analyzed: ${summary.totals.files}`,
    `- Runtime files: ${summary.totals.runtimeFiles}`,
    `- Doc/config files: ${summary.totals.docFiles}`,
    `- Boundary files: ${summary.totals.boundaryFiles}`,
    `- Internal relationships: ${summary.relationships}`,
    `- Unresolved internal imports: ${summary.unresolvedInternalImportCount}`,
    '',
    '## Risk Buckets',
    '',
    `- High: ${summary.riskBuckets.high}`,
    `- Medium: ${summary.riskBuckets.medium}`,
    `- Low: ${summary.riskBuckets.low}`,
    '',
    '## Files by Layer',
    '',
    ...Object.entries(summary.filesByLayer)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([layer, count]) => `- ${layer}: ${count}`),
    '',
    '## Top High-Risk Files',
    '',
  ];

  if (summary.topHighRisk.length === 0) {
    markdownLines.push('- No high-risk files detected by heuristic.');
  } else {
    for (const item of summary.topHighRisk) {
      markdownLines.push(`- ${item.path} (score: ${item.score}) → ${item.reasons.join(', ')}`);
    }
  }

  markdownLines.push('', '## Next Step', '', '- Review `dist/audit/system-audit.json` as the file-level ledger for full harmonization work.');

  await fs.writeFile(path.join(WORKSPACE_ROOT, 'dist', 'audit', 'system-audit.md'), `${markdownLines.join('\n')}\n`);

  console.log('System audit completed.');
  console.log(`Files: ${summary.totals.files}`);
  console.log(`Relationships: ${summary.relationships}`);
  console.log(`Unresolved internal imports: ${summary.unresolvedInternalImportCount}`);
  console.log(`High risk files: ${summary.riskBuckets.high}`);
}

main().catch((error) => {
  console.error('System audit failed:', error);
  process.exit(1);
});
