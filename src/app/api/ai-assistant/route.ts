import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gpsProvider } from "@/lib/gps-provider";
import { ensureReady } from "@/lib/init";
import { formatTime, formatDuration, getBusTypeLabel } from "@/lib/utils";

/**
 * AI Travel Assistant
 * =====================
 * Uses rule-based NLP to answer travel questions using live demo data.
 * 
 * To integrate a real LLM (OpenAI, Anthropic etc):
 * 1. Set OPENAI_API_KEY in .env
 * 2. Replace the rule-based engine below with an LLM call
 * 3. Pass the bus/route context as system prompt
 */

function detectLanguage(text: string): "mr" | "hi" | "en" {
  const marathi = /[\u0900-\u097F]/.test(text) && /आहे|जायचे|बस|मला|पुण्याला|अहमदनगर/.test(text);
  const hindi = /[\u0900-\u097F]/.test(text);
  if (marathi) return "mr";
  if (hindi) return "hi";
  return "en";
}

function extractCities(text: string): string[] {
  const cities = ["ahmednagar", "pune", "nashik", "mumbai", "shirdi", "kopargaon", "sangamner", "lonavala", "panvel", "kalyan"];
  const marathi: Record<string, string> = {
    "अहमदनगर": "ahmednagar", "पुणे": "pune", "पुण्याला": "pune", "नाशिक": "nashik",
    "मुंबई": "mumbai", "शिर्डी": "shirdi",
  };
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const c of cities) if (lower.includes(c)) found.push(c);
  for (const [mr, en] of Object.entries(marathi)) if (text.includes(mr)) found.push(en);
  return [...new Set(found)];
}

export async function POST(req: NextRequest) {
  await ensureReady();
  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const lang = detectLanguage(message);
  const lower = message.toLowerCase();
  const cities = extractCities(message);

  let reply = "";

  // Intent: find bus from → to
  if ((lower.includes("bus") || lower.includes("बस") || lower.includes("reach") || lower.includes("travel") || lower.includes("जायचे")) && cities.length >= 2) {
    const from = cities[0];
    const to = cities[1];

    const result = await db.execute({
      sql: `SELECT t.id, t.status, t.delay_minutes, t.scheduled_departure, t.scheduled_arrival,
                   b.bus_number, b.bus_type, r.route_number, r.name as route_name,
                   r.fare_ordinary, r.estimated_duration_min
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            JOIN routes r ON t.route_id = r.id
            WHERE t.status IN ('scheduled', 'in_progress')
              AND (LOWER(r.origin) LIKE ? OR LOWER(r.origin) LIKE ?)
              AND (LOWER(r.destination) LIKE ? OR LOWER(r.destination) LIKE ?)
              AND DATE(t.scheduled_departure) = DATE('now')
            ORDER BY t.scheduled_departure ASC LIMIT 3`,
      args: [`%${from}%`, `%${from}%`, `%${to}%`, `%${to}%`],
    });

    if (result.rows.length === 0) {
      if (lang === "mr") reply = `माफ करा, आज ${from} ते ${to} साठी कोणतीही बस उपलब्ध नाही. कृपया उद्या किंवा वेगळी तारीख तपासा.`;
      else if (lang === "hi") reply = `माफ़ करें, आज ${from} से ${to} के लिए कोई बस उपलब्ध नहीं है। कृपया कल या किसी और तारीख को देखें।`;
      else reply = `No buses found from ${from} to ${to} today. Try searching for tomorrow or a different date.`;
    } else {
      const buses = result.rows.map((b) => {
        const dep = formatTime(b.scheduled_departure as string);
        const arr = formatTime(b.scheduled_arrival as string);
        const dur = formatDuration(b.estimated_duration_min as number);
        const delayNote = (b.delay_minutes as number) > 0 ? ` (⚠️ Delayed ${b.delay_minutes} min)` : " ✅ On time";
        return `• **${b.bus_number}** (${getBusTypeLabel(b.bus_type as string)}) — Dep: ${dep}, Arr: ${arr}, Duration: ${dur}${delayNote}, Fare: ₹${b.fare_ordinary}`;
      });

      if (lang === "mr") {
        reply = `${from} ते ${to} साठी आजच्या बसेस:\n\n${buses.join("\n")}\n\n⚠️ हे सिम्युलेटेड डेटा आहे. वास्तविक MSRTC वेळापत्रक तपासा.`;
      } else if (lang === "hi") {
        reply = `${from} से ${to} के लिए आज की बसें:\n\n${buses.join("\n")}\n\n⚠️ यह सिमुलेटेड डेटा है। वास्तविक MSRTC शेड्यूल चेक करें।`;
      } else {
        reply = `Here are today's buses from **${from}** to **${to}**:\n\n${buses.join("\n")}\n\n⚠️ This is simulated demo data. Please verify with the official MSRTC schedule.`;
      }
    }
  }
  // Intent: where is my bus / bus location
  else if (lower.includes("where") || lower.includes("location") || lower.includes("कुठे") || lower.includes("कहाँ")) {
    const locations = gpsProvider.getAllLocations().slice(0, 3);
    if (locations.length === 0) {
      reply = lang === "mr" ? "सध्या कोणत्याही बसचे स्थान उपलब्ध नाही." :
              lang === "hi" ? "अभी किसी भी बस का स्थान उपलब्ध नहीं है।" :
              "No bus location data is currently available.";
    } else {
      const info = locations.map((l) => `• Trip ${l.tripId.slice(-8)}: ${l.speedKmh.toFixed(0)} km/h, Next stop in ${l.etaToNextStopMin} min`).join("\n");
      reply = `Currently tracking ${locations.length} active buses (simulated data):\n\n${info}\n\nUse Live Tracking to see real-time map positions.`;
    }
  }
  // Intent: fastest bus
  else if (lower.includes("fastest") || lower.includes("quick") || lower.includes("जलद") || lower.includes("तेज़")) {
    reply = lang === "mr" ? "सर्वात जलद बस शोधण्यासाठी बस शोध वापरा आणि 'जलद' फिल्टर निवडा." :
            lang === "hi" ? "सबसे तेज़ बस खोजने के लिए बस सर्च का उपयोग करें और 'तेज़' फ़िल्टर चुनें।" :
            "To find the fastest bus, use the Bus Search and select the **Fastest** filter. Luxury and Semi-Luxury buses typically run express routes with fewer stops.";
  }
  // Intent: when to leave
  else if (lower.includes("when") || lower.includes("leave") || lower.includes("depart") || lower.includes("कधी")) {
    reply = lang === "mr" ? "निघण्याची वेळ जाणण्यासाठी बस शोध वापरा. तुमच्या इच्छित बसची वेळ पाहा आणि थांब्यावर पोहोचण्यासाठी किमान १५ मिनिटे आधी जा." :
            lang === "hi" ? "जाने का समय जानने के लिए बस सर्च का उपयोग करें। अपनी इच्छित बस का समय देखें और कम से कम 15 मिनट पहले स्टॉप पर पहुंचें।" :
            "Use Bus Search to find your desired bus timing. I recommend arriving at the bus stop **at least 15 minutes before** the scheduled departure.";
  }
  // Intent: greetings
  else if (lower.match(/^(hi|hello|hey|नमस्ते|नमस्कार|हॅलो)[\s!.]*$/)) {
    if (lang === "mr") reply = "नमस्कार! 🙏 मी महाएसटी AI प्रवास सहाय्यक आहे. तुम्हाला कोणत्या मार्गावर बस हवी आहे?";
    else if (lang === "hi") reply = "नमस्ते! 🙏 मैं MahaST AI यात्रा सहायक हूं। आपको किस मार्ग पर बस चाहिए?";
    else reply = "Hello! 👋 I'm the **MahaST AI Travel Assistant**. I can help you find buses, routes, and travel information across Maharashtra.\n\nTry asking:\n• \"Buses from Ahmednagar to Pune today\"\n• \"Which bus is fastest to Nashik?\"\n• \"When should I leave for Shirdi?\"";
  }
  // Default
  else {
    if (lang === "mr") reply = "माफ करा, मला ते समजले नाही. कृपया तुमचा प्रश्न अशा प्रकारे विचारा: 'अहमदनगर ते पुणे बस' किंवा 'पुण्याला कधी जायचे?'";
    else if (lang === "hi") reply = "माफ़ करें, मुझे वह समझ नहीं आया। कृपया अपना प्रश्न इस तरह पूछें: 'अहमदनगर से पुणे बस' या 'पुणे कब जाना है?'";
    else reply = "I'm not sure I understood that. Try asking:\n• \"Buses from [city] to [city]\"\n• \"Where is my bus?\"\n• \"Which is the fastest bus to Pune?\"\n• \"When should I leave for Mumbai?\"";
  }

  return NextResponse.json({
    reply,
    language: lang,
    isSimulated: true,
    disclaimer: "This assistant uses simulated demo data. For official schedules, visit msrtc.maharashtra.gov.in",
  });
}
