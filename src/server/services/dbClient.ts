import { CloudResource } from '../../types/cloudwise.js';

// Read lazily: dotenv.config() runs after imports are hoisted
const base = () => process.env.DB_API_URL || 'http://localhost:8000';

async function request(method: string, path: string, body?: unknown): Promise<Response | null> {
  try {
    const res = await fetch(`${base()}/api/cloud/resources${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    // 404 is expected for live AWS instances (i-...) that aren't stored in the DB
    if (!res.ok && res.status !== 404) {
      console.warn(`[CloudWise-AI][DB] ${method} ${path || '/'} -> ${res.status}`);
    }
    return res;
  } catch (err: any) {
    console.warn(`[CloudWise-AI][DB] ${method} ${path || '/'} failed: ${err?.message}`);
    return null;
  }
}

export const dbClient = {
  async list(): Promise<CloudResource[] | null> {
    const res = await request('GET', '');
    if (!res || !res.ok) return null;
    const rows: any[] = await res.json();
    return rows.map(r => ({ ...r, anomaly_type: r.anomaly_type ?? undefined }));
  },
  async create(resource: CloudResource): Promise<void> {
    await request('POST', '', resource);
  },
  async update(id: string, updates: Partial<CloudResource>): Promise<void> {
    await request('PATCH', `/${encodeURIComponent(id)}`, updates);
  },
  async remove(id: string): Promise<void> {
    await request('DELETE', `/${encodeURIComponent(id)}`);
  },
};