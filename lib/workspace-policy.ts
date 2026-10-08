export const TRIAL_POLICY = {
  maxDocuments: 1,
  maxBatch: 1,
  maxBytes: 5 * 1024 * 1024,
  maxPages: 20,
  maxCharacters: 100000,
  chunkSize: 1000,
} as const;
export const FULL_POLICY = {
  maxDocuments: 10,
  maxBatch: 5,
  maxBytes: 15 * 1024 * 1024,
  maxPages: 200,
  maxCharacters: 750000,
} as const;
