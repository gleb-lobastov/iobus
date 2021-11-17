import { Store, StateVariable } from "./createStore.interface";

export default function createStore<State>(initialState?: State): Store<State> {
  let state: StateVariable<State> = initialState ?? null;
  return {
    get syncedState() {
      return state;
    },
    sync(values, forced) {
      if (!state || forced) {
        state = values;
        return { updated: true, state };
      }
      return { updated: false, state };
    },
    update(updates) {
      if (state) {
        state = { ...state, ...updates };
        return { updated: true, state };
      }
      return { updated: false, state: null };
    },
  };
}
