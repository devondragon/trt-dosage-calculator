addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname;

	switch (pathname) {
		case "/calculate-dose":
			return calculateDose(request);
		case "/":
			return serveForm();
		default:
			return new Response("Resource not found", { status: 404 });
	}
}

async function calculateDose(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const targetWeeklyDose = parseFloat(url.searchParams.get("targetWeeklyDose") || "0");
	const testosteroneStrength = parseFloat(url.searchParams.get("testosteroneStrength") || "0");
	const shotsPerWeek = parseInt(url.searchParams.get("shotsPerWeek") || "0", 10);
	const shotEveryXDays = parseFloat(url.searchParams.get("shotEveryXDays") || "0", 10);

	if (!targetWeeklyDose || !testosteroneStrength || (!shotsPerWeek && !shotEveryXDays)) {
		return new Response("Missing or invalid parameters", { status: 400 });
	}

	let shotsPerWeekCalculated = shotsPerWeek;
	if (!shotsPerWeek && shotEveryXDays) {
		shotsPerWeekCalculated = 7 / shotEveryXDays;  // Calculate the equivalent number of shots per week
	}

	const dosePerShotMg = targetWeeklyDose / shotsPerWeekCalculated;
	const dosePerShotMl = dosePerShotMg / testosteroneStrength;

	return new Response(JSON.stringify({
		dosePerShotMl: dosePerShotMl.toFixed(3) // Rounding to 3 decimal places
	}), {
		headers: {
			"Content-Type": "application/json"
		}
	});
}



function serveForm(): Response {
	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TRT Dosage Calculator</title>
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
	}

	button:hover {
		background-color: var(--primary-dark);
	}

	#result {
		margin-top: 20px;
		padding: 15px;
		background-color: var(--card-color);
		border-radius: var(--border-radius);
		color: var(--text-color);
		width: 100%;
		text-align: center;
		font-size: 1.2rem;
		font-weight: 600;
		display: none;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
	<form id="dosageForm">
		<div class="form-group">
			<label for="targetWeeklyDose">Target Weekly Dose (mg)</label>
			<input type="number" id="targetWeeklyDose" name="targetWeeklyDose" value="100" min="0" required>
			<div id="targetWeeklyDoseError" class="error-message">Please enter a valid weekly dose</div>
		</div>
		
		<div class="form-group">
			<label for="testosteroneStrength">
				Testosterone Strength (mg/ml)
				<span class="tooltip">
					<span class="info-icon">i</span>
					<span class="tooltip-text">Check your medication label for concentration (typically 100, 200, or 250 mg/ml)</span>
				</span>
			</label>
			<input type="number" id="testosteroneStrength" name="testosteroneStrength" value="200" min="0" required>
			<div id="testosteroneStrengthError" class="error-message">Please enter a valid strength</div>
		</div>
		
		<div class="divider">Choose one option below</div>
		
		<div class="form-group">
			<label for="shotsPerWeek">Number of Shots per Week</label>
			<input type="number" id="shotsPerWeek" name="shotsPerWeek" placeholder="e.g., 2">
			<div id="shotsPerWeekError" class="error-message">Please enter a valid number</div>
		</div>
		
		<div class="form-group">
			<label for="shotEveryXDays">OR Shot Every X Days</label>
			<input type="number" id="shotEveryXDays" name="shotEveryXDays" step="0.1" placeholder="e.g., 3.5">
			<div id="shotEveryXDaysError" class="error-message">Please enter a valid number of days</div>
		</div>
		
		<button type="button" onclick="calculateDose()">Calculate Dose</button>
	</form>
	
	<div id="result"></div>
	
	<div id="doseHelp">
		1 ml = 1 cc. Using a 1 cc insulin syringe makes measuring fractions of ml easier. 
		The syringe should have markings for each 0.1 ml/cc.
	</div>
</div>

<script>
function validateForm() {
	let isValid = true;
	const targetWeeklyDose = parseFloat(document.getElementById('targetWeeklyDose').value);
	const testosteroneStrength = parseFloat(document.getElementById('testosteroneStrength').value);
	const shotsPerWeek = document.getElementById('shotsPerWeek').value;
	const shotEveryXDays = document.getElementById('shotEveryXDays').value;
	
	// Reset error messages
	document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
	
	// Validate target weekly dose
	if (isNaN(targetWeeklyDose) || targetWeeklyDose <= 0) {
		document.getElementById('targetWeeklyDoseError').style.display = 'block';
		isValid = false;
	}
	
	// Validate testosterone strength
	if (isNaN(testosteroneStrength) || testosteroneStrength <= 0) {
		document.getElementById('testosteroneStrengthError').style.display = 'block';
		isValid = false;
	}
	
	// Validate that either shotsPerWeek or shotEveryXDays is filled
	if ((!shotsPerWeek && !shotEveryXDays) || 
		(shotsPerWeek && shotEveryXDays)) {
		document.getElementById('shotsPerWeekError').style.display = 'block';
		document.getElementById('shotEveryXDaysError').style.display = 'block';
		isValid = false;
	} else if (shotsPerWeek && (isNaN(parseFloat(shotsPerWeek)) || parseFloat(shotsPerWeek) <= 0)) {
		document.getElementById('shotsPerWeekError').style.display = 'block';
		isValid = false;
	} else if (shotEveryXDays && (isNaN(parseFloat(shotEveryXDays)) || parseFloat(shotEveryXDays) <= 0)) {
		document.getElementById('shotEveryXDaysError').style.display = 'block';
		isValid = false;
	}
	
	return isValid;
}

function calculateDose() {
	if (!validateForm()) {
		return;
	}
	
	const targetWeeklyDose = document.getElementById('targetWeeklyDose').value;
	const testosteroneStrength = document.getElementById('testosteroneStrength').value;
	const shotsPerWeek = document.getElementById('shotsPerWeek').value;
	const shotEveryXDays = document.getElementById('shotEveryXDays').value;
	
	let query = \`targetWeeklyDose=\${targetWeeklyDose}&testosteroneStrength=\${testosteroneStrength}\`;
	if (shotsPerWeek) {
		query += \`&shotsPerWeek=\${shotsPerWeek}\`;
	} else if (shotEveryXDays) {
		query += \`&shotEveryXDays=\${shotEveryXDays}\`;
	}
	
	const resultEl = document.getElementById('result');
	resultEl.style.display = 'block';
	resultEl.innerText = 'Calculating...';
	
	fetch(\`/calculate-dose?\${query}\`)
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(data => {
			resultEl.innerHTML = '<strong>Dose per Shot:</strong> ' + data.dosePerShotMl + ' ml';
		})
		.catch(error => {
			console.error('Error:', error);
			resultEl.innerText = 'Error calculating dosage. Please try again.';
		});
}

// Clear one field when the other is used
document.getElementById('shotsPerWeek').addEventListener('input', function() {
	if (this.value) {
		document.getElementById('shotEveryXDays').value = '';
	}
});

document.getElementById('shotEveryXDays').addEventListener('input', function() {
	if (this.value) {
		document.getElementById('shotsPerWeek').value = '';
	}
});
</script>
</body>
</html>
	`;
	return new Response(html, {
		headers: {
			"Content-Type": "text/html"
		}
	});
}
