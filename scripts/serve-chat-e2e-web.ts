import { createReadStream, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import http from "node:http";
import path from "node:path";

const rootDir = process.cwd();
const mockDir = path.join(rootDir, "dist-e2e-mock");
const apiDir = path.join(rootDir, "dist-e2e-api");
const port = 4173;

function ensureBuild(outputDir: string, simulatorApiUrl: string) {
  const result = spawnSync(
    "npx",
    ["expo", "export", "--platform", "web", "--output-dir", outputDir],
    {
      cwd: rootDir,
      stdio: "inherit",
      env: {
        ...process.env,
        EXPO_PUBLIC_SIMULATOR_API_URL: simulatorApiUrl
      }
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function sendFile(response: http.ServerResponse, filePath: string) {
  const ext = path.extname(filePath);
  const contentType =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".js"
        ? "application/javascript; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".json"
            ? "application/json; charset=utf-8"
            : ext === ".png"
              ? "image/png"
              : ext === ".svg"
                ? "image/svg+xml"
                : "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
}

function resolveBuildDir(urlPath: string) {
  if (urlPath.startsWith("/api")) {
    return apiDir;
  }

  return mockDir;
}

function resolveFilePath(buildDir: string, urlPath: string) {
  const relativePath = urlPath.replace(/^\/(mock|api)/, "") || "/";
  const candidatePath = relativePath === "/" ? "/index.html" : relativePath;
  const filePath = path.join(buildDir, candidatePath);

  if (existsSync(filePath) && !filePath.endsWith(path.sep)) {
    return filePath;
  }

  return path.join(buildDir, "index.html");
}

ensureBuild(mockDir, "");
ensureBuild(apiDir, "/");

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const buildDir = resolveBuildDir(requestUrl.pathname);
  const filePath = resolveFilePath(buildDir, requestUrl.pathname);

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  sendFile(response, filePath);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`chat-e2e-server: http://127.0.0.1:${port}\n`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
