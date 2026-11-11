const RIDER_NOTE_MAX = 200;

export type RiderApplicationInput = {
  note: string;
};

export type RiderApplicationResult =
  | { success: true; data: RiderApplicationInput }
  | { success: false };

/** Validate the rider application form. Only an optional note today. */
export function validateRiderApplication(formData: FormData): RiderApplicationResult {
  const rawNote = formData.get("note");

  let note = "";
  if (typeof rawNote === "string" && rawNote.length > 0) {
    note = rawNote.trim();
    if (note.length > RIDER_NOTE_MAX) {
      return { success: false };
    }
  }

  return { success: true, data: { note } };
}

export function isRiderApplicationUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
