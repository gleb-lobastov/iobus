import { BaseEventData } from "./connectChannel";
import { StateVariable } from "./createStore";

export interface ConnectOptions<State> {
  channelKey?: string;
  initialState?: State;
  onUpdate?: (payload: UpdateEventPayload<State, Updates>) => void;
  onError?: (error: Error | string) => void;
}

export interface IobusConnection<State> {
  connected: boolean;
  state: StateVariable<State>;
  update: (updates: Partial<State>) => boolean;
  reset: (toState: State) => void;
  disconnect: () => void;
}

export enum EventType {
  ACKNOWLEDGE = "ACKNOWLEDGE",
  SYNC = "SYNC",
  RESET = "RESET",
  UPDATE = "UPDATE",
}

export type AcknowledgeEventPayload = null;

export interface SyncEventPayload<State> {
  state: State;
}

export interface UpdateEventPayload<State> {
  state: State;
  updates: Partial<State> | null;
}

export interface AcknowledgeEventData extends BaseEventData {
  eventType: EventType.ACKNOWLEDGE;
  payload: AcknowledgeEventPayload;
  targetPeerId: string;
}

export interface SyncEventData<State> extends BaseEventData {
  eventType: EventType.SYNC | EventType.RESET;
  payload: SyncEventPayload<State>;
}

export interface UpdateEventData<State> extends BaseEventData {
  eventType: EventType.UPDATE;
  payload: UpdateEventPayload<State>;
}

export type StatefulEventData<State> =
  | AcknowledgeEventData
  | SyncEventData<State>
  | UpdateEventData<State>;
