export type StateVariable<State> = State | null;
export type UpdateStatus<State> =
  | { updated: false; state: StateVariable<State> }
  | { updated: boolean; state: State };

export interface Store<State> {
  syncedState: StateVariable<State>;
  sync: (values: State, forced?: boolean) => UpdateStatus<State>;
  update: (updates: Partial<State>) => UpdateStatus<State>;
}
