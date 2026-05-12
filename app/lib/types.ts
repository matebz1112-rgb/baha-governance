export type Organization = {
  id: string;
  user_id?: string | null;
  email?: string | null;
  name: string;
  category: string;
  city: string;
  license_number?: string | null;
  phone?: string | null;
  representative_name?: string | null;
  representative_position?: string | null;
  website?: string | null;
  address?: string | null;
  status?: "pending" | "active" | "suspended";
  created_at?: string;
  updated_at?: string;
};

export type Standard = {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  created_at?: string;
};

export type Question = {
  id: string;
  standard_id: string;
  question: string;
  max_score: number;
  created_at?: string;
  standards?: Pick<Standard, "title">;
};

export type Assessment = {
  id: string;
  organization_id: string;
  evaluation_tool_id?: string | null;
  total_score: number;
  max_score: number;
  percentage: number;
  status: "draft" | "completed";
  created_at?: string;
  organizations?: Pick<Organization, "name" | "category" | "city">;
};

export type EvaluationToolRecord = {
  id: string;
  slug: string;
  title: string;
  audience: string;
  year: number;
  source_file: string;
  created_at?: string;
};

export type Attachment = {
  id: string;
  organization_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at?: string;
  organizations?: Pick<Organization, "name">;
};
