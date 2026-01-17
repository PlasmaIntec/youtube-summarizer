import axios from "axios";
import type { TranscriptInput, GraphOutput, YouTubeURLInput } from "../types/graph";

const API_BASE = "http://localhost:8000/api";

export async function compileTranscript(
  input: TranscriptInput
): Promise<GraphOutput> {
  try {
    const response = await axios.post<GraphOutput>(`${API_BASE}/compile`, input);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === "string") {
        throw new Error(detail);
      }
      // RUTHLESS validation errors
      if (detail.errors && Array.isArray(detail.errors)) {
        throw new Error(`${detail.message}:\n${detail.errors.join("\n")}`);
      }
      throw new Error(detail.message || "Compilation failed");
    }
    throw err;
  }
}

export async function compileFromUrl(
  input: YouTubeURLInput
): Promise<GraphOutput> {
  try {
    const response = await axios.post<GraphOutput>(
      `${API_BASE}/compile-from-url`,
      input
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (typeof detail === "string") {
        throw new Error(detail);
      }
      // RUTHLESS validation errors
      if (detail.errors && Array.isArray(detail.errors)) {
        throw new Error(`${detail.message}:\n${detail.errors.join("\n")}`);
      }
      throw new Error(detail.message || "Compilation failed");
    }
    throw err;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    await axios.get(`${API_BASE}/health`);
    return true;
  } catch {
    return false;
  }
}
