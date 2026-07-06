const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

/**
 * @desc    Chat with Groq AI assistant about vehicle specifications and availability
 * @route   POST /api/ai/chat
 * @access  Public
 * 
 * This controller retrieves the live list of vehicles and their confirmed bookings
 * from MongoDB, injects them as real-time context into the LLM system prompt, and
 * forwards the messages to the Groq API (or falls back to a smart local matching helper).
 */
const getAIChatResponse = async (req, res) => {
  try {
    const { messages } = req.body;

    // Validate that the request contains chat history messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required.' });
    }

    // Get the last user message to use for local fallback matching if needed
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Fetch all available vehicles from MongoDB to feed as context for the AI
    const vehicles = await Vehicle.find({ availabilityStatus: true }).populate('owner', 'name').lean();

    // Fetch all confirmed bookings for these active vehicles to detect overlapping dates
    const vehicleIds = vehicles.map(v => v._id);
    const bookings = await Booking.find({
      vehicle: { $in: vehicleIds },
      bookingStatus: 'Confirmed'
    }).lean();

    // Group bookings by vehicle ID
    const bookingsByVehicle = {};
    bookings.forEach(b => {
      const vId = b.vehicle.toString();
      if (!bookingsByVehicle[vId]) {
        bookingsByVehicle[vId] = [];
      }
      bookingsByVehicle[vId].push(b);
    });

    // Format vehicle list for prompt context including booked dates
    const vehicleSummaries = vehicles.map(v => {
      const vId = v._id.toString();
      const vBookings = bookingsByVehicle[vId] || [];
      const bookingsFormatted = vBookings.map(b => {
        const pickupStr = new Date(b.pickupDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
        const returnStr = new Date(b.returnDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
        return `${pickupStr} to ${returnStr}`;
      }).join(', ');

      return `- ${v.brand} ${v.name} (${v.type}): Price ₹${v.pricePerHour}/hr, Location: ${v.location}, Fuel: ${v.fuelType}, Seating: ${v.seatingCapacity} seats, Owner: ${v.owner?.name || 'Unknown'}. Description: ${v.description || 'N/A'}. ALREADY BOOKED DATES: [${bookingsFormatted || 'None'}]`;
    }).join('\n');

    // Retrieve the Groq API key from environment configuration
    const apiKey = process.env.GROQ_API_KEY;

    // Check if Groq API Key is available. If missing, fall back to a demo mode
    // with local heuristic matching to prevent application crash.
    if (!apiKey) {
      console.warn("GROQ_API_KEY is not defined in environment variables. Falling back to local smart assistant responses.");
      const reply = getFallbackResponse(lastUserMessage, vehicles, bookingsByVehicle);
      return res.json({
        message: {
          role: 'assistant',
          content: reply
        },
        demoMode: true
      });
    }

    // Define System Instructions (Strict guardrails and vehicle listing context)
    const systemPrompt = `You are "Vehigo AI", a helpful, professional, and smart AI customer assistant for our premium multi-vehicle rental platform.
            Our platform allows owners to list their vehicles (including cars, bikes, SUVs, scooters, and more) and allows customers to rent them easily.
            Here is the real-time, live list of available vehicles in our database and their booked/reserved dates:${vehicleSummaries || 'No vehicles are currently listed.'}

YOUR STRICT INSTRUCTIONS AND BOUNDARIES:
1. You MUST only answer questions related to vehicles, vehicle rentals, booking procedures, pricing, vehicle specifications, locations, and platform support.
2. If the user asks about ANY topic completely unrelated to vehicle rentals, automotive support, or our platform (for example: coding recipes, writing code, cooking meals, math formulas, general historical events, or academic subjects), you must politely and briefly refuse. Tell them you are only programmed to help with renting cars, bikes, and other vehicles on Vehigo.
3. Be friendly, concise, and highly professional.
4. Recommend specific vehicles from the list above when users ask for suggestions or inquire about cars/bikes in specific cities or price ranges.
5. If someone asks for a vehicle at a specific location, match the "Location" field of the vehicles listed above (e.g., matching Vadodara, Mumbai, Pune, etc.).
6. Provide booking instructions: Users can sign up/log in, browse vehicles from the Vehicle Listing page, click on a vehicle to view its details, select pickup/return dates, and click "Book Now" to confirm their reservation.
7. CRITICAL RULES ON BOOKING AVAILABILITY:
   - For each vehicle, look at its "ALREADY BOOKED DATES" list.
   - If a user asks if a vehicle is available, or wants to check bookings, or requests to book on dates overlapping with these already booked dates, you MUST state clearly and explicitly that the vehicle is already booked for those days. Tell them the exact booked dates and suggest they choose different dates or look at other listed vehicles.
   - Never tell a customer that a vehicle is available on dates it is already booked.
`;

    // Format messages for Groq API (Prepending system prompt)
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      // Send request to Groq Cloud API completions endpoint
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // Groq's high-quality flagship text model
          messages: apiMessages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Groq API Error response (${response.status}):`, errorData);
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      return res.json({
        message: assistantMessage,
        demoMode: false
      });
    } catch (apiError) {
      console.error("Failed to connect to Groq API, falling back to local database match:", apiError.message);
      // Fallback in case of actual API failure
      const reply = getFallbackResponse(lastUserMessage, vehicles, bookingsByVehicle);
      return res.json({
        message: {
          role: 'assistant',
          content: reply
        },
        demoMode: true,
        error: "Groq API call failed. Running in demo mode."
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Heuristic fallback matching for high-quality developer demo experience
function getFallbackResponse(userMessage, vehicles, bookingsByVehicle = {}) {
  const msg = userMessage.toLowerCase();
  
  // Basic guardrail check
  const onTopicKeywords = ['bike', 'car', 'suv', 'scoot', 'rent', 'vehicle', 'price', 'book', 'list', 'show', 'hi', 'hello', 'hey', 'help', 'location', 'where'];
  const isOnTopic = onTopicKeywords.some(keyword => msg.includes(keyword));
  
  if (!isOnTopic && msg.length > 3) {
    return "👋 I am Vehigo AI, your Vehicle Rental Assistant.\n\nI am only programmed to assist you with vehicle rentals, bookings, and inquiries. Please ask about our listed vehicles (cars, bikes, etc.) or how to book them!";
  }
  
  // Format specific recommendations based on user query
  let matched = [];
  if (msg.includes('car')) {
    matched = vehicles.filter(v => v.type.toLowerCase().includes('car') || v.type.toLowerCase().includes('suv'));
  } else if (msg.includes('bike') || msg.includes('scoot') || msg.includes('cycle')) {
    matched = vehicles.filter(v => v.type.toLowerCase().includes('bike') || v.type.toLowerCase().includes('scoot') || v.type.toLowerCase().includes('motorcycle'));
  } else {
    matched = vehicles.slice(0, 3); // top 3
  }
  
  let responseText = "👋 **Hello! I am Vehigo AI, your Vehicle Rental Assistant.**\n\n";
  responseText += "⚠️ *Demo Mode Notice: GROQ_API_KEY is not configured in `.env` yet.* However, here is real-time availability from our database:\n\n";
  
  if (vehicles.length === 0) {
    responseText += "We currently have no vehicles uploaded in the system database. Once an owner registers a car or bike, it will display here!";
    return responseText;
  }

  if (matched.length > 0) {
    responseText += `Here are some available vehicles currently listed on our platform:\n\n`;
    matched.forEach(v => {
      const vId = v._id.toString();
      const vBookings = bookingsByVehicle[vId] || [];
      const bookingsStr = vBookings.length > 0 
        ? ` (Booked Dates: ${vBookings.map(b => `${new Date(b.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${new Date(b.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`).join(', ')})`
        : ' (Fully Available)';
      responseText += `- **${v.brand} ${v.name}** (${v.type}) - **₹${v.pricePerHour}/hr** in *${v.location}*${bookingsStr}\n`;
    });
    responseText += `\nTo book any of these, simply sign up, browse our **Vehicle Listings**, choose a vehicle, and hit **Book Now**!`;
  } else {
    responseText += "I couldn't find vehicles matching your specific filters in our database. You can try searching for 'car' or 'bike', or look at the listings page!";
  }
  
  return responseText;
}

module.exports = {
  getAIChatResponse
};
