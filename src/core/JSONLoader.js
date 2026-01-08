// Responsible for fetching JSON files
// It caches results
export class JSONLoader {
    constructor() {
        this.cache = new Map();
    }

    // Loads and parses a JSON file
    // Uses cache to avoid fetching the same file twice
    async load(path) {
        // return cached
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${path}`);
        }

        // save to cache
        const data = await response.json();
        this.cache.set(path, data);
        return data;
    }

    // Loads all jsons from a folder
    async loadAllFromFolder(path, files) {
        const results = {};

        const promises = files.map(async file => {
            const fullPath = `${path}/${file}.json`;
            const data = await this.load(fullPath);
            results[file.replace(".json", "")] = data;
        });

        await Promise.all(promises);
        return results;
    }

    // Loads diferent jsons from paths
    async loadAll(paths) {
        const results = {};

        const promises = paths.map(async path => {
            const data = await this.load(path);
            results[path] = data;
        });

        await Promise.all(promises);
        return results;
    }
}