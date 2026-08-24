// This file is server-only and should never be imported in client components
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';

// Cache for prompts loaded from YAML
let _promptsCache: {
  react_prompt: string;
} | null = null;

/**
 * Load prompts from YAML file (server-side only, synchronous)
 */
export function loadPromptsFromFile(): {
  react_prompt: string;
} {
  if (_promptsCache) {
    return _promptsCache;
  }

  // Candidate locations, in order:
  //  1. frontend/resources/... — bundled with the app (works on Vercel where
  //     only the frontend/ directory is deployed)
  //  2. ../resources/... — repo root (works in local dev from frontend/)
  const candidates = [
    resolve(process.cwd(), 'resources/prompts/prompts.yaml'),
    resolve(process.cwd(), '..', 'resources/prompts/prompts.yaml'),
  ];
  const promptsFile = candidates.find((p) => existsSync(p)) ?? candidates[0];

  try {
    const fileContent = readFileSync(promptsFile, 'utf-8');
    const prompts = yaml.load(fileContent) as Record<string, string>;

    if (!prompts) {
      throw new Error(`Prompts file is empty or invalid: ${promptsFile}`);
    }

    const requiredKeys = ['react_prompt'];
    const missingKeys = requiredKeys.filter(
      (key) => !prompts[key] || typeof prompts[key] !== 'string'
    );

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required prompt keys in YAML file: ${missingKeys.join(', ')}`
      );
    }

    _promptsCache = {
      react_prompt: prompts.react_prompt,
    };

    return _promptsCache;
  } catch (error: any) {
    const errorMsg = `Failed to load prompts from YAML file ${promptsFile}: ${error.message}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

