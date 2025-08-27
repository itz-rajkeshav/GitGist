import { ASTSummary, FileAnalysis } from './astParser';

// Simple chunk interface
export interface SimpleChunk {
  id: string;
  text: string;
  type: 'function' | 'import' | 'export' | 'class' | 'variable' | 'summary';
  file: string;
  name?: string;
}

// Simple chunking options
export interface ChunkOptions {
  maxSize?: number;  // max characters per chunk
  combine?: boolean;  // combine small chunks
}

// Default options
const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxSize: 500,
  combine: true
};

/**
 * Simple chunking function - easy to use
 */
export function chunk(analysis: FileAnalysis, options?: ChunkOptions): SimpleChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: SimpleChunk[] = [];
  const { file, ast_summary } = analysis;
  
  // Functions
  for (const fn of ast_summary.functions) {
    chunks.push({
      id: `${file}::${fn.name}`,
      text: `Function: ${fn.name}\nParams: ${fn.params.join(', ')}\nCalls: ${fn.calls.join(', ')}`,
      type: 'function',
      file,
      name: fn.name
    });
  }
  
  // Imports
  if (ast_summary.imports.length > 0) {
    const importText = ast_summary.imports
      .map(imp => `from ${imp.source}: ${imp.imports.join(', ')}`)
      .join('\n');
    chunks.push({ id: `${file}::imports`, text: `Imports:\n${importText}`, type: 'import', file });
  }
  
  // Exports
  if (ast_summary.exports.length > 0) {
    const exportText = ast_summary.exports
      .map(exp => `${exp.type}: ${exp.name}${exp.isDefault ? ' (default)' : ''}`)
      .join('\n');
    chunks.push({ id: `${file}::exports`, text: `Exports:\n${exportText}`, type: 'export', file });
  }
  
  // Classes
  for (const className of ast_summary.classes) {
    chunks.push({ id: `${file}::${className}`, text: `Class: ${className}`, type: 'class', file, name: className });
  }
  
  // Variables
  if (ast_summary.variables.length > 0) {
    chunks.push({ id: `${file}::variables`, text: `Variables: ${ast_summary.variables.join(', ')}`, type: 'variable', file });
  }
  
  // Summary when nothing else exists
  if (chunks.length === 0) {
    chunks.push({
      id: `${file}::summary`,
      text: `File: ${file}\nFunctions: ${ast_summary.functions.length}\nImports: ${ast_summary.imports.length}\nExports: ${ast_summary.exports.length}`,
      type: 'summary',
      file
    });
  }
  
  return opts.combine ? combineSmallChunks(chunks, opts.maxSize) : chunks;
}

/**
 * Chunk multiple files at once
 */
export function chunkAll(analyses: FileAnalysis[], options?: ChunkOptions): SimpleChunk[] {
  return analyses.flatMap(analysis => chunk(analysis, options));
}

/**
 * Combine small chunks into larger ones
 */
function combineSmallChunks(chunks: SimpleChunk[], maxSize: number): SimpleChunk[] {
  if (chunks.length <= 1) return chunks;
  
  const result: SimpleChunk[] = [];
  let current = chunks[0];
  
  for (let i = 1; i < chunks.length; i++) {
    const next = chunks[i];
    const combinedText = `${current.text}\n\n${next.text}`;
    if (combinedText.length <= maxSize) {
      current = { id: `${current.id}+${next.id}`, text: combinedText, type: current.type, file: current.file };
    } else {
      result.push(current);
      current = next;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Split large chunks
 */
export function splitLargeChunks(chunks: SimpleChunk[], maxSize: number): SimpleChunk[] {
  const result: SimpleChunk[] = [];
  
  for (const chunk of chunks) {
    if (chunk.text.length <= maxSize) {
      result.push(chunk);
      continue;
    }
    
    const lines = chunk.text.split('\n');
    let currentText = '';
    let part = 1;
    
    for (const line of lines) {
      const nextText = currentText + (currentText ? '\n' : '') + line;
      if (nextText.length > maxSize && currentText) {
        result.push({ ...chunk, id: `${chunk.id}#${part}`, text: currentText });
        currentText = line;
        part++;
      } else {
        currentText = nextText;
      }
    }
    
    if (currentText) {
      result.push({ ...chunk, id: `${chunk.id}#${part}`, text: currentText });
    }
  }
  
  return result;
}
