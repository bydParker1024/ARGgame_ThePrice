export function renderApp(container, dependencies) {
  if (!window.ARG_FILES || typeof window.ARG_FILES.renderApp !== 'function') {
    throw new Error('Archive runtime is not loaded.');
  }
  return window.ARG_FILES.renderApp(container, dependencies);
}
