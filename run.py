#!/usr/bin/env python3
"""
Sanskrit Manuscript Reconstruction Portal - System Launcher

Automated startup script that verifies prerequisites and launches both
backend and frontend services.

Usage:
    python run.py              # Start the complete system
    python run.py --check      # Check prerequisites only
    python run.py --help       # Display help information

System Requirements:
    - Python 3.8 or higher
    - Node.js 14 or higher
    - npm package manager

The script performs prerequisite checks, sets up necessary directories,
and coordinates the startup of FastAPI backend and React frontend servers.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def check_requirements():
    """Check if required tools are installed"""
    print("🔍 Checking requirements...")
    
    # Check Python
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    
    print(f"✅ Python {sys.version.split()[0]} found")
    
    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()} found")
        else:
            print("❌ Node.js not found. Please install Node.js 16+")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found. Please install Node.js 16+")
        return False
    
    # Check npm
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ npm {result.stdout.strip()} found")
        else:
            print("❌ npm not found")
            return False
    except FileNotFoundError:
        print("❌ npm not found")
        return False
    
    return True

def setup_system():
    """Run the setup script"""
    print("\n🔧 Setting up system...")
    
    try:
        subprocess.run([sys.executable, "setup-complete.py"], check=True)
        print("✅ System setup completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Setup failed: {e}")
        return False
    except FileNotFoundError:
        print("❌ setup-complete.py not found")
        return False

def start_system():
    """Start the complete system"""
    print("\n🚀 Starting Sanskrit Manuscript Reconstruction Portal...")
    
    try:
        # Start the local development server
        subprocess.run([sys.executable, "run_local.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 System stopped by user")
    except Exception as e:
        print(f"❌ Failed to start system: {e}")
        return False
    
    return True

def run_tests():
    """Run system tests"""
    print("\n🧪 Running system tests...")
    
    try:
        result = subprocess.run([sys.executable, "test_system.py"], 
                              capture_output=True, text=True)
        
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        return False

def main():
    """Main function"""
    print("🔥 Sanskrit Manuscript Reconstruction Portal")
    print("   Intelligent AI-Powered Sanskrit Manuscript Analysis")
    print("=" * 60)
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements check failed. Please install missing dependencies.")
        sys.exit(1)
    
    # Setup system
    if not setup_system():
        print("\n❌ System setup failed.")
        sys.exit(1)
    
    # Ask user what to do
    print("\n🎯 What would you like to do?")
    print("1. Start the system (recommended)")
    print("2. Run tests only")
    print("3. Setup only (already done)")
    print("4. Exit")
    
    try:
        choice = input("\nEnter your choice (1-4): ").strip()
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
        sys.exit(0)
    
    if choice == "1":
        print("\n🚀 Starting the complete system...")
        print("   This will start both backend and frontend servers.")
        print("   Press Ctrl+C to stop the system.")
        
        # Wait a moment then open browser
        def open_browser():
            time.sleep(5)
            try:
                webbrowser.open("http://localhost:3000")
            except:
                pass
        
        import threading
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        start_system()
        
    elif choice == "2":
        print("\n🧪 Running tests...")
        if run_tests():
            print("\n✅ All tests passed!")
        else:
            print("\n❌ Some tests failed. Check the output above.")
            
    elif choice == "3":
        print("\n✅ Setup completed. You can now:")
        print("   • Run 'python run.py' to start the system")
        print("   • Run 'python test_system.py' to test")
        print("   • Run 'python run_local.py' for development")
        
    elif choice == "4":
        print("\n👋 Goodbye!")
        
    else:
        print("\n❌ Invalid choice. Please run the script again.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)