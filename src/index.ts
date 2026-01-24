// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Env {
	// Add any environment variables here if needed
}

interface DosageRequest {
	targetWeeklyDose: number;
	testosteroneStrength: number;
	shotsPerWeek?: number;
	shotEveryXDays?: number;
}

interface DosageResponse {
	dosePerShotMl: string;
	dosePerShotMg: string;
	shotsPerWeek: string;
	frequency: string;
}

export default {
	async fetch(
		request: Request,
		_env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Add CORS headers for API endpoints
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Handle preflight requests
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		switch (pathname) {
			case "/calculate-dose":
				return handleCalculateDose(request, corsHeaders);
			case "/":
				return serveForm();
			case "/api/v1/calculate":
				// New versioned API endpoint supporting both GET and POST
				return handleApiCalculate(request, corsHeaders);
			default:
				return new Response("Resource not found", { status: 404 });
		}
	},
};

async function handleApiCalculate(
	request: Request,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	try {
		let params: DosageRequest;

		if (request.method === "POST") {
			params = (await request.json()) as DosageRequest;
		} else {
			const url = new URL(request.url);
			params = {
				targetWeeklyDose: parseFloat(
					url.searchParams.get("targetWeeklyDose") || "0",
				),
				testosteroneStrength: parseFloat(
					url.searchParams.get("testosteroneStrength") || "0",
				),
				shotsPerWeek: url.searchParams.get("shotsPerWeek")
					? parseInt(url.searchParams.get("shotsPerWeek")!, 10)
					: undefined,
				shotEveryXDays: url.searchParams.get("shotEveryXDays")
					? parseFloat(url.searchParams.get("shotEveryXDays")!)
					: undefined,
			};
		}

		const result = calculateDosage(params);

		if ("error" in result) {
			return new Response(JSON.stringify(result), {
				status: 400,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				},
			});
		}

		return new Response(JSON.stringify(result), {
			headers: {
				"Content-Type": "application/json",
				...corsHeaders,
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: "Invalid request format" }), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
				...corsHeaders,
			},
		});
	}
}

async function handleCalculateDose(
	request: Request,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const url = new URL(request.url);
	const params: DosageRequest = {
		targetWeeklyDose: parseFloat(
			url.searchParams.get("targetWeeklyDose") || "0",
		),
		testosteroneStrength: parseFloat(
			url.searchParams.get("testosteroneStrength") || "0",
		),
		shotsPerWeek: url.searchParams.get("shotsPerWeek")
			? parseInt(url.searchParams.get("shotsPerWeek")!, 10)
			: undefined,
		shotEveryXDays: url.searchParams.get("shotEveryXDays")
			? parseFloat(url.searchParams.get("shotEveryXDays")!)
			: undefined,
	};

	const result = calculateDosage(params);

	if ("error" in result) {
		return new Response(JSON.stringify(result), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
				...corsHeaders,
			},
		});
	}

	// Return simplified response for backward compatibility
	return new Response(
		JSON.stringify({
			dosePerShotMl: result.dosePerShotMl,
		}),
		{
			headers: {
				"Content-Type": "application/json",
				...corsHeaders,
			},
		},
	);
}

function calculateDosage(
	params: DosageRequest,
): DosageResponse | { error: string } {
	const {
		targetWeeklyDose,
		testosteroneStrength,
		shotsPerWeek,
		shotEveryXDays,
	} = params;

	// Input validation
	if (!targetWeeklyDose || targetWeeklyDose <= 0 || targetWeeklyDose > 1000) {
		return { error: "Target weekly dose must be between 0 and 1000 mg" };
	}

	if (
		!testosteroneStrength ||
		testosteroneStrength <= 0 ||
		testosteroneStrength > 500
	) {
		return { error: "Testosterone strength must be between 0 and 500 mg/ml" };
	}

	if (!shotsPerWeek && !shotEveryXDays) {
		return {
			error: "Please specify either shots per week or days between shots",
		};
	}

	if (shotsPerWeek && shotEveryXDays) {
		return { error: "Please specify only one frequency option" };
	}

	let shotsPerWeekCalculated = shotsPerWeek || 0;
	let frequencyDescription = "";

	if (shotEveryXDays) {
		if (shotEveryXDays <= 0 || shotEveryXDays > 30) {
			return { error: "Days between shots must be between 0 and 30" };
		}
		shotsPerWeekCalculated = 7 / shotEveryXDays;
		frequencyDescription = `Every ${shotEveryXDays} days`;
	} else if (shotsPerWeek) {
		if (shotsPerWeek <= 0 || shotsPerWeek > 7) {
			return { error: "Shots per week must be between 0 and 7" };
		}
		frequencyDescription =
			shotsPerWeek === 1 ? "Once weekly" : `${shotsPerWeek} times per week`;
	}

	const dosePerShotMg = targetWeeklyDose / shotsPerWeekCalculated;
	const dosePerShotMl = dosePerShotMg / testosteroneStrength;

	return {
		dosePerShotMl: dosePerShotMl.toFixed(3),
		dosePerShotMg: dosePerShotMg.toFixed(1),
		shotsPerWeek: shotsPerWeekCalculated.toFixed(2),
		frequency: frequencyDescription,
	};
}

function serveForm(): Response {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TRT Dosage Calculator</title>
<meta name="description" content="Calculate your testosterone replacement therapy (TRT) injection dosage based on weekly dose, concentration, and injection frequency.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
	:root {
		--primary: #1a5f5a;
		--primary-light: #2a8f87;
		--primary-dark: #0d3d3a;
		--accent: #d4a853;
		--accent-light: #f0d08a;
		--bg-deep: #0f1419;
		--bg-card: #1a2028;
		--bg-elevated: #232b35;
		--text-primary: #f0f2f5;
		--text-secondary: #9ca3af;
		--text-muted: #6b7280;
		--border: rgba(255,255,255,0.08);
		--border-focus: rgba(26,95,90,0.6);
		--error: #ef4444;
		--error-bg: rgba(239,68,68,0.1);
		--success: #10b981;
		--warning-bg: rgba(212,168,83,0.12);
		--warning-border: rgba(212,168,83,0.3);
		--radius-sm: 6px;
		--radius-md: 12px;
		--radius-lg: 20px;
		--shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
		--shadow-md: 0 8px 32px rgba(0,0,0,0.4);
		--shadow-lg: 0 20px 60px rgba(0,0,0,0.5);
		--transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	html {
		font-size: 16px;
	}

	body {
		font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
		background: var(--bg-deep);
		color: var(--text-primary);
		min-height: 100vh;
		line-height: 1.6;
		overflow-x: hidden;
	}

	/* Animated background */
	.bg-pattern {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.bg-pattern::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background:
			radial-gradient(ellipse at 20% 20%, rgba(26,95,90,0.15) 0%, transparent 50%),
			radial-gradient(ellipse at 80% 80%, rgba(212,168,83,0.08) 0%, transparent 50%),
			radial-gradient(ellipse at 50% 50%, rgba(26,95,90,0.05) 0%, transparent 70%);
		animation: bgShift 20s ease-in-out infinite;
	}

	@keyframes bgShift {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		33% { transform: translate(-2%, 2%) rotate(1deg); }
		66% { transform: translate(2%, -1%) rotate(-1deg); }
	}

	/* Grid overlay */
	.bg-pattern::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
		background-size: 60px 60px;
		mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
	}

	.page-wrapper {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 20px 60px;
	}

	/* Header */
	header {
		text-align: center;
		margin-bottom: 40px;
		animation: fadeInDown 0.8s ease-out;
	}

	@keyframes fadeInDown {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.logo-mark {
		width: 64px;
		height: 64px;
		margin: 0 auto 20px;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 4px 20px rgba(26,95,90,0.4),
			inset 0 1px 0 rgba(255,255,255,0.1);
		position: relative;
		overflow: hidden;
	}

	.logo-mark::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
		animation: shimmer 3s ease-in-out infinite;
	}

	@keyframes shimmer {
		0%, 100% { transform: translateX(-100%) rotate(45deg); }
		50% { transform: translateX(100%) rotate(45deg); }
	}

	.logo-mark svg {
		width: 32px;
		height: 32px;
		fill: none;
		stroke: var(--text-primary);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	h1 {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		margin-bottom: 8px;
	}

	.tagline {
		font-size: 0.95rem;
		color: var(--text-secondary);
		font-weight: 400;
	}

	/* Main card */
	.calculator-card {
		width: 100%;
		max-width: 480px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		animation: fadeInUp 0.8s ease-out 0.2s both;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Disclaimer */
	.disclaimer {
		background: var(--warning-bg);
		border-bottom: 1px solid var(--warning-border);
		padding: 14px 24px;
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.disclaimer-icon {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		color: var(--accent);
		margin-top: 2px;
	}

	.disclaimer p {
		font-size: 0.82rem;
		color: var(--accent-light);
		line-height: 1.5;
	}

	.disclaimer strong {
		color: var(--accent);
	}

	/* Form */
	form {
		padding: 28px 24px;
	}

	.form-section {
		margin-bottom: 24px;
	}

	.form-section-title {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.form-section-title::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.label-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 400;
	}

	.input-wrapper {
		position: relative;
	}

	input[type="number"] {
		width: 100%;
		padding: 14px 16px;
		padding-right: 60px;
		background: var(--bg-elevated);
		border: 1.5px solid var(--border);
		border-radius: var(--radius-md);
		font-family: 'DM Sans', sans-serif;
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-primary);
		transition: all var(--transition);
		-webkit-appearance: none;
		-moz-appearance: textfield;
	}

	input[type="number"]::-webkit-outer-spin-button,
	input[type="number"]::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type="number"]::placeholder {
		color: var(--text-muted);
		font-weight: 400;
	}

	input[type="number"]:hover {
		border-color: rgba(255,255,255,0.15);
	}

	input[type="number"]:focus {
		outline: none;
		border-color: var(--primary-light);
		box-shadow: 0 0 0 3px rgba(26,95,90,0.2);
		background: var(--bg-card);
	}

	.input-unit {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-muted);
		pointer-events: none;
	}

	.error-message {
		display: none;
		margin-top: 6px;
		padding: 8px 12px;
		background: var(--error-bg);
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		color: var(--error);
	}

	.error-message.show {
		display: block;
		animation: shake 0.4s ease-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20%, 60% { transform: translateX(-4px); }
		40%, 80% { transform: translateX(4px); }
	}

	/* Frequency toggle */
	.frequency-toggle {
		display: flex;
		background: var(--bg-elevated);
		border-radius: var(--radius-md);
		padding: 4px;
		margin-bottom: 16px;
	}

	.frequency-toggle label {
		flex: 1;
		margin: 0;
	}

	.frequency-toggle input[type="radio"] {
		display: none;
	}

	.frequency-toggle .toggle-btn {
		display: block;
		padding: 10px 16px;
		text-align: center;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition);
	}

	.frequency-toggle input[type="radio"]:checked + .toggle-btn {
		background: var(--primary);
		color: var(--text-primary);
		box-shadow: 0 2px 8px rgba(26,95,90,0.3);
	}

	.frequency-input {
		display: none;
	}

	.frequency-input.active {
		display: block;
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Info tooltip */
	.info-trigger {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 50%;
		cursor: help;
		transition: all var(--transition);
		position: relative;
	}

	.info-trigger svg {
		width: 12px;
		height: 12px;
		color: var(--text-muted);
	}

	.info-trigger:hover {
		background: var(--primary);
		border-color: var(--primary);
	}

	.info-trigger:hover svg {
		color: var(--text-primary);
	}

	.info-trigger .tooltip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		width: 220px;
		padding: 10px 12px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.78rem;
		font-weight: 400;
		color: var(--text-secondary);
		line-height: 1.5;
		box-shadow: var(--shadow-md);
		opacity: 0;
		visibility: hidden;
		transition: all var(--transition);
		pointer-events: none;
		z-index: 100;
	}

	.info-trigger .tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: var(--bg-elevated);
	}

	.info-trigger:hover .tooltip {
		opacity: 1;
		visibility: visible;
	}

	/* Save preferences */
	.save-prefs {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 0;
		border-top: 1px solid var(--border);
		margin-top: 20px;
	}

	.save-prefs input[type="checkbox"] {
		display: none;
	}

	.save-prefs .checkbox-custom {
		width: 20px;
		height: 20px;
		border: 1.5px solid var(--border);
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all var(--transition);
		flex-shrink: 0;
	}

	.save-prefs .checkbox-custom svg {
		width: 12px;
		height: 12px;
		color: var(--text-primary);
		opacity: 0;
		transform: scale(0.5);
		transition: all var(--transition);
	}

	.save-prefs input[type="checkbox"]:checked + .checkbox-custom {
		background: var(--primary);
		border-color: var(--primary);
	}

	.save-prefs input[type="checkbox"]:checked + .checkbox-custom svg {
		opacity: 1;
		transform: scale(1);
	}

	.save-prefs span {
		font-size: 0.85rem;
		color: var(--text-muted);
		cursor: pointer;
	}

	/* Calculate button */
	.btn-calculate {
		width: 100%;
		padding: 16px 24px;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
		border: none;
		border-radius: var(--radius-md);
		font-family: 'DM Sans', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--transition);
		position: relative;
		overflow: hidden;
		margin-top: 8px;
	}

	.btn-calculate::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%);
		opacity: 0;
		transition: opacity var(--transition);
	}

	.btn-calculate:hover::before {
		opacity: 1;
	}

	.btn-calculate:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(26,95,90,0.4);
	}

	.btn-calculate:active {
		transform: translateY(0);
	}

	.btn-calculate:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-calculate .btn-text {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: opacity var(--transition);
	}

	.btn-calculate.loading .btn-text {
		opacity: 0;
	}

	.btn-calculate .spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 22px;
		height: 22px;
		border: 2.5px solid rgba(255,255,255,0.3);
		border-top-color: white;
		border-radius: 50%;
		opacity: 0;
		animation: none;
	}

	.btn-calculate.loading .spinner {
		opacity: 1;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: translate(-50%, -50%) rotate(360deg); }
	}

	/* Results */
	.results-section {
		display: none;
		padding: 0 24px 28px;
		animation: slideUp 0.5s ease-out;
	}

	.results-section.show {
		display: block;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.results-header {
		text-align: center;
		padding-bottom: 20px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 20px;
	}

	.results-header h2 {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.1rem;
		font-weight: 400;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	/* Syringe visualization */
	.syringe-viz {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 24px 0;
	}

	.syringe {
		position: relative;
		width: 180px;
		height: 36px;
	}

	.syringe-body {
		position: absolute;
		left: 30px;
		right: 0;
		top: 4px;
		bottom: 4px;
		background: linear-gradient(to bottom, #e8e8e8 0%, #d0d0d0 50%, #e8e8e8 100%);
		border-radius: 4px 8px 8px 4px;
		box-shadow:
			inset 0 2px 4px rgba(0,0,0,0.1),
			0 2px 8px rgba(0,0,0,0.2);
		overflow: hidden;
	}

	.syringe-fill {
		position: absolute;
		left: 0;
		top: 2px;
		bottom: 2px;
		width: 0%;
		background: linear-gradient(to bottom, var(--accent-light) 0%, var(--accent) 50%, var(--accent-light) 100%);
		border-radius: 2px 0 0 2px;
		transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: inset 0 -2px 4px rgba(0,0,0,0.1);
	}

	.syringe-markings {
		position: absolute;
		left: 0;
		right: 8px;
		top: 0;
		bottom: 0;
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
	}

	.syringe-mark {
		width: 1px;
		height: 100%;
		background: rgba(0,0,0,0.15);
	}

	.syringe-mark:nth-child(odd) {
		height: 60%;
		margin-top: 20%;
	}

	.syringe-needle {
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 34px;
		height: 4px;
		background: linear-gradient(to bottom, #c0c0c0 0%, #909090 50%, #c0c0c0 100%);
		border-radius: 0 2px 2px 4px;
	}

	.syringe-needle::before {
		content: '';
		position: absolute;
		left: -6px;
		top: 50%;
		transform: translateY(-50%);
		border: 3px solid transparent;
		border-right: 6px solid #909090;
	}

	.syringe-plunger {
		position: absolute;
		right: -8px;
		top: 2px;
		bottom: 2px;
		width: 16px;
		background: linear-gradient(to bottom, #f0f0f0 0%, #d8d8d8 50%, #f0f0f0 100%);
		border-radius: 2px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.15);
	}

	.dose-amount {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--accent);
		line-height: 1;
	}

	.dose-amount span {
		font-size: 1.2rem;
		font-weight: 500;
		color: var(--text-muted);
		margin-left: 4px;
	}

	.result-cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.result-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 16px;
		text-align: center;
	}

	.result-card.full-width {
		grid-column: span 2;
	}

	.result-card-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 6px;
	}

	.result-card-value {
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.result-card-value.highlight {
		color: var(--primary-light);
	}

	.result-error {
		background: var(--error-bg);
		border: 1px solid rgba(239,68,68,0.3);
		border-radius: var(--radius-md);
		padding: 16px;
		text-align: center;
		color: var(--error);
		font-size: 0.9rem;
	}

	/* Help section */
	.help-section {
		width: 100%;
		max-width: 480px;
		margin-top: 24px;
		animation: fadeInUp 0.8s ease-out 0.4s both;
	}

	.help-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
	}

	.help-card h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.help-card h3 svg {
		width: 16px;
		height: 16px;
		color: var(--primary-light);
	}

	.help-card p {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Footer */
	footer {
		margin-top: 40px;
		text-align: center;
		animation: fadeInUp 0.8s ease-out 0.6s both;
	}

	footer p {
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	/* Responsive */
	@media (max-width: 520px) {
		.page-wrapper {
			padding: 24px 16px 40px;
		}

		header {
			margin-bottom: 28px;
		}

		.logo-mark {
			width: 56px;
			height: 56px;
			border-radius: 14px;
		}

		h1 {
			font-size: 1.6rem;
		}

		form {
			padding: 24px 20px;
		}

		.disclaimer {
			padding: 12px 20px;
		}

		.results-section {
			padding: 0 20px 24px;
		}

		.dose-amount {
			font-size: 2rem;
		}

		.result-cards {
			grid-template-columns: 1fr;
		}

		.result-card.full-width {
			grid-column: span 1;
		}
	}
</style>
</head>
<body>
<div class="bg-pattern"></div>

<div class="page-wrapper">
	<header>
		<div class="logo-mark">
			<svg viewBox="0 0 24 24">
				<path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke-width="1.5"/>
				<path d="M12 8V16M8 12H16" stroke-width="2"/>
			</svg>
		</div>
		<h1>TRT Dosage Calculator</h1>
		<p class="tagline">Precision dosing for your therapy</p>
	</header>

	<main class="calculator-card">
		<div class="disclaimer">
			<svg class="disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"/>
				<line x1="12" y1="8" x2="12" y2="12"/>
				<line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			<p><strong>Medical Disclaimer:</strong> For informational purposes only. Always consult your healthcare provider before making changes to your medication regimen.</p>
		</div>

		<form id="dosageForm">
			<div class="form-section">
				<div class="form-section-title">Medication Details</div>

				<div class="form-group">
					<label for="targetWeeklyDose">
						Weekly Target Dose
						<span class="label-hint">(prescribed amount)</span>
					</label>
					<div class="input-wrapper">
						<input type="number" id="targetWeeklyDose" name="targetWeeklyDose" value="100" min="1" max="1000" required>
						<span class="input-unit">mg</span>
					</div>
					<div id="targetWeeklyDoseError" class="error-message">Enter a valid dose between 1-1000 mg</div>
				</div>

				<div class="form-group">
					<label for="testosteroneStrength">
						Concentration
						<span class="info-trigger">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"/>
								<path d="M12 16v-4"/>
								<path d="M12 8h.01"/>
							</svg>
							<span class="tooltip">Check your vial label for concentration. Common values: 100, 200, or 250 mg/ml</span>
						</span>
					</label>
					<div class="input-wrapper">
						<input type="number" id="testosteroneStrength" name="testosteroneStrength" value="200" min="1" max="500" required>
						<span class="input-unit">mg/ml</span>
					</div>
					<div id="testosteroneStrengthError" class="error-message">Enter a valid strength between 1-500 mg/ml</div>
				</div>
			</div>

			<div class="form-section">
				<div class="form-section-title">Injection Frequency</div>

				<div class="frequency-toggle">
					<label>
						<input type="radio" name="freqType" value="perWeek" checked>
						<span class="toggle-btn">Times per Week</span>
					</label>
					<label>
						<input type="radio" name="freqType" value="everyXDays">
						<span class="toggle-btn">Every X Days</span>
					</label>
				</div>

				<div id="perWeekInput" class="frequency-input active">
					<div class="form-group">
						<label for="shotsPerWeek">Injections per Week</label>
						<div class="input-wrapper">
							<input type="number" id="shotsPerWeek" name="shotsPerWeek" placeholder="2" min="1" max="7">
							<span class="input-unit">shots</span>
						</div>
						<div id="shotsPerWeekError" class="error-message">Enter a number between 1-7</div>
					</div>
				</div>

				<div id="everyXDaysInput" class="frequency-input">
					<div class="form-group">
						<label for="shotEveryXDays">Days Between Injections</label>
						<div class="input-wrapper">
							<input type="number" id="shotEveryXDays" name="shotEveryXDays" step="0.5" placeholder="3.5" min="1" max="30">
							<span class="input-unit">days</span>
						</div>
						<div id="shotEveryXDaysError" class="error-message">Enter a number between 1-30</div>
					</div>
				</div>
			</div>

			<label class="save-prefs">
				<input type="checkbox" id="savePreferences" checked>
				<span class="checkbox-custom">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				</span>
				<span>Remember my settings</span>
			</label>

			<button type="button" class="btn-calculate" id="calculateBtn" onclick="calculateDose()">
				<span class="btn-text">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="4" y="2" width="16" height="20" rx="2"/>
						<line x1="8" y1="6" x2="16" y2="6"/>
						<line x1="8" y1="10" x2="16" y2="10"/>
						<line x1="8" y1="14" x2="12" y2="14"/>
					</svg>
					Calculate Dose
				</span>
				<span class="spinner"></span>
			</button>
		</form>

		<div id="result" class="results-section"></div>
	</main>

	<div class="help-section">
		<div class="help-card">
			<h3>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
					<line x1="12" y1="17" x2="12.01" y2="17"/>
				</svg>
				Measurement Guide
			</h3>
			<p>1 ml = 1 cc. A 1 cc insulin syringe with 0.1 ml markings makes measuring easier and more precise.</p>
		</div>
	</div>

	<footer>
		<p>Built for precision. Not a substitute for medical advice.</p>
	</footer>
</div>

<script>
// Frequency toggle logic
const freqRadios = document.querySelectorAll('input[name="freqType"]');
const perWeekInput = document.getElementById('perWeekInput');
const everyXDaysInput = document.getElementById('everyXDaysInput');

freqRadios.forEach(radio => {
	radio.addEventListener('change', () => {
		if (radio.value === 'perWeek') {
			perWeekInput.classList.add('active');
			everyXDaysInput.classList.remove('active');
			document.getElementById('shotEveryXDays').value = '';
		} else {
			everyXDaysInput.classList.add('active');
			perWeekInput.classList.remove('active');
			document.getElementById('shotsPerWeek').value = '';
		}
	});
});

// Load saved preferences
window.addEventListener('DOMContentLoaded', () => {
	const savedPrefs = localStorage.getItem('trtCalculatorPrefs');
	if (savedPrefs) {
		try {
			const prefs = JSON.parse(savedPrefs);
			if (prefs.targetWeeklyDose) document.getElementById('targetWeeklyDose').value = prefs.targetWeeklyDose;
			if (prefs.testosteroneStrength) document.getElementById('testosteroneStrength').value = prefs.testosteroneStrength;
			if (prefs.shotsPerWeek) {
				document.getElementById('shotsPerWeek').value = prefs.shotsPerWeek;
				document.querySelector('input[name="freqType"][value="perWeek"]').checked = true;
				perWeekInput.classList.add('active');
				everyXDaysInput.classList.remove('active');
			}
			if (prefs.shotEveryXDays) {
				document.getElementById('shotEveryXDays').value = prefs.shotEveryXDays;
				document.querySelector('input[name="freqType"][value="everyXDays"]').checked = true;
				everyXDaysInput.classList.add('active');
				perWeekInput.classList.remove('active');
			}
		} catch (e) {
			console.error('Error loading preferences:', e);
		}
	}
});

function savePreferences() {
	if (!document.getElementById('savePreferences').checked) {
		localStorage.removeItem('trtCalculatorPrefs');
		return;
	}

	const prefs = {
		targetWeeklyDose: document.getElementById('targetWeeklyDose').value,
		testosteroneStrength: document.getElementById('testosteroneStrength').value,
		shotsPerWeek: document.getElementById('shotsPerWeek').value,
		shotEveryXDays: document.getElementById('shotEveryXDays').value,
	};

	localStorage.setItem('trtCalculatorPrefs', JSON.stringify(prefs));
}

function validateForm() {
	let isValid = true;
	const targetWeeklyDose = parseFloat(document.getElementById('targetWeeklyDose').value);
	const testosteroneStrength = parseFloat(document.getElementById('testosteroneStrength').value);
	const shotsPerWeek = document.getElementById('shotsPerWeek').value;
	const shotEveryXDays = document.getElementById('shotEveryXDays').value;

	document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

	if (isNaN(targetWeeklyDose) || targetWeeklyDose <= 0 || targetWeeklyDose > 1000) {
		document.getElementById('targetWeeklyDoseError').classList.add('show');
		isValid = false;
	}

	if (isNaN(testosteroneStrength) || testosteroneStrength <= 0 || testosteroneStrength > 500) {
		document.getElementById('testosteroneStrengthError').classList.add('show');
		isValid = false;
	}

	const freqType = document.querySelector('input[name="freqType"]:checked').value;

	if (freqType === 'perWeek') {
		if (!shotsPerWeek) {
			document.getElementById('shotsPerWeekError').classList.add('show');
			isValid = false;
		} else {
			const val = parseFloat(shotsPerWeek);
			if (isNaN(val) || val <= 0 || val > 7) {
				document.getElementById('shotsPerWeekError').classList.add('show');
				isValid = false;
			}
		}
	} else {
		if (!shotEveryXDays) {
			document.getElementById('shotEveryXDaysError').classList.add('show');
			isValid = false;
		} else {
			const val = parseFloat(shotEveryXDays);
			if (isNaN(val) || val <= 0 || val > 30) {
				document.getElementById('shotEveryXDaysError').classList.add('show');
				isValid = false;
			}
		}
	}

	return isValid;
}

async function calculateDose() {
	if (!validateForm()) return;

	const btn = document.getElementById('calculateBtn');
	const resultEl = document.getElementById('result');

	btn.classList.add('loading');
	btn.disabled = true;
	resultEl.classList.remove('show');

	savePreferences();

	const targetWeeklyDose = parseFloat(document.getElementById('targetWeeklyDose').value);
	const testosteroneStrength = parseFloat(document.getElementById('testosteroneStrength').value);
	const shotsPerWeek = document.getElementById('shotsPerWeek').value;
	const shotEveryXDays = document.getElementById('shotEveryXDays').value;

	const params = {
		targetWeeklyDose,
		testosteroneStrength,
		...(shotsPerWeek && { shotsPerWeek: parseFloat(shotsPerWeek) }),
		...(shotEveryXDays && { shotEveryXDays: parseFloat(shotEveryXDays) }),
	};

	try {
		const response = await fetch('/api/v1/calculate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || 'Calculation failed');
		}

		const fillPercent = Math.min((parseFloat(data.dosePerShotMl) / 1) * 100, 100);

		resultEl.innerHTML = \`
			<div class="results-header">
				<h2>Your Calculated Dose</h2>
				<div class="syringe-viz">
					<div class="syringe">
						<div class="syringe-needle"></div>
						<div class="syringe-body">
							<div class="syringe-fill" style="width: \${fillPercent}%"></div>
							<div class="syringe-markings">
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
								<div class="syringe-mark"></div>
							</div>
						</div>
						<div class="syringe-plunger"></div>
					</div>
				</div>
				<div class="dose-amount">\${data.dosePerShotMl}<span>ml</span></div>
			</div>
			<div class="result-cards">
				<div class="result-card">
					<div class="result-card-label">Per Injection</div>
					<div class="result-card-value highlight">\${data.dosePerShotMg} mg</div>
				</div>
				<div class="result-card">
					<div class="result-card-label">Schedule</div>
					<div class="result-card-value">\${data.frequency}</div>
				</div>
			</div>
		\`;

		resultEl.classList.add('show');

		// Animate syringe fill after DOM update
		setTimeout(() => {
			const fill = resultEl.querySelector('.syringe-fill');
			if (fill) fill.style.width = fillPercent + '%';
		}, 50);

	} catch (error) {
		console.error('Error:', error);
		resultEl.innerHTML = \`<div class="result-error">\${error.message}</div>\`;
		resultEl.classList.add('show');
	} finally {
		btn.classList.remove('loading');
		btn.disabled = false;
	}
}

// Keyboard support
document.getElementById('dosageForm').addEventListener('keypress', function(e) {
	if (e.key === 'Enter') {
		e.preventDefault();
		calculateDose();
	}
});
</script>
</body>
</html>
	`;
	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
			"Content-Security-Policy":
				"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;",
		},
	});
}
