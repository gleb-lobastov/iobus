import { EventType } from "../iobus.interface";
import { BaseEventData } from "./connectChannel.interface";

export function listen(handler: (event: MessageEvent) => void) {
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

export function stringifyEvent<EventData extends BaseEventData>(
  channelKey: string,
  eventData: EventData
) {
  const { eventType, ...restEventData } = eventData;
  const eventPayloadStr = JSON.stringify(restEventData);
  return `${channelKey}@${eventType}:${eventPayloadStr}`;
}

export function parseEvent<EventData extends BaseEventData>(
  channelKey: string,
  message: string,
  onError?: (message: string) => void
): EventData | null {
  if (!isMessageBelongsToChannel(message, channelKey)) {
    return null;
  }

  // split only on first occurrence of delimiter ":", https://stackoverflow.com/a/4607799
  const [channelAndEventType, eventPayloadStr] = message.split(/:(.+)/);
  const [eventChannelKey, eventType] = channelAndEventType.split("@");

  if (eventChannelKey !== channelKey) {
    return null;
  }

  if (!isValidEventType(eventType)) {
    onError?.(`invalid eventType "${eventType}" in channel "${channelKey}"`);
    return null;
  }

  let restEventData;
  try {
    restEventData = JSON.parse(eventPayloadStr);
  } catch (error) {
    const { message, stack = "" } =
      error instanceof Error ? error : { message: error };
    onError?.(`error occurred during parse: "${message}" ${stack}`);
    return null;
  }

  return {
    ...restEventData,
    eventType,
  };
}

export function isValidEventType(eventType: string): boolean {
  const options: string[] = Object.values(EventType);
  return options.includes(eventType);
}

export function isMessageBelongsToChannel(message: string, channel: string) {
  return message.startsWith(channel);
}
