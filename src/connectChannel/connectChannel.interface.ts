export interface BaseEventData {
  eventType: string;
  sourcePeerId: string;
  targetPeerId?: string;
}

export interface ChannelOptions<EventData extends BaseEventData> {
  channelKey: string;
  onEvent: (eventData: EventData) => void;
  onError?: (error: Error | string) => void;
}

export interface Channel<EventData extends BaseEventData> {
  connected: boolean;
  broadcast: (eventData: EventData) => void;
  disconnect: () => void;
}
