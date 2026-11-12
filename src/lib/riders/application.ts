const RIDER_NOTE_MAX = 200;

export type RiderApplicationInput = {
  note: string;
  vehicleType?: string;
  plateNumber?: string;
  deliveryZone?: string;
  nin?: string;
  phone?: string;
  emergencyPhone?: string;
  emergencyName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorRelationship?: string;
  guarantorAddress?: string;
  portraitImage?: string;
};

export type RiderApplicationResult =
  | { success: true; data: RiderApplicationInput }
  | { success: false; error?: string };

function sanitize(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/** Validate the rider application form, supporting both legacy and full verification workflows. */
export function validateRiderApplication(formData: FormData): RiderApplicationResult {
  const note = sanitize(formData.get("note"));
  if (note.length > RIDER_NOTE_MAX) {
    return { success: false, error: "Note exceeds 200 characters." };
  }

  const vehicleType = sanitize(formData.get("vehicleType"));
  const plateNumber = sanitize(formData.get("plateNumber"));
  const deliveryZone = sanitize(formData.get("deliveryZone"));
  const nin = sanitize(formData.get("nin"));
  const phone = sanitize(formData.get("phone"));
  const emergencyPhone = sanitize(formData.get("emergencyPhone"));
  const emergencyName = sanitize(formData.get("emergencyName"));
  const bankName = sanitize(formData.get("bankName"));
  const bankAccountNumber = sanitize(formData.get("bankAccountNumber"));
  const bankAccountName = sanitize(formData.get("bankAccountName"));
  const guarantorName = sanitize(formData.get("guarantorName"));
  const guarantorPhone = sanitize(formData.get("guarantorPhone"));
  const guarantorRelationship = sanitize(formData.get("guarantorRelationship"));
  const guarantorAddress = sanitize(formData.get("guarantorAddress"));
  const portraitImage = sanitize(formData.get("portraitImage"));

  // If NIN is provided, it must be 11 digits
  if (nin && !/^\d{11}$/.test(nin.replace(/\s+/g, ""))) {
    return { success: false, error: "National Identity Number (NIN) must be 11 digits." };
  }

  // If bank account is provided, NUBAN must be 10 digits
  if (bankAccountNumber && !/^\d{10}$/.test(bankAccountNumber.replace(/\s+/g, ""))) {
    return { success: false, error: "Bank account number (NUBAN) must be 10 digits." };
  }

  return {
    success: true,
    data: {
      note,
      vehicleType: vehicleType || undefined,
      plateNumber: plateNumber || undefined,
      deliveryZone: deliveryZone || undefined,
      nin: nin || undefined,
      phone: phone || undefined,
      emergencyPhone: emergencyPhone || undefined,
      emergencyName: emergencyName || undefined,
      bankName: bankName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      bankAccountName: bankAccountName || undefined,
      guarantorName: guarantorName || undefined,
      guarantorPhone: guarantorPhone || undefined,
      guarantorRelationship: guarantorRelationship || undefined,
      guarantorAddress: guarantorAddress || undefined,
      portraitImage: portraitImage || undefined,
    },
  };
}

export function isRiderApplicationUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
