import os
from flask import Flask
from flask_cors import CORS
from app.routes import encryption_routes, blockchain_routes


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Enable CORS for all routes
    cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
    CORS(app, origins=cors_origins if cors_origins[0] != "*" else "*")
    
    # Register blueprints
    app.register_blueprint(encryption_routes.bp, url_prefix="/api")
    app.register_blueprint(blockchain_routes.bp, url_prefix="/api")
    
    @app.route("/api/health", methods=["GET"])
    def health():
        """Health check endpoint."""
        return {"status": "ok", "message": "Server is running"}
    
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
