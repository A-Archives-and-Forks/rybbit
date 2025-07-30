import twilio from "twilio";
import { IS_CLOUD } from "./const.js";

let twilioClient: ReturnType<typeof twilio> | undefined;

// Initialize Twilio client only if we have the necessary credentials
if (IS_CLOUD && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  if (!twilioClient) {
    console.log("[SMS] Twilio client not initialized - skipping SMS notification");
    return { success: false, error: "SMS not configured" };
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.error("[SMS] TWILIO_PHONE_NUMBER not configured");
    return { success: false, error: "SMS sender not configured" };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`[SMS] Successfully sent SMS to ${phoneNumber}, SID: ${result.sid}`);
    return { success: true };
  } catch (error) {
    console.error("[SMS] Failed to send SMS:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send SMS" 
    };
  }
};

export const isSMSConfigured = (): boolean => {
  return !!(
    twilioClient && 
    process.env.TWILIO_PHONE_NUMBER &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  );
};