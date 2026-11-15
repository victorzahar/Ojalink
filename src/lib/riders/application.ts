/**
 * Rider application validation (Nigeria).
 *
 * The application captures the rider's vehicle, home area, emergency contact
 * and two guarantors. Identity documents (driver licence, vehicle papers) are
 * NOT collected here — admins verify them through the verification queue and
 * only references are stored.
 */

const RIDER_NOTE_MAX = 200;
const RELATION_MAX = 60;
const NAME_MAX = 80;
const MAP_PIN_MIN = 5;
const MAP_PIN_MAX = 200;

export const riderVehicleTypes = ["motorbike", "tricycle", "car"] as const;
export type RiderVehicleType = (typeof riderVehicleTypes)[number];

const platePattern = /^[A-Za-z0-9-]{5,12}$/;
const phonePattern = /^\+?[0-9\s-]{7,15}$/;

export type RiderApplicationInput = {
  vehicleType: RiderVehicleType;
  plateNumber: string;
  homeMapPin: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  guarantors: [
    { name: string; phone: string; relation: string },
    { name: string; phone: string; relation: string },
  ];
  trainingConfirmed: boolean;
  note: string;
};

export type RiderApplicationResult =
  | { success: true; data: RiderApplicationInput }
  | { success: false };

function readText(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function isValidPhone(value: string): boolean {
  return phonePattern.test(value);
}

/** Guarantor + emergency-contact phones must all differ (guards copy-paste). */
function allPhonesDistinct(phones: string[]): boolean {
  const normalised = phones.map((phone) => phone.replace(/[\s-]/g, ""));
  return new Set(normalised).size === normalised.length;
}

/** Validate the rider application form. */
export function validateRiderApplication(formData: FormData): RiderApplicationResult {
  const vehicleTypeRaw = readText(formData, "vehicleType");
  if (!(riderVehicleTypes as readonly string[]).includes(vehicleTypeRaw)) {
    return { success: false };
  }

  const plateNumber = readText(formData, "plateNumber");
  if (!platePattern.test(plateNumber)) {
    return { success: false };
  }

  const homeMapPin = readText(formData, "homeMapPin");
  if (homeMapPin.length < MAP_PIN_MIN || homeMapPin.length > MAP_PIN_MAX) {
    return { success: false };
  }

  const emergencyContactName = readText(formData, "emergencyContactName");
  if (emergencyContactName.length === 0 || emergencyContactName.length > NAME_MAX) {
    return { success: false };
  }

  const emergencyContactPhone = readText(formData, "emergencyContactPhone");
  if (!isValidPhone(emergencyContactPhone)) {
    return { success: false };
  }

  const guarantors: RiderApplicationInput["guarantors"] = [
    {
      name: readText(formData, "guarantor1Name"),
      phone: readText(formData, "guarantor1Phone"),
      relation: readText(formData, "guarantor1Relation"),
    },
    {
      name: readText(formData, "guarantor2Name"),
      phone: readText(formData, "guarantor2Phone"),
      relation: readText(formData, "guarantor2Relation"),
    },
  ];

  for (const guarantor of guarantors) {
    if (
      guarantor.name.length === 0 ||
      guarantor.name.length > NAME_MAX ||
      !isValidPhone(guarantor.phone) ||
      guarantor.relation.length === 0 ||
      guarantor.relation.length > RELATION_MAX
    ) {
      return { success: false };
    }
  }

  // Two different people, on phones that are not the rider's own.
  if (
    !allPhonesDistinct([
      guarantors[0].phone,
      guarantors[1].phone,
      emergencyContactPhone,
    ])
  ) {
    return { success: false };
  }

  const trainingConfirmed = formData.get("trainingConfirmed") === "on" || formData.get("trainingConfirmed") === "true";
  if (!trainingConfirmed) {
    return { success: false };
  }

  let note = "";
  const rawNote = formData.get("note");
  if (typeof rawNote === "string" && rawNote.trim().length > 0) {
    note = rawNote.trim();
    if (note.length > RIDER_NOTE_MAX) {
      return { success: false };
    }
  }

  return {
    success: true,
    data: {
      vehicleType: vehicleTypeRaw as RiderVehicleType,
      plateNumber: plateNumber.toUpperCase(),
      homeMapPin,
      emergencyContactName,
      emergencyContactPhone,
      guarantors,
      trainingConfirmed,
      note,
    },
  };
}

export function isRiderApplicationUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
