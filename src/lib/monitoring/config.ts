export const monitoringConfig = {
	vercelAnalyticsEnabled:
		process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true",
	sentryEnabled: process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true",
	sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
	logRocketEnabled: process.env.NEXT_PUBLIC_ENABLE_LOGROCKET === "true",
	logRocketAppId: process.env.NEXT_PUBLIC_LOGROCKET_APP_ID ?? "",
} as const;

export function getMonitoringReadiness() {
	return {
		vercelAnalytics: monitoringConfig.vercelAnalyticsEnabled,
		sentry:
			monitoringConfig.sentryEnabled && monitoringConfig.sentryDsn.length > 0,
		logRocket:
			monitoringConfig.logRocketEnabled &&
			monitoringConfig.logRocketAppId.length > 0,
	};
}
