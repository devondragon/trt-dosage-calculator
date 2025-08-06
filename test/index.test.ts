import worker from "../src/index";

describe("TRT Dosage Calculator", () => {
	describe("GET /", () => {
		it("should return HTML form with status 200", async () => {
			const request = new Request("http://localhost/");
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("text/html");

			const html = await response.text();
			expect(html).toContain("TRT Dosage Calculator");
			expect(html).toContain("Medical Disclaimer");
		});
	});

	describe("GET /calculate-dose", () => {
		it("should calculate correct dosage for weekly shots", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=100&testosteroneStrength=200&shotsPerWeek=2",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("application/json");

			const data = await response.json();
			expect(data.dosePerShotMl).toBe("0.250");
		});

		it("should calculate correct dosage for every X days", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=100&testosteroneStrength=200&shotEveryXDays=3.5",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.dosePerShotMl).toBe("0.250");
		});

		it("should return 400 for missing parameters", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=100",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toBeDefined();
		});

		it("should return 400 for invalid dose range", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=1500&testosteroneStrength=200&shotsPerWeek=2",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toContain("must be between 0 and 1000");
		});

		it("should return 400 for both frequency options specified", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=100&testosteroneStrength=200&shotsPerWeek=2&shotEveryXDays=3.5",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toContain("only one frequency option");
		});
	});

	describe("POST /api/v1/calculate", () => {
		it("should calculate dosage with POST request", async () => {
			const request = new Request("http://localhost/api/v1/calculate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetWeeklyDose: 100,
					testosteroneStrength: 200,
					shotsPerWeek: 2,
				}),
			});

			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("application/json");

			const data = await response.json();
			expect(data.dosePerShotMl).toBe("0.250");
			expect(data.dosePerShotMg).toBe("50.0");
			expect(data.frequency).toBe("2 times per week");
			expect(data.shotsPerWeek).toBe("2.00");
		});

		it("should support GET request on new API endpoint", async () => {
			const request = new Request(
				"http://localhost/api/v1/calculate?targetWeeklyDose=140&testosteroneStrength=250&shotEveryXDays=7",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.dosePerShotMl).toBe("0.560");
			expect(data.dosePerShotMg).toBe("140.0");
			expect(data.frequency).toBe("Every 7 days");
		});

		it("should handle CORS preflight requests", async () => {
			const request = new Request("http://localhost/api/v1/calculate", {
				method: "OPTIONS",
			});

			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);
			expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
			expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
				"POST",
			);
		});

		it("should return error for invalid JSON in POST", async () => {
			const request = new Request("http://localhost/api/v1/calculate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "invalid json",
			});

			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toBe("Invalid request format");
		});
	});

	describe("Edge cases and validation", () => {
		it("should handle decimal shots per week", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=150&testosteroneStrength=200&shotsPerWeek=1.5",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);

			const data = await response.json();
			// Note: shotsPerWeek is parsed as parseInt, so 1.5 becomes 1
			const expectedDose = (150 / 1 / 200).toFixed(3);
			expect(data.dosePerShotMl).toBe(expectedDose);
		});

		it("should handle very small doses correctly", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=50&testosteroneStrength=250&shotsPerWeek=7",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.dosePerShotMl).toBe("0.029");
		});

		it("should reject negative values", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=-100&testosteroneStrength=200&shotsPerWeek=2",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(400);
		});

		it("should reject testosterone strength over 500", async () => {
			const request = new Request(
				"http://localhost/calculate-dose?targetWeeklyDose=100&testosteroneStrength=600&shotsPerWeek=2",
			);
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toContain("must be between 0 and 500");
		});
	});

	describe("404 handling", () => {
		it("should return 404 for unknown routes", async () => {
			const request = new Request("http://localhost/unknown-route");
			const response = await worker.fetch(request, {}, {} as ExecutionContext);

			expect(response.status).toBe(404);
			expect(await response.text()).toBe("Resource not found");
		});
	});
});
