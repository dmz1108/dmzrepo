'use strict';

const REVIEW_SOURCE_HEALTH_LABELS = {
  healthy: '完整',
  pending: '等待发布',
  missing: '缺失',
  invalid: '异常',
  failed: '检查失败',
  'not-required': '无需检查',
};

function adminReviewSourceHealthVerdict(inspect = {}, options = {}) {
  if (inspect.error) {
    return { status: 'failed', label: REVIEW_SOURCE_HEALTH_LABELS.failed, reasonCode: 'inspection-failed' };
  }
  if (inspect.skipped || inspect.source === 'market-closed' || inspect.marketClosed) {
    return { status: 'not-required', label: REVIEW_SOURCE_HEALTH_LABELS['not-required'], reasonCode: 'market-closed' };
  }

  const artifacts = Array.isArray(inspect.sourceArtifactStats) ? inspect.sourceArtifactStats : [];
  const requiredSourceCount = Math.max(1, Number(options.requiredSourceCount || 4));
  const artifactsComplete = artifacts.length >= requiredSourceCount
    && artifacts.every(item => item?.ok === true);
  const limitUpCount = Number(inspect.limitUpCount || 0);
  const missingCount = Number(inspect.missingCount || 0);
  const combinedComplete = limitUpCount > 0
    && inspect.compatible === true
    && missingCount === 0
    && artifactsComplete;
  if (combinedComplete) {
    return { status: 'healthy', label: REVIEW_SOURCE_HEALTH_LABELS.healthy, reasonCode: 'reconciled' };
  }

  if (!options.afterMarketClose || inspect.reasonReady !== true) {
    return { status: 'pending', label: REVIEW_SOURCE_HEALTH_LABELS.pending, reasonCode: 'publication-window' };
  }
  if (!limitUpCount) {
    return { status: 'missing', label: REVIEW_SOURCE_HEALTH_LABELS.missing, reasonCode: 'limit-up-base-missing' };
  }

  const invalidArtifact = artifacts.some(item => item?.exists && item?.ok !== true);
  if (inspect.compatible === false || missingCount > 0 || invalidArtifact) {
    return { status: 'invalid', label: REVIEW_SOURCE_HEALTH_LABELS.invalid, reasonCode: 'reconciliation-failed' };
  }
  return { status: 'missing', label: REVIEW_SOURCE_HEALTH_LABELS.missing, reasonCode: 'source-artifact-missing' };
}

module.exports = {
  REVIEW_SOURCE_HEALTH_LABELS,
  adminReviewSourceHealthVerdict,
};
