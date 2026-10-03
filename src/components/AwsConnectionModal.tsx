import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Key,
  Globe,
  ShieldCheck,
  ExternalLink,
  Zap,
  Check,
  Database
} from 'lucide-react';
import { Button } from './ui/Primitives.js';

interface AwsConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudStatus: {
    awsConfigured: boolean;
    maskedKey?: string | null;
    region: string;
    isLiveActive: boolean;
    account?: string;
    arn?: string;
  };
  onSync: (region?: string) => Promise<void>;
  onResetMock: () => Promise<void>;
  syncing: boolean;
}

const COMMON_AWS_REGIONS = [
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)', flag: '🇮🇳' },
  { id: 'us-east-1', name: 'US East (N. Virginia)', flag: '🇺🇸' },
  { id: 'us-east-2', name: 'US East (Ohio)', flag: '🇺🇸' },
  { id: 'us-west-2', name: 'US West (Oregon)', flag: '🇺🇸' },
  { id: 'eu-west-1', name: 'Europe (Ireland)', flag: '🇮🇪' },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)', flag: '🇩🇪' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', flag: '🇸🇬' },
];

export const AwsConnectionModal: React.FC<AwsConnectionModalProps> = ({
  isOpen,
  onClose,
  cloudStatus,
  onSync,
  onResetMock,
  syncing
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>(cloudStatus.region || 'ap-south-1');
  const [testing, setTesting] = useState<boolean>(false);
  const [savingCreds, setSavingCreds] = useState<boolean>(false);
  const [showCredForm, setShowCredForm] = useState<boolean>(false);
  const [accessKeyInput, setAccessKeyInput] = useState<string>('');
  const [secretKeyInput, setSecretKeyInput] = useState<string>('');
  const [sessionTokenInput, setSessionTokenInput] = useState<string>('');
  const [testResult, setTestResult] = useState<{
    connected?: boolean;
    account?: string;
    arn?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const safeParseJson = async (res: Response) => {
    const text = await res.text().catch(() => '');
    if (!text || text.trim().length === 0) {
      throw new Error(`Server returned empty response (HTTP ${res.status}). The server may have restarted - please retry.`);
    }
    try {
      return JSON.parse(text);
    } catch (_e) {
      throw new Error(`Server response error: ${text.substring(0, 150)}`);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/cloud/aws/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: selectedRegion }),
      });
      const data = await safeParseJson(res);
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        connected: false,
        error: err?.message || 'Failed to communicate with AWS test endpoint.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConfigureCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKeyInput.trim() || !secretKeyInput.trim()) return;

    setSavingCreds(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/cloud/aws/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: accessKeyInput.trim(),
          secretAccessKey: secretKeyInput.trim(),
          sessionToken: sessionTokenInput.trim() || undefined,
          region: selectedRegion
        }),
      });
      const data = await safeParseJson(res);
      if (res.ok && data.success) {
        setTestResult({
          connected: true,
          account: data.account,
          arn: data.arn
        });
        setShowCredForm(false);
        // Trigger live refresh
        await onSync(selectedRegion);
      } else {
        setTestResult({
          connected: false,
          error: data?.error || data?.details || 'AWS Authentication rejected these credentials.'
        });
      }
    } catch (err: any) {
      setTestResult({
        connected: false,
        error: err?.message || 'Failed to submit AWS credentials.'
      });
    } finally {
      setSavingCreds(false);
    }
  };

  const handleRunSync = async () => {
    await onSync(selectedRegion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface border border-border rounded-card w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-btn bg-[#FF9900]/15 border border-[#FF9900]/30 flex items-center justify-center text-[#FF9900] font-bold">
              <Zap className="w-5 h-5 text-[#FF9900]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                AWS Live Infrastructure Connector
              </h2>
              <p className="text-xs text-muted">
                Synchronize EC2 compute instances & CloudWatch metrics directly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-btn hover:bg-elevated text-muted hover:text-text transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-4 rounded-btn border ${
            cloudStatus.isLiveActive
              ? 'bg-success/10 border-success/30 text-success'
              : cloudStatus.awsConfigured
              ? 'bg-brand-indigo/10 border-brand-indigo/30 text-brand-cyan'
              : 'bg-warning/10 border-warning/30 text-warning'
          }`}>
            <div className="flex items-start gap-3">
              {cloudStatus.isLiveActive ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text text-sm">
                  {cloudStatus.isLiveActive
                    ? `Live AWS Connected (${cloudStatus.region})`
                    : cloudStatus.awsConfigured
                    ? 'AWS Credentials Detected in .env'
                    : 'AWS Credentials Not Detected'}
                </p>
                <p className="text-muted">
                  {cloudStatus.isLiveActive
                    ? `Displaying live EC2 instances and real-time CloudWatch telemetry for AWS.`
                    : cloudStatus.awsConfigured
                    ? `Found Access Key in server environment (${cloudStatus.maskedKey || 'Loaded'}). Click 'Sync AWS Now' to pull your instances.`
                    : `Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your root .env file and restart the dev server.`}
                </p>
              </div>
            </div>
          </div>

          {/* Region Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-cyan" />
                Target AWS Region
              </span>
              <span className="text-[11px] text-muted font-normal">
                Instances must exist in this region
              </span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-elevated border border-border rounded-btn px-3 py-2 text-sm text-text focus:outline-none focus:border-brand-cyan transition"
            >
              {COMMON_AWS_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.flag} {r.id} - {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnostic Test Box */}
          {testResult && (
            <div className={`p-4 rounded-btn border text-xs space-y-2 ${
              testResult.connected
                ? 'bg-success/10 border-success/30 text-text'
                : 'bg-danger/10 border-danger/30 text-text'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {testResult.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-success text-sm">AWS STS Connection Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-danger" />
                    <span className="text-danger text-sm">AWS Authentication Error</span>
                  </>
                )}
              </div>
              {testResult.connected ? (
                <div className="mt-2 text-muted space-y-1">
                  <p><strong className="text-text">AWS Account ID:</strong> {testResult.account}</p>
                  <p className="truncate"><strong className="text-text">IAM Principal:</strong> {testResult.arn}</p>
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  <p className="text-danger font-medium">{testResult.error}</p>
                  <div className="p-2.5 rounded bg-surface border border-border text-[11px] text-muted space-y-1">
                    <p className="font-semibold text-text">How to resolve this:</p>
                    <p>• If using <strong>Standard AWS</strong>: In AWS IAM Console &gt; Users &gt; Security credentials &gt; Create new Access Key.</p>
                    <p>• If using <strong>AWS Academy / Learner Lab</strong>: In the Lab classroom, click <strong>AWS Details</strong>, copy the fresh credentials (including Session Token), and click "Enter New Credentials" below.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsible Direct Credentials Input */}
          <div className="border border-border rounded-btn bg-elevated/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCredForm(!showCredForm)}
              className="w-full px-4 py-3 text-xs font-semibold text-text flex items-center justify-between hover:bg-elevated/60 transition"
            >
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-brand-cyan" />
                {showCredForm ? 'Hide Credentials Form' : 'Enter / Update AWS Credentials Here'}
              </span>
              <span className="text-[11px] text-brand-cyan">
                {showCredForm ? 'Close' : 'Configure Live Keys →'}
              </span>
            </button>

            {showCredForm && (
              <form onSubmit={handleConfigureCredentials} className="p-4 pt-2 border-t border-border space-y-3">
                <p className="text-[11px] text-muted">
                  Paste your active credentials below to immediately test & connect without editing files:
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-text block mb-1">
                    AWS Access Key ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AKIA... or ASIA..."
                    value={accessKeyInput}
                    onChange={(e) => setAccessKeyInput(e.target.value)}
                    className="w-full bg-surface border border-border rounded-btn px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text block mb-1">
                    AWS Secret Access Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="40-character secret key"
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    className="w-full bg-surface border border-border rounded-btn px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text flex items-center justify-between mb-1">
                    <span>AWS Session Token</span>
                    <span className="text-[10px] text-muted font-normal">Optional (AWS Academy / Learner Lab / SSO)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Only required if key starts with ASIA (paste session token from AWS Details)"
                    value={sessionTokenInput}
                    onChange={(e) => setSessionTokenInput(e.target.value)}
                    className="w-full bg-surface border border-border rounded-btn px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={savingCreds || !accessKeyInput || !secretKeyInput}
                  >
                    {savingCreds ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                    Save &amp; Connect Live AWS
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Setup Reference */}
          <div className="p-3.5 bg-elevated/40 border border-border rounded-btn space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-muted" />
                Required IAM Permissions
              </span>
              <span className="text-[11px] text-muted">Read + Power Control</span>
            </div>
            <div className="text-[11px] text-muted space-y-1">
              <p>To view inventory, metrics, and stop/start EC2 instances from CloudWise-AI:</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-[10px] text-brand-cyan" title="Allows CloudWise-AI to stop & start EC2 instances">
                  AmazonEC2FullAccess
                </span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-[10px] text-brand-cyan" title="Allows CloudWise-AI to read CloudWatch CPU metrics">
                  CloudWatchReadOnlyAccess
                </span>
              </div>
              <p className="text-[10px] text-muted/80 mt-1">
                *(Note: If your IAM user only has ReadOnly access, the Stop/Start power button will be blocked by AWS with Permission Denied).*
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-elevated/30 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetMock}
            title="Switch back to sample multi-cloud dataset"
          >
            <Database className="w-3.5 h-3.5 mr-1 text-muted" />
            Use Demo Data
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || syncing}
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
              Test Credentials
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleRunSync}
              disabled={syncing}
            >
              {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1 text-slate-950" />}
              Sync AWS Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
