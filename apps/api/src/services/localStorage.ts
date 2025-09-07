import * as fs from 'fs-extra';
import * as path from 'path';
import { FileAnalysis } from './astParser';

export interface StorageConfig {
  baseDir: string;
  createTimestampFolders: boolean;
}

export class LocalStorage {
  private config: StorageConfig;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      baseDir: config.baseDir || './ast_analysis',
      createTimestampFolders: config.createTimestampFolders ?? true
    };
  }

  private sanitizeRepoName(repoUrl: string): string {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');
    
    return `${owner}_${repoName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private getRepoStorageDir(repoUrl: string): string {
    const sanitizedName = this.sanitizeRepoName(repoUrl);
    
    if (this.config.createTimestampFolders) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return path.join(this.config.baseDir, sanitizedName, timestamp);
    }
    
    return path.join(this.config.baseDir, sanitizedName);
  }

  async saveFileAnalysis(repoUrl: string, analysis: FileAnalysis): Promise<string> {
    try {
      const repoDir = this.getRepoStorageDir(repoUrl);
      
      const fileDir = path.dirname(analysis.file);
      const fileName = path.basename(analysis.file, path.extname(analysis.file));
      const fullDir = path.join(repoDir, fileDir);
      
      await fs.ensureDir(fullDir);
      
      const outputPath = path.join(fullDir, `${fileName}_analysis.json`);
      await fs.writeJson(outputPath, analysis, { spaces: 2 });
      
      return outputPath;
    } catch (error: any) {
      throw new Error(`Failed to save file analysis: ${error.message}`);
    }
  }

  async saveMultipleFileAnalyses(repoUrl: string, analyses: FileAnalysis[]): Promise<{
    savedFiles: string[];
    summary: any;
  }> {
    try {
      const existingRepos = await this.listStoredRepositories();
      for (const repo of existingRepos) {
        const repoPath = path.join(this.config.baseDir, repo);
        await fs.remove(repoPath);
      }
      
      const repoDir = this.getRepoStorageDir(repoUrl);
      await fs.ensureDir(repoDir);
      
      const savedFiles: string[] = [];
      
      for (const analysis of analyses) {
        const savedPath = await this.saveFileAnalysis(repoUrl, analysis);
        savedFiles.push(savedPath);
      }
      
      const summary = this.createSummary(analyses);
      const summaryPath = path.join(repoDir, 'summary.json');
      await fs.writeJson(summaryPath, summary, { spaces: 2 });
      savedFiles.push(summaryPath);
      
      const indexPath = path.join(repoDir, 'index.json');
      const index = {
        repository: repoUrl,
        timestamp: new Date().toISOString(),
        totalFiles: analyses.length,
        files: analyses.map(a => a.file),
        summaryPath,
        analysisFiles: savedFiles.filter(f => f !== summaryPath && f !== indexPath)
      };
      await fs.writeJson(indexPath, index, { spaces: 2 });
      savedFiles.push(indexPath);
      
      return { savedFiles, summary };
    } catch (error: any) {
      throw new Error(`Failed to save multiple file analyses: ${error.message}`);
    }
  }

  private createSummary(analyses: FileAnalysis[]): any {
    const summary = {
      totalFiles: analyses.length,
      totalFunctions: 0,
      totalImports: 0,
      totalExports: 0,
      totalClasses: 0,
      totalVariables: 0,
      filesByExtension: {} as Record<string, number>,
      mostUsedImports: {} as Record<string, number>,
      functionsByFile: {} as Record<string, number>,
      files: analyses.map(analysis => ({
        file: analysis.file,
        functions: analysis.ast_summary.functions.length,
        imports: analysis.ast_summary.imports.length,
        exports: analysis.ast_summary.exports.length,
        classes: analysis.ast_summary.classes.length,
        variables: analysis.ast_summary.variables.length
      }))
    };

    analyses.forEach(analysis => {
      const ext = path.extname(analysis.file);
      summary.filesByExtension[ext] = (summary.filesByExtension[ext] || 0) + 1;
      
      summary.totalFunctions += analysis.ast_summary.functions.length;
      summary.totalImports += analysis.ast_summary.imports.length;
      summary.totalExports += analysis.ast_summary.exports.length;
      summary.totalClasses += analysis.ast_summary.classes.length;
      summary.totalVariables += analysis.ast_summary.variables.length;
      
      analysis.ast_summary.imports.forEach(imp => {
        summary.mostUsedImports[imp.source] = (summary.mostUsedImports[imp.source] || 0) + 1;
      });
      
      summary.functionsByFile[analysis.file] = analysis.ast_summary.functions.length;
    });

    return summary;
  }

  async loadFileAnalysis(filePath: string): Promise<FileAnalysis> {
    try {
      return await fs.readJson(filePath);
    } catch (error: any) {
      throw new Error(`Failed to load file analysis: ${error.message}`);
    }
  }

  private async findLatestAnalysisFolder(repoUrl: string): Promise<string> {
    try {
      const sanitizedName = this.sanitizeRepoName(repoUrl);
      const repoDir = path.join(this.config.baseDir, sanitizedName);
      
      if (!(await fs.pathExists(repoDir))) {
        throw new Error('Repository directory not found');
      }
      
      const entries = await fs.readdir(repoDir);
      let latestFolder = '';
      let latestTime = new Date(0);
      
      for (const entry of entries) {
        const entryPath = path.join(repoDir, entry);
        const stat = await fs.stat(entryPath);
        
        if (stat.isDirectory()) {
          if (stat.mtime > latestTime) {
            latestTime = stat.mtime;
            latestFolder = entryPath;
          }
        }
      }
      
      if (!latestFolder) {
        throw new Error('No analysis folders found');
      }
      
      return latestFolder;
    } catch (error: any) {
      throw new Error(`Failed to find latest analysis folder: ${error.message}`);
    }
  }

  async loadRepoAnalyses(repoUrl: string): Promise<FileAnalysis[]> {
    try {
      const latestFolder = await this.findLatestAnalysisFolder(repoUrl);
      
      const analyses: FileAnalysis[] = [];
      
      const scanForAnalyses = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir);
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry);
          const stat = await fs.stat(entryPath);
          
          if (stat.isDirectory()) {
            await scanForAnalyses(entryPath);
          } else if (entry.endsWith('_analysis.json')) {
            try {
              const analysis = await this.loadFileAnalysis(entryPath);
              analyses.push(analysis);
            } catch (error: any) {
              console.warn(`Failed to load analysis file ${entryPath}: ${error.message}`);
            }
          }
        }
      };
      
      await scanForAnalyses(latestFolder);
      
      if (analyses.length === 0) {
        throw new Error('No analysis files found in the repository');
      }
      
      return analyses;
    } catch (error: any) {
      throw new Error(`Failed to load repository analyses: ${error.message}`);
    }
  }

  async listStoredRepositories(): Promise<string[]> {
    try {
      if (!(await fs.pathExists(this.config.baseDir))) {
        return [];
      }
      
      const entries = await fs.readdir(this.config.baseDir);
      const repos: string[] = [];
      
      for (const entry of entries) {
        const entryPath = path.join(this.config.baseDir, entry);
        const stat = await fs.stat(entryPath);
        
        if (stat.isDirectory()) {
          repos.push(entry);
        }
      }
      
      return repos;
    } catch (error: any) {
      throw new Error(`Failed to list stored repositories: ${error.message}`);
    }
  }
}
