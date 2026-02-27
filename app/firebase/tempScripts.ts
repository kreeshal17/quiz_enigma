import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { firebasedb } from "./firebase.config";

export const clearTeamsCollection = async () => {
  try {
    const teamsCol = collection(firebasedb, "teams");
    const snap = await getDocs(teamsCol);

    if (snap.empty) return { success: true, deleted: 0 };

    const BATCH_SIZE = 500;
    let batch = writeBatch(firebasedb);
    let ops = 0;
    let deleted = 0;

    for (const d of snap.docs) {
      batch.delete(doc(firebasedb, "teams", d.id));
      ops++;
      deleted++;

      if (ops === BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(firebasedb);
        ops = 0;
      }
    }

    if (ops > 0) await batch.commit();

    return { success: true, deleted };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message || String(error),
    };
  }
};