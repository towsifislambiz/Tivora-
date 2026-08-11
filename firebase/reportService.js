import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";

const REPORTS_COLLECTION = "reports";

/**
 * Submit a report for a user, post, comment, or group
 * @param {string} reporterId 
 * @param {string} targetType - "user" | "post" | "comment" | "group"
 * @param {string} targetId 
 * @param {string} reason 
 * @param {string} [description] 
 */
export async function createReport(reporterId, targetType, targetId, reason, description = "") {
  if (!reporterId || !targetType || !targetId || !reason) {
    throw new Error("reporterId, targetType, targetId and reason are required.");
  }

  const reportRef = doc(collection(db, REPORTS_COLLECTION));
  const reportId = reportRef.id;

  const newReport = {
    id: reportId,
    reporterId,
    targetType,
    targetId,
    reason,
    description: description.trim(),
    status: "pending", // "pending" | "reviewed" | "resolved"
    createdAt: serverTimestamp(),
    reviewedAt: null
  };

  await setDoc(reportRef, newReport);
  return newReport;
}

/**
 * Fetch pending reports for Admin Moderation panel
 */
export async function getPendingReports(limitCount = 30) {
  try {
    const reportsRef = collection(db, REPORTS_COLLECTION);
    const q = query(reportsRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);

    const reports = [];
    snap.forEach((docSnap) => {
      reports.push({ ...docSnap.data(), id: docSnap.id });
    });
    return reports;
  } catch (err) {
    console.warn("getPendingReports error:", err);
    return [];
  }
}

/**
 * Update report status (Admin action)
 * @param {string} reportId 
 * @param {string} status - "reviewed" | "resolved"
 */
export async function updateReportStatus(reportId, status) {
  if (!reportId || !status) return;

  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(reportRef, {
    status,
    reviewedAt: serverTimestamp()
  });
}
