import { RepoData, commit, githubFile } from "./type";

export interface ExtractedRepoData {
  repoData: RepoData;
  commits: commit[];
  folderStructure: githubFile['folderstructure'][];
}

export function extractRepoDataForRedux(apiResponse: any): ExtractedRepoData {
  const repoData: RepoData = {
    name: apiResponse.name || '',
    description: apiResponse.description || '',
    language: apiResponse.language || {},
    stars: apiResponse.stars || 0,
    forks: apiResponse.forks || 0,
    url: apiResponse.url || '',
    created_at: apiResponse.created_at || '',
    updated_at: apiResponse.updated_at || '',
    dependencies: apiResponse.dependencies || []
  };

  const commits: commit[] = apiResponse.commits?.map((commitItem: any) => ({
    commit: {
      author: {
        name: commitItem.commit?.author?.name || '',
        email: commitItem.commit?.author?.email || '',
        date: commitItem.commit?.author?.date || '',
      },
      message: commitItem.commit?.message || '',
      tree: {
        sha: commitItem.commit?.tree?.sha || '',
        url: commitItem.commit?.tree?.url || '',
      },
      comment_count: commitItem.commit?.comment_count || 0,
    }
  })) || [];

  const folderStructure: githubFile['folderstructure'][] = apiResponse.folderstructure?.tree?.map((item: any) => ({
    path: item.path || '',
    mode: item.mode || '',
    type: item.type ,
    size: item.size || 0,
    sha: item.sha || '',
    url: item.url || '',
  })) || [];

  return {
    repoData,
    commits,
    folderStructure
  };
}
