export interface Tool {
  id: string;
  title: string;
  link: string;
  description: string;
  created_at: string;
  is_personal_tool: boolean;
  updated_at: string;
  tags: string[];
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  type: "article" | "tweet" | "youtube" | "other";
  embedHtml?: string;
  videoId?: string;
  created_at: string;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
  type: "note";
}

export interface TagOption {
  value: string;
  label: string;
  color: string;
}

export interface TagResponse {
  value: string;
  [key: string]: any;
}

export interface Preview {
  title: string;
  description: string;
  type: "article" | "tweet" | "youtube" | "other";
  videoId?: string;
}

export type ContentItem = MediaItem | Note;
