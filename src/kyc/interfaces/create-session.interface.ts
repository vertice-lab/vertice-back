

export interface SessionMetadata {
  plan?: string;
  signup_source?: string;
  [key: string]: any;
}

export interface CreateSessionResponse {
  session_id: string;
  session_number: number;
  session_token: string;
  vendor_data: string;
  metadata: SessionMetadata;
  status: string;
  workflow_id: string;
  callback: string;
  url: string;
}