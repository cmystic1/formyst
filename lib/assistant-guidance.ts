/** Public product knowledge only. Never include account data, responses, or secrets. */
export const FORMYST_HELP_GUIDE = `
Formyst is a form builder. After sign-in, the Forms workspace at /forms lists owned forms, their publish status, total responses, and red unread-response counts. It has search and All forms, Published, and Drafts filters. Opening a form's Responses page clears its unread count. A user sees only their own forms and responses.
Use Create form on /forms to open a new form in the editor. The form editor at /forms/{id}/edit has Build and Preview views. It supports text, email, phone, number, date, URL, paragraph, dropdown, radio, and checkbox fields; labels, help text, required fields, choices, and conditional visibility. Drag fields to reorder them.
The editor supports page and card colors, uploaded page background images, solid or frosted-glass cards, glass opacity, fonts, corners, custom CSS, per-field styling, logo, cover, submit-button styling, and a customizable thank-you screen. Preview changes before saving. For choices, edit the question's options. For conditional visibility, select a question and set it to show when a choice in an earlier choice question is selected.
Save draft keeps a form private. Publish saves it and makes /f/{id} available to respondents; a form needs at least one field to publish. Unpublish stops new public responses while retaining existing ones.
Open a form's Responses page to read responses, click Export CSV to download all responses for that form, and configure per-form n8n, Telegram, Slack, Discord, and automation webhooks under Integrations. There is no response-selection step for CSV export. Integrations send data after a response is stored; delivery failures do not erase the saved response.
Settings at /account shows account details and a Change password form. Changing a password requires the current password and a new password of at least 12 characters; the user signs in again afterward. Administrators see Accounts at /accounts and can create and manage accounts. Public sign-up is at /signup; Google sign-in may be available if configured. Never ask the user to share a password or token in chat.
The assistant in a form editor can add, change, and remove questions; edit form title, description, submit text, and supported visual controls; repair unreadable text; and explain these user-facing features. It cannot edit conditional visibility, upload images, edit custom CSS, edit the thank-you screen, publish, read responses, configure integrations, or operate account and security settings. Its edits appear in the editor immediately, but the owner must Save draft or Publish to persist them. The workspace assistant at /forms gives product help; open a form's editor to ask for edits. Assistant conversations are saved separately for each form and for workspace help; Clear chat erases that conversation.
`;

export function answerKnownHelpQuestion(prompt: string): string | null {
  const text = prompt.toLowerCase();
  if (/\b(?:export|download|csv)\b/.test(text) && /\b(?:responses?|submissions?|answers?|data)\b/.test(text)) {
    return "Open your form's Responses page and click Export CSV. It downloads all responses for that form.";
  }
  if (/\b(?:publish|unpublish|share|public link)\b/.test(text) && /\bform\b/.test(text)) {
    return "In the form editor, click Publish to save and activate its public link. Open form shows the link; click Unpublish when you want to stop new public responses.";
  }
  if (/\b(?:create|new)\b/.test(text) && /\bform\b/.test(text)) {
    return "Open the Forms page and click Create form. The new form opens in the editor, where you can add fields and save a draft or publish it.";
  }
  if (/\b(?:new|unread|notification|badge)\b/.test(text) && /\bresponses?\b/.test(text)) {
    return "The Forms page shows a red count of new responses on each form. Open that form's Responses page to read them and clear its count.";
  }
  if (/\b(?:background|wallpaper)\b/.test(text) && /\b(?:image|photo|upload)\b/.test(text)) {
    return "In the form editor's Design section, use Page background image to upload an image. Card material and Glass opacity control how much of it shows through the form card.";
  }
  if (/\b(?:integrations?|webhooks?|telegram|slack|discord|n8n|zapier|make)\b/.test(text)) {
    return "Open the form's Responses page and scroll to Integrations. Add a destination there and save it; the server must allow that webhook host before delivery can work.";
  }
  return null;
}
