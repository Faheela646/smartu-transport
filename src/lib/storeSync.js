export function syncPersistedStore(store, key) {
  if (typeof window === "undefined") return () => {};
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(`smartu:${key}`) : null;
  let applyingRemoteState = false;

  const applyState = (serialized) => {
    if (!serialized) return;
    try {
      const parsed = JSON.parse(serialized);
      if (!parsed?.state) return;
      applyingRemoteState = true;
      store.setState(parsed.state);
    } catch (error) {
      console.error(`Unable to synchronize ${key} across tabs.`, error);
    } finally {
      applyingRemoteState = false;
    }
  };

  const unsubscribe = store.subscribe(() => {
    if (applyingRemoteState) return;
    const serialized = window.localStorage.getItem(key);
    if (serialized) channel?.postMessage(serialized);
  });
  const onStorage = (event) => {
    if (event.key === key) applyState(event.newValue);
  };
  const onMessage = (event) => applyState(event.data);

  window.addEventListener("storage", onStorage);
  channel?.addEventListener("message", onMessage);

  return () => {
    unsubscribe();
    window.removeEventListener("storage", onStorage);
    channel?.removeEventListener("message", onMessage);
    channel?.close();
  };
}
