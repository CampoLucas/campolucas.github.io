// Responsible for fetching JSON files
// It caches results
export class JSONLoader {
    constructor() {
        this.cache = new Map();
    }

    // Loads and parses a JSON file
    // Uses cache to avoid fetching the same file twice
    load(path) {
        // return cached
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        const promise = fetch(path).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load JSON: ${path}`);
            }
            return response.json();
        });

        // save to cache
        this.cache.set(path, promise);
        promise.catch(() => this.cache.delete(path));
        return promise;
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
