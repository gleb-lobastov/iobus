import {
  stringifyEvent,
  parseEvent,
  isMessageBelongsToChannel,
  isValidEventType,
} from "./connectChannel.utils";
import { EventType } from "../iobus.interface";

describe("isMessageBelongsToChannel", () => {
  it("should return true if message belongs to channel", () => {
    const testChannelKey = "testChannelKey";
    expect(
      isMessageBelongsToChannel(
        `${testChannelKey}@whatever:whatsoever`,
        testChannelKey
      )
    ).toBe(true);
  });

  it("should return false if message not belongs to channel", () => {
    expect(
      isMessageBelongsToChannel(
        `otherChannelKey@whatever:whatsoever`,
        "testChannelKey"
      )
    ).toBe(false);
  });
});

describe("isValidEventType", () => {
  Object.values(EventType).forEach((eventType) => {
    it(`should be valid for ${eventType}`, () => {
      expect(isValidEventType(eventType)).toBe(true);
    });
  });
  it("should be valid for unknown eventType", () => {
    expect(isValidEventType("unknown")).toBe(false);
  });
});

describe("stringifyEvent", () => {
  it("should stringify event data", () => {
    const testChannelKey = "testChannelKey";
    const testEventType = "testEventType";
    const testSourcePeerId = "testSourcePeerId";
    const whatever = "whatever";
    const stringifiedEventData = stringifyEvent(testChannelKey, {
      eventType: testEventType,
      sourcePeerId: testSourcePeerId,
      whatever,
    });
    expect(stringifiedEventData).toBe(
      `${testChannelKey}@${testEventType}:${JSON.stringify({
        sourcePeerId: testSourcePeerId,
        whatever,
      })}`
    );
  });
});

describe("parseEvent", () => {
  it("should parse event data", () => {
    const testChannelKey = "testChannelKey";
    const eventType = EventType.ACKNOWLEDGE;
    const testSourcePeerId = "testSourcePeerId";
    const whatever = "whatever";
    const testMessage = `${testChannelKey}@${eventType}:${JSON.stringify({
      sourcePeerId: testSourcePeerId,
      whatever,
    })}`;
    const onError = jest.fn();

    const parsedEventData = parseEvent(testChannelKey, testMessage, onError);
    expect(parsedEventData).toEqual({
      eventType,
      sourcePeerId: testSourcePeerId,
      whatever,
    });
    expect(onError).not.toBeCalled();
  });
});
