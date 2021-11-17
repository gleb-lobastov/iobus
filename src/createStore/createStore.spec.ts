import createStore from "./createStore";
describe("createStore", () => {
  it("should hold null instead of state until synced", () => {
    const store = createStore();

    expect(store.syncedState).toBeNull();
  });

  it("should not update until synced", () => {
    const store = createStore();
    const testUpdate = { update: "update" };

    const { updated, state } = store.update(testUpdate);

    expect(updated).toBe(false);
    expect(state).toBeNull();
  });

  it("should hold state, when synced", function () {
    const store = createStore();
    const testInitialState = { state: "whatever" };

    const { updated, state } = store.sync(testInitialState);

    expect(updated).toBe(true);
    expect(state).toEqual(testInitialState);
    expect(store.syncedState).toEqual(testInitialState);
  });

  it("should not sync twice", function () {
    const store = createStore();
    const testInitialState = { state: "whatever" };

    store.sync(testInitialState);
    const { updated, state } = store.sync({ haha: "whatever" });

    expect(updated).toBe(false);
    expect(state).toEqual(testInitialState);
    expect(store.syncedState).toEqual(testInitialState);
  });

  it("should update state", function () {
    const store = createStore();
    const testInitialState = { state: "whatever" };
    const testUpdate = { update: "update" };

    store.sync(testInitialState);
    const { updated, state } = store.update(testUpdate);

    expect(updated).toBe(true);
    expect(state).toEqual({ ...testInitialState, ...testUpdate });
    expect(store.syncedState).toEqual({ ...testInitialState, ...testUpdate });
  });
});
