# SecureLog - Blockchain-Powered Tamper-Proof Logging
 
SecureLog is a modern full-stack web application that bridges classical and modern cryptography with blockchain-based immutability. It allows users to encrypt sensitive data using multiple algorithms — RSA, Vigenère, and Playfair — and automatically logs every operation to an internal blockchain, ensuring that no record can be silently altered or deleted after the fact.
The system is built for transparency and verifiability. Each encrypted entry is hashed together with the previous block's hash, forming a cryptographic chain where any tampering is immediately detectable. Users can compare algorithm performance in real time through interactive charts, decrypt stored data using the original keys, and audit the full history of all encryption operations at any time.
Whether you're exploring cryptographic concepts, benchmarking cipher performance, or building a foundation for a tamper-evident audit trail, SecureLog provides a clean, interactive interface backed by a robust Python/Flask backend and a responsive Next.js frontend.
 
## Contributors
 
| Name | Role & Contribution |
|------|---------------------|
| **Mohamed Elfeky** | **Log Design & Core System** — Designed the log structure; implemented hashing + chaining logic where `current hash = hash(encrypted data + previous hash)`; built the log storage system |
| **Mohamed Elhadad** | **Algorithm Implementation & Frontend** — Implemented Playfair Cipher (Encryption & Decryption); contributed to the frontend development |
| **Omar Abdelhamed** | **Algorithm Implementation & Frontend** — Implemented Playfair Cipher (Encryption & Decryption); contributed to the frontend development |
| **Zeyad Ashraf** | **Algorithm Implementation** — Implemented Vigenère Cipher (Encryption & Decryption) |
| **Malak Ahmed** | **Algorithm Implementation** — Implemented RSA (Encryption & Decryption) |
| **Menna Eldemerdash** | **Algorithm Implementation** — Implemented RSA (Encryption & Decryption) |
 
---
 
## Features
 
- **Multi-Algorithm Encryption**: Supports RSA, Vigenère, and Playfair cipher encryption methods
- **Performance Comparison**: Compare execution times across different algorithms with interactive charts
- **Blockchain Integration**: Automatically logs encrypted data to a blockchain for tamper-proof verification
- **Decryption Support**: Decrypt data using stored keys for all supported algorithms
- **History Tracking**: View and manage all previous encryption operations
- **Real-time Stats**: Monitor performance metrics and blockchain integrity
## Tech Stack
 
### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Animations
- **Radix UI** - Headless UI components
- **Recharts** - Data visualization
- **Lucide React** - Icons
### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyCryptodome** - Cryptographic operations (RSA)
- Custom implementations for Vigenère and Playfair ciphers
## Project Structure
 
```
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── navbar.tsx         # Navigation
│   ├── footer.tsx         # Footer
│   ├── encryption-panel.tsx
│   ├── blockchain-viewer.tsx
│   ├── comparison-chart.tsx
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and API functions
├── server/                 # Python Flask backend
│   ├── app/
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   │       ├── blockchain.py
│   │       ├── encryption_service.py
│   │       ├── rsa.py
│   │       ├── vigenere.py
│   │       └── playfair.py
│   └── main.py            # Flask app entry point
├── styles/                 # Global styles
└── public/                 # Static assets
```
 
## Getting Started
 
### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
### Installation
 
1. Clone the repository:
```bash
git clone <repository-url>
cd "Block Chain"
```
 
2. Install frontend dependencies:
```bash
npm install
```
 
3. Install backend dependencies:
```bash
cd server
pip install -r requirements.txt
cd ..
```
 
### Running the Application
 
1. Start the Flask backend:
```bash
cd server
python main.py
```
The backend will run on `http://localhost:5000`
 
2. In a new terminal, start the Next.js frontend:
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`
 
3. Open `http://localhost:3000` in your browser
## API Endpoints
 
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/encrypt` | POST | Encrypt data with specified algorithm |
| `/api/encrypt/all` | POST | Run all algorithms and compare |
| `/api/decrypt` | POST | Decrypt encrypted data |
| `/api/blockchain/add` | POST | Add data to blockchain |
| `/api/blockchain/chain` | GET | Get full blockchain |
| `/api/blockchain/validate` | GET | Validate blockchain integrity |
 
## Encryption Algorithms
 
### RSA
- Asymmetric encryption using public/private key pairs
- Key generation, encryption, and decryption support
- Suitable for secure data transmission
### Vigenère Cipher
- Polyalphabetic substitution cipher
- Uses a keyword for encryption/decryption
- Classical encryption method with historical significance
### Playfair Cipher
- Digraph substitution cipher using a 5×5 matrix
- More secure than simple substitution ciphers
- Based on a keyword for matrix generation
## Blockchain Implementation
 
The blockchain provides tamper-proof logging with:
- **SHA-256 hashing** for block integrity
- **Previous hash linking** to prevent tampering
- **Automatic validation** to detect any modifications
- **Genesis block** as the chain anchor
Each encryption result is automatically logged to the blockchain, creating an immutable record of all operations.
 
## Development
 
### Frontend Development
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
 
### Backend Development
```bash
cd server
python main.py   # Start Flask server (debug mode)
```
 
## Contributing
 
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
## License
 
This project is open source and available under the [MIT License](LICENSE).
 
## Acknowledgments
 - Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)