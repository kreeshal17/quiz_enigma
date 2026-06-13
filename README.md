# Quiz Enigma

Quiz Enigma is a real-time quiz competition platform built for conducting technical and aptitude-based contests. The platform provides a secure team-based login system, live quiz management, leaderboard tracking, and multi-round progression controls through an admin dashboard.

## Features

### Team-Based Authentication

* Teams are created by the administrator.
* Each team receives a unique Team ID and password.
* Participants can access the quiz only through valid credentials.

### Real-Time Quiz Management

* Questions are served dynamically.
* Live synchronization using Firebase.
* Instant response updates without page refresh.

### Admin Dashboard

* Create and manage teams.
* Monitor participant activity in real time.
* View team scores and rankings.
* Pause or resume the quiz for all participants instantly.
* Control quiz progression from a centralized dashboard.

### Leaderboard System

* Real-time leaderboard updates.
* Automatic score calculation.
* Ranking based on participant performance.

### Multi-Round Competition

* Conduct multiple rounds of quizzes.
* Promote selected teams from Round 1 to Round 2 directly from the admin panel.
* Separate logic for different competition stages.

### Additional Features

* Difficulty tagging for questions.
* Submission controls.
* Pause overlay for participants during admin interventions.
* Real-time event listeners powered by Firebase.

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend & Database

* Firebase Authentication
* Cloud Firestore
* Firebase Real-Time Data Synchronization

### UI Components

* shadcn/ui

## Project Structure

```text
quiz_enigma/
├── app/
├── components/
│   └── ui/
├── lib/
├── public/
├── scripts/
├── package.json
└── firebase configuration
```

## How It Works

### Administrator Workflow

1. Create teams from the admin dashboard.
2. Assign Team IDs and passwords.
3. Start the quiz session.
4. Monitor participant progress in real time.
5. Pause or resume the quiz whenever required.
6. View leaderboard standings.
7. Promote qualified teams to the next round.

### Participant Workflow

1. Login using the provided Team ID and password.
2. Access the active quiz.
3. Submit answers within the allotted time.
4. Track performance through leaderboard updates.
5. Qualify for subsequent rounds based on score.

## Installation

### Clone Repository

```bash
git clone https://github.com/kreeshal17/quiz_enigma.git
cd quiz_enigma
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file and add your Firebase credentials.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Future Improvements

* AI-generated questions
* Question randomization
* Advanced analytics dashboard
* Exportable result reports
* Automated qualification criteria
* Timer-based round scheduling

## Author

Krishal Karna

GitHub: https://github.com/kreeshal17

## License

This project is licensed under the MIT License.
