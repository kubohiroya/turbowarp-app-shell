import {describe, expect, it, vi} from 'vitest';
import {createRuntimeMessageIndicator, resolveAppShellLocale} from '../src/index.js';

function fakeDocument() {
  const body = fakeElement('body');
  return {
    body,
    createElement(tagName: string) {
      return fakeElement(tagName);
    }
  } as unknown as Document;
}

function fakeElement(tagName: string) {
  const children: unknown[] = [];
  const listeners = new Map<string, Function[]>();
  return {
    tagName,
    children,
    style: {} as Record<string, string>,
    attributes: new Map<string, string>(),
    textContent: '',
    type: '',
    appendChild(child: unknown) {
      children.push(child);
      return child;
    },
    remove() {
      this.removed = true;
    },
    removed: false,
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
    addEventListener(name: string, listener: Function) {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    },
    click() {
      for (const listener of listeners.get('click') ?? []) listener();
    }
  };
}

describe('resolveAppShellLocale', () => {
  it('maps Japanese browser language to ja and defaults to en', () => {
    expect(resolveAppShellLocale({language: 'ja-JP'})).toBe('ja');
    expect(resolveAppShellLocale({language: 'en-US'})).toBe('en');
  });
});

describe('createRuntimeMessageIndicator', () => {
  it('mounts, shows, hides, and disposes an indicator', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const indicator = createRuntimeMessageIndicator({
      document,
      mount,
      initialLocale: 'en',
      locales: {
        en: {title: 'Runtime error'},
        ja: {title: '実行エラー'}
      }
    });

    indicator.show({message: 'failed', details: {code: 'E'}});
    expect(indicator.element.style.display).toBe('flex');

    indicator.hide();
    expect(indicator.element.style.display).toBe('none');

    indicator.dispose();
    expect((indicator.element as unknown as {removed: boolean}).removed).toBe(true);
  });

  it('wires an injected action callback', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const onClick = vi.fn();
    const indicator = createRuntimeMessageIndicator({
      document,
      mount,
      initialLocale: 'en',
      locales: {
        en: {title: 'Runtime warning', actionLabel: 'Open'},
        ja: {title: '警告', actionLabel: '開く'}
      },
      action: {onClick}
    });
    const panel = (indicator.element as unknown as {children: unknown[]}).children[0] as {
      children: unknown[];
    };
    const button = panel.children[3] as {click(): void};
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
