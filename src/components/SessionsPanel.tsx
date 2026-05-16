import { EVENTS, getEvent } from "../events";
import type { EventId, Session } from "../types";
import { Button } from "./Button";
import { FieldLabel, SelectInput, TextInput } from "./FormControls";

type SessionsPanelProps = {
  activeSession: Session;
  sessions: Session[];
  onAddSession: () => void;
  onChangeEvent: (eventId: EventId) => void;
  onDeleteSession: () => void;
  onRenameSession: (name: string) => void;
  onResetAll: () => void;
  onSelectSession: (sessionId: string) => void;
};

export function SessionsPanel({
  activeSession,
  onAddSession,
  onChangeEvent,
  onDeleteSession,
  onRenameSession,
  onResetAll,
  onSelectSession,
  sessions,
}: SessionsPanelProps) {
  return (
    <section className="grid min-h-0 gap-[9px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.96rem] text-slate-50">Sessions</h2>
        <Button type="button" onClick={onAddSession}>
          Add
        </Button>
      </div>

      <div className="mb-0.5 grid grid-cols-2 gap-2 overflow-visible pr-0.5 max-[680px]:grid-cols-1">
        {sessions.map((session) => (
          <Button
            active={session.id === activeSession.id}
            className="grid min-h-[42px] min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center justify-between gap-2 text-left leading-none"
            type="button"
            key={session.id}
            onClick={() => onSelectSession(session.id)}
          >
            <span className="min-w-0 translate-y-0.5 overflow-hidden leading-[1.1] text-ellipsis whitespace-nowrap">{session.name}</span>
            <small className="translate-y-0.5 leading-[1.1] text-[#8d99aa]">{getEvent(session.eventId).shortName}</small>
          </Button>
        ))}
      </div>

      <FieldLabel htmlFor="session-name">Session name</FieldLabel>
      <TextInput id="session-name" value={activeSession.name} onChange={(event) => onRenameSession(event.target.value)} />

      <FieldLabel htmlFor="event">Scramble type</FieldLabel>
      <SelectInput id="event" value={activeSession.eventId} onChange={(event) => onChangeEvent(event.target.value as EventId)}>
        {EVENTS.map((event) => (
          <option value={event.id} key={event.id}>
            {event.name}
          </option>
        ))}
      </SelectInput>

      <div className="flex items-center gap-2 max-[680px]:flex-wrap">
        <Button type="button" onClick={onDeleteSession} disabled={sessions.length === 1}>
          Delete session
        </Button>
        <Button type="button" onClick={onResetAll}>
          Reset all
        </Button>
      </div>
    </section>
  );
}
