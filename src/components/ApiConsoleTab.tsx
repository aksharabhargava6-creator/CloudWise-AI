import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Copy,
  Check,
  Code2,
  Clock,
  History,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card, Button } from './ui/Primitives.js';

interface EndpointItem {
  id: string;
  name: string;
  group: 'System' | 'Cloud Resources' | 'AI Analytics';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  defaultBody?: any;
}

const ENDPOINTS: EndpointItem[] = [
  // System
  {
    id: 'health',
    name: 'Health Check',
    group: 'System',
    method: 'GET',
    path: '/api/health',
    description: 'Returns operational availability status of API Gateway and background tasks.',
  },
  {
    id: 'auth-test',
    name: 'Authentication Test',
    group: 'System',
    method: 'GET',
    path: '/api/auth/test',
    description: 'Verifies auth subsystem connectivity and session headers.',
  },
  {
    id: 'overview-kpi',
    name: 'Dashboard Overview KPIs',
    group: 'System',
    method: 'GET',
    path: '/api/ai/overview',
    description: 'Retrieves aggregated multi-cloud invoice totals and alert indicators.',
  },

  // Cloud Resources
  {
    id: 'get-resources',
    name: 'List Cloud Resources',
    group: 'Cloud Resources',
    method: 'GET',
    path: '/api/cloud/resources',
    description: 'Retrieves all registered multi-cloud resources from inventory.',
  },
  {
    id: 'get-resource',
    name: 'Get Resource by Name',
    group: 'Cloud Resources',
    method: 'GET',
    path: '/api/cloud/resources/prod-api-gateway-01',
    description: 'Retrieves a single cloud resource by name or unique ID.',
  },
  {
    id: 'create-resource',
    name: 'Register Cloud Resource',
    group: 'Cloud Resources',
    method: 'POST',
    path: '/api/cloud/resources',
    description: 'Registers a new multi-cloud asset with telemetry metrics.',
    defaultBody: {
      name: 'k8s-ingress-controller',
      provider: 'AWS',
      resource_type: 'EC2',
      region: 'us-east-1',
      status: 'running',
      instance_type: 'c6g.xlarge',
      cpu_utilization: 44.5,
      memory_utilization: 52.0,
      storage_utilization: 38.0,
      cost_usd: 0.19,
      monthly_cost: 136.80,
    },
  },
  {
    id: 'update-resource',
    name: 'Update Resource Sizing',
    group: 'Cloud Resources',
    method: 'PATCH',
    path: '/api/cloud/resources/res-aws-01',
    description: 'Applies rightsizing adjustments or status modifications to an asset.',
    defaultBody: {
      status: 'running',
      cpu_utilization: 55.0,
      cost_usd: 0.24,
    },
  },

  // AI Analytics
  {
    id: 'ai-analyze',
    name: 'Full AI Analysis Pipeline',
    group: 'AI Analytics',
    method: 'POST',
    path: '/ai/analyze',
    description: 'Executes anomaly detection, cost forecasting, and recommendations in one request.',
    defaultBody: {
      contamination: 0.05,
      forecast_periods: 3,
    },
  },
  {
    id: 'ai-anomalies',
    name: 'Isolation Forest Anomalies',
    group: 'AI Analytics',
    method: 'POST',
    path: '/ai/anomalies',
    description: 'Scores metric time-series through multi-variate Isolation Forest algorithms.',
    defaultBody: {
      contamination: 0.05,
      metrics: [
        {
          timestamp: '2026-10-01T12:00:00Z',
          cloud: 'AWS',
          resource_id: 'sample-ec2-node',
          resource_type: 'EC2',
          cpu_utilization: 96.5,
          memory_utilization: 88.0,
          storage_utilization: 52.0,
          network_in_mb: 920.0,
          cost_usd: 0.32,
        },
      ],
    },
  },
  {
    id: 'ai-forecast',
    name: 'Prophet Cost Forecasting',
    group: 'AI Analytics',
    method: 'POST',
    path: '/ai/forecast',
    description: 'Generates time-series expenditure forecasts with widening 95% confidence intervals.',
    defaultBody: {
      periods: 6,
      provider: 'All',
    },
  },
  {
    id: 'ai-recommendations',
    name: 'Cost Optimization Engine',
    group: 'AI Analytics',
    method: 'POST',
    path: '/ai/recommendations',
    description: 'Evaluates resources to produce triaged rightsizing and cleanup actions.',
    defaultBody: {
      resources: [
        {
          resource_id: 'test-idle-worker',
          resource_type: 'EC2',
          cpu_utilization: 8.5,
          total_cost: 180.0,
          status: 'running',
        },
        {
          resource_id: 'test-stopped-node',
          resource_type: 'Compute Engine',
          cpu_utilization: 0.0,
          total_cost: 240.0,
          status: 'stopped',
        },
      ],
    },
  },
];

interface RequestHistoryItem {
  id: string;
  method: string;
  path: string;
  status: number;
  timeMs: number;
  timestamp: string;
}

// Hand-rolled syntax highlighter for JSON strings (no libraries)
function renderHighlightedJson(jsonString: string) {
  if (!jsonString) return null;

  // Split into tokens
  const tokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],])/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(jsonString)) !== null) {
    // text before match
    if (match.index > lastIndex) {
      parts.push(jsonString.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (/^"/.test(token)) {
      if (/:$/.test(token)) {
        // Key
        parts.push(
          <span key={match.index} className="text-brand-cyan font-semibold">
            {token}
          </span>
        );
      } else {
        // String value
        parts.push(
          <span key={match.index} className="text-emerald-400">
            {token}
          </span>
        );
      }
    } else if (/true|false/.test(token)) {
      parts.push(
        <span key={match.index} className="text-purple-400 font-bold">
          {token}
        </span>
      );
    } else if (/null/.test(token)) {
      parts.push(
        <span key={match.index} className="text-danger font-semibold">
          {token}
        </span>
      );
    } else if (/[0-9]/.test(token)) {
      // Number
      parts.push(
        <span key={match.index} className="text-amber-400 font-mono">
          {token}
        </span>
      );
    } else {
      // Brackets, commas
      parts.push(
        <span key={match.index} className="text-muted">
          {token}
        </span>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < jsonString.length) {
    parts.push(jsonString.substring(lastIndex));
  }

  return parts;
}

export const ApiConsoleTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointItem>(ENDPOINTS[0]);
  const [urlPath, setUrlPath] = useState<string>(ENDPOINTS[0].path);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(ENDPOINTS[0].defaultBody, null, 2) || ''
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<string | null>(null);
  const [responseDataString, setResponseDataString] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);

  const handleSelectEndpoint = (ep: EndpointItem) => {
    setSelectedEndpoint(ep);
    setUrlPath(ep.path);
    setRequestBodyText(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseStatus(null);
    setResponseDataString(null);
  };

  const handleFormatJson = () => {
    try {
      if (!requestBodyText.trim()) return;
      const parsed = JSON.parse(requestBodyText);
      setRequestBodyText(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore syntax errors
    }
  };

  const handleSend = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      let body: any = undefined;
      if (['POST', 'PATCH'].includes(selectedEndpoint.method) && requestBodyText.trim()) {
        body = requestBodyText;
      }

      const res = await fetch(urlPath, {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const text = await res.text();
      setResponseSize(`${(new Blob([text]).size / 1024).toFixed(1)} KB`);

      try {
        const json = JSON.parse(text);
        setResponseDataString(JSON.stringify(json, null, 2));
      } catch {
        setResponseDataString(text);
      }

      // Add to history
      const histItem: RequestHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        method: selectedEndpoint.method,
        path: urlPath,
        status: res.status,
        timeMs: elapsed,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory((prev) => [histItem, ...prev.slice(0, 7)]);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseDataString(JSON.stringify({ error: err.message || 'Request Failed' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCurl = () => {
    let curl = `curl -X ${selectedEndpoint.method} "http://localhost:3000${urlPath}"`;
    if (['POST', 'PATCH'].includes(selectedEndpoint.method) && requestBodyText.trim()) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBodyText.replace(/'/g, "'\\''")}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group endpoints
  const systemEndpoints = ENDPOINTS.filter((e) => e.group === 'System');
  const cloudEndpoints = ENDPOINTS.filter((e) => e.group === 'Cloud Resources');
  const aiEndpoints = ENDPOINTS.filter((e) => e.group === 'AI Analytics');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-cyan" />
            Postman-Style API &amp; Engine Console
          </h2>
          <p className="text-xs text-muted mt-1">
            Test and inspect all Fastify/Express REST endpoints with syntax-highlighted responses and live latency tracking.
          </p>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Endpoint Catalog & Request History */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Endpoint Catalog
            </h3>

            {/* System Endpoints */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                System &amp; Diagnostics
              </span>
              {systemEndpoints.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-2.5 rounded-btn border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-elevated border-brand-cyan text-text shadow-sm'
                        : 'bg-surface border-border text-muted hover:text-text hover:bg-elevated/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-success">GET</span>
                      <span className="truncate font-mono">{ep.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cloud Resources Endpoints */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                Cloud Inventory (CRUD)
              </span>
              {cloudEndpoints.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                const methodColor =
                  ep.method === 'GET'
                    ? 'text-success'
                    : ep.method === 'POST'
                    ? 'text-brand-cyan'
                    : ep.method === 'PATCH'
                    ? 'text-warning'
                    : 'text-danger';

                return (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-2.5 rounded-btn border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-elevated border-brand-cyan text-text shadow-sm'
                        : 'bg-surface border-border text-muted hover:text-text hover:bg-elevated/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-mono text-[10px] font-bold ${methodColor}`}>
                        {ep.method}
                      </span>
                      <span className="truncate font-mono">{ep.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI Analytics Endpoints */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                AI Analytics &amp; Forecasting
              </span>
              {aiEndpoints.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-2.5 rounded-btn border text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-elevated border-brand-cyan text-text shadow-sm'
                        : 'bg-surface border-border text-muted hover:text-text hover:bg-elevated/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-brand-cyan">POST</span>
                      <span className="truncate font-mono">{ep.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Request History */}
          {history.length > 0 && (
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <History className="w-3.5 h-3.5" />
                Session Request History
              </div>
              <div className="space-y-1.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-2 rounded-btn bg-elevated/60 border border-border flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[10px] font-bold ${
                          h.status >= 200 && h.status < 300 ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {h.status}
                      </span>
                      <span className="truncate text-text text-[11px]">{h.path}</span>
                    </div>
                    <span className="text-[10px] text-muted shrink-0">{h.timeMs}ms</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Request & Response Panes */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-5 space-y-4">
            {/* Request Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Method Pill */}
              <span
                className={`px-3 py-1.5 rounded-btn text-xs font-extrabold font-mono text-center shrink-0 ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-success/20 text-success border border-success/30'
                    : selectedEndpoint.method === 'POST'
                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                    : selectedEndpoint.method === 'PATCH'
                    ? 'bg-warning/20 text-warning border border-warning/30'
                    : 'bg-danger/20 text-danger border border-danger/30'
                }`}
              >
                {selectedEndpoint.method}
              </span>

              {/* URL Input */}
              <input
                type="text"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                className="flex-1 bg-elevated border border-border rounded-btn px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-brand-cyan"
              />

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCurl}
                  icon={copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Copied' : 'cURL'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSend}
                  loading={loading}
                  icon={<Play className="w-3.5 h-3.5 fill-current" />}
                >
                  Send
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted">{selectedEndpoint.description}</p>

            {/* Request Body Editor (if POST or PATCH) */}
            {['POST', 'PATCH'].includes(selectedEndpoint.method) && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-semibold uppercase tracking-wider">JSON Request Body</span>
                  <button
                    onClick={handleFormatJson}
                    className="text-brand-cyan hover:underline text-[11px] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Format JSON
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={requestBodyText}
                  onChange={(e) => setRequestBodyText(e.target.value)}
                  className="w-full bg-elevated border border-border rounded-btn p-3 font-mono text-xs text-text focus:outline-none focus:border-brand-cyan leading-relaxed resize-y"
                />
              </div>
            )}

            {/* Response Section */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-muted">Response</span>
                {responseStatus !== null && (
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-success/20 text-success'
                          : 'bg-danger/20 text-danger'
                      }`}
                    >
                      {responseStatus} OK
                    </span>
                    <span className="text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {responseTime}ms
                    </span>
                    {responseSize && <span className="text-muted">{responseSize}</span>}
                  </div>
                )}
              </div>

              {/* Hand-Rolled Syntax Highlighted Code Viewer */}
              <div className="w-full bg-elevated/90 border border-border rounded-btn p-4 font-mono text-xs max-h-80 overflow-y-auto leading-relaxed shadow-inner">
                {responseDataString !== null ? (
                  <pre className="whitespace-pre-wrap">
                    {renderHighlightedJson(responseDataString)}
                  </pre>
                ) : (
                  <span className="text-muted italic">
                    Press "Send" above to execute this endpoint against the Express/Node.js 22 server.
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
