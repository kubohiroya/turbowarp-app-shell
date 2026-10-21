import {afterEach, describe, expect, it, vi} from 'vitest';
import {createRuntimeControlsDock, getRuntimeControlsDock} from '../src/runtime-controls-dock.js';

class FakeElement extends EventTarget {
  children: FakeElement[] = [];
  parentNode: FakeElement | null = null;
  style: Record<string, string> = {};
  attributes = new Map<string, string>();
  hidden = false; textContent = ''; value = ''; checked = false; focused = false;
  constructor(readonly ownerDocument: FakeDocument, readonly tagName: string) { super(); }
  append(...children: FakeElement[]) { for (const child of children) this.insertBefore(child, null); }
  insertBefore(child: FakeElement, before: FakeElement | null) {
    child.remove(); child.parentNode = this;
    const index = before ? this.children.indexOf(before) : -1;
    if (index < 0) this.children.push(child); else this.children.splice(index, 0, child);
  }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  contains(child: FakeElement): boolean { return this === child || this.children.some(value => value.contains(child)); }
  matches() { return this.focused; }
  focus() { this.focused = true; this.ownerDocument.activeElement = this; }
  click() { this.dispatchEvent(new Event('click')); }
  getBoundingClientRect() { return {left: 100, top: 100, right: 200, bottom: 200}; }
}
class FakeDocument extends EventTarget {
  body = new FakeElement(this, 'body');
  documentElement = {lang: 'ja'};
  activeElement: FakeElement | null = null;
  fullscreenElement: FakeElement | null = null;
  storage = new Map<string, string>();
  defaultView = Object.assign(new EventTarget(), {innerWidth: 1280, innerHeight: 800, navigator: {language: 'ja'},
    localStorage: {getItem: (key: string) => this.storage.get(key), setItem: (key: string, value: string) => this.storage.set(key, value)}});
  createElement(tag: string) { return new FakeElement(this, tag); }
}
const find = (root: FakeElement, name: string, value?: string): FakeElement | undefined =>
  root.attributes.has(name) && (value === undefined || root.attributes.get(name) === value) ? root :
    root.children.map(child => find(child, name, value)).find(Boolean);
const asDocument = (document: FakeDocument) => document as unknown as Document;
afterEach(() => vi.useRealTimers());

describe('standalone controls Dock', () => {
  it('starts hidden, reveals at the edge and stays visible while a control panel is expanded', async () => {
    vi.useFakeTimers();
    const document = new FakeDocument(); const dock = createRuntimeControlsDock({document: asDocument(document)});
    const button = dock.stageControls.addButton({id: 'camera', label: 'カメラ', onClick() {}});
    const root = document.body.children[0]!;
    expect(root.hidden).toBe(true); button.update({visible: true});
    const bar = find(root, 'data-runtime-dock-bar')!;
    expect(bar.hidden).toBe(true); root.dispatchEvent(new Event('pointerenter'));
    expect(bar.hidden).toBe(false); button.update({expanded: true});
    root.dispatchEvent(new Event('pointerleave')); vi.advanceTimersByTime(1000);
    expect(bar.hidden).toBe(false); button.update({expanded: false});
    expect(bar.hidden).toBe(true);
    button.focus(); expect(bar.hidden).toBe(false);
    root.dispatchEvent(Object.assign(new Event('focusout'), {relatedTarget: find(root, 'data-runtime-dock-control', 'camera')}));
    await Promise.resolve(); expect(bar.hidden).toBe(false);
    document.dispatchEvent(new Event('pointerdown')); expect(bar.hidden).toBe(true);
    const touch = (type: string) => Object.assign(new Event(type), {pointerType: 'touch'});
    root.dispatchEvent(touch('pointerenter'));
    find(root, 'data-runtime-dock-handle')!.click();
    root.dispatchEvent(touch('pointerleave')); vi.advanceTimersByTime(1500);
    expect(bar.hidden).toBe(false);
    document.dispatchEvent(new Event('pointerdown')); expect(bar.hidden).toBe(true);
    button.dispose(); expect(root.hidden).toBe(true); dock.dispose();
    expect(vi.getTimerCount()).toBe(0); expect(document.body.children).toHaveLength(0);
  });

  it('persists all four edges and the auto-hide setting, and supports unavailable storage', () => {
    const document = new FakeDocument(); let dock = createRuntimeControlsDock({document: asDocument(document)});
    dock.stageControls.addButton({id: 'camera', label: 'カメラ', onClick() {}}).update({visible: true});
    const root = document.body.children[0]!;
    const select = find(root, 'aria-label', '表示位置')!;
    for (const edge of ['top', 'bottom', 'left', 'right']) {
      select.value = edge; select.dispatchEvent(new Event('change')); expect(dock.getSnapshot().edge).toBe(edge);
    }
    const settings = find(root, 'data-runtime-dock-settings')!;
    const auto = settings.children[2]!.children[0]!;
    auto.checked = false; auto.dispatchEvent(new Event('change')); dock.dispose();
    dock = createRuntimeControlsDock({document: asDocument(document)});
    expect(dock.getSnapshot()).toMatchObject({edge: 'right', autoHide: false}); dock.dispose();
    document.defaultView.localStorage.getItem = () => { throw new Error('Storage disabled'); };
    document.defaultView.localStorage.setItem = () => { throw new Error('Storage disabled'); };
    dock = createRuntimeControlsDock({document: asDocument(document)});
    expect(dock.getSnapshot()).toMatchObject({edge: 'bottom', autoHide: true}); dock.dispose();
  });

  it('shares a document singleton, fences stale handles and reconnects after disposal', () => {
    const document = new FakeDocument(); const first = getRuntimeControlsDock({document: asDocument(document)});
    expect(getRuntimeControlsDock({document: asDocument(document)})).toBe(first);
    const old = first.stageControls.addButton({id: 'reload', label: '旧設定', onClick() {}});
    const current = first.stageControls.addButton({id: 'reload', label: '設定', onClick() {}});
    current.update({visible: true}); old.update({visible: false}); old.dispose();
    expect(first.getSnapshot().count).toBe(1);
    document.fullscreenElement = document.createElement('fullscreen'); document.dispatchEvent(new Event('fullscreenchange'));
    expect(document.fullscreenElement.children).toHaveLength(1);
    first.dispose(); expect(document.fullscreenElement.children).toHaveLength(0);
    expect(getRuntimeControlsDock({document: asDocument(document)})).not.toBe(first);
    getRuntimeControlsDock({document: asDocument(document)}).dispose();
  });
});
