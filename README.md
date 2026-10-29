RescueBite – Food Redistribution Platform

RescueBite is a full-stack web application that connects restaurants, hostels, NGOs, and volunteers to redistribute surplus food and reduce food waste. It uses a Python-based matching algorithm to prioritize donations based on expiry deadlines, geographical proximity, and recipient capacity.

Features:
User Authentication: Registration and login with role-based access.
Food Donation Management: Create, browse, and manage surplus food listings.
Donation Requests: Enable NGOs to request food and track approval status.
Smart Matching: Rank suitable recipients using Python and FastAPI.
Pickup Tracking: Manage donation collection and delivery status.
Analytics Dashboard: Visualize donation trends and redistribution outcomes.

Tech Stack:
1. Frontend: React.js, Vite, Tailwind CSS, Recharts
2. Backend: Node.js, Express.js, REST APIs
3. Database: MongoDB, Mongoose
4. Authentication: JWT, bcrypt

Getting Started:
Prerequisites: Node.js, Python, npm, and MongoDB
Clone the repository:
git clone <your-repository-url>
Install frontend dependencies:
cd frontend && npm install

Install backend dependencies:
cd ../backend && npm install
Install Python dependencies:
cd ../intelligence
pip install -r requirements.txt
Configure environment variables using the provided .env.example files.
Start the frontend, backend, and Python service in separate terminals using their configured start commands.

Project Goal
To reduce avoidable food waste by making surplus food easier to discover, match, and redistribute to communities in need.

Future Enhancements
Real-time notifications
Interactive donation maps
Surplus food prediction
Advanced impact analytics
