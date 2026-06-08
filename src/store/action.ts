export interface ActionItem {
  id: number;
  uuid: string;
  action_when: string;
}

export interface ActionListResponse {
  status: boolean;
  message: string;
  data: ActionItem[];
}

export interface ActionLanguageMessage {
  id: number;
  uuid: string;
  language_code: string;
  message: string;
}

export interface ActionWithLanguageItem {
  id: number;
  uuid: string;
  action_when: string;
  messages: ActionLanguageMessage[];
}

