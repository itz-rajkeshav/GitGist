import { parseCode, isSupportedFile } from './astParser';
import { getAllSupportedFilesWithContent, parseRepoUrl, getFileContent } from './githubFileFetcher';
import { saveMultipleFileAnalyses, loadRepoAnalyses, listStoredRepositories, StorageConfig } from './localStorage';

export interface AnalysisProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  errors: string[];
}

export interface FileAnalysis {
  file: string;
  ast_summary: any;
}

export interface AnalysisResult {
  repository: string;
  totalFiles: number;
  processedFiles: number;
  analyses: FileAnalysis[];
  summary: any;
  storagePath: string;
  errors: string[];
  duration: number;
}

export async function analyzeRepository(
  repoUrl: string, 
  githubToken?: string,
  storageConfig?: Partial<StorageConfig>,
  progressCallback?: (progress: AnalysisProgress) => void
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const config: StorageConfig = {
    baseDir: storageConfig?.baseDir || './ast_analysis',
    createTimestampFolders: storageConfig?.createTimestampFolders ?? true
  };
  
  try {
    console.log(`Starting analysis of repository: ${repoUrl}`);
    
    const files = await getAllSupportedFilesWithContent(repoUrl, githubToken);
    console.log(`Found ${files.length} supported files to analyze`);
    
    const analyses: FileAnalysis[] = [];
    let processedFiles = 0;
    
    for (const file of files) {
      try {
        if (progressCallback) {
          progressCallback({
            totalFiles: files.length,
            processedFiles,
            currentFile: file.path,
            errors
          });
        }
        
        console.log(`Analyzing file: ${file.path}`);
        
        const astSummary = parseCode(file.content, file.path);
        
        const analysis: FileAnalysis = {
          file: file.path,
          ast_summary: astSummary
        };
        
        analyses.push(analysis);
        processedFiles++;
        
        console.log(`✓ ${file.path}:`, {
          functions: astSummary.functions.length,
          imports: astSummary.imports.length,
          exports: astSummary.exports.length,
          classes: astSummary.classes.length,
          variables: astSummary.variables.length
        });
        
      } catch (error: any) {
        const errorMsg = `Error analyzing ${file.path}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`Saving ${analyses.length} analyses to local storage...`);
    const { savedFiles, summary } = await saveMultipleFileAnalyses(repoUrl, analyses, config);
    
    const duration = Date.now() - startTime;
    
    const result: AnalysisResult = {
      repository: repoUrl,
      totalFiles: files.length,
      processedFiles,
      analyses,
      summary,
      storagePath: savedFiles[savedFiles.length - 1],
      errors,
      duration
    };
    
    console.log(`Analysis completed in ${duration}ms`);
    console.log(`Summary:`, summary);
    
    return result;
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    throw new Error(`Repository analysis failed after ${duration}ms: ${error.message}`);
  }
}

export async function analyzeFile(repoUrl: string, filePath: string, githubToken?: string): Promise<FileAnalysis> {
  try {
    const repoInfo = parseRepoUrl(repoUrl);
    const file = await getFileContent(repoInfo, filePath, githubToken);
    
    if (!isSupportedFile(file.path)) {
      throw new Error(`File type not supported: ${file.path}`);
    }
    
    const astSummary = parseCode(file.content, file.path);
    
    return {
      file: file.path,
      ast_summary: astSummary
    };
  } catch (error: any) {
    throw new Error(`Failed to analyze file ${filePath}: ${error.message}`);
  }
}

export async function loadStoredAnalyses(repoUrl: string, storageConfig?: Partial<StorageConfig>): Promise<FileAnalysis[]> {
  try {
    const config: StorageConfig = {
      baseDir: storageConfig?.baseDir || './ast_analysis',
      createTimestampFolders: storageConfig?.createTimestampFolders ?? true
    };
    return await loadRepoAnalyses(repoUrl, config);
  } catch (error: any) {
    throw new Error(`Failed to load stored analyses: ${error.message}`);
  }
}

export async function listStoredAnalyses(storageConfig?: Partial<StorageConfig>): Promise<string[]> {
  try {
    const config: StorageConfig = {
      baseDir: storageConfig?.baseDir || './ast_analysis',
      createTimestampFolders: storageConfig?.createTimestampFolders ?? true
    };
    return await listStoredRepositories(config);
  } catch (error: any) {
    throw new Error(`Failed to list stored analyses: ${error.message}`);
  }
}
