// Dynamic import for Octokit to resolve module compatibility
let OctokitClass: any;

async function getOctokit(githubToken?: string) {
  if (!OctokitClass) {
    const { Octokit } = await import("octokit");
    OctokitClass = Octokit;
  }
  return new OctokitClass({
    auth: githubToken || process.env.GITHUB_TOKEN
  });
}

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
  private githubToken?: string;
  private supportedExtensions = ['.js', '.jsx', '.ts', '.tsx'];

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
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
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo, branch } = repoInfo;
      
      // Get repository info to find default branch if not specified
      const { data: repoData } = await octokit.request(`GET /repos/${owner}/${repo}`);
      const targetBranch = branch || repoData.default_branch;

      // Get the tree recursively
      const { data: tree } = await octokit.request(
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
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data } = await octokit.request(
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
      const batchPromises = batch.map(filePath => this.getFileContent(repoInfo, filePath));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error: any) {
        console.warn(`Batch ${i / batchSize + 1} failed: ${error.message}`);
        // Continue with next batch instead of failing completely
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
  private isSupportedFile(filePath: string): boolean {
    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    return this.supportedExtensions.includes(extension);
  }

  /**
   * Get repository size and file count
   */
  async getRepoStats(repoInfo: RepoInfo): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: repoData } = await octokit.request(`GET /repos/${owner}/${repo}`);
      
      return {
        totalFiles: repoData.size || 0,
        totalSize: repoData.size || 0
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch repository stats: ${error.message}`);
    }
  }

  /**
   * Get repository languages
   */
  async getRepoLanguages(repoInfo: RepoInfo): Promise<Record<string, number>> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: languages } = await octokit.request(`GET /repos/${owner}/${repo}/languages`);
      return languages;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository languages: ${error.message}`);
    }
  }

  /**
   * Get repository contributors
   */
  async getRepoContributors(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: contributors } = await octokit.request(`GET /repos/${owner}/${repo}/contributors`);
      return contributors;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository contributors: ${error.message}`);
    }
  }

  /**
   * Get repository commits
   */
  async getRepoCommits(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: commits } = await octokit.request(`GET /repos/${owner}/${repo}/commits`);
      return commits;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository commits: ${error.message}`);
    }
  }

  /**
   * Get repository branches
   */
  async getRepoBranches(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: branches } = await octokit.request(`GET /repos/${owner}/${repo}/branches`);
      return branches;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository branches: ${error.message}`);
    }
  }

  /**
   * Get repository releases
   */
  async getRepoReleases(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: releases } = await octokit.request(`GET /repos/${owner}/${repo}/releases`);
      return releases;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository releases: ${error.message}`);
    }
  }

  /**
   * Get repository issues
   */
  async getRepoIssues(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: issues } = await octokit.request(`GET /repos/${owner}/${repo}/issues`);
      return issues;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository issues: ${error.message}`);
    }
  }

  /**
   * Get repository pull requests
   */
  async getRepoPullRequests(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: pullRequests } = await octokit.request(`GET /repos/${owner}/${repo}/pulls`);
      return pullRequests;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository pull requests: ${error.message}`);
    }
  }

  /**
   * Get repository stargazers
   */
  async getRepoStargazers(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: stargazers } = await octokit.request(`GET /repos/${owner}/${repo}/stargazers`);
      return stargazers;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository stargazers: ${error.message}`);
    }
  }

  /**
   * Get repository forks
   */
  async getRepoForks(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: forks } = await octokit.request(`GET /repos/${owner}/${repo}/forks`);
      return forks;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository forks: ${error.message}`);
    }
  }

  /**
   * Get repository watchers
   */
  async getRepoWatchers(repoInfo: RepoInfo): Promise<any[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: watchers } = await octokit.request(`GET /repos/${owner}/${repo}/subscribers`);
      return watchers;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository watchers: ${error.message}`);
    }
  }

  /**
   * Get repository topics
   */
  async getRepoTopics(repoInfo: RepoInfo): Promise<string[]> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: topics } = await octokit.request(`GET /repos/${owner}/${repo}/topics`);
      return topics.names || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch repository topics: ${error.message}`);
    }
  }

  /**
   * Get repository license
   */
  async getRepoLicense(repoInfo: RepoInfo): Promise<any> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: license } = await octokit.request(`GET /repos/${owner}/${repo}/license`);
      return license;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository license: ${error.message}`);
    }
  }

  /**
   * Get repository readme
   */
  async getRepoReadme(repoInfo: RepoInfo): Promise<string> {
    try {
      const octokit = await getOctokit(this.githubToken);
      const { owner, repo } = repoInfo;
      
      const { data: readme } = await octokit.request(`GET /repos/${owner}/${repo}/readme`);
      
      if ('content' in readme) {
        return Buffer.from(readme.content, 'base64').toString('utf-8');
      }
      
      throw new Error('Unable to fetch readme content');
    } catch (error: any) {
      throw new Error(`Failed to fetch repository readme: ${error.message}`);
    }
  }
}
