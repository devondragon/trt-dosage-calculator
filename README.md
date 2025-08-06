# TRT Dosage Calculator

A Cloudflare Worker application that calculates testosterone replacement therapy (TRT) injection dosages based on weekly dose targets, testosterone concentration, and injection frequency.

## Features

- 🧮 **Accurate Dosage Calculations** - Calculate injection volumes based on your prescribed weekly dose
- 🌐 **RESTful API** - Both GET and POST endpoints with CORS support
- 💻 **Web Interface** - User-friendly HTML form with mobile-responsive design
- 💾 **Local Storage** - Saves user preferences for convenience
- ⚡ **Fast & Serverless** - Deployed on Cloudflare Workers for global availability
- 🔒 **Input Validation** - Comprehensive validation with reasonable medical limits
- 📊 **Detailed Results** - Shows volume (ml), amount (mg), and frequency information

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trt-dosage-calculator.git
cd trt-dosage-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Run locally:
```bash
npm run dev
```

The application will be available at `http://localhost:8787`

### Testing

Run the test suite:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## API Usage

### Web Interface
Navigate to the root URL to access the web calculator with a user-friendly form.

### API Endpoints

#### Calculate Dosage (POST)
```bash
curl -X POST "https://your-worker.workers.dev/api/v1/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "targetWeeklyDose": 100,
    "testosteroneStrength": 200,
    "shotsPerWeek": 2
  }'
```

**Response:**
```json
{
  "dosePerShotMl": "0.250",
  "dosePerShotMg": "50.0",
  "shotsPerWeek": "2.00",
  "frequency": "2 times per week"
}
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run publish
```

Make sure you have configured your `wrangler.toml` with your account details.

## Project Structure

```
trt-dosage-calculator/
├── src/
│   └── index.ts          # Main application code (ES modules)
├── test/
│   └── index.test.ts     # Comprehensive test suite
├── API_DOCUMENTATION.md  # Detailed API documentation
├── CLAUDE.md            # AI assistant instructions
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── wrangler.toml        # Cloudflare Workers configuration
└── README.md            # This file
```

## Input Validation

The calculator enforces the following limits for safety:

- **Weekly Dose**: 0-1000 mg
- **Testosterone Strength**: 0-500 mg/ml
- **Shots Per Week**: 1-7
- **Days Between Shots**: 1-30

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Build Tool**: Wrangler

## Recent Improvements

- ✅ Modernized to ES Modules syntax
- ✅ Added comprehensive test coverage (15+ test cases)
- ✅ Implemented loading states and animations
- ✅ Added localStorage for user preferences
- ✅ Created versioned API endpoint with detailed responses
- ✅ Added CORS support for cross-origin requests
- ✅ Improved input validation with medical safety limits
- ✅ Added medical disclaimer
- ✅ Enhanced mobile responsiveness
- ✅ Updated all dependencies to latest versions

## Medical Disclaimer

⚠️ **Important**: This calculator is for informational purposes only. Always consult with your healthcare provider before making any changes to your medication regimen. The calculations provided should be verified by a medical professional.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.