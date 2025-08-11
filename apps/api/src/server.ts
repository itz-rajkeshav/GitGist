import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import { Octokit } from "octokit";
import dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function getRepoDetail(repoUrl: string) {
  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub repository URL');

    const [owner, repo] = match.slice(1);

    const [{data:repoInfo},{data:language},{data:commits},{data:contributors},{data:content},{data:folderstructure}] = await Promise.all([
      octokit.request(`GET /repos/${owner}/${repo}`),
      octokit.request(`GET /repos/${owner}/${repo}/languages`),
      octokit.request(`GET /repos/${owner}/${repo}/commits`),
      octokit.request(`GET /repos/${owner}/${repo}/contributors`),
      octokit.request(`GET /repos/${owner}/${repo}/contents`),
      octokit.request(`GET /repos/${owner}/${repo}/git/trees/main?recursive=1`)
    ]);

    let dependencies: any[] = [];
    try {
      const {data: packageJsonData} = await octokit.request(`GET /repos/${owner}/${repo}/contents/package.json`);

      if ('content' in packageJsonData) {
        // Decode base64 content
        const packageJsonContent = Buffer.from(packageJsonData.content, 'base64').toString('utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        // Extract dependencies and devDependencies
        const deps = packageJson.dependencies || {};
        const devDeps = packageJson.devDependencies || {};

        // Convert to array format with name and version
        dependencies = [
          ...Object.entries(deps).map(([name, version]) => ({
            name,
            version,
            type: 'dependency'
          })),
          ...Object.entries(devDeps).map(([name, version]) => ({
            name,
            version,
            type: 'devDependency'
          }))
        ];
      }
    } catch (depError) {
      console.log(`No package.json found or error parsing dependencies for ${owner}/${repo}`);
    }

    return {
      name: repoInfo.name,
      description: repoInfo.description,
      language: language,
      commits: commits,
      contributors: contributors,
      content: content,
      folderstructure: folderstructure,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      dependencies: dependencies,
      url: repoInfo.html_url,
      created_at: repoInfo.created_at,
      updated_at: repoInfo.updated_at
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch repository data: ${error.message}`);
  }
}

export const createServer = (): Express => {
  const app = express();
  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .get("/status", (_, res) => {
      return res.json({ ok: true });
    })
    .post("/api/repo", async (req, res) => {
      try {
        const { repoUrl } = req.body;
        if (!repoUrl) {
          return res.status(400).json({ error: "Repository URL is required" });
        }
        const repoData = await getRepoDetail(repoUrl);
        return res.status(200).json(repoData);
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    });

  return app;
};
