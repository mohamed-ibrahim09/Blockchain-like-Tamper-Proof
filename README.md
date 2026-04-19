# Blockchain Logging System

A modern, visually appealing frontend for a "Blockchain-like Tamper-Proof Logging System" using React (Vite) and Node.js (Express).

## Features

- **Upload Section**: Drag & drop file upload or manual text entry for logs
- **Encryption Panel**: Multiple encryption algorithms (RSA, Playfair, Vigenère) with hybrid mode
- **Blockchain Viewer**: Visual representation of blocks with integrity verification
- **Results Display**: Detailed encryption results with hash information
- **Responsive Design**: Mobile-friendly dark theme with cyberpunk aesthetics
- **Animations**: Smooth Framer Motion animations and particle effects

## Tech Stack

### Frontend
- React 18 with Vite
- TailwindCSS for styling
- Framer Motion for animations
- Axios for API communication

### Backend
- Node.js with Express
- Mock encryption implementations
- RESTful API endpoints
- In-memory blockchain storage

## Project Structure

```
/
/client
  /src
    /components
      - UploadSection.jsx
      - EncryptionPanel.jsx
      - BlockchainViewer.jsx
      - ResultDisplay.jsx
      - Navbar.jsx
      - Footer.jsx
      - Loader.jsx
      - AnimatedBackground.jsx
    /pages
      - Home.jsx
    /services
      - api.js
    App.jsx
    main.jsx
    index.css
    tailwind.config.js
    vite.config.js
/server
  /routes
    - encrypt.js
    - verify.js
    - chain.js
  /controllers
    - encryptController.js
    - verifyController.js
    - chainController.js
  /services
    - blockchainService.js
  server.js
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockchain-logging-system
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../server
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   # or for development with auto-reload
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

### API Endpoints

- `POST /api/encrypt` - Encrypt data with specified algorithm
- `POST /api/verify` - Verify blockchain integrity
- `GET /api/chain` - Get entire blockchain
- `GET /api/chain/:id` - Get specific block
- `GET /api/health` - Health check endpoint

## Usage

1. **Upload Logs**: Either drag & drop a `.txt` or `.log` file, or paste text manually
2. **Choose Algorithm**: Select RSA, Playfair, or Vigenère encryption (enable hybrid mode for enhanced security)
3. **Encrypt**: Click the encrypt button to process your data
4. **Verify Chain**: Check blockchain integrity to ensure no tampering
5. **View Results**: See encrypted data, hash values, and download results

## Design Features

- **Dark Theme**: Cybersecurity-inspired dark interface
- **Glassmorphism**: Modern glass-like card effects
- **Neon Accents**: Green and blue neon colors for cyberpunk aesthetic
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive**: Works seamlessly on mobile and desktop
- **Interactive Elements**: Hover effects, loading states, and micro-interactions

## Security Notes

- This is a demonstration project with mock encryption implementations
- In production, use proper cryptographic libraries
- Blockchain storage should use a persistent database
- Implement proper authentication and authorization

## Development

### Adding New Encryption Algorithms

1. Update the algorithm list in `EncryptionPanel.jsx`
2. Add mock implementation in `server/controllers/encryptController.js`
3. Update API service if needed

### Customizing Theme

Modify `tailwind.config.js` and `client/src/index.css` to adjust colors and animations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Future Enhancements

- Real cryptographic implementations
- Persistent blockchain storage
- User authentication
- Advanced visualization options
- Performance metrics dashboard
- Export/import functionality
