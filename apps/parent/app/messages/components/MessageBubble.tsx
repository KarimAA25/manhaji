import type { Message } from "@manhaj/lib/mock-messages";
import { formatRelative } from "@manhaj/lib/mock-messages";

export default function MessageBubble({
  message, isOutgoing,
}: {
  message:    Message;
  isOutgoing: boolean;
}) {
  const lines = message.body.split("\n");
  return (
    <article className={`msg-bubble ${isOutgoing ? "is-outgoing" : "is-incoming"}`}>
      <header className="msg-bubble-head">
        <span className="msg-bubble-from">{message.from_name}</span>
        <span className="msg-bubble-sub">{message.from_label} · {formatRelative(message.ts)}</span>
      </header>
      <div className="msg-bubble-body">
        {lines.map((line, i) => <p key={i}>{line || " "}</p>)}
      </div>
      {isOutgoing && message.opened_at && (
        <div className="msg-bubble-receipt">▸ opened {formatRelative(message.opened_at)}</div>
      )}
    </article>
  );
}
