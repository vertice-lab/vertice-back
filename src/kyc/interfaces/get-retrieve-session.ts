export interface GetRetrieveSessionResponse {
    session_id:              string;
    session_number:          number;
    session_url:             string;
    status:                  string;
    workflow_id:             string;
    features:                string[];
    vendor_data:             null;
    metadata:                null;
    callback:                string;
    id_verifications:        IDVerification[];
    nfc_verifications:       null;
    liveness_checks:         LivenessCheck[];
    face_matches:            FaceMatch[];
    poa_verifications:       null;
    phone_verifications:     null;
    email_verifications:     null;
    aml_screenings:          null;
    ip_analyses:             IPAnalysis[];
    database_validations:    null;
    questionnaire_responses: null;
    reviews:                 any[];
    contact_details:         null;
    expected_details:        null;
    created_at:              Date;
    expires_at:              Date;
}

export interface FaceMatch {
    status:                  string;
    score:                   number;
    source_image_session_id: null;
    source_image:            string;
    target_image:            string;
    warnings:                any[];
    node_id:                 string;
}

export interface IDVerification {
    status:                                    string;
    document_type:                             string;
    document_number:                           string;
    personal_number:                           null;
    portrait_image:                            string;
    front_image:                               string;
    front_video:                               string;
    back_image:                                null;
    back_video:                                null;
    full_front_image:                          string;
    full_back_image:                           null;
    front_image_camera_front:                  string;
    back_image_camera_front:                   null;
    front_image_camera_front_face_match_score: null;
    back_image_camera_front_face_match_score:  null;
    front_image_quality_score:                 FrontImageQualityScore;
    back_image_quality_score:                  null;
    date_of_birth:                             Date;
    age:                                       number;
    expiration_date:                           Date;
    date_of_issue:                             Date;
    issuing_state:                             string;
    issuing_state_name:                        string;
    first_name:                                string;
    last_name:                                 string;
    full_name:                                 string;
    gender:                                    string;
    address:                                   null;
    formatted_address:                         null;
    place_of_birth:                            null;
    marital_status:                            string;
    nationality:                               null;
    extra_fields:                              ExtraFields;
    parsed_address:                            null;
    extra_files:                               any[];
    warnings:                                  Warning[];
    node_id:                                   string;
    matches:                                   IDVerificationMatch[];
}

export interface ExtraFields {
    first_surname:  string;
    second_surname: string;
}

export interface FrontImageQualityScore {
    focus_score:               number;
    overall_score:             number;
    brightness_issue:          string;
    brightness_score:          number;
    resolution_score:          number;
    is_document_fully_visible: boolean;
}

export interface IDVerificationMatch {
    status:            string;
    session_id:        string;
    api_service:       null;
    vendor_data:       null;
    user_details:      PurpleUserDetails;
    is_blocklisted:    boolean;
    session_number:    number;
    front_image_url:   string;
    verification_date: Date;
}

export interface PurpleUserDetails {
    name:            string;
    document_type:   string;
    document_number: string;
}

export interface Warning {
    feature:           string;
    risk:              string;
    additional_data:   AdditionalData;
    log_type:          string;
    short_description: string;
    long_description:  string;
    node_id:           string;
}

export interface AdditionalData {
    api_service:               null;
    duplicated_session_id:     string;
    duplicated_session_number: number;
}

export interface IPAnalysis {
    status:             string;
    node_id:            string;
    device_brand:       string;
    device_model:       string;
    browser_family:     string;
    os_family:          string;
    platform:           string;
    device_fingerprint: string;
    ip_country:         string;
    ip_country_code:    string;
    ip_state:           string;
    ip_city:            string;
    latitude:           number;
    longitude:          number;
    ip_address:         string;
    isp:                string;
    organization:       string;
    is_vpn_or_tor:      boolean;
    is_data_center:     boolean;
    time_zone:          string;
    time_zone_offset:   string;
    ip:                 IP;
    id_document:        IDDocument;
    poa_document:       PoaDocument;
    warnings:           any[];
    matches:            any[];
}

export interface IDDocument {
    location:                   null;
    distance_from_ip:           null;
    distance_from_poa_document: null;
}

export interface IP {
    location:                   Location;
    distance_from_id_document:  null;
    distance_from_poa_document: null;
}

export interface Location {
    latitude:  number;
    longitude: number;
}

export interface PoaDocument {
    location:                  null;
    distance_from_ip:          null;
    distance_from_id_document: null;
}

export interface LivenessCheck {
    status:          string;
    method:          string;
    score:           number;
    reference_image: string;
    video_url:       string;
    age_estimation:  number;
    matches:         LivenessCheckMatch[];
    warnings:        Warning[];
    face_quality:    number;
    face_luminance:  number;
    node_id:         string;
}

export interface LivenessCheckMatch {
    source:                string;
    status:                string;
    session_id:            string;
    api_service:           null;
    vendor_data:           null;
    user_details:          FluffyUserDetails;
    is_blocklisted:        boolean;
    session_number:        number;
    match_image_url:       string;
    verification_date:     Date;
    similarity_percentage: number;
}

export interface FluffyUserDetails {
    full_name:       string;
    document_type:   string;
    document_number: null | string;
}
