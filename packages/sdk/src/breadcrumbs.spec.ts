import { BreadcrumbStore } from './breadcrumbs';

describe('BreadcrumbStore', () => {
  it('keeps only the most recent maxSize breadcrumbs', () => {
    const store = new BreadcrumbStore(2);
    store.add({ category: 'http', message: 'a', level: 'info' });
    store.add({ category: 'http', message: 'b', level: 'info' });
    store.add({ category: 'http', message: 'c', level: 'info' });

    expect(store.snapshot().map((b) => b.message)).toEqual(['b', 'c']);
  });
});
