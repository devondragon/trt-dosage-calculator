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
		env: Env,
		ctx: ExecutionContext,
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
	} catch (error) {
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
<style>
	:root {
		--primary-color: #0056b3;
		--primary-dark: #004494;
		--background-color: #f4f4f9;
		--card-color: #ffffff;
		--text-color: #333333;
		--secondary-text: #666666;
		--border-radius: 8px;
	}

	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		margin: 0;
		padding: 15px;
		background-color: var(--background-color);
		color: var(--text-color);
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 500px;
	}

	h1 {
		color: var(--primary-color);
		margin-bottom: 20px;
		text-align: center;
		font-size: 1.8rem;
	}

	.disclaimer {
		background-color: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: var(--border-radius);
		padding: 12px;
		margin-bottom: 20px;
		font-size: 0.85rem;
		color: #856404;
		text-align: center;
	}

	form {
		background-color: var(--card-color);
		padding: 25px;
		border-radius: var(--border-radius);
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		width: 100%;
	}

	.form-group {
		margin-bottom: 16px;
	}

	label {
		display: block;
		font-size: 1rem;
		color: var(--secondary-text);
		margin-bottom: 8px;
		font-weight: 500;
	}

	input[type="number"] {
		width: 100%;
		padding: 12px;
		border-radius: var(--border-radius);
		border: 1px solid #ddd;
		font-size: 1rem;
		transition: border-color 0.3s;
		-webkit-appearance: none;
	}

	input[type="number"]:focus {
		border-color: var(--primary-color);
		outline: none;
	}

	.divider {
		text-align: center;
		margin: 15px 0;
		font-size: 0.9rem;
		color: var(--secondary-text);
		position: relative;
	}

	.divider::before,
	.divider::after {
		content: "";
		position: absolute;
		top: 50%;
		width: 45%;
		height: 1px;
		background-color: #ddd;
	}

	.divider::before {
		left: 0;
	}

	.divider::after {
		right: 0;
	}

	button {
		width: 100%;
		padding: 12px;
		background-color: var(--primary-color);
		color: white;
		border: none;
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.3s;
		margin-top: 10px;
		position: relative;
	}

	button:hover:not(:disabled) {
		background-color: var(--primary-dark);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		display: none;
		width: 16px;
		height: 16px;
		border: 2px solid #ffffff;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		position: absolute;
		right: 15px;
		top: 50%;
		transform: translateY(-50%);
	}

	@keyframes spin {
		to { transform: translateY(-50%) rotate(360deg); }
	}

	button.loading .spinner {
		display: block;
	}

	#result {
		margin-top: 20px;
		padding: 15px;
		background-color: var(--card-color);
		border-radius: var(--border-radius);
		color: var(--text-color);
		width: 100%;
		text-align: center;
		font-size: 1.1rem;
		display: none;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	#result.show {
		display: block;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.result-detail {
		margin: 8px 0;
		padding: 8px;
		background-color: var(--background-color);
		border-radius: 4px;
	}

	.result-detail strong {
		color: var(--primary-color);
	}

	#doseHelp {
		margin-top: 15px;
		text-align: center;
		font-size: 0.9rem;
		color: var(--secondary-text);
		line-height: 1.5;
		padding: 0 10px;
	}

	.error-message {
		color: #d32f2f;
		font-size: 0.85rem;
		margin-top: 5px;
		display: none;
	}

	.info-icon {
		display: inline-block;
		width: 16px;
		height: 16px;
		background-color: var(--secondary-text);
		color: white;
		border-radius: 50%;
		text-align: center;
		font-size: 12px;
		line-height: 16px;
		margin-left: 5px;
		cursor: help;
	}

	.tooltip {
		position: relative;
		display: inline-block;
	}

	.tooltip .tooltip-text {
		visibility: hidden;
		width: 200px;
		background-color: #555;
		color: #fff;
		text-align: center;
		border-radius: 6px;
		padding: 5px;
		position: absolute;
		z-index: 1;
		bottom: 125%;
		left: 50%;
		margin-left: -100px;
		opacity: 0;
		transition: opacity 0.3s;
		font-size: 0.8rem;
		font-weight: normal;
	}

	.tooltip:hover .tooltip-text {
		visibility: visible;
		opacity: 1;
	}

	.save-preferences {
		margin-top: 10px;
		display: flex;
		align-items: center;
		font-size: 0.9rem;
		color: var(--secondary-text);
	}

	.save-preferences input[type="checkbox"] {
		margin-right: 8px;
	}

	@media (max-width: 600px) {
		body {
			padding: 10px;
			align-items: flex-start;
		}

		h1 {
			font-size: 1.5rem;
			margin-top: 20px;
		}

		form {
			padding: 20px;
		}

		input[type="number"], button {
			padding: 10px;
		}

		.container {
			max-width: 100%;
		}
	}
</style>
</head>
<body>
<div class="container">
	<h1>TRT Dosage Calculator</h1>
	
	<div class="disclaimer">
		<strong>Medical Disclaimer:</strong> This calculator is for informational purposes only. Always consult with your healthcare provider before making any changes to your medication regimen.
	</div>
	
	<form id="dosageForm">
		<div class="form-group">
			<label for="targetWeeklyDose">Target Weekly Dose (mg)</label>
			<input type="number" id="targetWeeklyDose" name="targetWeeklyDose" value="100" min="0" max="1000" required>
			<div id="targetWeeklyDoseError" class="error-message">Please enter a valid weekly dose (0-1000 mg)</div>
		</div>
		
		<div class="form-group">
			<label for="testosteroneStrength">
				Testosterone Strength (mg/ml)
				<span class="tooltip">
					<span class="info-icon">i</span>
					<span class="tooltip-text">Check your medication label for concentration (typically 100, 200, or 250 mg/ml)</span>
				</span>
			</label>
			<input type="number" id="testosteroneStrength" name="testosteroneStrength" value="200" min="0" max="500" required>
			<div id="testosteroneStrengthError" class="error-message">Please enter a valid strength (0-500 mg/ml)</div>
		</div>
		
		<div class="divider">Choose one option below</div>
		
		<div class="form-group">
			<label for="shotsPerWeek">Number of Shots per Week</label>
			<input type="number" id="shotsPerWeek" name="shotsPerWeek" placeholder="e.g., 2" min="0" max="7">
			<div id="shotsPerWeekError" class="error-message">Please enter a valid number (1-7)</div>
		</div>
		
		<div class="form-group">
			<label for="shotEveryXDays">OR Shot Every X Days</label>
			<input type="number" id="shotEveryXDays" name="shotEveryXDays" step="0.1" placeholder="e.g., 3.5" min="0" max="30">
			<div id="shotEveryXDaysError" class="error-message">Please enter a valid number of days (1-30)</div>
		</div>
		
		<div class="save-preferences">
			<input type="checkbox" id="savePreferences" checked>
			<label for="savePreferences">Remember my settings</label>
		</div>
		
		<button type="button" onclick="calculateDose()" id="calculateBtn">
			Calculate Dose
			<span class="spinner"></span>
		</button>
	</form>
	
	<div id="result"></div>
	
	<div id="doseHelp">
		<strong>Measurement Guide:</strong> 1 ml = 1 cc. Using a 1 cc insulin syringe makes measuring easier. 
		The syringe should have markings for each 0.1 ml/cc increment.
	</div>
</div>

<script>
// Load saved preferences on page load
window.addEventListener('DOMContentLoaded', () => {
	const savedPrefs = localStorage.getItem('trtCalculatorPrefs');
	if (savedPrefs) {
		try {
			const prefs = JSON.parse(savedPrefs);
			if (prefs.targetWeeklyDose) document.getElementById('targetWeeklyDose').value = prefs.targetWeeklyDose;
			if (prefs.testosteroneStrength) document.getElementById('testosteroneStrength').value = prefs.testosteroneStrength;
			if (prefs.shotsPerWeek) document.getElementById('shotsPerWeek').value = prefs.shotsPerWeek;
			if (prefs.shotEveryXDays) document.getElementById('shotEveryXDays').value = prefs.shotEveryXDays;
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
	
	// Reset error messages
	document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
	
	// Validate target weekly dose
	if (isNaN(targetWeeklyDose) || targetWeeklyDose <= 0 || targetWeeklyDose > 1000) {
		document.getElementById('targetWeeklyDoseError').style.display = 'block';
		isValid = false;
	}
	
	// Validate testosterone strength
	if (isNaN(testosteroneStrength) || testosteroneStrength <= 0 || testosteroneStrength > 500) {
		document.getElementById('testosteroneStrengthError').style.display = 'block';
		isValid = false;
	}
	
	// Validate that either shotsPerWeek or shotEveryXDays is filled
	if ((!shotsPerWeek && !shotEveryXDays) || 
		(shotsPerWeek && shotEveryXDays)) {
		document.getElementById('shotsPerWeekError').textContent = 'Please choose one frequency option';
		document.getElementById('shotsPerWeekError').style.display = 'block';
		document.getElementById('shotEveryXDaysError').textContent = 'Please choose one frequency option';
		document.getElementById('shotEveryXDaysError').style.display = 'block';
		isValid = false;
	} else if (shotsPerWeek) {
		const val = parseFloat(shotsPerWeek);
		if (isNaN(val) || val <= 0 || val > 7) {
			document.getElementById('shotsPerWeekError').style.display = 'block';
			isValid = false;
		}
	} else if (shotEveryXDays) {
		const val = parseFloat(shotEveryXDays);
		if (isNaN(val) || val <= 0 || val > 30) {
			document.getElementById('shotEveryXDaysError').style.display = 'block';
			isValid = false;
		}
	}
	
	return isValid;
}

async function calculateDose() {
	if (!validateForm()) {
		return;
	}
	
	const btn = document.getElementById('calculateBtn');
	const resultEl = document.getElementById('result');
	
	// Show loading state
	btn.classList.add('loading');
	btn.disabled = true;
	resultEl.classList.remove('show');
	
	// Save preferences if checkbox is checked
	savePreferences();
	
	const targetWeeklyDose = document.getElementById('targetWeeklyDose').value;
	const testosteroneStrength = document.getElementById('testosteroneStrength').value;
	const shotsPerWeek = document.getElementById('shotsPerWeek').value;
	const shotEveryXDays = document.getElementById('shotEveryXDays').value;
	
	const params = {
		targetWeeklyDose,
		testosteroneStrength,
		...(shotsPerWeek && { shotsPerWeek }),
		...(shotEveryXDays && { shotEveryXDays }),
	};
	
	try {
		// Use the new API endpoint
		const response = await fetch('/api/v1/calculate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		});
		
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.error || 'Calculation failed');
		}
		
		// Display detailed results
		resultEl.innerHTML = \`
			<h3 style="margin-bottom: 12px; color: var(--primary-color);">Your Dosage</h3>
			<div class="result-detail">
				<strong>Volume per injection:</strong> \${data.dosePerShotMl} ml
			</div>
			<div class="result-detail">
				<strong>Amount per injection:</strong> \${data.dosePerShotMg} mg
			</div>
			<div class="result-detail">
				<strong>Injection frequency:</strong> \${data.frequency}
			</div>
		\`;
		
		resultEl.classList.add('show');
	} catch (error) {
		console.error('Error:', error);
		resultEl.innerHTML = \`<span style="color: #d32f2f;">Error: \${error.message}</span>\`;
		resultEl.classList.add('show');
	} finally {
		btn.classList.remove('loading');
		btn.disabled = false;
	}
}

// Clear one field when the other is used
document.getElementById('shotsPerWeek').addEventListener('input', function() {
	if (this.value) {
		document.getElementById('shotEveryXDays').value = '';
		document.getElementById('shotEveryXDaysError').style.display = 'none';
	}
});

document.getElementById('shotEveryXDays').addEventListener('input', function() {
	if (this.value) {
		document.getElementById('shotsPerWeek').value = '';
		document.getElementById('shotsPerWeekError').style.display = 'none';
	}
});

// Add keyboard support
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
				"default-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; style-src 'unsafe-inline';",
		},
	});
}
