export type AppShellLocale = 'en' | 'ja';

export interface AppShellMessageLocales {
  en: {
    title: string;
    actionLabel?: string;
  };
  ja: {
    title: string;
    actionLabel?: string;
  };
}

export interface RuntimeMessageIndicatorOptions {
  document: Document;
  mount: HTMLElement;
  locales: AppShellMessageLocales;
  initialLocale?: AppShellLocale;
  tone?: 'error' | 'warning' | 'info';
  action?: {
    onClick(): unknown | Promise<unknown>;
  };
}

export interface RuntimeMessage {
  message: unknown;
  details?: Record<string, unknown>;
}

export interface AppShellIcon {
  url?: string;
  text?: string;
}

export interface AppShellActionState {
  enabled?: boolean;
  visible?: boolean;
}

export interface AppShellTitleControlLabels {
  website: string;
  close: string;
}

export interface AppShellTitleControlsOptions {
  document: Document;
  mount: HTMLElement;
  locales: Readonly<Record<string, AppShellTitleControlLabels>>;
  initialLocale?: string;
  fallbackLocale?: string;
  ariaLabel?: string;
  websiteIcon?: AppShellIcon;
  closeIcon?: AppShellIcon;
  websiteEnabled?: boolean;
  websiteVisible?: boolean;
  closeEnabled?: boolean;
  closeVisible?: boolean;
  websiteTestId?: string;
  closeTestId?: string;
  rootTestId?: string;
  onWebsite(): unknown | Promise<unknown>;
  onClose(): unknown | Promise<unknown>;
  onError?(error: unknown): unknown;
}

export interface AppShellApplicationMenuAction {
  id: string;
  labels: Readonly<Record<string, string>>;
  icon?: AppShellIcon;
  enabled?: boolean;
  visible?: boolean;
  testId?: string;
  onSelect(): unknown | Promise<unknown>;
}

export interface AppShellApplicationMenuStatus {
  text?: string;
  visible?: boolean;
  tone?: 'neutral' | 'info' | 'warning' | 'error';
}

export interface AppShellApplicationMenuActionState extends AppShellActionState {
  labels?: Readonly<Record<string, string>>;
  icon?: AppShellIcon;
}

export interface AppShellApplicationMenuOptions {
  document: Document;
  mount: HTMLElement;
  actions: readonly AppShellApplicationMenuAction[];
  initialLocale?: string;
  fallbackLocale?: string;
  ariaLabel?: string;
  status?: AppShellApplicationMenuStatus;
  rootTestId?: string;
  statusTestId?: string;
  onError?(error: unknown): unknown;
}

export interface AppShellLoadingState {
  visible: boolean;
  label?: string;
  progress?: number | null;
  backdropUrl?: string;
  frameUrls?: readonly string[];
}

export interface AppShellLoadingPresenterOptions {
  document: Document;
  mount: HTMLElement;
  frameMilliseconds?: number;
  ariaLabel?: string;
  rootTestId?: string;
  initialState?: AppShellLoadingState;
}

export interface AppShellSourceChoice {
  id: string;
  labels: Readonly<Record<string, string>>;
  descriptionLabels?: Readonly<Record<string, string>>;
  icon?: AppShellIcon;
  enabled?: boolean;
  visible?: boolean;
  primary?: boolean;
  testId?: string;
  onSelect(): unknown | Promise<unknown>;
}

export interface AppShellSourceChoiceState extends AppShellActionState {
  labels?: Readonly<Record<string, string>>;
  descriptionLabels?: Readonly<Record<string, string>>;
  icon?: AppShellIcon;
}

export interface AppShellSourceChooserOptions {
  document: Document;
  mount: HTMLElement;
  choices: readonly AppShellSourceChoice[];
  initialLocale?: string;
  fallbackLocale?: string;
  ariaLabel?: string;
  introLabels?: Readonly<Record<string, string>>;
  rootTestId?: string;
  panelTestId?: string;
  onError?(error: unknown): unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireElement(value: unknown, name: string): HTMLElement {
  if (!isRecord(value) || typeof value['appendChild'] !== 'function') {
    throw new TypeError(`${name} must be a DOM element.`);
  }
  return value as unknown as HTMLElement;
}

function requireDocument(value: unknown): Document {
  if (!isRecord(value) || typeof value['createElement'] !== 'function') {
    throw new TypeError('document must provide the DOM document contract.');
  }
  return value as unknown as Document;
}

function requireLocales(value: unknown): AppShellMessageLocales {
  if (!isRecord(value)) throw new TypeError('locales must be an object.');
  for (const locale of ['en', 'ja'] as const) {
    const localized = value[locale];
    if (!isRecord(localized) || typeof localized['title'] !== 'string' || localized['title'].length === 0) {
      throw new TypeError(`locales.${locale}.title must be a non-empty string.`);
    }
    if (localized['actionLabel'] !== undefined && typeof localized['actionLabel'] !== 'string') {
      throw new TypeError(`locales.${locale}.actionLabel must be a string.`);
    }
  }
  return value as unknown as AppShellMessageLocales;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
}

function optionalBoolean(value: unknown, name: string, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean.`);
  return value;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string.`);
  return value;
}

function requireLocalizedLabels(value: unknown, name: string): Readonly<Record<string, string>> {
  if (!isRecord(value)) throw new TypeError(`${name} must be an object.`);
  const entries = Object.entries(value);
  if (entries.length === 0) throw new TypeError(`${name} must include at least one locale.`);
  for (const [locale, label] of entries) {
    if (typeof label !== 'string' || label.length === 0) {
      throw new TypeError(`${name}.${locale} must be a non-empty string.`);
    }
  }
  return value as Readonly<Record<string, string>>;
}

function requireTitleLocales(value: unknown): Readonly<Record<string, AppShellTitleControlLabels>> {
  if (!isRecord(value)) throw new TypeError('title control locales must be an object.');
  const entries = Object.entries(value);
  if (entries.length === 0) {
    throw new TypeError('title control locales must include at least one locale.');
  }
  for (const [locale, labels] of entries) {
    if (!isRecord(labels)) throw new TypeError(`title control locales.${locale} must be an object.`);
    requireString(labels['website'], `title control locales.${locale}.website`);
    requireString(labels['close'], `title control locales.${locale}.close`);
  }
  return value as Readonly<Record<string, AppShellTitleControlLabels>>;
}

function firstLocale<T>(locales: Readonly<Record<string, T>>, name: string): string {
  const [locale] = Object.keys(locales);
  if (locale === undefined) throw new TypeError(`${name} must include at least one locale.`);
  return locale;
}

function resolveInjectedLocale<T>(
  locales: Readonly<Record<string, T>>,
  requested: string | undefined,
  fallback: string | undefined,
  name: string
): string {
  if (requested !== undefined && Object.hasOwn(locales, requested)) return requested;
  if (fallback !== undefined && Object.hasOwn(locales, fallback)) return fallback;
  if (Object.hasOwn(locales, 'en')) return 'en';
  return firstLocale(locales, name);
}

function localized<T>(
  locales: Readonly<Record<string, T>>,
  locale: string,
  fallback: string | undefined,
  name: string
): T {
  const resolved = resolveInjectedLocale(locales, locale, fallback, name);
  return locales[resolved] as T;
}

function requireIcon(value: unknown, name: string): AppShellIcon | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new TypeError(`${name} must be an object.`);
  const url = optionalString(value['url'], `${name}.url`);
  const text = optionalString(value['text'], `${name}.text`);
  if ((url === undefined || url.length === 0) && (text === undefined || text.length === 0)) {
    throw new TypeError(`${name} must include a non-empty url or text.`);
  }
  return {
    ...(url === undefined ? {} : {url}),
    ...(text === undefined ? {} : {text})
  };
}

function requireTestId(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
  return value;
}

function applyTestId(element: HTMLElement, testId: string | undefined) {
  if (testId !== undefined) element.setAttribute('data-testid', testId);
}

function restoreableMountPosition(document: Document, mount: HTMLElement): (() => void) | null {
  if (mount === document.body) return null;
  const previous = mount.style.position;
  if (previous === '' || previous === 'static') {
    mount.style.position = 'relative';
    return () => {
      mount.style.position = previous;
    };
  }
  return null;
}

function setButtonEnabled(button: HTMLButtonElement, enabled: boolean) {
  button.disabled = !enabled;
  button.setAttribute('aria-disabled', String(!enabled));
  button.style.cursor = enabled ? 'pointer' : 'not-allowed';
  button.style.opacity = enabled ? '1' : '0.42';
}

function setElementVisible(element: HTMLElement, visible: boolean, display: string) {
  element.hidden = !visible;
  element.style.display = visible ? display : 'none';
}

function reportActionError(onError: ((error: unknown) => unknown) | undefined, error: unknown) {
  try {
    onError?.(error);
  } catch {
    // Error observers cannot change the shell lifecycle.
  }
}

function invokeAction(
  action: () => unknown | Promise<unknown>,
  onError: ((error: unknown) => unknown) | undefined,
  event?: Event
) {
  event?.preventDefault();
  event?.stopPropagation();
  try {
    Promise.resolve(action()).catch((error) => {
      reportActionError(onError, error);
    });
  } catch (error) {
    reportActionError(onError, error);
  }
}

function iconCssUrl(url: string): string {
  return `url("${url.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}")`;
}

function renderIcon(element: HTMLElement, icon: AppShellIcon | undefined) {
  element.textContent = '';
  element.style.backgroundImage = '';
  element.style.display = icon === undefined ? 'none' : 'inline-flex';
  if (icon === undefined) return;
  if (icon.url !== undefined) {
    element.style.backgroundImage = iconCssUrl(icon.url);
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundSize = 'contain';
    return;
  }
  element.textContent = icon.text ?? '';
}

function appendDefaultCloseIcon(document: Document, icon: HTMLElement) {
  icon.textContent = '';
  icon.style.cssText =
    'position:relative;display:block;width:20px;height:20px;pointer-events:none;flex:0 0 auto;';
  for (const rotation of ['45deg', '-45deg']) {
    const line = document.createElement('span');
    line.setAttribute('data-turbowarp-app-shell-close-icon-line', 'true');
    line.style.cssText = `position:absolute;left:50%;top:50%;display:block;width:20px;height:3px;border-radius:2px;background:currentColor;transform:translate(-50%,-50%) rotate(${rotation});transform-origin:center;`;
    icon.appendChild(line);
  }
}

function loadingTone(tone: 'neutral' | 'info' | 'warning' | 'error') {
  if (tone === 'warning') return '#805300';
  if (tone === 'error') return '#a00020';
  if (tone === 'info') return '#176e9f';
  return '#35524c';
}

export function resolveAppShellLocale(input?: {
  language?: string;
  languages?: readonly string[];
}): AppShellLocale {
  const preferred = input?.language ?? input?.languages?.[0] ?? globalThis.navigator?.language ?? '';
  return /^ja(?:-|$)/iu.test(preferred) ? 'ja' : 'en';
}

function boundedText(value: unknown, limit = 2000): string {
  const text = String(value ?? '');
  const scalars = [...text];
  return scalars.length <= limit ? text : `${scalars.slice(0, limit - 1).join('')}...`;
}

export function createAppShellTitleControls(options: AppShellTitleControlsOptions) {
  if (!isRecord(options)) throw new TypeError('title control options must be an object.');
  const document = requireDocument(options.document);
  const mount = requireElement(options.mount, 'mount');
  const locales = requireTitleLocales(options.locales);
  const fallbackLocale = optionalString(options.fallbackLocale, 'fallbackLocale');
  let locale = resolveInjectedLocale(
    locales,
    optionalString(options.initialLocale, 'initialLocale') ?? resolveAppShellLocale(),
    fallbackLocale,
    'title control locales'
  );
  if (typeof options.onWebsite !== 'function') throw new TypeError('onWebsite must be a function.');
  if (typeof options.onClose !== 'function') throw new TypeError('onClose must be a function.');
  const websiteIcon = requireIcon(options.websiteIcon, 'websiteIcon');
  const closeIcon = requireIcon(options.closeIcon, 'closeIcon');
  const rootTestId = requireTestId(options.rootTestId, 'rootTestId');
  const websiteTestId = requireTestId(options.websiteTestId, 'websiteTestId');
  const closeTestId = requireTestId(options.closeTestId, 'closeTestId');

  const root = document.createElement('section');
  const website = document.createElement('button');
  const websiteIconElement = document.createElement('span');
  const websiteLabel = document.createElement('span');
  const close = document.createElement('button');
  const closeIconElement = document.createElement('span');

  root.setAttribute('data-turbowarp-app-shell-title-controls', 'true');
  root.setAttribute('aria-label', options.ariaLabel ?? 'Application title controls');
  root.style.cssText =
    'position:absolute;inset:0;z-index:2147483600;display:none;box-sizing:border-box;overflow:hidden;pointer-events:none;font-family:sans-serif;container-type:inline-size;';
  root.style.position = 'absolute';
  root.style.display = 'none';
  applyTestId(root, rootTestId);

  website.type = 'button';
  website.setAttribute('data-turbowarp-app-shell-title-action', 'website');
  website.style.cssText =
    'position:absolute;left:33.3333%;top:25.5556%;width:33.3333%;height:17.7778%;display:flex;align-items:center;justify-content:center;gap:5%;box-sizing:border-box;border:.4167cqw solid #005f50;border-radius:2.5cqw;background:#007d66;color:#fff;box-shadow:0 .625cqw 1.6667cqw rgba(0,0,0,.2);cursor:pointer;pointer-events:auto;font:inherit;';
  website.style.cursor = 'pointer';
  applyTestId(website, websiteTestId);
  websiteIconElement.setAttribute('aria-hidden', 'true');
  websiteIconElement.style.cssText =
    'display:inline-flex;width:10cqw;height:10cqw;align-items:center;justify-content:center;line-height:1;font-size:5.5cqw;';
  websiteLabel.style.cssText = 'font-size:2.5cqw;line-height:1.15;text-align:center;';
  website.appendChild(websiteIconElement);
  website.appendChild(websiteLabel);

  close.type = 'button';
  close.setAttribute('data-turbowarp-app-shell-title-action', 'close');
  close.style.cssText =
    'position:absolute;left:92.5%;top:1.1111%;width:6.6667%;height:8.8889%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:.2083cqw solid #005f50;border-radius:50%;background:#007d66;color:#fff;box-shadow:0 .4167cqw 1.25cqw rgba(0,0,0,.2);cursor:pointer;pointer-events:auto;padding:0;';
  close.style.cursor = 'pointer';
  applyTestId(close, closeTestId);
  closeIconElement.setAttribute('data-turbowarp-app-shell-close-icon', 'true');
  closeIconElement.setAttribute('aria-hidden', 'true');
  if (closeIcon === undefined) {
    appendDefaultCloseIcon(document, closeIconElement);
  }
  close.appendChild(closeIconElement);

  root.appendChild(website);
  root.appendChild(close);
  const restoreMountPosition = restoreableMountPosition(document, mount);
  mount.appendChild(root);

  let disposed = false;
  let websiteEnabled = optionalBoolean(options.websiteEnabled, 'websiteEnabled', true);
  let websiteVisible = optionalBoolean(options.websiteVisible, 'websiteVisible', true);
  let closeEnabled = optionalBoolean(options.closeEnabled, 'closeEnabled', true);
  let closeVisible = optionalBoolean(options.closeVisible, 'closeVisible', true);

  const onWebsiteClick = (event: Event) => {
    if (websiteEnabled && websiteVisible) invokeAction(options.onWebsite, options.onError, event);
  };
  const onCloseClick = (event: Event) => {
    if (closeEnabled && closeVisible) invokeAction(options.onClose, options.onError, event);
  };
  website.addEventListener('click', onWebsiteClick);
  close.addEventListener('click', onCloseClick);

  function render() {
    const labels = localized(locales, locale, fallbackLocale, 'title control locales');
    websiteLabel.textContent = labels.website;
    website.setAttribute('aria-label', labels.website);
    close.setAttribute('aria-label', labels.close);
    close.setAttribute('title', labels.close);
    renderIcon(websiteIconElement, websiteIcon);
    if (closeIcon !== undefined) renderIcon(closeIconElement, closeIcon);
    setButtonEnabled(website, websiteEnabled);
    setButtonEnabled(close, closeEnabled);
    setElementVisible(website, websiteVisible, 'flex');
    setElementVisible(close, closeVisible, 'flex');
  }

  function ensureActive() {
    if (disposed) throw new TypeError('title controls are disposed.');
  }

  render();
  return Object.freeze({
    show(nextLocale?: string) {
      ensureActive();
      locale = resolveInjectedLocale(locales, nextLocale ?? locale, fallbackLocale, 'title control locales');
      render();
      root.style.display = 'block';
      return locale;
    },
    hide() {
      if (!disposed) root.style.display = 'none';
    },
    setLocale(nextLocale: string) {
      ensureActive();
      locale = resolveInjectedLocale(locales, nextLocale, fallbackLocale, 'title control locales');
      render();
      return locale;
    },
    setActionState(action: 'website' | 'close', state: AppShellActionState) {
      ensureActive();
      if (!isRecord(state)) throw new TypeError('title action state must be an object.');
      if (state.enabled !== undefined) {
        if (typeof state.enabled !== 'boolean') throw new TypeError('title action enabled must be a boolean.');
        if (action === 'website') websiteEnabled = state.enabled;
        else closeEnabled = state.enabled;
      }
      if (state.visible !== undefined) {
        if (typeof state.visible !== 'boolean') throw new TypeError('title action visible must be a boolean.');
        if (action === 'website') websiteVisible = state.visible;
        else closeVisible = state.visible;
      }
      render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      website.removeEventListener('click', onWebsiteClick);
      close.removeEventListener('click', onCloseClick);
      root.remove();
      restoreMountPosition?.();
    },
    get element() {
      return root;
    }
  });
}

export function createAppShellApplicationMenu(options: AppShellApplicationMenuOptions) {
  if (!isRecord(options)) throw new TypeError('application menu options must be an object.');
  const document = requireDocument(options.document);
  const mount = requireElement(options.mount, 'mount');
  if (!Array.isArray(options.actions) || options.actions.length === 0) {
    throw new TypeError('actions must include at least one menu action.');
  }
  const fallbackLocale = optionalString(options.fallbackLocale, 'fallbackLocale');
  const rootTestId = requireTestId(options.rootTestId, 'rootTestId');
  const statusTestId = requireTestId(options.statusTestId, 'statusTestId');
  const root = document.createElement('section');
  const status = document.createElement('p');
  const restoreMountPosition = restoreableMountPosition(document, mount);

  root.setAttribute('data-turbowarp-app-shell-application-menu', 'true');
  root.setAttribute('aria-label', options.ariaLabel ?? 'Application menu');
  root.style.cssText =
    'position:absolute;inset:0;z-index:2147483600;display:none;box-sizing:border-box;overflow:hidden;pointer-events:auto;font-family:sans-serif;container-type:inline-size;';
  root.style.position = 'absolute';
  root.style.display = 'none';
  root.style.cursor = 'pointer';
  applyTestId(root, rootTestId);

  status.setAttribute('data-turbowarp-app-shell-menu-status', 'true');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.style.cssText =
    'position:absolute;left:10%;top:93%;width:80%;margin:0;color:#35524c;font-size:2.7cqw;line-height:1.1;text-align:center;';
  applyTestId(status, statusTestId);

  type MenuButtonRecord = {
    button: HTMLButtonElement;
    icon: HTMLElement;
    label: HTMLElement;
    labels: Readonly<Record<string, string>>;
    iconDefinition: AppShellIcon | undefined;
    enabled: boolean;
    visible: boolean;
    onSelect: () => unknown | Promise<unknown>;
    onClick: (event: Event) => void;
  };
  const buttons = new Map<string, MenuButtonRecord>();
  const seen = new Set<string>();
  let locale = optionalString(options.initialLocale, 'initialLocale') ?? resolveAppShellLocale();

  for (const [index, definition] of options.actions.entries()) {
    if (!isRecord(definition)) throw new TypeError(`actions.${index} must be an object.`);
    const id = requireString(definition.id, `actions.${index}.id`);
    if (seen.has(id)) throw new TypeError(`Duplicate application menu action id: ${id}.`);
    seen.add(id);
    const labels = requireLocalizedLabels(definition.labels, `actions.${index}.labels`);
    const icon = requireIcon(definition.icon, `actions.${index}.icon`);
    const enabled = optionalBoolean(definition.enabled, `actions.${index}.enabled`, true);
    const visible = optionalBoolean(definition.visible, `actions.${index}.visible`, true);
    const testId = requireTestId(definition.testId, `actions.${index}.testId`);
    if (typeof definition.onSelect !== 'function') {
      throw new TypeError(`actions.${index}.onSelect must be a function.`);
    }
    const onSelect = definition.onSelect as () => unknown | Promise<unknown>;
    const button = document.createElement('button');
    const iconElement = document.createElement('span');
    const label = document.createElement('span');
    const row = Math.floor(index / 2);
    const column = index % 2;
    button.type = 'button';
    button.setAttribute('data-turbowarp-app-shell-menu-action', id);
    button.style.cssText = `position:absolute;left:${column === 0 ? '10%' : '53.3333%'};top:${25.5556 + row * 30}%;width:36.6667%;height:24.4444%;display:flex;min-width:0;min-height:0;align-items:center;justify-content:center;flex-direction:column;gap:.4167cqw;border:.4167cqw solid #005f50;border-radius:2.9167cqw;background:#007d66;color:#fff;box-shadow:0 .625cqw 1.6667cqw rgba(0,0,0,.2);cursor:pointer;font:inherit;`;
    button.style.cursor = 'pointer';
    applyTestId(button, testId);
    iconElement.setAttribute('aria-hidden', 'true');
    iconElement.style.cssText =
      'display:inline-flex;width:10cqw;height:10cqw;align-items:center;justify-content:center;line-height:1;font-size:6cqw;';
    label.style.cssText = 'font-size:3.8cqw;line-height:1.15;text-align:center;';
    button.appendChild(iconElement);
    button.appendChild(label);

    const onClick = (event: Event) => {
      const current = buttons.get(id);
      if (current === undefined || !current.enabled || !current.visible) return;
      invokeAction(current.onSelect, options.onError, event);
    };
    button.addEventListener('click', onClick);
    buttons.set(id, {
      button,
      icon: iconElement,
      label,
      labels,
      iconDefinition: icon,
      enabled,
      visible,
      onSelect,
      onClick
    });
    root.appendChild(button);
  }
  root.appendChild(status);
  mount.appendChild(root);

  type MenuStatusState = {
    text: string;
    visible: boolean;
    tone: 'neutral' | 'info' | 'warning' | 'error';
  };
  let statusState: MenuStatusState = {
    text: options.status?.text ?? '',
    visible: options.status?.visible ?? false,
    tone: options.status?.tone ?? 'neutral'
  };
  if (typeof statusState.text !== 'string') throw new TypeError('status.text must be a string.');
  if (typeof statusState.visible !== 'boolean') throw new TypeError('status.visible must be a boolean.');
  if (!['neutral', 'info', 'warning', 'error'].includes(statusState.tone)) {
    throw new TypeError('status.tone must be neutral, info, warning, or error.');
  }
  let disposed = false;

  function renderMenu() {
    for (const [id, value] of buttons) {
      const label = localized(value.labels, locale, fallbackLocale, `menu action ${id} labels`);
      value.label.textContent = label;
      value.button.setAttribute('aria-label', label);
      renderIcon(value.icon, value.iconDefinition);
      setButtonEnabled(value.button, value.enabled);
      setElementVisible(value.button, value.visible, 'flex');
      value.button.style.boxShadow = value.enabled ? '0 .625cqw 1.6667cqw rgba(0,0,0,.2)' : 'none';
    }
    status.textContent = boundedText(statusState.text, 500);
    status.style.color = loadingTone(statusState.tone);
    setElementVisible(status, statusState.visible && statusState.text.length > 0, 'block');
  }

  function ensureActive() {
    if (disposed) throw new TypeError('application menu is disposed.');
  }

  renderMenu();
  return Object.freeze({
    show(nextLocale?: string) {
      ensureActive();
      locale = optionalString(nextLocale, 'nextLocale') ?? locale;
      renderMenu();
      root.style.display = 'block';
      return locale;
    },
    hide() {
      if (!disposed) root.style.display = 'none';
    },
    setLocale(nextLocale: string) {
      ensureActive();
      locale = requireString(nextLocale, 'nextLocale');
      renderMenu();
      return locale;
    },
    setActionState(id: string, state: AppShellApplicationMenuActionState) {
      ensureActive();
      const action = buttons.get(requireString(id, 'action id'));
      if (action === undefined) throw new TypeError(`Unknown application menu action: ${id}.`);
      if (!isRecord(state)) throw new TypeError('application menu action state must be an object.');
      if (state.enabled !== undefined) {
        if (typeof state.enabled !== 'boolean') throw new TypeError('action enabled must be a boolean.');
        action.enabled = state.enabled;
      }
      if (state.visible !== undefined) {
        if (typeof state.visible !== 'boolean') throw new TypeError('action visible must be a boolean.');
        action.visible = state.visible;
      }
      if (state.labels !== undefined) {
        action.labels = requireLocalizedLabels(state.labels, 'action state labels');
      }
      if (state.icon !== undefined) {
        action.iconDefinition = requireIcon(state.icon, 'action state icon');
      }
      renderMenu();
    },
    setStatus(nextStatus: AppShellApplicationMenuStatus) {
      ensureActive();
      if (!isRecord(nextStatus)) throw new TypeError('application menu status must be an object.');
      const nextToneValue = nextStatus['tone'] ?? statusState.tone;
      if (!['neutral', 'info', 'warning', 'error'].includes(String(nextToneValue))) {
        throw new TypeError('status.tone must be neutral, info, warning, or error.');
      }
      const nextTone = nextToneValue as MenuStatusState['tone'];
      statusState = {
        text: optionalString(nextStatus['text'], 'status.text') ?? statusState.text,
        visible: optionalBoolean(nextStatus['visible'], 'status.visible', statusState.visible),
        tone: nextTone
      };
      renderMenu();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const {button, onClick} of buttons.values()) {
        button.removeEventListener('click', onClick);
      }
      buttons.clear();
      root.remove();
      restoreMountPosition?.();
    },
    get element() {
      return root;
    }
  });
}

export function createAppShellLoadingPresenter(options: AppShellLoadingPresenterOptions) {
  if (!isRecord(options)) throw new TypeError('loading presenter options must be an object.');
  const document = requireDocument(options.document);
  const mount = requireElement(options.mount, 'mount');
  const frameMilliseconds = options.frameMilliseconds ?? 250;
  if (!Number.isFinite(frameMilliseconds) || frameMilliseconds <= 0) {
    throw new TypeError('frameMilliseconds must be positive.');
  }
  const rootTestId = requireTestId(options.rootTestId, 'rootTestId');
  const root = document.createElement('section');
  const backdrop = document.createElement('img');
  const frame = document.createElement('img');
  const label = document.createElement('p');
  const progress = document.createElement('progress') as HTMLProgressElement;
  const restoreMountPosition = restoreableMountPosition(document, mount);

  root.setAttribute('data-turbowarp-app-shell-loading', 'true');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-label', options.ariaLabel ?? 'Loading');
  root.style.cssText =
    'position:absolute;inset:0;z-index:2147483645;display:none;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box;pointer-events:none;background:#000;color:#fff;font-family:sans-serif;';
  root.style.position = 'absolute';
  root.style.display = 'none';
  applyTestId(root, rootTestId);
  backdrop.setAttribute('data-turbowarp-app-shell-loading-backdrop', 'true');
  backdrop.alt = '';
  backdrop.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
  frame.setAttribute('data-turbowarp-app-shell-loading-frame', 'true');
  frame.alt = '';
  frame.style.cssText =
    'position:absolute;left:50%;top:50%;max-width:100%;max-height:100%;transform:translate(-50%,-50%);object-fit:contain;';
  label.setAttribute('data-turbowarp-app-shell-loading-label', 'true');
  label.style.cssText =
    'position:absolute;left:8%;right:8%;bottom:11%;margin:0;text-align:center;font-size:clamp(14px,3cqw,24px);line-height:1.35;text-shadow:0 2px 8px rgba(0,0,0,.7);overflow-wrap:anywhere;';
  progress.setAttribute('data-turbowarp-app-shell-loading-progress', 'true');
  progress.max = 1;
  progress.style.cssText =
    'position:absolute;left:16%;right:16%;bottom:6%;width:68%;height:12px;display:none;';
  root.appendChild(backdrop);
  root.appendChild(frame);
  root.appendChild(label);
  root.appendChild(progress);
  mount.appendChild(root);

  let disposed = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let frameUrls: string[] = [];
  let frameIndex = 0;

  function stopAnimation() {
    if (timer !== null) globalThis.clearInterval(timer);
    timer = null;
  }

  function renderFrame() {
    frame.src = frameUrls[frameIndex] ?? '';
    frame.style.display = frame.src.length > 0 ? 'block' : 'none';
  }

  function setLoading(state: AppShellLoadingState) {
    if (disposed) return;
    if (!isRecord(state)) throw new TypeError('loading state must be an object.');
    if (typeof state.visible !== 'boolean') throw new TypeError('loading state visible must be a boolean.');
    stopAnimation();
    const backdropUrl = state.backdropUrl ?? '';
    if (typeof backdropUrl !== 'string') throw new TypeError('loading backdropUrl must be a string.');
    const nextFrames = state.frameUrls ?? [];
    if (!Array.isArray(nextFrames)) throw new TypeError('loading frameUrls must be an array.');
    frameUrls = nextFrames.filter((value): value is string => typeof value === 'string' && value.length > 0);
    frameIndex = 0;
    backdrop.src = backdropUrl;
    backdrop.style.display = backdropUrl.length > 0 ? 'block' : 'none';
    renderFrame();
    label.textContent = boundedText(state.label ?? '', 500);
    label.style.display = label.textContent.length > 0 ? 'block' : 'none';
    if (state.progress === undefined) {
      progress.style.display = 'none';
      progress.removeAttribute('value');
    } else {
      progress.style.display = 'block';
      if (state.progress === null) {
        progress.removeAttribute('value');
      } else {
        if (!Number.isFinite(state.progress)) throw new TypeError('loading progress must be finite.');
        progress.value = Math.max(0, Math.min(1, state.progress));
      }
    }
    root.style.display = state.visible ? 'flex' : 'none';
    if (state.visible && frameUrls.length > 1) {
      timer = globalThis.setInterval(() => {
        frameIndex = (frameIndex + 1) % frameUrls.length;
        renderFrame();
      }, frameMilliseconds);
    }
  }

  if (options.initialState !== undefined) setLoading(options.initialState);

  return Object.freeze({
    show(state?: Omit<AppShellLoadingState, 'visible'>) {
      setLoading({visible: true, ...(state ?? {})});
    },
    setLoading,
    hide() {
      setLoading({visible: false});
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopAnimation();
      root.remove();
      restoreMountPosition?.();
    },
    get element() {
      return root;
    }
  });
}

export function createAppShellSourceChooser(options: AppShellSourceChooserOptions) {
  if (!isRecord(options)) throw new TypeError('source chooser options must be an object.');
  const document = requireDocument(options.document);
  const mount = requireElement(options.mount, 'mount');
  if (!Array.isArray(options.choices) || options.choices.length === 0) {
    throw new TypeError('choices must include at least one source choice.');
  }
  const fallbackLocale = optionalString(options.fallbackLocale, 'fallbackLocale');
  const rootTestId = requireTestId(options.rootTestId, 'rootTestId');
  const panelTestId = requireTestId(options.panelTestId, 'panelTestId');
  const root = document.createElement('section');
  const panel = document.createElement('div');
  const intro = document.createElement('p');
  const restoreMountPosition = restoreableMountPosition(document, mount);

  root.setAttribute('data-turbowarp-app-shell-source-chooser', 'true');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', options.ariaLabel ?? 'Choose source');
  root.style.cssText =
    'position:absolute;inset:0;z-index:2147483620;display:none;align-items:center;justify-content:center;padding:5cqw;box-sizing:border-box;background:rgba(0,20,18,.72);font-family:sans-serif;cursor:auto;pointer-events:auto;container-type:inline-size;';
  root.style.position = 'absolute';
  root.style.display = 'none';
  applyTestId(root, rootTestId);
  panel.style.cssText =
    'display:grid;width:min(75cqw,560px);gap:2.4cqw;padding:4cqw;box-sizing:border-box;border:.4cqw solid #005f50;border-radius:2.5cqw;background:#f4fffc;box-shadow:0 1.2cqw 3cqw rgba(0,0,0,.35);';
  applyTestId(panel, panelTestId);
  intro.setAttribute('data-turbowarp-app-shell-source-intro', 'true');
  intro.style.cssText = 'margin:0;color:#263330;font-size:3cqw;line-height:1.25;text-align:center;';
  panel.appendChild(intro);

  type ChoiceRecord = {
    button: HTMLButtonElement;
    icon: HTMLElement;
    label: HTMLElement;
    description: HTMLElement;
    labels: Readonly<Record<string, string>>;
    descriptionLabels: Readonly<Record<string, string>> | undefined;
    iconDefinition: AppShellIcon | undefined;
    enabled: boolean;
    visible: boolean;
    onSelect: () => unknown | Promise<unknown>;
    onClick: (event: Event) => void;
  };
  const choices = new Map<string, ChoiceRecord>();
  const seen = new Set<string>();
  let locale = optionalString(options.initialLocale, 'initialLocale') ?? resolveAppShellLocale();

  for (const [index, definition] of options.choices.entries()) {
    if (!isRecord(definition)) throw new TypeError(`choices.${index} must be an object.`);
    const id = requireString(definition.id, `choices.${index}.id`);
    if (seen.has(id)) throw new TypeError(`Duplicate source choice id: ${id}.`);
    seen.add(id);
    const labels = requireLocalizedLabels(definition.labels, `choices.${index}.labels`);
    const descriptionLabels =
      definition.descriptionLabels === undefined
        ? undefined
        : requireLocalizedLabels(definition.descriptionLabels, `choices.${index}.descriptionLabels`);
    const icon = requireIcon(definition.icon, `choices.${index}.icon`);
    const enabled = optionalBoolean(definition.enabled, `choices.${index}.enabled`, true);
    const visible = optionalBoolean(definition.visible, `choices.${index}.visible`, true);
    const primary = optionalBoolean(definition.primary, `choices.${index}.primary`, false);
    const testId = requireTestId(definition.testId, `choices.${index}.testId`);
    if (typeof definition.onSelect !== 'function') {
      throw new TypeError(`choices.${index}.onSelect must be a function.`);
    }
    const onSelect = definition.onSelect as () => unknown | Promise<unknown>;
    const button = document.createElement('button');
    const iconElement = document.createElement('span');
    const label = document.createElement('span');
    const description = document.createElement('span');
    button.type = 'button';
    button.setAttribute('data-turbowarp-app-shell-source-choice', id);
    button.style.cssText = primary
      ? 'min-height:9cqw;padding:1.6cqw 2cqw;border:.3cqw solid #005f50;border-radius:1.5cqw;background:#007d66;color:#fff;font:inherit;font-size:3.4cqw;font-weight:700;cursor:pointer;display:grid;grid-template-columns:auto 1fr;gap:.8cqw;align-items:center;text-align:left;'
      : 'min-height:7cqw;padding:1.3cqw 2cqw;border:.3cqw solid #52605d;border-radius:1.3cqw;background:#fff;color:#263330;font:inherit;font-size:3cqw;cursor:pointer;display:grid;grid-template-columns:auto 1fr;gap:.8cqw;align-items:center;text-align:left;';
    button.style.cursor = 'pointer';
    applyTestId(button, testId);
    iconElement.setAttribute('aria-hidden', 'true');
    iconElement.style.cssText =
      'display:inline-flex;width:6cqw;height:6cqw;align-items:center;justify-content:center;line-height:1;font-size:4.8cqw;grid-row:1 / span 2;';
    label.style.cssText = 'display:block;line-height:1.15;';
    description.style.cssText = 'display:block;line-height:1.2;font-size:80%;opacity:.78;font-weight:400;';
    button.appendChild(iconElement);
    button.appendChild(label);
    button.appendChild(description);

    const onClick = (event: Event) => {
      const current = choices.get(id);
      if (current === undefined || !current.enabled || !current.visible) return;
      invokeAction(current.onSelect, options.onError, event);
    };
    button.addEventListener('click', onClick);
    choices.set(id, {
      button,
      icon: iconElement,
      label,
      description,
      labels,
      descriptionLabels,
      iconDefinition: icon,
      enabled,
      visible,
      onSelect,
      onClick
    });
    panel.appendChild(button);
  }
  root.appendChild(panel);
  mount.appendChild(root);

  const introLabels =
    options.introLabels === undefined ? undefined : requireLocalizedLabels(options.introLabels, 'introLabels');
  let disposed = false;

  function renderChooser() {
    if (introLabels === undefined) {
      intro.textContent = '';
      intro.style.display = 'none';
    } else {
      intro.textContent = localized(introLabels, locale, fallbackLocale, 'introLabels');
      intro.style.display = 'block';
    }
    for (const [id, value] of choices) {
      const label = localized(value.labels, locale, fallbackLocale, `source choice ${id} labels`);
      value.label.textContent = label;
      value.button.setAttribute('aria-label', label);
      if (value.descriptionLabels === undefined) {
        value.description.textContent = '';
        value.description.style.display = 'none';
      } else {
        value.description.textContent = localized(
          value.descriptionLabels,
          locale,
          fallbackLocale,
          `source choice ${id} descriptions`
        );
        value.description.style.display = 'block';
      }
      renderIcon(value.icon, value.iconDefinition);
      setButtonEnabled(value.button, value.enabled);
      setElementVisible(value.button, value.visible, 'grid');
    }
  }

  function ensureActive() {
    if (disposed) throw new TypeError('source chooser is disposed.');
  }

  renderChooser();
  return Object.freeze({
    show(nextLocale?: string, choiceStates?: Readonly<Record<string, AppShellActionState>>) {
      ensureActive();
      locale = optionalString(nextLocale, 'nextLocale') ?? locale;
      if (choiceStates !== undefined) {
        if (!isRecord(choiceStates)) throw new TypeError('source choice states must be an object.');
        for (const [id, state] of Object.entries(choiceStates)) {
          const choice = choices.get(id);
          if (choice === undefined) throw new TypeError(`Unknown source choice: ${id}.`);
          if (!isRecord(state)) throw new TypeError(`source choice state for ${id} must be an object.`);
          if (state.enabled !== undefined) {
            if (typeof state.enabled !== 'boolean') throw new TypeError('source choice enabled must be a boolean.');
            choice.enabled = state.enabled;
          }
          if (state.visible !== undefined) {
            if (typeof state.visible !== 'boolean') throw new TypeError('source choice visible must be a boolean.');
            choice.visible = state.visible;
          }
        }
      }
      renderChooser();
      root.style.display = 'flex';
      return locale;
    },
    hide() {
      if (!disposed) root.style.display = 'none';
    },
    setLocale(nextLocale: string) {
      ensureActive();
      locale = requireString(nextLocale, 'nextLocale');
      renderChooser();
      return locale;
    },
    setChoiceState(id: string, state: AppShellSourceChoiceState) {
      ensureActive();
      const choice = choices.get(requireString(id, 'choice id'));
      if (choice === undefined) throw new TypeError(`Unknown source choice: ${id}.`);
      if (!isRecord(state)) throw new TypeError('source choice state must be an object.');
      if (state.enabled !== undefined) {
        if (typeof state.enabled !== 'boolean') throw new TypeError('source choice enabled must be a boolean.');
        choice.enabled = state.enabled;
      }
      if (state.visible !== undefined) {
        if (typeof state.visible !== 'boolean') throw new TypeError('source choice visible must be a boolean.');
        choice.visible = state.visible;
      }
      if (state.labels !== undefined) {
        choice.labels = requireLocalizedLabels(state.labels, 'source choice labels');
      }
      if (state.descriptionLabels !== undefined) {
        choice.descriptionLabels = requireLocalizedLabels(state.descriptionLabels, 'source choice descriptions');
      }
      if (state.icon !== undefined) {
        choice.iconDefinition = requireIcon(state.icon, 'source choice icon');
      }
      renderChooser();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const {button, onClick} of choices.values()) {
        button.removeEventListener('click', onClick);
      }
      choices.clear();
      root.remove();
      restoreMountPosition?.();
    },
    get element() {
      return root;
    }
  });
}

function palette(tone: 'error' | 'warning' | 'info') {
  if (tone === 'warning') {
    return {background: 'rgba(48,32,0,.72)', panel: '#fff7df', border: '#a86b00', text: '#4a2d00'};
  }
  if (tone === 'info') {
    return {background: 'rgba(0,24,40,.64)', panel: '#eef8ff', border: '#176e9f', text: '#08364f'};
  }
  return {background: 'rgba(20,0,0,.72)', panel: '#fff4f4', border: '#b00020', text: '#5c0011'};
}

export function createRuntimeMessageIndicator(options: RuntimeMessageIndicatorOptions) {
  if (!isRecord(options)) throw new TypeError('Runtime message indicator options must be an object.');
  const document = requireDocument(options.document);
  const mount = requireElement(options.mount, 'mount');
  const locales = requireLocales(options.locales);
  const locale = options.initialLocale ?? resolveAppShellLocale();
  const colors = palette(options.tone ?? 'error');

  const root = document.createElement('section');
  const panel = document.createElement('div');
  const heading = document.createElement('h1');
  const message = document.createElement('p');
  const details = document.createElement('pre');
  const actionButton = document.createElement('button');

  root.style.cssText = `position:absolute;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:${colors.background};font-family:sans-serif;cursor:auto;`;
  panel.style.cssText = `width:min(680px,94%);max-height:86%;display:flex;flex-direction:column;overflow:hidden;padding:24px;box-sizing:border-box;background:${colors.panel};border:2px solid ${colors.border};border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.4);color:${colors.text};`;
  heading.style.cssText = 'margin:0 0 14px;font-size:24px;line-height:1.3;';
  message.style.cssText = 'margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:16px;line-height:1.5;';
  details.style.cssText = 'display:none;margin:14px 0 0;padding:10px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;background:#fff;border:1px solid currentColor;border-radius:5px;font:13px/1.5 monospace;';
  actionButton.style.cssText = `display:none;align-self:flex-end;margin-top:18px;min-height:40px;padding:8px 16px;border:0;border-radius:6px;background:${colors.border};color:#fff;font:700 15px/1.4 sans-serif;cursor:pointer;`;

  root.setAttribute('data-turbowarp-app-shell-message', 'true');
  root.setAttribute('role', 'alertdialog');
  root.setAttribute('aria-live', options.tone === 'info' ? 'polite' : 'assertive');
  heading.textContent = locales[locale].title;
  actionButton.type = 'button';
  actionButton.textContent = locales[locale].actionLabel ?? '';

  if (options.action !== undefined) {
    if (typeof options.action.onClick !== 'function') {
      throw new TypeError('action.onClick must be a function.');
    }
    actionButton.style.display = 'block';
    actionButton.addEventListener('click', () => {
      void options.action?.onClick();
    });
  }

  panel.appendChild(heading);
  panel.appendChild(message);
  panel.appendChild(details);
  panel.appendChild(actionButton);
  root.appendChild(panel);

  let restoreMountPosition: (() => void) | null = null;
  if (mount !== document.body && mount.style.position === '') {
    mount.style.position = 'relative';
    restoreMountPosition = () => {
      mount.style.position = '';
    };
  }
  mount.appendChild(root);
  let disposed = false;

  return Object.freeze({
    show(input: RuntimeMessage) {
      if (disposed) return;
      message.textContent = boundedText(input.message);
      if (input.details === undefined || Object.keys(input.details).length === 0) {
        details.style.display = 'none';
        details.textContent = '';
      } else {
        details.style.display = 'block';
        details.textContent = boundedText(JSON.stringify(input.details, null, 2));
      }
      root.style.display = 'flex';
    },
    hide() {
      if (disposed) return;
      root.style.display = 'none';
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.remove();
      restoreMountPosition?.();
    },
    get element() {
      return root;
    }
  });
}
