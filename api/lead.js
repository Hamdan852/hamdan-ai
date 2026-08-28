function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return !value || /^[+()\d\s.-]{7,30}$/.test(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[c]));
}

function hasSmsConfig() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_PHONE &&
    process.env.LEAD_SMS_TO
  );
}

async function sendSms(lead) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;
  const to = process.env.LEAD_SMS_TO;
  const text = [
    `Hamdan AI: New ${lead.industry} lead`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : "Phone: not provided",
    `Request: ${lead.message}`
  ].join("\n").slice(0, 1500);

  const body = new URLSearchParams({ From: from, To: to, Body: text });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`
    },
    body
  });
  if (!response.ok) throw new Error(`SMS provider returned ${response.status}`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (clean(body.website, 80)) return json(res, 400, { error: "spam_detected" });
  if (body.consent !== true) return json(res, 400, { error: "consent_required", message: "Consent is required before sending contact information." });

  const lead = {
    name: clean(body.name, 120),
    email: clean(body.email, 240),
    phone: clean(body.phone, 40),
    message: clean(body.message, 2000),
    industry: clean(body.industry, 80) || "general",
    language: clean(body.language, 80) || "unknown",
    source: clean(body.source, 120) || "hamdan-ai-assistant",
    createdAt: new Date().toISOString()
  };

  if (!lead.name) return json(res, 400, { error: "name_required" });
  if (!lead.email || !validEmail(lead.email)) return json(res, 400, { error: "valid_email_required" });
  if (!validPhone(lead.phone)) return json(res, 400, { error: "invalid_phone" });
  if (!lead.message) return json(res, 400, { error: "message_required" });

  const webhook = process.env.LEAD_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.LEAD_TO_EMAIL;
  const smsReady = hasSmsConfig();

  if (!webhook && !(resendKey && toEmail) && !smsReady) {
    return json(res, 503, { error: "lead_delivery_not_configured", message: "Lead capture is ready, but no business notification destination has been configured yet." });
  }

  const tasks = [];
  const channels = [];
  const payload = { event: "new_lead", lead };

  if (webhook) {
    channels.push("webhook");
    tasks.push(fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(async response => {
      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
    }));
  }

  if (resendKey && toEmail) {
    channels.push("email");
    const subject = `New Hamdan AI lead — ${lead.industry}`;
    const html = `<h2>New customer lead</h2><p><b>Name:</b> ${escapeHtml(lead.name)}</p><p><b>Email:</b> ${escapeHtml(lead.email)}</p><p><b>Phone:</b> ${escapeHtml(lead.phone || "Not provided")}</p><p><b>Industry:</b> ${escapeHtml(lead.industry)}</p><p><b>Language:</b> ${escapeHtml(lead.language)}</p><p><b>Request:</b><br>${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p><p><b>Received:</b> ${escapeHtml(lead.createdAt)}</p>`;
    tasks.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Hamdan AI <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html
      })
    }).then(async response => {
      if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
    }));
  }

  if (smsReady) {
    channels.push("sms");
    tasks.push(sendSms(lead));
  }

  try {
    await Promise.all(tasks);
    return json(res, 200, { success: true, channels, message: "Your information was sent to the business successfully." });
  } catch (error) {
    console.error("Lead delivery failed", error?.message || "Unknown error");
    return json(res, 502, { error: "lead_delivery_failed", message: "We could not deliver your information right now. Please try again later." });
  }
}
