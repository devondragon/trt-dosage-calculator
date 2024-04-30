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
<html>
<head>
<title>TRT Dosage Calculator</title>
<style>
	body {
		font-family: Arial, sans-serif;
		margin: 0;
		padding: 0;
		background-color: #f4f4f9;
		color: #333;
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
	}
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 400px;  // Control width here for both form and title
	}
	h1 {
		color: #0056b3;
		margin-bottom: 20px;
	}
	form {
		background-color: white;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 0 10px rgba(0,0,0,0.1);
	}
	label {
		margin-top: 10px;
		display: block;
		font-size: 16px;
		color: #666;
	}
	input[type="number"], input[type="button"] {
		width: 100%;
		padding: 8px;
		margin-top: 5px;
		border-radius: 4px;
		border: 1px solid #ccc;
		box-sizing: border-box;
	}
	input[type="button"] {
		background-color: #0056b3;
		color: white;
		cursor: pointer;
	}
	input[type="button"]:hover {
		background-color: #004494;
	}
	#result {
		margin-top: 20px;
		padding: 10px;
		background-color: #e2e2e2;
		border-radius: 4px;
		color: #333;
	}
</style>
</head>
<body>
<div class="container">
	<h1>Calculate TRT Dosage</h1>
	<form id="dosageForm">
		<label for="targetWeeklyDose">Target Weekly Dose (mg):</label>
		<input type="number" id="targetWeeklyDose" name="targetWeeklyDose" value="100" required><br>
		<label for="testosteroneStrength">Testosterone Strength (mg/ml):</label>
		<input type="number" id="testosteroneStrength" name="testosteroneStrength" value="200" required><br>
		<label for="shotsPerWeek">Number of Shots per Week:</label>
		<input type="number" id="shotsPerWeek" name="shotsPerWeek"><br>
		<label for="shotEveryXDays">Or, Shot Every X Days:</label>
		<input type="number" id="shotEveryXDays" name="shotEveryXDays" step="0.1"><br>
		<input type="button" value="Calculate" onclick="calculateDose()">
	</form>
	<div id="result"></div>
	<div id="doseHelp">
		1 ml = 1 cc. Recommend using a 1 cc syringe, which makes measuring fractions of mls easier. The syringe should have makings that show each 0.1 ml/cc. 
	</div>
</div>
<script>
function calculateDose() {
	const targetWeeklyDose = document.getElementById('targetWeeklyDose').value;
	const testosteroneStrength = document.getElementById('testosteroneStrength').value;
	const shotsPerWeek = document.getElementById('shotsPerWeek').value;
	const shotEveryXDays = parseFloat(document.getElementById('shotEveryXDays').value);
	
	let query = \`targetWeeklyDose=\${targetWeeklyDose}&testosteroneStrength=\${testosteroneStrength}\`;
	if (shotsPerWeek) {
		query += \`&shotsPerWeek=\${shotsPerWeek}\`;
	} else if (shotEveryXDays) {
		query += \`&shotEveryXDays=\${shotEveryXDays}\`;
	}
	
	fetch(\`/calculate-dose?\${query}\`)
		.then(response => response.json())
		.then(data => {
			document.getElementById('result').innerText = 'Dose per Shot (ml): ' + data.dosePerShotMl;
		})
		.catch(error => {
			console.error('Error:', error);
			document.getElementById('result').innerText = 'Error calculating dosage.';
		});
}
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
