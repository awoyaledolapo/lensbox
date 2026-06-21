/**

/** A photo row as returned by Supabase. */
export type Photo = {
  id: string;
  gallery_id: string;
  user_id: string;
  image_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string; // ISO 8601 timestamp string
};

/** Shape required to insert a new photo row. */
export type PhotoInsert = {
  gallery_id: string;
  user_id: string;
  image_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
};

/** Per-file upload state tracked in the UI. */
export type UploadItem = {
  /** Unique key for React list rendering — derived from File object. */
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  /** 0–100 */
  progress: number;
  /** Public URL once upload succeeds. */
  url?: string;
  /** Human-readable error message on failure. */
  error?: string;
};
