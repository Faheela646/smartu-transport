const QR_TYPE = "SMARTU_STUDENT";

export function createStudentQrPayload(student) {
  return JSON.stringify({
    type: QR_TYPE,
    studentId: student.id,
    rollNo: student.rollNo,
  });
}

export function parseStudentQrPayload(value) {
  if (typeof value !== "string") return null;

  try {
    const payload = JSON.parse(value);
    if (
      payload?.type !== QR_TYPE ||
      typeof payload.studentId !== "string" ||
      typeof payload.rollNo !== "string"
    ) {
      return null;
    }
    return { studentId: payload.studentId, rollNo: payload.rollNo };
  } catch {
    return null;
  }
}
