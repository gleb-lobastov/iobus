import { stringifyEvent, parseEvent, listen } from "./connectChannel.utils";
import {
  ChannelOptions,
  Channel,
  BaseEventData,
} from "./connectChannel.interface";

export default function connectChannel<EventData extends BaseEventData>(
  channelOptions: ChannelOptions<EventData>
): Channel<EventData> {
  let connected = true;

  const { channelKey, onEvent, onError } = channelOptions;

  const unlisten = listen(handleEvent);

  return {
    get connected() {
      return connected;
    },
    broadcast,
    disconnect: () => {
      connected = false;
      unlisten();
    },
  };

  function handleEvent(event: MessageEvent) {
    const { data: message } = event;
    const eventData = parseEvent<EventData>(channelKey, message, onError);

    if (eventData == null) {
      return;
    }

    onEvent(eventData);
  }

  function broadcast(eventData: EventData) {
    if (!connected) {
      onError?.(`channel "${channelKey}" is not in sync`);
    }
    window.postMessage(stringifyEvent<EventData>(channelKey, eventData), "*");
  }
}
