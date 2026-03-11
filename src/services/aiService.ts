import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Truck {
  id: string;
  driver: string;
  location: string;
  destination: string;
  capacity: number;
  status: string;
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  weight: number;
  deadline: string;
  price: number;
  status: string;
}

export async function getMatchingRecommendation(truck: Truck, availableShipments: Shipment[]) {
  const prompt = `
    You are an AI Logistics Dispatcher. 
    A truck has just finished delivery and is currently empty.
    
    Truck Details:
    - ID: ${truck.id}
    - Current Location: ${truck.location}
    - Home Base/Destination: ${truck.destination}
    - Capacity: ${truck.capacity} tons
    
    Available Shipments:
    ${availableShipments.map(s => `- ID: ${s.id}, From: ${s.origin}, To: ${s.destination}, Weight: ${s.weight} tons, Price: ₹${s.price}, Deadline: ${s.deadline}`).join('\n')}
    
    Task:
    Recommend the best shipment for this truck to minimize empty miles and maximize profit.
    Consider:
    1. Distance from truck's current location to shipment origin.
    2. How close the shipment destination is to the truck's home base (${truck.destination}).
    3. Profit margin (Price).
    4. Capacity fit.
    
    Return the response in JSON format:
    {
      "recommendedShipmentId": "S1",
      "reasoning": "Brief explanation why this is the best match.",
      "estimatedProfit": 15000,
      "efficiencyScore": 0.95
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Matching Error:", error);
    return null;
  }
}
