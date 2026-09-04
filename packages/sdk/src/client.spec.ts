import { NodeMonitorClient } from './client';

jest.mock('./transport');
import { Transport } from './transport';

const MockedTransport = Transport as jest.MockedClass<typeof Transport>;

describe('NodeMonitorClient', () => {
  beforeEach(() => {
    MockedTransport.mockClear();
  });

  function createClient(options: Partial<ConstructorParameters<typeof NodeMonitorClient>[0]> = {}) {
    return new NodeMonitorClient({
      dsn: 'nm_test',
      apiUrl: 'http://localhost:3001',
      autoCaptureExceptions: false,
      ...options,
    });
  }

  it('throws if dsn or apiUrl is missing', () => {
    expect(() => new NodeMonitorClient({ dsn: '', apiUrl: 'http://x' } as any)).toThrow('dsn');
    expect(() => new NodeMonitorClient({ dsn: 'x', apiUrl: '' } as any)).toThrow('apiUrl');
  });

  it('reports an Error with its type, message and stack', async () => {
    const client = createClient();
    const sendException = MockedTransport.mock.instances[0].sendException as jest.Mock;
    sendException.mockResolvedValue(undefined);

    await client.captureException(new TypeError('bad input'));

    expect(sendException).toHaveBeenCalledWith(
      expect.objectContaining({
        exceptionType: 'TypeError',
        message: 'bad input',
        level: 'error',
      }),
    );
    expect(sendException.mock.calls[0][0].stack).toContain('TypeError');
  });

  it('reports a thrown non-Error value as NonError', async () => {
    const client = createClient();
    const sendException = MockedTransport.mock.instances[0].sendException as jest.Mock;
    sendException.mockResolvedValue(undefined);

    await client.captureException('just a string');

    expect(sendException).toHaveBeenCalledWith(
      expect.objectContaining({ exceptionType: 'NonError', message: 'just a string' }),
    );
  });

  it('includes recorded breadcrumbs in the payload', async () => {
    const client = createClient();
    const sendException = MockedTransport.mock.instances[0].sendException as jest.Mock;
    sendException.mockResolvedValue(undefined);

    client.addBreadcrumb({ category: 'http', message: 'GET /orders', level: 'info' });
    await client.captureException(new Error('boom'));

    const payload = sendException.mock.calls[0][0];
    expect(payload.breadcrumbs).toHaveLength(1);
    expect(payload.breadcrumbs[0]).toMatchObject({ category: 'http', message: 'GET /orders' });
  });

  it('merges constructor tags with per-call tags', async () => {
    const client = createClient({ tags: { service: 'api' } });
    const sendException = MockedTransport.mock.instances[0].sendException as jest.Mock;
    sendException.mockResolvedValue(undefined);

    await client.captureException(new Error('boom'), { tags: { route: '/orders' } });

    expect(sendException.mock.calls[0][0].tags).toEqual({ service: 'api', route: '/orders' });
  });

  it('reports captureMessage with exceptionType Message and the given level', async () => {
    const client = createClient();
    const sendException = MockedTransport.mock.instances[0].sendException as jest.Mock;
    sendException.mockResolvedValue(undefined);

    await client.captureMessage('something noteworthy', 'warning');

    expect(sendException).toHaveBeenCalledWith(
      expect.objectContaining({ exceptionType: 'Message', message: 'something noteworthy', level: 'warning' }),
    );
  });

  it('never throws even if the transport rejects', async () => {
    const client = createClient();
    const sendException = MockedTransport.mock.instances[0].sendException as jest.Mock;
    sendException.mockRejectedValue(new Error('network down'));

    await expect(client.captureException(new Error('boom'))).resolves.toBeUndefined();
  });
});
