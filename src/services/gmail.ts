export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  internalDate?: string;
  bodyText?: string;
}

function encodeEmail(to: string, from: string, subject: string, htmlMessage: string): string {
  const emailLines = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlMessage,
  ];

  const rawEmail = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Send an email using Gmail API */
export async function sendGmailMessage(
  accessToken: string,
  to: string,
  subject: string,
  bodyHtml: string,
  senderEmail: string = 'me'
): Promise<any> {
  const raw = encodeEmail(to, senderEmail, subject, bodyHtml);
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to send email via Gmail API');
  }

  return response.json();
}

/** List recent messages from Gmail */
export async function listGmailMessages(
  accessToken: string,
  query: string = '',
  maxResults: number = 10
): Promise<GmailMessageSummary[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.append('maxResults', maxResults.toString());
  if (query) url.searchParams.append('q', query);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Gmail messages');
  }

  const data = await res.json();
  if (!data.messages || !Array.isArray(data.messages)) {
    return [];
  }

  // Fetch details for each message
  const summaries: GmailMessageSummary[] = await Promise.all(
    data.messages.map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
        const detail = await detailRes.json();

        const headers: GmailMessageHeader[] = detail.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
        const to = headers.find((h) => h.name.toLowerCase() === 'to')?.value || 'Me';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

        let bodyText = detail.snippet || '';
        if (detail.payload?.body?.data) {
          try {
            bodyText = atob(detail.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } catch (e) {}
        } else if (detail.payload?.parts) {
          const textPart = detail.payload.parts.find((p: any) => p.mimeType === 'text/plain' || p.mimeType === 'text/html');
          if (textPart?.body?.data) {
            try {
              bodyText = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } catch (e) {}
          }
        }

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet,
          subject,
          from,
          to,
          date,
          bodyText,
        };
      } catch (e) {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return summaries;
}

/** Get Gmail User Profile Info */
export async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string; messagesTotal: number }> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch Gmail user profile');
  }
  return res.json();
}
