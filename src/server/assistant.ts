// ZS Events - Luxury Event & Floral Assistant
// Built-in intelligent quotation builder and communication generator
// Runs completely locally with ZERO API key required!

export interface QuotationSuggestionRequest {
  eventType: string;
  theme?: string;
  budget?: number;
  location?: string;
  specialRequirements?: string;
}

export interface AIQuotationItem {
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface AIQuotationResponse {
  themeName: string;
  palette: string[];
  suggestedItems: AIQuotationItem[];
  flowerList: string[];
  designNotes: string;
  estimatedLaborDays: number;
}

export async function generateQuotationSuggestions(
  req: QuotationSuggestionRequest
): Promise<AIQuotationResponse> {
  // Pure local intelligence engine - zero external API or key needed
  const event = (req.eventType || 'Wedding').toLowerCase();
  const targetBudget = req.budget && req.budget > 25000 ? req.budget : 180000;

  if (event.includes('wedding') || event.includes('reception')) {
    const stageVal = Math.round(targetBudget * 0.44);
    const archVal = Math.round(targetBudget * 0.22);
    const aisleVal = Math.round(targetBudget * 0.18);
    const tableVal = Math.round(targetBudget * 0.16);

    return {
      themeName: req.theme || 'Royal Blush & Jasmine Elegance',
      palette: ['#831843', '#F472B6', '#FDE047', '#0F172A'],
      suggestedItems: [
        {
          description: `Grand Floral Stage Backdrop (36ft x 12ft) with layered avalanche white & blush pink roses, hanging brass bells & baby's breath halos`,
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: stageVal,
          amount: stageVal,
        },
        {
          description: `Monumental 4-Pillar Floral Entrance Arch with dense Madurai Mogra strands & pink lotus focal accents`,
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: archVal,
          amount: archVal,
        },
        {
          description: `Mirrored VIP Aisle Walkway with 10 Elevated Crystal & Floral Pedestals`,
          hsnSac: '998599',
          quantity: 10,
          unit: 'Units',
          unitPrice: Math.round(aisleVal / 10),
          amount: aisleVal,
        },
        {
          description: `Round Table Centerpieces with brass urlis, floating tea-lights & rose petals`,
          hsnSac: '998599',
          quantity: 12,
          unit: 'Tables',
          unitPrice: Math.round(tableVal / 12),
          amount: tableVal,
        },
      ],
      flowerList: [
        'Dutch Avalanche Roses (Blush & Ivory)',
        'Fresh Madurai Mogra (Jasmine)',
        'Hosur Pink Oriental Lilies',
        'Gypsophila (Baby\'s Breath)',
        'Pink Indian Lotuses',
        'Eucalyptus Gunni foliage',
      ],
      designNotes:
        'Procure fresh blooms from Hosur cold chain at 4:00 AM on event day. Stage structure assembly begins 8 hours before guest arrival.',
      estimatedLaborDays: 2,
    };
  } else if (event.includes('mehendi') || event.includes('haldi')) {
    const backdropVal = Math.round(targetBudget * 0.48);
    const jhulaVal = Math.round(targetBudget * 0.32);
    const urliVal = Math.round(targetBudget * 0.20);

    return {
      themeName: req.theme || 'Sunny Marigold & Bougainvillea Vibe',
      palette: ['#EAB308', '#F97316', '#EC4899', '#059669'],
      suggestedItems: [
        {
          description: 'Custom Ombre Marigold Backdrop with yellow & orange strings and brass parrot hangings',
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: backdropVal,
          amount: backdropVal,
        },
        {
          description: 'Floral Decorated Teak Wood Jhula (Swing) with dense marigold & pink rose cushions',
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: jhulaVal,
          amount: jhulaVal,
        },
        {
          description: '6 Giant Brass Urlis with floating orange marigold petals and brass lotus cutouts',
          hsnSac: '998599',
          quantity: 6,
          unit: 'Units',
          unitPrice: Math.round(urliVal / 6),
          amount: urliVal,
        },
      ],
      flowerList: [
        'Kolkata Orange Marigold',
        'Bangalore Golden Yellow Marigold',
        'Pink Garden Bougainvillea',
        'Red Sevanti (Chrysanthemum)',
        'Fresh Mango Leaves',
      ],
      designNotes: 'Pre-string marigolds the previous evening. Mist hourly with cold water to maintain peak vibrance.',
      estimatedLaborDays: 1,
    };
  } else if (event.includes('sangeet') || event.includes('cocktail')) {
    const djVal = Math.round(targetBudget * 0.45);
    const barVal = Math.round(targetBudget * 0.30);
    const loungeVal = Math.round(targetBudget * 0.25);

    return {
      themeName: req.theme || 'Glamorous Midnight Violet & Orchids',
      palette: ['#581C87', '#3B82F6', '#F43F5E', '#1E1B4B'],
      suggestedItems: [
        {
          description: 'Illuminated DJ Truss & Stage Floral Framing with deep purple orchids & neon floral installations',
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: djVal,
          amount: djVal,
        },
        {
          description: 'Island Bar Canopy adorned with cascading wisteria vines, crystal prisms, and amaranthus',
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: barVal,
          amount: barVal,
        },
        {
          description: 'VIP Lounge Cabana Table Florals with floating candles and black calla lilies',
          hsnSac: '998599',
          quantity: 8,
          unit: 'Tables',
          unitPrice: Math.round(loungeVal / 8),
          amount: loungeVal,
        },
      ],
      flowerList: [
        'Purple Dendrobium Orchids',
        'White Phalaenopsis Orchids',
        'Hanging Burgundy Amaranthus',
        'Deep Plum Carnations',
        'Italian Ruscus greens',
      ],
      designNotes: 'Lighting must sync with violet & magenta hues. Assemble hanging elements with safety-rated cables.',
      estimatedLaborDays: 2,
    };
  } else {
    const mainVal = Math.round(targetBudget * 0.58);
    const podiumVal = Math.round(targetBudget * 0.22);
    const diningVal = Math.round(targetBudget * 0.20);

    return {
      themeName: req.theme || 'Minimalist Modern Botanical',
      palette: ['#047857', '#F3F4F6', '#1E293B', '#D97706'],
      suggestedItems: [
        {
          description: 'Sleek Stage Backdrop with tropical monstera leaves, white orchids, and gold metal geo-frames',
          hsnSac: '998599',
          quantity: 1,
          unit: 'Set',
          unitPrice: mainVal,
          amount: mainVal,
        },
        {
          description: 'Executive Speaker Podium Floral Arrangement with white cymbidium orchids & anthuriums',
          hsnSac: '998599',
          quantity: 2,
          unit: 'Sets',
          unitPrice: Math.round(podiumVal / 2),
          amount: podiumVal,
        },
        {
          description: 'Executive Lounge Low-Profile Glass Floral Vases with calla lilies and bamboo shoots',
          hsnSac: '998599',
          quantity: 8,
          unit: 'Units',
          unitPrice: Math.round(diningVal / 8),
          amount: diningVal,
        },
      ],
      flowerList: [
        'White Cymbidium Orchids',
        'White Anthuriums',
        'Monstera Deliciosa Leaves',
        'Areca Palm Fronds',
        'White Calla Lilies',
      ],
      designNotes: 'Structured clean aesthetic. Florals hydrated with floral foam and placed 2 hours before conference.',
      estimatedLaborDays: 1,
    };
  }
}

export async function generateWhatsAppPitch(params: {
  customerName: string;
  eventType: string;
  eventDate: string;
  budget?: number;
  serviceRequired?: string;
  tone?: 'WARM' | 'LUXURY' | 'URGENT' | 'FOLLOW_UP';
}): Promise<string> {
  const { customerName, eventType, eventDate } = params;
  const budgetStr = params.budget ? `₹${params.budget.toLocaleString('en-IN')}` : 'your planned budget';

  if (params.tone === 'FOLLOW_UP') {
    return `Hi ${customerName}! 🌸\n\nTrust you are doing wonderful! This is Syed from *Z S EVENTS Bangalore*.\n\nI wanted to check in regarding the floral design proposal we prepared for your upcoming *${eventType}* on *${eventDate}*.\n\nWe have reserved the seasonal fresh bloom allocations with our Hosur greenhouse growers. Would you like to schedule a quick 10-minute design call or visit our Indiranagar studio to review the 3D mockups and flower samples?\n\nLooking forward to creating something unforgettable for you! ✨`;
  }

  if (params.tone === 'URGENT') {
    return `Dear ${customerName}, warm greetings from *Z S EVENTS Bangalore*! 🌺\n\nRegarding your *${eventType}* on *${eventDate}*:\nWe have received multiple inquiries for this date and our master floral staging crew has limited capacity for that weekend.\n\nTo lock in your date on our staging calendar and secure early-booking floral rates within ${budgetStr}, please let us know if we can confirm the quotation today.\n\nShall I send over the official booking confirmation link? 📝`;
  }

  if (params.tone === 'WARM') {
    return `Hello ${customerName}! Warmest congratulations on your upcoming *${eventType}* on *${eventDate}*! 💐\n\nThis is Syed from *Z S EVENTS Bangalore*. We received your inquiry regarding *${params.serviceRequired || 'custom floral decor'}* and we would be thrilled to bring your vision to life!\n\nWhether it's traditional Madurai jasmine garlands, grand rose backdrops, or contemporary botanicals, we tailor every detail to your preferences.\n\nFeel free to reply right here or call us at *+91 98450 99880* whenever you are free to chat. Have a wonderful day ahead! 😊`;
  }

  // Default: LUXURY
  return `Dear ${customerName}, warm greetings from *Z S EVENTS Bangalore*! 🌸✨\n\nThank you for reaching out to us for your *${eventType}* on *${eventDate}*.\n\nOur creative floristry and staging team has reviewed your requirement for *${params.serviceRequired || 'Bespoke Floral Decor'}*. We have curated an exclusive botanical moodboard featuring premium blooms, custom stage backdrops, and fragrant Madurai Mogra accents suited for ${budgetStr}.\n\n📍 *Studio Address*: 128 Floral Boulevard, Indiranagar, Bangalore\n📞 *Direct Line*: +91 98450 99880\n\nWould you be available for a brief 10-minute consultation today to walk through the floral concepts?`;
}
