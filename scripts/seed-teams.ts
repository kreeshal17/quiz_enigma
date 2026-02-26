/**
 * Seed script — Run once to create the 20 team documents in Firebase.
 *
 * Usage:  npx tsx scripts/seed-teams.ts
 *
 * Make sure your .env file is in the project root with the Firebase config.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env") });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEAM_IDS = [
    "QZLXM", "TRKPA", "VNBQY", "LXFRT", "MZKWP",
    "RQTLY", "BXJNA", "CYRKP", "DZWLT", "PNXQV",
    "GKZRM", "HJQTX", "WPLZN", "KRYMV", "SZTQX",
    "FNLKP", "YTRZX", "MXQPL", "JZKRT", "LQXNV",
];

async function seedTeams() {
    console.log(`Seeding ${TEAM_IDS.length} teams...\n`);

    for (const id of TEAM_IDS) {
        const teamRef = doc(db, "teams", id);
        await setDoc(teamRef, {
            team_name: null,
            is_logged_in: false,
            has_submitted: false,
            score: 0,
            completion_time: null,
        });
        console.log(`  ✔ Created team: ${id}`);
    }

    console.log(`\nDone! ${TEAM_IDS.length} teams seeded.`);
    process.exit(0);
}

seedTeams().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
