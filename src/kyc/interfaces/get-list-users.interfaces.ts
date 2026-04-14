interface Tag {
  uuid: string;
  name: string;
  color: string;
}

interface FeatureItem {
  feature: string;
  status: string;
}

interface User {
  didit_internal_id: string;
  vendor_data: string | null;
  display_name: string | null;
  full_name: string;
  date_of_birth: string;
  effective_name: string;
  status: string;
  portrait_image_url: string | null;
  session_count: number;
  approved_count: number;
  declined_count: number;
  in_review_count: number;
  issuing_states: Record<string, number>;
  approved_emails: Record<string, boolean>;
  approved_phones: Record<string, boolean>;
  features: Record<string, string>;
  features_list: FeatureItem[];
  last_session_at: string;
  first_session_at: string;
  tags: Tag[];
  created_at: string;
}

export interface ListUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}