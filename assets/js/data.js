const countryDetails = {
  India: {
    country: 'India',
    currencySymbol: '₹',
    currency: 'INR',
    std: '+91'
  },
  USA: {
    country: 'United States',
    currencySymbol: '$',
    currency: 'USD',
    std: '+1'
  },
  UK: {
    country: 'United Kingdom',
    currencySymbol: '£',
    currency: 'GBP',
    std: '+44'
  },
  Japan: {
    country: 'Japan',
    currencySymbol: '¥',
    currency: 'JPY',
    std: '+81'
  },
  Australia: {
    country: 'Australia',
    currencySymbol: '$',
    currency: 'AUD',
    std: '+61'
  },
  Canada: {
    country: 'Canada',
    currencySymbol: 'CA$',
    currency: 'CAD',
    std: '+1'
  },
  Germany: {
    country: 'Germany',
    currencySymbol: '€',
    currency: 'EUR',
    std: '+49'
  },
  China: {
    country: 'China',
    currencySymbol: '¥',
    currency: 'CNY',
    std: '+86'
  },
  Brazil: {
    country: 'Brazil',
    currencySymbol: 'R$',
    currency: 'BRL',
    std: '+55'
  },
  SouthAfrica: {
    country: 'South Africa',
    currencySymbol: 'R',
    currency: 'ZAR',
    std: '+27'
  },
  France: {
    country: 'France',
    currencySymbol: '€',
    currency: 'EUR',
    std: '+33'
  },
  Russia: {
    country: 'Russia',
    currencySymbol: '₽',
    currency: 'RUB',
    std: '+7'
  },
  Mexico: {
    country: 'Mexico',
    currencySymbol: 'MXN$',
    currency: 'MXN',
    std: '+52'
  },
  Japan: {
    country: 'Japan',
    currencySymbol: '¥',
    currency: 'JPY',
    std: '+81'
  },
  SouthKorea: {
    country: 'South Korea',
    currencySymbol: '₩',
    currency: 'KRW',
    std: '+82'
  },
  Argentina: {
    country: 'Argentina',
    currencySymbol: 'ARS$',
    currency: 'ARS',
    std: '+54'
  }
  // Add more countries as needed
};


const deliveryStatuses = {
  Pending: {
    status: "Pending",
    color: "#808080"
  },
  Processing: {
    status: "Processing",
    color: "#FFA500"  // Orange
  },
  Shipped: {
    status: "Shipped",
    color: "#008000"  // Green
  },
  In_Transit: {
    status: "In Transit",
    color: "#0000FF"  // Blue
  },
  Out_for_Delivery: {
    status: "Out for Delivery",
    color: "#800080"  // Purple
  },
  Delivered: {
    status: "Delivered",
    color: "#008000"  // Green
  },
  Failed_Attempt: {
    status: "Failed Attempt",
    color: "#FF0000"  // Red
  },
  Returned_To_Sender: {
    status: "Returned to Sender",
    color: "#FF0000"  // Red
  },
  Delayed: {
    status: "Delayed",
    color: "#FFA500"  // Orange
  },
  Canceled: {
    status: "Canceled",
    color: "#FF0000"  // Red
  }
};

module.exports = { countryDetails, deliveryStatuses };