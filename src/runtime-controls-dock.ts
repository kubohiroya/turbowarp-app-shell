export type DockEdge = 'top' | 'bottom' | 'left' | 'right';
export interface DockButtonOptions {
  id: string;
  label: string;
  icon?: string;
  text?: string;
  onClick(): unknown;
}
export interface DockButtonState {
  label?: string;
  text?: string;
  visible?: boolean;
  expanded?: boolean;
}
export interface RuntimeStageControls {
  addButton(options: DockButtonOptions): {
    update(state: DockButtonState): void;
    focus(): void;
    dispose(): void;
    placePanel?(element: unknown): void;
  };
}
const registry = Symbol.for('@kubohiroya/turbowarp-app-shell/runtime-controls-dock/v1');
const edges: DockEdge[] = ['top', 'bottom', 'left', 'right'];

/** App-neutral, optional controls for standalone players that have no Editor toolbar. */
export function createRuntimeControlsDock(options: {
  document: Document;
  locale?: string;
  storageKey?: string;
}) {
  const {document} = options;
  const view = document.defaultView;
  const ja = /^ja(?:-|$)/iu.test(
    options.locale || document.documentElement.lang || view?.navigator.language || '',
  );
  const labels = ja
    ? {
        tools: 'ツール',
        settings: 'Dockの設定',
        settingsButton: '設定',
        edge: '表示位置',
        autoHide: '自動的に隠す',
        close: '閉じる',
        top: '上',
        bottom: '下',
        left: '左',
        right: '右',
      }
    : {
        tools: 'Tools',
        settings: 'Dock settings',
        settingsButton: 'Settings',
        edge: 'Position',
        autoHide: 'Automatically hide',
        close: 'Close',
        top: 'Top',
        bottom: 'Bottom',
        left: 'Left',
        right: 'Right',
      };
  const storageKey = options.storageKey || 'turbowarp.runtime-controls-dock.v1';
  let edge: DockEdge = 'bottom';
  let autoHide = true;
  try {
    const stored = JSON.parse(view?.localStorage.getItem(storageKey) || 'null');
    if (stored && edges.includes(stored.edge)) edge = stored.edge;
    if (typeof stored?.autoHide === 'boolean') autoHide = stored.autoHide;
  } catch {
    /* Storage is optional, including file: URLs and restrictive webviews. */
  }
  const root = document.createElement('div');
  root.setAttribute('data-runtime-controls-dock', 'true');
  const style = document.createElement('style');
  style.textContent = `[data-runtime-controls-dock] {position:fixed;z-index:2147483000;display:flex;align-items:center;gap:4px;font:14px/1.4 sans-serif;color:#25354a;max-width:100vw;max-height:100vh}
[data-runtime-controls-dock][hidden], [data-runtime-controls-dock] [hidden] {display:none!important}
[data-runtime-controls-dock] button, [data-runtime-controls-dock] select {font:inherit;color:inherit;cursor:pointer}
[data-runtime-controls-dock] button:focus-visible, [data-runtime-controls-dock] select:focus-visible {outline:3px solid #2864bd;outline-offset:2px}
[data-runtime-dock-bar] {display:flex;gap:6px;padding:8px;border:1px solid #9aa8b8;border-radius:14px;background:#f5f8fceF;box-shadow:0 3px 16px #0003;backdrop-filter:blur(16px);overflow:auto;max-width:calc(100vw - 16px);max-height:calc(100vh - 48px)}
[data-runtime-dock-bar] button {min-width:48px;min-height:48px;padding:0 4px;border:1px solid transparent;border-radius:8px;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px}
[data-runtime-dock-bar] button:hover {background:#dae5f4}
[data-runtime-dock-bar] button[aria-expanded=true] {border-color:#2864bd;background:#e8effb}
[data-runtime-dock-icon] {font-size:24px;line-height:1}
[data-runtime-dock-handle] {min-width:48px;min-height:28px;border:1px solid #9aa8b8;border-radius:8px;background:#f5f8fc;color:#25354a}
[data-runtime-dock-settings] {position:fixed;z-index:2147483001;box-sizing:border-box;width:280px;max-width:calc(100vw - 24px);padding:16px;border:1px solid #9aa8b8;border-radius:12px;background:#fff;box-shadow:0 4px 16px #0003;display:flex;flex-direction:column;gap:12px}
[data-runtime-dock-panel] {box-sizing:border-box;display:flex;flex-direction:column;width:min(28rem,calc(100vw - 24px));background:#fff;color:#25354a;border:1px solid #9aa8b8;border-radius:12px;box-shadow:0 4px 16px #0003;z-index:2147483001!important;font:14px/1.5 sans-serif;overflow:hidden!important}
[data-runtime-dock-panel][hidden] {display:none!important}
[data-runtime-dock-panel] > :first-child {display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;border-bottom:1px solid #d8e0ea}
[data-runtime-dock-panel] > :nth-child(2) {overflow:auto;min-height:0;padding:0 16px}
[data-runtime-dock-panel] > :last-child {padding:12px 16px;border-top:1px solid #d8e0ea}
[data-runtime-dock-panel] h2 {font-size:18px;margin:0}
[data-runtime-dock-panel] h3 {font-size:15px}
[data-runtime-dock-panel] button {font:inherit;min-height:36px;padding:6px 10px;margin:3px;border:1px solid #9aa8b8;border-radius:6px;background:#f5f8fc;color:#25354a;cursor:pointer}
[data-runtime-dock-panel] button[aria-checked=true] {border-color:#2864bd;box-shadow:inset 0 0 0 1px #2864bd;background:#e8effb}
[data-runtime-dock-panel] button:focus-visible {outline:3px solid #2864bd;outline-offset:1px}
[data-runtime-dock-settings] label {display:flex;align-items:center;justify-content:space-between;gap:12px}
[data-runtime-dock-settings] select, [data-runtime-dock-settings] button {min-height:36px;padding:6px 10px;border:1px solid #9aa8b8;border-radius:6px;background:#f5f8fc}
`;
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.textContent = labels.tools;
  handle.setAttribute('data-runtime-dock-handle', 'true');
  handle.setAttribute('aria-label', labels.tools);
  const bar = document.createElement('div');
  bar.setAttribute('data-runtime-dock-bar', 'true');
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', labels.tools);
  const settings = document.createElement('div');
  settings.setAttribute('data-runtime-dock-settings', 'true');
  settings.setAttribute('role', 'dialog');
  settings.setAttribute('aria-label', labels.settings);
  const heading = document.createElement('strong');
  heading.textContent = labels.settings;
  const edgeLabel = document.createElement('label');
  edgeLabel.textContent = labels.edge;
  const edgeSelect = document.createElement('select');
  edgeSelect.setAttribute('aria-label', labels.edge);
  for (const position of edges) {
    const option = document.createElement('option');
    option.value = position;
    option.textContent = labels[position];
    edgeSelect.append(option);
  }
  edgeLabel.append(edgeSelect);
  const autoLabel = document.createElement('label');
  autoLabel.textContent = labels.autoHide;
  const autoCheck = document.createElement('input');
  autoCheck.type = 'checkbox';
  autoLabel.append(autoCheck);
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = labels.close;
  settings.append(heading, edgeLabel, autoLabel, close);
  const gear = document.createElement('button');
  gear.type = 'button';
  const gearIcon = document.createElement('span');
  gearIcon.setAttribute('data-runtime-dock-icon', 'true');
  gearIcon.setAttribute('aria-hidden', 'true');
  gearIcon.textContent = '⚙';
  const gearLabel = document.createElement('span');
  gearLabel.textContent = labels.settingsButton;
  gear.append(gearIcon, gearLabel);
  gear.setAttribute('aria-label', labels.settings);
  gear.title = labels.settings;
  root.append(style, handle, bar, settings);
  type Entry = {
    panel?: HTMLElement;
    button: HTMLButtonElement;
    label: HTMLSpanElement;
    state: Required<DockButtonState>;
  };
  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let hovered = false,
    manual = false,
    settingsOpen = false,
    disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let keyboardInput = false;
  const hasFocus = () => keyboardInput && root.contains(document.activeElement);
  const expanded = () =>
    !autoHide ||
    hovered ||
    manual ||
    settingsOpen ||
    hasFocus() ||
    [...entries.values()].some((entry) => entry.state.visible && entry.state.expanded);
  const persist = () => {
    try {
      view?.localStorage.setItem(storageKey, JSON.stringify({edge, autoHide}));
    } catch {
      /* Settings still work for this page. */
    }
  };
  const placePanel = (panel: HTMLElement) => {
    const rect = root.getBoundingClientRect();
    const width = panel.offsetWidth || 320,
      height = panel.offsetHeight || 240;
    const vw = view?.innerWidth || 480,
      vh = view?.innerHeight || 360;
    let left = (vw - width) / 2,
      top = (vh - height) / 2;
    if (edge === 'bottom') top = rect.top - height - 8;
    if (edge === 'top') top = rect.bottom + 8;
    if (edge === 'left') left = rect.right + 8;
    if (edge === 'right') left = rect.left - width - 8;
    Object.assign(panel.style, {
      position: 'fixed',
      left: `${Math.max(8, Math.min(left, vw - width - 8))}px`,
      top: `${Math.max(8, Math.min(top, vh - height - 8))}px`,
      maxHeight: 'calc(100vh - 16px)',
      overflowY: 'auto',
    });
  };
  function render() {
    if (disposed) return;
    const visible = [...entries.values()].filter((entry) => entry.state.visible);
    root.hidden = !visible.length;
    if (!visible.length) {
      settingsOpen = false;
      manual = false;
      hovered = false;
    }
    const showing = expanded();
    bar.hidden = !showing;
    settings.hidden = !settingsOpen;
    handle.hidden = !autoHide;
    handle.setAttribute('aria-expanded', String(showing));
    root.setAttribute('data-edge', edge);
    root.setAttribute('data-auto-hide', String(autoHide));
    root.setAttribute('data-expanded', String(showing));
    const vertical = edge === 'left' || edge === 'right';
    Object.assign(root.style, {
      left: edge === 'right' ? 'auto' : '0',
      right: edge === 'left' ? 'auto' : '0',
      top: edge === 'bottom' ? 'auto' : '0',
      bottom: edge === 'top' ? 'auto' : '0',
      width: 'max-content',
      height: 'max-content',
      margin: vertical ? 'auto 0' : '0 auto',
      transform: 'none',
      flexDirection:
        edge === 'bottom'
          ? 'column'
          : edge === 'top'
            ? 'column-reverse'
            : edge === 'left'
              ? 'row-reverse'
              : 'row',
    });
    bar.style.flexDirection = vertical ? 'column' : 'row';
    for (const entry of entries.values()) {
      entry.button.hidden = !entry.state.visible;
      entry.label.textContent = entry.state.text || entry.state.label;
      entry.button.setAttribute('aria-label', entry.state.label);
      entry.button.title = entry.state.label;
      entry.button.setAttribute('aria-expanded', String(entry.state.expanded));
    }
    edgeSelect.value = edge;
    autoCheck.checked = autoHide;
    gear.setAttribute('aria-expanded', String(settingsOpen));
    if (settingsOpen) placePanel(settings);
    for (const entry of entries.values())
      if (entry.panel && entry.state.expanded && !entry.panel.hidden) placePanel(entry.panel);
    listeners.forEach((listener) => listener());
  }
  const scheduleHide = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      hovered = false;
      manual = false;
      render();
    }, 600);
  };
  root.addEventListener('pointerenter', (event) => {
    clearTimeout(timer);
    hovered = event.pointerType !== 'touch';
    render();
  });
  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') scheduleHide();
  });
  root.addEventListener('focusin', render);
  root.addEventListener('focusout', (event) => {
    if (root.contains(event.relatedTarget as Node)) return;
    queueMicrotask(() => {
      if (!root.contains(document.activeElement)) manual = false;
      render();
    });
  });
  handle.addEventListener('click', () => {
    manual = !manual;
    render();
  });
  gear.addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    render();
    if (settingsOpen) edgeSelect.focus();
  });
  close.addEventListener('click', () => {
    settingsOpen = false;
    render();
    gear.focus();
  });
  edgeSelect.addEventListener('change', () => {
    if (edges.includes(edgeSelect.value as DockEdge)) edge = edgeSelect.value as DockEdge;
    persist();
    render();
  });
  autoCheck.addEventListener('change', () => {
    autoHide = autoCheck.checked;
    persist();
    render();
  });
  const onKey = (event: KeyboardEvent) => {
    keyboardInput = true;
    if (settingsOpen && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      settingsOpen = false;
      render();
      gear.focus();
    }
  };
  const onPointer = (event: PointerEvent) => {
    keyboardInput = false;
    if (!root.contains(event.target as Node)) {
      manual = false;
      hovered = false;
      render();
    }
  };
  const fullscreen = () => {
    (document.fullscreenElement || document.body).append(root);
    render();
  };
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('fullscreenchange', fullscreen);
  view?.addEventListener('resize', render);
  (document.fullscreenElement || document.body).append(root);
  const stageControls: RuntimeStageControls = {
    addButton(options) {
      if (disposed) throw new Error('The Dock has been disposed');
      if (!options.id || !options.label || typeof options.onClick !== 'function')
        throw new TypeError('Invalid Dock control');
      entries.get(options.id)?.button.remove();
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-runtime-dock-control', options.id);
      const icon = document.createElement('span');
      icon.setAttribute('data-runtime-dock-icon', 'true');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = options.icon || '•';
      const label = document.createElement('span');
      button.append(icon, label);
      button.addEventListener('click', options.onClick);
      const entry: Entry = {
        button,
        label,
        state: {label: options.label, text: options.text || '', visible: false, expanded: false},
      };
      entries.set(options.id, entry);
      bar.insertBefore(button, gear.parentNode === bar ? gear : null);
      if (gear.parentNode !== bar) bar.append(gear);
      render();
      return {
        update(state) {
          if (entries.get(options.id) !== entry) return;
          let changed = false;
          for (const key of ['label', 'text', 'visible', 'expanded'] as const) {
            const value = state[key];
            if (typeof value === typeof entry.state[key] && entry.state[key] !== value) {
              Object.assign(entry.state, {[key]: value});
              changed = true;
            }
          }
          if (changed) render();
        },
        placePanel(element: unknown) {
          const panel = element as HTMLElement;
          if (!panel || typeof panel.setAttribute !== 'function' || !panel.style)
            throw new TypeError('Invalid Dock panel');
          entry.panel = panel;
          panel.setAttribute('data-runtime-dock-panel', 'true');
          placePanel(panel);
        },
        focus() {
          if (entry.state.visible && entries.get(options.id) === entry) {
            manual = true;
            render();
            button.focus();
          }
        },
        dispose() {
          if (entries.get(options.id) !== entry) return;
          entries.delete(options.id);
          button.remove();
          render();
        },
      };
    },
  };
  render();
  return {
    stageControls,
    placePanel,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => ({
      edge,
      autoHide,
      expanded: expanded(),
      count: [...entries.values()].filter((entry) => entry.state.visible).length,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(timer);
      entries.clear();
      listeners.clear();
      root.remove();
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('fullscreenchange', fullscreen);
      view?.removeEventListener('resize', render);
    },
  };
}

/** Sharing on the document also covers independently bundled copies of this package. */
export function getRuntimeControlsDock(options: Parameters<typeof createRuntimeControlsDock>[0]) {
  const document = options.document as Document & {
    [registry]?: ReturnType<typeof createRuntimeControlsDock>;
  };
  if (document[registry]) return document[registry];
  const dock = createRuntimeControlsDock(options);
  const dispose = dock.dispose;
  dock.dispose = () => {
    dispose();
    if (document[registry] === dock) delete document[registry];
  };
  document[registry] = dock;
  return dock;
}
