import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { ASTAnalysisService } from "./services/astAnalysisService";
import { chunkAll } from "./services/simpleChunker";
// Removed embedding process import

dotenv.config();

// Dynamic import for Octokit to resolve module compatibility
let octokit: any;

async function initializeOctokit() {
  if (!octokit) {
    const { Octokit } = await import("octokit");
    octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }
  return octokit;
}

const astAnalysisService = new ASTAnalysisService(process.env.GITHUB_TOKEN);

async function getRepoDetail(repoUrl: string) {
  try {
    const octokitInstance = await initializeOctokit();
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub repository URL');

    const [owner, repo] = match.slice(1);

    const {data: repoInfo} = await octokitInstance.request(`GET /repos/${owner}/${repo}`);

    const [{data:language},{data:commits},{data:contributors},{data:content},{data:folderstructure}] = await Promise.all([
      octokitInstance.request(`GET /repos/${owner}/${repo}/languages`),
      octokitInstance.request(`GET /repos/${owner}/${repo}/commits`),
      octokitInstance.request(`GET /repos/${owner}/${repo}/contributors`),
      octokitInstance.request(`GET /repos/${owner}/${repo}/contents`),
      octokitInstance.request(`GET /repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`)
    ]);

    let dependencies: any[] = [];
    try {
      const {data: packageJsonData} = await octokitInstance.request(`GET /repos/${owner}/${repo}/contents/package.json`);

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
    .use(urlencoded({ extended: true, limit: "10mb" }))
    .use(json({ limit: "10mb" }))
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
    })
    .post("/api/repo/analyze", async (req, res) => {
      try {
        const { repoUrl } = req.body;
        if (!repoUrl) {
          return res.status(400).json({ error: "Repository URL is required" });
        }

        console.log(`🚀 Starting AST analysis with chunking for: ${repoUrl}`);
        
        // Enable chunking by default
        const result = await astAnalysisService.analyzeRepository(
          repoUrl, 
          undefined, // no progress callback
          true,      // enable chunking
          false      // disable embedding
        );

        console.log(`✅ Analysis complete! Generated ${result.chunks?.length || 0} chunks`);

        return res.status(200).json({
          success: true,
          data: result,
          message: `Repository analyzed successfully! Generated ${result.chunks?.length || 0} chunks.`
        });
      } catch (error: any) {
        console.error("AST Analysis error:", error);
        return res.status(500).json({ error: error.message });
      }
    })

    .post("/api/repo/analyze-file", async (req, res) => {
      try {
        const { repoUrl, filePath } = req.body;
        if (!repoUrl || !filePath) {
          return res.status(400).json({ error: "Repository URL and file path are required" });
        }

        const result = await astAnalysisService.analyzeFile(repoUrl, filePath);
        return res.status(200).json({
          success: true,
          data: result
        });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    })
    
  return app;
};
