return () => {
  observer?.disconnect();
  injectedStyle?.remove();
  listenerCleanup.forEach(fn => fn());
};