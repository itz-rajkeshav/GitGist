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

const supportedExtensions = ['.js', '.jsx', '.ts', '.tsx'];

export function parseRepoUrl(repoUrl: string): RepoInfo {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  const [, owner, repo] = match;
  return { owner, repo: repo.replace('.git', '') };
}

export async function getAllFiles(repoInfo: RepoInfo, githubToken?: string): Promise<any[]> {
  try {
    const octokit = await getOctokit(githubToken);
    const { owner, repo, branch } = repoInfo;
    
    const { data: repoData } = await octokit.request(`GET /repos/${owner}/${repo}`);
    const targetBranch = branch || repoData.default_branch;

    const { data: tree } = await octokit.request(
      `GET /repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`
    );

    return tree.tree.filter((item: any) =>
      item.type === 'blob' &&
      isSupportedFile(item.path || '')
    );
  } catch (error: any) {
    throw new Error(`Failed to fetch repository files: ${error.message}`);
  }
}

export async function getFileContent(repoInfo: RepoInfo, filePath: string, githubToken?: string): Promise<GitHubFile> {
  try {
    const octokit = await getOctokit(githubToken);
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

export async function getMultipleFileContents(repoInfo: RepoInfo, filePaths: string[], githubToken?: string): Promise<GitHubFile[]> {
  const results: GitHubFile[] = [];
  const batchSize = 10;

  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const batchPromises = batch.map(filePath => getFileContent(repoInfo, filePath, githubToken));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    } catch (error: any) {
      console.warn(`Batch ${i / batchSize + 1} failed: ${error.message}`);
    }
  }

  return results;
}

export async function getAllSupportedFilesWithContent(repoUrl: string, githubToken?: string): Promise<GitHubFile[]> {
  try {
    const repoInfo = parseRepoUrl(repoUrl);
    
    const allFiles = await getAllFiles(repoInfo, githubToken);
    
    const supportedFiles = allFiles.filter(file => 
      isSupportedFile(file.path || '')
    );

    console.log(`Found ${supportedFiles.length} supported files in ${repoInfo.owner}/${repoInfo.repo}`);

    const filePaths = supportedFiles.map(file => file.path!);
    const filesWithContent = await getMultipleFileContents(repoInfo, filePaths, githubToken);

    return filesWithContent;
  } catch (error: any) {
    throw new Error(`Failed to fetch repository files: ${error.message}`);
  }
}

function isSupportedFile(filePath: string): boolean {
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return supportedExtensions.includes(extension);
}
