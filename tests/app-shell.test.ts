import {describe, expect, it, vi} from 'vitest';
import {
  createAppShellApplicationMenu,
  createAppShellLoadingPresenter,
  createAppShellSourceChooser,
  createAppShellTitleControls,
  createRuntimeMessageIndicator,
  resolveAppShellLocale
} from '../src/index.js';

interface FakeElement {
  tagName: string;
  children: FakeElement[];
  parentNode: FakeElement | null;
  style: Record<string, string>;
  attributes: Map<string, string>;
  dataset: Record<string, string>;
  textContent: string;
  type: string;
  hidden: boolean;
  disabled: boolean;
  src: string;
  alt: string;
  value: number;
  max: number;
  removed: boolean;
  appendChild(child: FakeElement): FakeElement;
  remove(): void;
  setAttribute(name: string, value: string): void;
  getAttribute(name: string): string | null;
  removeAttribute(name: string): void;
  addEventListener(name: string, listener: Function): void;
  removeEventListener(name: string, listener: Function): void;
  click(): void;
}

function fakeDocument() {
  const body = fakeElement('body');
  return {
    body,
    createElement(tagName: string) {
      return fakeElement(tagName);
    }
  } as unknown as Document;
}

function fakeElement(tagName: string): FakeElement {
  const children: FakeElement[] = [];
  const listeners = new Map<string, Function[]>();
  return {
    tagName,
    children,
    parentNode: null as FakeElement | null,
    style: {} as Record<string, string>,
    attributes: new Map<string, string>(),
    dataset: {} as Record<string, string>,
    textContent: '',
    type: '',
    hidden: false,
    disabled: false,
    src: '',
    alt: '',
    value: 0,
    max: 0,
    appendChild(child: FakeElement) {
      children.push(child);
      child.parentNode = this;
      return child;
    },
    remove() {
      if (this.parentNode !== null) {
        const index = this.parentNode.children.indexOf(this);
        if (index >= 0) this.parentNode.children.splice(index, 1);
        this.parentNode = null;
      }
      this.removed = true;
    },
    removed: false,
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
    getAttribute(name: string) {
      return this.attributes.get(name) ?? null;
    },
    removeAttribute(name: string) {
      this.attributes.delete(name);
    },
    addEventListener(name: string, listener: Function) {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    },
    removeEventListener(name: string, listener: Function) {
      listeners.set(
        name,
        (listeners.get(name) ?? []).filter((candidate) => candidate !== listener)
      );
    },
    click() {
      for (const listener of listeners.get('click') ?? []) {
        listener({preventDefault() {}, stopPropagation() {}});
      }
    }
  };
}

function findByAttribute(element: FakeElement, name: string, value: string): FakeElement[] {
  const found = element.getAttribute(name) === value ? [element] : [];
  for (const child of element.children) {
    found.push(...findByAttribute(child, name, value));
  }
  return found;
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

describe('createAppShellTitleControls', () => {
  it('renders injected labels, icons, actions, state, and test hooks', async () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const onWebsite = vi.fn();
    const onClose = vi.fn();
    const controls = createAppShellTitleControls({
      document,
      mount,
      initialLocale: 'en',
      locales: {
        en: {website: 'Website', close: 'Close'},
        ja: {website: 'Web', close: '閉じる'}
      },
      websiteIcon: {text: 'W'},
      rootTestId: 'title-root',
      websiteTestId: 'title-website',
      closeTestId: 'title-close',
      onWebsite,
      onClose
    });

    expect(controls.show('ja')).toBe('ja');
    expect(controls.element.style.display).toBe('block');
    expect(controls.element.getAttribute('data-testid')).toBe('title-root');

    const root = controls.element as unknown as FakeElement;
    const website = findByAttribute(root, 'data-turbowarp-app-shell-title-action', 'website')[0]!;
    const close = findByAttribute(root, 'data-turbowarp-app-shell-title-action', 'close')[0]!;
    const closeLines = findByAttribute(root, 'data-turbowarp-app-shell-close-icon-line', 'true');
    expect(website.getAttribute('aria-label')).toBe('Web');
    expect(website.getAttribute('data-testid')).toBe('title-website');
    expect(website.children[0]!.textContent).toBe('W');
    expect(close.getAttribute('aria-label')).toBe('閉じる');
    expect(close.getAttribute('data-testid')).toBe('title-close');
    expect(closeLines).toHaveLength(2);

    website.click();
    close.click();
    await Promise.resolve();
    expect(onWebsite).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    controls.setActionState('website', {enabled: false});
    website.click();
    expect(website.disabled).toBe(true);
    expect(onWebsite).toHaveBeenCalledTimes(1);

    controls.setActionState('close', {visible: false});
    expect(close.hidden).toBe(true);
    expect(close.style.display).toBe('none');

    controls.dispose();
    expect(root.parentNode).toBe(null);
  });
});

describe('createAppShellApplicationMenu', () => {
  it('renders app-defined actions with controlled availability and status', async () => {
    const document = fakeDocument();
    const calls: string[] = [];
    const menu = createAppShellApplicationMenu({
      document,
      mount: document.body,
      initialLocale: 'ja',
      status: {text: 'Waiting', visible: true, tone: 'info'},
      rootTestId: 'menu-root',
      statusTestId: 'menu-status',
      actions: [
        {
          id: 'open',
          labels: {en: 'Open', ja: '開く'},
          icon: {text: 'O'},
          onSelect: () => calls.push('open')
        },
        {
          id: 'reload',
          labels: {en: 'Reload', ja: '再実行'},
          enabled: false,
          onSelect: () => calls.push('reload')
        },
        {
          id: 'about',
          labels: {en: 'About', ja: '情報'},
          visible: false,
          onSelect: () => calls.push('about')
        }
      ]
    });

    menu.show('ja');
    const root = menu.element as unknown as FakeElement;
    const open = findByAttribute(root, 'data-turbowarp-app-shell-menu-action', 'open')[0]!;
    const reload = findByAttribute(root, 'data-turbowarp-app-shell-menu-action', 'reload')[0]!;
    const about = findByAttribute(root, 'data-turbowarp-app-shell-menu-action', 'about')[0]!;
    const status = findByAttribute(root, 'data-turbowarp-app-shell-menu-status', 'true')[0]!;

    expect(root.getAttribute('data-testid')).toBe('menu-root');
    expect(open.getAttribute('aria-label')).toBe('開く');
    expect(open.children[0]!.textContent).toBe('O');
    expect(reload.disabled).toBe(true);
    expect(about.hidden).toBe(true);
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('data-testid')).toBe('menu-status');
    expect(status.textContent).toBe('Waiting');

    open.click();
    reload.click();
    await Promise.resolve();
    expect(calls).toEqual(['open']);

    menu.setActionState('reload', {
      enabled: true,
      labels: {en: 'Run again', ja: 'もう一度実行'}
    });
    menu.setStatus({text: 'Ready', visible: true, tone: 'warning'});
    reload.click();
    await Promise.resolve();
    expect(reload.getAttribute('aria-label')).toBe('もう一度実行');
    expect(status.textContent).toBe('Ready');
    expect(calls).toEqual(['open', 'reload']);

    menu.dispose();
    expect(root.parentNode).toBe(null);
  });
});

describe('createAppShellLoadingPresenter', () => {
  it('shows app-provided loading artwork, label, and progress', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const presenter = createAppShellLoadingPresenter({
      document,
      mount,
      rootTestId: 'loading-root',
      frameMilliseconds: 100
    });

    presenter.show({
      label: 'Initializing runtime',
      progress: 0.5,
      backdropUrl: 'backdrop.png',
      frameUrls: ['frame-a.png']
    });

    const root = presenter.element as unknown as FakeElement;
    const backdrop = findByAttribute(root, 'data-turbowarp-app-shell-loading-backdrop', 'true')[0]!;
    const frame = findByAttribute(root, 'data-turbowarp-app-shell-loading-frame', 'true')[0]!;
    const label = findByAttribute(root, 'data-turbowarp-app-shell-loading-label', 'true')[0]!;
    const progress = findByAttribute(root, 'data-turbowarp-app-shell-loading-progress', 'true')[0]!;
    expect(root.style.display).toBe('flex');
    expect(root.getAttribute('data-testid')).toBe('loading-root');
    expect(backdrop.src).toBe('backdrop.png');
    expect(frame.src).toBe('frame-a.png');
    expect(label.textContent).toBe('Initializing runtime');
    expect(progress.value).toBe(0.5);

    presenter.hide();
    expect(root.style.display).toBe('none');
    presenter.dispose();
    expect(root.parentNode).toBe(null);
  });
});

describe('createAppShellSourceChooser', () => {
  it('keeps source choices app-defined with locale, state, and callbacks', async () => {
    const document = fakeDocument();
    const choices: string[] = [];
    const chooser = createAppShellSourceChooser({
      document,
      mount: document.body,
      initialLocale: 'ja',
      introLabels: {en: 'Choose a source', ja: 'ソースを選択'},
      rootTestId: 'chooser-root',
      panelTestId: 'chooser-panel',
      choices: [
        {
          id: 'file',
          labels: {en: 'Open file', ja: 'ファイルを開く'},
          descriptionLabels: {en: 'Use a single document.', ja: '単一ファイルを使います。'},
          icon: {text: 'F'},
          primary: true,
          testId: 'choice-file',
          onSelect: () => choices.push('file')
        },
        {
          id: 'project',
          labels: {en: 'Open project', ja: 'プロジェクトを開く'},
          enabled: false,
          onSelect: () => choices.push('project')
        },
        {
          id: 'cancel',
          labels: {en: 'Cancel', ja: 'キャンセル'},
          onSelect: () => choices.push('cancel')
        }
      ]
    });

    chooser.show('ja');
    const root = chooser.element as unknown as FakeElement;
    const intro = findByAttribute(root, 'data-turbowarp-app-shell-source-intro', 'true')[0]!;
    const file = findByAttribute(root, 'data-turbowarp-app-shell-source-choice', 'file')[0]!;
    const project = findByAttribute(root, 'data-turbowarp-app-shell-source-choice', 'project')[0]!;
    const cancel = findByAttribute(root, 'data-turbowarp-app-shell-source-choice', 'cancel')[0]!;
    expect(root.getAttribute('data-testid')).toBe('chooser-root');
    expect(intro.textContent).toBe('ソースを選択');
    expect(file.getAttribute('aria-label')).toBe('ファイルを開く');
    expect(file.getAttribute('data-testid')).toBe('choice-file');
    expect(file.children[0]!.textContent).toBe('F');
    expect(file.children[2]!.textContent).toBe('単一ファイルを使います。');
    expect(project.disabled).toBe(true);

    file.click();
    project.click();
    cancel.click();
    await Promise.resolve();
    expect(choices).toEqual(['file', 'cancel']);

    chooser.setChoiceState('project', {enabled: true, visible: false});
    chooser.setChoiceState('file', {labels: {en: 'File source', ja: 'ファイルソース'}});
    chooser.show('ja');
    expect(project.hidden).toBe(true);
    expect(file.getAttribute('aria-label')).toBe('ファイルソース');

    chooser.dispose();
    expect(root.parentNode).toBe(null);
  });
});

describe('app-owned presentation injection', () => {
  it('stamps app-owned attributes and scales the built-in close glyph', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const controls = createAppShellTitleControls({
      document,
      mount,
      locales: {en: {website: 'Website', close: 'Close'}},
      closeIconMetrics: {size: '4.1667cqw', thickness: '.625cqw', radius: '.3125cqw'},
      attributes: {
        root: {'data-app-title-controls': 'true'},
        website: {'data-app-title-action': 'website'},
        close: {'data-app-title-action': 'close'},
        closeIcon: {'data-app-close-icon': 'true'},
        closeIconLine: {'data-app-close-icon-line': 'true'}
      },
      onWebsite() {},
      onClose() {}
    });

    const root = controls.element as unknown as FakeElement;
    expect(root.getAttribute('data-app-title-controls')).toBe('true');
    expect(findByAttribute(root, 'data-app-title-action', 'website')).toHaveLength(1);
    const icon = findByAttribute(root, 'data-app-close-icon', 'true')[0]!;
    const lines = findByAttribute(root, 'data-app-close-icon-line', 'true');
    expect(icon.style['cssText']).toContain('width:4.1667cqw');
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.style['cssText']).toContain('width:4.1667cqw;height:.625cqw');
      expect(line.style['cssText']).toContain('border-radius:.3125cqw');
    }
  });

  it('keeps a text icon at its injected size and applies an icon filter', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const controls = createAppShellTitleControls({
      document,
      mount,
      locales: {en: {website: 'Website', close: 'Close'}},
      websiteIcon: {text: '🌐', size: 'auto', fontSize: '5.5cqw'},
      onWebsite() {},
      onClose() {}
    });
    const root = controls.element as unknown as FakeElement;
    const website = findByAttribute(root, 'data-turbowarp-app-shell-title-action', 'website')[0]!;
    const icon = website.children[0]!;
    expect(icon.textContent).toBe('🌐');
    expect(icon.style['width']).toBe('auto');
    expect(icon.style['fontSize']).toBe('5.5cqw');

    const menu = createAppShellApplicationMenu({
      document,
      mount,
      actions: [
        {
          id: 'open',
          labels: {en: 'Open'},
          icon: {url: 'data:image/svg+xml,<svg/>', filter: 'invert(1)'},
          attributes: {'data-app-menu-action': 'open'},
          position: {left: '10%', top: '58.8889%'},
          onSelect() {}
        }
      ],
      status: {text: 'ready', visible: true, color: '#004d40'},
      attributes: {status: {'data-app-menu-status': 'true'}}
    });
    const menuRoot = menu.element as unknown as FakeElement;
    const open = findByAttribute(menuRoot, 'data-app-menu-action', 'open')[0]!;
    expect(open.style['left']).toBe('10%');
    expect(open.style['top']).toBe('58.8889%');
    expect(open.children[0]!.style['filter']).toBe('invert(1)');
    const status = findByAttribute(menuRoot, 'data-app-menu-status', 'true')[0]!;
    expect(status.style['color']).toBe('#004d40');

    menu.setActionState('open', {position: {top: '18%'}});
    expect(open.style['top']).toBe('18%');
  });

  it('centres a label-only source choice when the app asks for it', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const chooser = createAppShellSourceChooser({
      document,
      mount,
      choices: [
        {
          id: 'file',
          labels: {en: 'Open file'},
          align: 'center',
          primary: true,
          attributes: {'data-app-source-choice': 'file'},
          onSelect() {}
        }
      ]
    });
    const root = chooser.element as unknown as FakeElement;
    const button = findByAttribute(root, 'data-app-source-choice', 'file')[0]!;
    expect(button.style['cssText']).toContain('justify-content:center;text-align:center;');
    expect(button.style['cssText']).not.toContain('grid-template-columns');
    chooser.show('en');
    expect(button.style['display']).toBe('flex');
  });

  it('stamps app-owned attributes on the loading presenter', () => {
    const document = fakeDocument();
    const mount = fakeElement('div') as unknown as HTMLElement;
    const presenter = createAppShellLoadingPresenter({
      document,
      mount,
      attributes: {
        root: {'data-app-loading': 'true', 'aria-hidden': 'true'},
        backdrop: {'data-app-loading-backdrop': 'true'}
      }
    });
    const root = presenter.element as unknown as FakeElement;
    expect(root.getAttribute('data-app-loading')).toBe('true');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(findByAttribute(root, 'data-app-loading-backdrop', 'true')).toHaveLength(1);
  });
});
