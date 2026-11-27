export const ASSISTANT_OPEN_EVENT = "taskloom:open-assistant";

export interface AssistantOpenDetail {
  prompt?: string;
}

export function openAssistantWidget(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AssistantOpenDetail>(ASSISTANT_OPEN_EVENT, {
      detail: { prompt },
    }),
  );
}
