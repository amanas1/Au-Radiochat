
// This service has been disabled to remove the @google/genai dependency.
// It was previously used for the "AI Mirror" feature.

import { StreamState } from "../types";

export class GeminiLiveService {
  constructor(config: any) {
    console.warn("GeminiLiveService is disabled in this build.");
  }

  public async start() {
    console.warn("GeminiLiveService.start() called but service is disabled.");
  }

  public async stop() {
    // No-op
  }
}
