/**
 * @jest-environment jsdom
 */
import { EventType } from "../yabus.interface";
import connectChannel from "./connectChannel";

describe("createChannel", () => {
  it("should create channel, send and receive message in same channel", async () => {
    expect.assertions(6);

    const channelKey = "testChannelKey";
    const onEvent = jest.fn();
    const onError = jest.fn();
    const onOtherConnectionEvent = jest.fn();
    const onOtherConnectionError = jest.fn();
    const onOtherChannelEvent = jest.fn();
    const onOtherChannelError = jest.fn();
    const eventData = {
      eventType: EventType.ACKNOWLEDGE,
      sourcePeerId: "testSourcePeerId",
    };

    const channel = connectChannel({ channelKey, onEvent, onError });
    connectChannel({
      channelKey,
      onEvent: onOtherConnectionEvent,
      onError: onOtherConnectionError,
    });
    connectChannel({
      channelKey: "otherChannelKey",
      onEvent: onOtherChannelEvent,
      onError: onOtherChannelError,
    });

    channel.broadcast(eventData);

    await delay(); // broadcast is async
    expect(onEvent).toBeCalledWith(eventData);
    expect(onError).not.toBeCalled();
    expect(onOtherConnectionEvent).toBeCalledWith(eventData);
    expect(onOtherConnectionError).not.toBeCalled();
    expect(onOtherChannelEvent).not.toBeCalled();
    expect(onOtherChannelError).not.toBeCalled();
  });
});

function delay(timeout = 0) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
