/**
 * @jest-environment jsdom
 */
import yabus from "./yabus";
import { ConnectOptions } from "./yabus.interface";

interface TestState {
  never?: true;
  testPropNum: number;
  testPropStr: string;
}

let postMessageSpy: jest.SpyInstance;

beforeEach(() => {
  postMessageSpy = jest.spyOn(window, "postMessage");
});

afterEach(() => {
  console.log(postMessageSpy.mock.calls);
  postMessageSpy.mockRestore();
});

describe("single yabus instance", () => {
  it("should initialize, update and disconnect properly", async () => {
    expect.assertions(9);

    const channelKey = "testChannelKey";
    const initialState = { testPropNum: 1, testPropStr: "whatever" };
    const updates = { testPropNum: 2 };
    const onUpdate = jest.fn();
    const onError = jest.fn();
    const iobusConnection = yabus<TestState>({
      initialState,
      channelKey,
      onUpdate,
      onError,
    });

    expect(iobusConnection.connected).toBe(true);

    await delay();

    expect(iobusConnection.state).toEqual(initialState);
    expect(onError).not.toBeCalled();
    expect(onUpdate).not.toBeCalled(); // ignore own events

    const success = iobusConnection.update(updates);
    expect(success).toBe(true);

    await delay();

    expect(iobusConnection.state).toEqual({ ...initialState, ...updates });
    expect(onError).not.toBeCalled();
    expect(onUpdate).not.toBeCalled(); // ignore own events

    iobusConnection.disconnect();
    expect(iobusConnection.connected).toBe(false);
  });
});

describe("two yabus instances", () => {
  it("should acknowledge and sync newbie", async () => {
    expect.assertions(9);

    const channelKey = "testChannelKey";
    const initialState = { testPropNum: 1, testPropStr: "whatever" };
    const updates = { testPropNum: 2 };
    const onUpdateNewbie = jest.fn();
    const onErrorNewbie = jest.fn();
    const iobusConnectionOldie = yabus<TestState>({
      initialState,
      channelKey,
      onUpdate: jest.fn(),
      onError: jest.fn(),
    });

    const iobusConnectionNewbie = yabus<TestState>({
      channelKey,
      onUpdate: onUpdateNewbie,
      onError: onErrorNewbie,
    });

    expect(iobusConnectionNewbie.connected).toBe(true);

    await delay();

    expect(iobusConnectionNewbie.state).toEqual(initialState);
    expect(onErrorNewbie).not.toBeCalled();
    expect(onUpdateNewbie).toBeCalledWith({
      state: initialState,
      updates: null,
    });

    const success = iobusConnectionOldie.update(updates);
    expect(success).toBe(true);

    await delay();

    expect(iobusConnectionNewbie.state).toEqual({
      ...initialState,
      ...updates,
    });
    expect(onErrorNewbie).not.toBeCalled();
    expect(onUpdateNewbie).toBeCalledWith({
      state: { ...initialState, ...updates },
      updates,
    });

    iobusConnectionNewbie.disconnect();
    expect(iobusConnectionNewbie.connected).toBe(false);
  });

  it("should sync oldie, when newbie comes with initial state", async () => {
    expect.assertions(5);

    const channelKey = "testChannelKey";
    const initialState = { testPropNum: 1, testPropStr: "whatever" };

    const onUpdateOldie = jest.fn();
    const onErrorOldie = jest.fn();
    const iobusConnectionOldie = yabus<TestState>({
      channelKey,
      onUpdate: onUpdateOldie,
      onError: onErrorOldie,
    });

    const onUpdateNewbie = jest.fn();
    const onErrorNewbie = jest.fn();
    yabus<TestState>({
      channelKey,
      initialState,
      onUpdate: onUpdateNewbie,
      onError: onErrorNewbie,
    });

    await delay();

    expect(iobusConnectionOldie.state).toEqual(initialState);
    expect(onErrorOldie).not.toBeCalled();
    expect(onUpdateOldie).toBeCalledWith({
      state: initialState,
      updates: null,
    });
    expect(onUpdateNewbie).not.toBeCalled();
    expect(onErrorNewbie).not.toBeCalled();
  });

  it("should update both ways", async () => {
    expect.assertions(4);

    const channelKey = "testChannelKey";
    const initialState = { testPropNum: 1, testPropStr: "whatever" };
    const oldieUpdates = { testPropNum: 2 };
    const newbieUpdate = { testPropStr: "breaking change" };

    const iobusConnectionOldie = yabus<TestState>({
      channelKey,
      initialState,
      onUpdate: jest.fn(),
      onError: jest.fn(),
    });
    const iobusConnectionNewbie = yabus<TestState>({
      channelKey,
      initialState,
      onUpdate: jest.fn(),
      onError: jest.fn(),
    });

    await delay();

    iobusConnectionOldie.update(oldieUpdates);

    await delay();

    iobusConnectionNewbie.update(newbieUpdate);

    await delay();

    expect(iobusConnectionOldie.state).toEqual({
      ...initialState,
      ...oldieUpdates,
      ...newbieUpdate,
    });
    expect(iobusConnectionNewbie.state).toEqual({
      ...initialState,
      ...oldieUpdates,
      ...newbieUpdate,
    });

    const resetState = { testPropNum: 3, testPropStr: "brand new" };
    iobusConnectionOldie.reset(resetState);

    await delay();

    expect(iobusConnectionOldie.state).toEqual(resetState);
    expect(iobusConnectionNewbie.state).toEqual(resetState);
  });
});

describe("yabus instances pool", () => {
  it("should work", async () => {
    const poolSize = 10; // >= 8
    expect.assertions(poolSize * 4);

    const channelKey = "testChannelKey";
    const initialState = { testPropNum: 1, testPropStr: "good" };
    const updatesFoo = { testPropNum: 31337 };
    const updatesBar = { testPropStr: "excellent" };

    const poolOptions = Array.from({ length: poolSize }).map(() => ({
      channelKey,
      onUpdate: jest.fn(),
      onError: jest.fn(),
    })) as unknown as ConnectOptions<TestState, Partial<TestState>>[];

    poolOptions[2].initialState = {
      testPropNum: -1,
      testPropStr: "not so good",
      never: true,
    };
    poolOptions[5].initialState = initialState;
    const pool = poolOptions.map(yabus);

    await delay();

    pool.forEach((iobusConnection) => {
      expect(iobusConnection.state).toEqual(initialState);
    });

    pool[8].update(updatesFoo);

    await delay();

    const fooState = { ...initialState, ...updatesFoo };
    pool.forEach((iobusConnection) => {
      expect(iobusConnection.state).toEqual(fooState);
    });

    const disconnectIndex = 7;
    pool[disconnectIndex].disconnect();
    pool[4].update(updatesBar);

    await delay();

    const barState = { ...fooState, ...updatesBar };
    pool.forEach((iobusConnection, index) => {
      if (index !== disconnectIndex) {
        expect(iobusConnection.state).toEqual(barState);
      } else {
        expect(iobusConnection.state).toEqual(fooState);
      }
      expect(poolOptions[index].onError).not.toBeCalled();
    });
  });
});

function delay(timeout = 0) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}
