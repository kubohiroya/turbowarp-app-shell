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
