import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			// Retry transient failures (network blips, cold edge) with backoff.
			retry: 2,
			retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
		},
		mutations: {
			// Mutations are not auto-retried — avoids accidental double-submits
			// (e.g. creating a print job or event twice).
			retry: 0,
		},
	},
});