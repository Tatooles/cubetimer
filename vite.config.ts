import { defineConfig, type ResolveModulePreloadDependenciesFn } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const resolveModulePreloadDependencies: ResolveModulePreloadDependenciesFn = (
  _filename,
  deps,
  { hostId, hostType },
) => {
  if (hostType === "js" && isCubingSearchWorker(hostId)) {
    return [];
  }

  return deps;
};

function isCubingSearchWorker(hostId: string): boolean {
  const fileName = hostId.split("/").pop() ?? "";
  return fileName.startsWith("search-worker-entry-") && fileName.endsWith(".js");
}

export default defineConfig({
  build: {
    modulePreload: {
      resolveDependencies: resolveModulePreloadDependencies,
    },
  },
  plugins: [react(), tailwindcss()],
});
