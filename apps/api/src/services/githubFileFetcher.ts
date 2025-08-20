import { Octokit } from "octokit";

export interface GitHubFile {
  path: string;
  content: string;
  size: number;
  sha: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

export class GitHubFileFetcher {
  private octokit: Octokit;
  private supportedExtensions = ['.js', '.jsx', '.ts', '.tsx'];

  constructor(githubToken?: string) {
    this.octokit = new Octokit({
      auth: githubToken || process.env.GITHUB_TOKEN
    });
  }
  parseRepoUrl(repoUrl: string): RepoInfo {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = match;
    return { owner, repo: repo.replace('.git', '') };
  }

  /**
   * Get all files from a repository recursively
   */
  async getAllFiles(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const { owner, repo, branch } = repoInfo;
      
      // Get repository info to find default branch if not specified
      const { data: repoData } = await this.octokit.request(`GET /repos/${owner}/${repo}`);
      const targetBranch = branch || repoData.default_branch;

      // Get the tree recursively
      const { data: tree } = await this.octokit.request(
        `GET /repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`
      );

      return tree.tree.filter((item: any) =>
        item.type === 'blob' &&
        this.isSupportedFile(item.path || '')
      );
    } catch (error: any) {
      throw new Error(`Failed to fetch repository files: ${error.message}`);
    }
  }

  /**
   * Get raw content of a specific file
   */
  async getFileContent(repoInfo: RepoInfo, filePath: string): Promise<GitHubFile> {
    try {
      const { owner, repo } = repoInfo;
      
      const { data } = await this.octokit.request(
        `GET /repos/${owner}/${repo}/contents/${filePath}`
      );

      if (Array.isArray(data)) {
        throw new Error(`Path ${filePath} is a directory, not a file`);
      }

      if (!('content' in data)) {
        throw new Error(`Unable to fetch content for ${filePath}`);
      }

      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return {
        path: filePath,
        content,
        size: data.size,
        sha: data.sha
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get content of multiple files in batch
   */
  async getMultipleFileContents(repoInfo: RepoInfo, filePaths: string[]): Promise<GitHubFile[]> {
    const results: GitHubFile[] = [];
    const batchSize = 10; // Process files in batches to avoid rate limiting

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          return await this.getFileContent(repoInfo, filePath);
        } catch (error) {
          console.error(`Error fetching ${filePath}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as GitHubFile[]);

      // Add a small delay between batches to respect rate limits
      if (i + batchSize < filePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get all supported files with their content from a repository
   */
  async getAllSupportedFilesWithContent(repoUrl: string): Promise<GitHubFile[]> {
    try {
      const repoInfo = this.parseRepoUrl(repoUrl);
      
      // Get all files in the repository
      const allFiles = await this.getAllFiles(repoInfo);
      
      // Filter for supported file types
      const supportedFiles = allFiles.filter(file => 
        this.isSupportedFile(file.path || '')
      );

      console.log(`Found ${supportedFiles.length} supported files in ${repoInfo.owner}/${repoInfo.repo}`);

      // Get content for all supported files
      const filePaths = supportedFiles.map(file => file.path!);
      const filesWithContent = await this.getMultipleFileContents(repoInfo, filePaths);

      return filesWithContent;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository files: ${error.message}`);
    }
  }

  /**
   * Check if a file has a supported extension
   */
  private isSupportedFile(filename: string): boolean {
    return this.supportedExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Get repository statistics
   */
  async getRepoStats(repoUrl: string): Promise<{
    totalFiles: number;
    supportedFiles: number;
    filesByExtension: Record<string, number>;
  }> {
    try {
      const repoInfo = this.parseRepoUrl(repoUrl);
      const allFiles = await this.getAllFiles(repoInfo);
      
      const supportedFiles = allFiles.filter(file => 
        this.isSupportedFile(file.path || '')
      );

      const filesByExtension: Record<string, number> = {};
      supportedFiles.forEach(file => {
        const ext = file.path?.split('.').pop() || 'unknown';
        filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
      });

      return {
        totalFiles: allFiles.length,
        supportedFiles: supportedFiles.length,
        filesByExtension
      };
    } catch (error: any) {
      throw new Error(`Failed to get repository stats: ${error.message}`);
    }
  }
}
