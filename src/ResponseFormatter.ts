//pulls the JSON formatting logic from extension.ts and puts it in its own helper file.
// src/ResponseFormatter.ts

export interface SubsystemResults {
  snippetGenerator?: any;
  docLookup?: any;
  feedback?: any;
}

export function formatResponse(results: SubsystemResults): object {
  return {
    timestamp: new Date().toISOString(),
    subsystems: {
      snippetGenerator: results.snippetGenerator || null,
      docLookup: results.docLookup || null,
      feedback: results.feedback || null
    },
    status: "success"
  };
}
