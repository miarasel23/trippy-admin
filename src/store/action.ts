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
