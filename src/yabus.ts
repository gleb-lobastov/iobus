import uniqId from "./utils/uniqId";
import createStore from "./createStore";
import connectChannel from "./connectChannel";
import {
  AcknowledgeEventData,
  ConnectOptions,
  EventType,
  IobusConnection,
  StatefulEventData,
  SyncEventData,
  UpdateEventData,
} from "./yabus.interface";

const DEFAULT_CHANNEL = "@@yabus";

export default function yabus<State>({
  channelKey = DEFAULT_CHANNEL,
  initialState,
  onUpdate,
  onError,
}: ConnectOptions<State>): IobusConnection<State> {
  const peerId = uniqId("peer");
  const store = createStore<State>(initialState);
  const channel = connectChannel<StatefulEventData<State>>({
    channelKey,
    onEvent: handleEvent,
    onError,
  });

  if (initialState) {
    reset(initialState);
  } else {
    channel.broadcast({
      eventType: EventType.ACKNOWLEDGE,
      payload: null,
      sourcePeerId: peerId,
      targetPeerId: peerId,
    });
  }
  return {
    get state() {
      return store.syncedState;
    },
    get connected() {
      return channel.connected;
    },
    update,
    reset,
    disconnect() {
      channel.disconnect();
    },
  };

  function update(updates: Partial<State>): boolean {
    if (!channel.connected) {
      onError?.(`channel "${channelKey}" is disconnected`);
      return false;
    }
    if (!store.syncedState) {
      onError?.(`store "${channelKey}" is not yet in sync`);
      return false;
    }
    const { updated, state: nextState } = store.update(updates);
    if (!updated || !nextState) {
      onError?.(`couldn't read state in channel "${channelKey}"`);
      return false;
    }
    channel.broadcast({
      eventType: EventType.UPDATE,
      sourcePeerId: peerId,
      targetPeerId: "*",
      payload: {
        state: nextState, // when updated is true, State always present
        updates,
      },
    });
    return true;
  }

  function reset(toState: State) {
    channel.broadcast({
      eventType: EventType.RESET,
      payload: { state: toState, updates: toState },
      sourcePeerId: peerId,
      targetPeerId: "*",
    });
  }

  function handleEvent(eventData: StatefulEventData<State>) {
    const { eventType, sourcePeerId } = eventData;

    const selfEmitted = sourcePeerId === peerId;
    // RESET event should reset peer itself, because peer could catch other RESET events
    // after reset command invocation, but before own RESET event capture.
    // And state will became inconsistent in such case
    if (selfEmitted && eventType !== EventType.RESET) {
      return;
    }

    switch (eventType) {
      case EventType.ACKNOWLEDGE:
        handleAcknowledge(eventData);
        break;
      case EventType.SYNC:
      case EventType.RESET:
        handleSync(eventData, selfEmitted);
        break;
      case EventType.UPDATE:
        handleUpdate(eventData);
        break;
      default:
    }
  }

  function handleAcknowledge(eventData: AcknowledgeEventData) {
    const { targetPeerId } = eventData;

    if (!store.syncedState) {
      return;
    }

    channel.broadcast({
      eventType: EventType.SYNC,
      sourcePeerId: peerId,
      targetPeerId,
      payload: {
        state: store.syncedState,
      },
    });
  }

  function handleSync(eventData: SyncEventData<State>, selfEmitted: boolean) {
    const { eventType, payload, targetPeerId } = eventData;

    const forced = eventType === EventType.RESET;
    if (
      (!forced && store.syncedState) ||
      (targetPeerId !== peerId && targetPeerId !== "*")
    ) {
      return;
    }
    const { updated, state } = store.sync(payload.state, forced);
    if (!updated || !state) {
      return;
    }
    if (!selfEmitted && onUpdate) {
      onUpdate({ state, updates: null });
    }
  }

  function handleUpdate(eventData: UpdateEventData<State>) {
    const { payload } = eventData;
    if (!payload.updates) {
      return;
    }

    const { updated, state } = store.update(payload.updates);
    if (!updated || !state) {
      return;
    }
    onUpdate?.({ state, updates: payload.updates });
  }
}

yabus.EventType = EventType;
