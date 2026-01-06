import axios from "axios";
import type { TranscriptInput, GraphOutput } from "../types/graph";

const API_BASE = "http://localhost:8000/api";

export async function compileTranscript(
  input: TranscriptInput
): Promise<GraphOutput> {
  const response = await axios.post<GraphOutput>(`${API_BASE}/compile`, input);
  return response.data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await axios.get(`${API_BASE}/health`);
    return true;
  } catch {
    return false;
  }
}
