export type ParsedIcsEvent = {
  uid: string;
  start: string;
  end: string;
  summary?: string;
};

function unfoldLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];
  for (const line of raw) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDate(value: string): string {
  const v = value.trim();
  if (/^\d{8}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  }
  if (/^\d{8}T\d{6}Z?$/.test(v)) {
    const d = v.replace(/Z$/, "");
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return v.slice(0, 10);
}

export function parseIcs(text: string): ParsedIcsEvent[] {
  const lines = unfoldLines(text);
  const events: ParsedIcsEvent[] = [];
  let inEvent = false;
  let current: Partial<ParsedIcsEvent> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current.uid && current.start && current.end) {
        events.push(current as ParsedIcsEvent);
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const [key, ...rest] = line.split(":");
    const value = rest.join(":");
    const baseKey = key.split(";")[0];

    switch (baseKey) {
      case "UID":
        current.uid = value;
        break;
      case "DTSTART":
        current.start = parseIcsDate(value);
        break;
      case "DTEND":
        current.end = parseIcsDate(value);
        break;
      case "SUMMARY":
        current.summary = value;
        break;
    }
  }

  return events;
}
