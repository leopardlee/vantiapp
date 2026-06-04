export interface MockPlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating: number;
  userRatingCount: number;
  types: string[];
  mode: 'social' | 'genius' | 'perks' | 'canada';
  perkDescription?: string;
  socialActivity?: string;
  aiCurationSummary?: string;
  imageUrl: string;
  matchScore?: number;
  regularOpeningHours?: {
    weekdayDescriptions: string[];
  };
}

export interface UserFriend {
  id: string;
  name: string;
  avatar: string;
  activeLocation: string;
  lat: number;
  lng: number;
  lastActive: string;
}

export interface ActiveCoupon {
  id: string;
  shopName: string;
  benefit: string;
  code: string;
  expires: string;
}

export const CANADA_MOCK_PLACES: MockPlace[] = [
  {
    id: "canada_vancouver_consulate",
    displayName: "Republic of Korea Consulate General (Vancouver)",
    formattedAddress: "1090 W Georgia St #1600, Vancouver, BC V6E 3V7",
    lat: 49.2847,
    lng: -123.1235,
    rating: 4.5,
    userRatingCount: 450,
    types: ["embassy", "office", "canada_essential"],
    mode: "canada",
    socialActivity: "Official support and document processing for Working Holiday holders.",
    imageUrl: "https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&w=500&q=80",
    regularOpeningHours: {
      weekdayDescriptions: [
        "Monday: 9:00 AM – 5:00 PM",
        "Tuesday: 9:00 AM – 5:00 PM",
        "Wednesday: 9:00 AM – 5:00 PM",
        "Thursday: 9:00 AM – 5:00 PM",
        "Friday: 9:00 AM – 5:00 PM",
        "Saturday: Closed",
        "Sunday: Closed"
      ]
    }
  },
  {
    id: "canada_toronto_consulate",
    displayName: "Republic of Korea Consulate General (Toronto)",
    formattedAddress: "555 Avenue Rd, Toronto, ON M4V 2J7",
    lat: 43.6874,
    lng: -79.3995,
    rating: 4.4,
    userRatingCount: 520,
    types: ["embassy", "office", "canada_essential"],
    mode: "canada",
    socialActivity: "Central hub for Korean residents and youth in Toronto.",
    imageUrl: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "canada_hmart_vancouver",
    displayName: "H-Mart Vancouver Downtown",
    formattedAddress: "590 Robson St #200, Vancouver, BC V6B 2B7",
    lat: 49.2807,
    lng: -123.1185,
    rating: 4.6,
    userRatingCount: 2100,
    types: ["store", "grocery", "canada_essential"],
    mode: "canada",
    perkDescription: "10% Welcome discount for new VANTi Working Holiday members.",
    imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "canada_hmart_northyork",
    displayName: "H-Mart North York",
    formattedAddress: "6035 Yonge St, North York, ON M2M 3W2",
    lat: 43.7885,
    lng: -79.4184,
    rating: 4.7,
    userRatingCount: 3400,
    types: ["store", "grocery", "canada_essential"],
    mode: "canada",
    perkDescription: "VANTi Coin rewards for all bulk purchases tonight.",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "canada_service_toronto",
    displayName: "Service Canada Centre (Toronto City Hall)",
    formattedAddress: "100 Queen St W, Toronto, ON M5H 2N2",
    lat: 43.6525,
    lng: -79.3820,
    rating: 3.8,
    userRatingCount: 120,
    types: ["office", "canada_essential"],
    mode: "canada",
    socialActivity: "Process your SIN (Social Insurance Number) here upon arrival.",
    imageUrl: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "canada_vancouver_library",
    displayName: "Vancouver Public Library (Central Branch)",
    formattedAddress: "350 W Georgia St, Vancouver, BC V6B 6B1",
    lat: 49.2820,
    lng: -123.1165,
    rating: 4.8,
    userRatingCount: 4500,
    types: ["library", "landmark", "canada_essential"],
    mode: "canada",
    aiCurationSummary: "Ideal quiet workspace with free high-speed Wi-Fi. Perfect for job hunting and community networking.",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=500&q=80"
  }
];

export const SEOUL_MOCK_PLACES: MockPlace[] = [
  {
    id: "vanti_social_hongdae",
    displayName: "Hongdae Art Street Hub",
    formattedAddress: "365-1 Seogyo-dong, Mapo-gu, Seoul",
    lat: 37.5518,
    lng: 126.9249,
    rating: 4.8,
    userRatingCount: 3120,
    types: ["social_hub", "nightlife", "park"],
    mode: "social",
    socialActivity: "42 VANTi users checked in right now. Live acoustic street performance starting at 8 PM.",
    imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=500&q=80",
    regularOpeningHours: {
      weekdayDescriptions: [
        "Monday: 11:00 AM – 11:00 PM",
        "Tuesday: 11:00 AM – 11:00 PM",
        "Wednesday: 11:00 AM – 11:00 PM",
        "Thursday: 11:00 AM – 11:00 PM",
        "Friday: 11:00 AM – 2:00 AM",
        "Saturday: 11:00 AM – 2:00 AM",
        "Sunday: 11:00 AM – 11:00 PM"
      ]
    }
  },
  {
    id: "vanti_social_itaewon",
    displayName: "Itaewon Antique Street Lounge",
    formattedAddress: "Itaewon-dong, Yongsan-gu, Seoul",
    lat: 37.5345,
    lng: 126.9942,
    rating: 4.6,
    userRatingCount: 1890,
    types: ["social_hub", "bar", "restaurant"],
    mode: "social",
    socialActivity: "18 friends have favorited this space. Trending for international culinary meetups tonight.",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "vanti_social_hanriver",
    displayName: "Yeouido Hangang Riverside Oasis",
    formattedAddress: "330 Yeouidong-ro, Yeoungdeungpo-gu, Seoul",
    lat: 37.5273,
    lng: 126.9327,
    rating: 4.9,
    userRatingCount: 7850,
    types: ["social_hub", "park", "poi"],
    mode: "social",
    socialActivity: "Busy picnic hour! 5 VANTi dynamic chat groups are active. Sunset light show starts at 7 PM.",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "vanti_genius_bukchon",
    displayName: "Bukchon Traditional Heritage Village",
    formattedAddress: "37 Gyedong-gil, Jongno-gu, Seoul",
    lat: 37.5828,
    lng: 126.9835,
    rating: 4.7,
    userRatingCount: 4200,
    types: ["scenic", "historic", "museum"],
    mode: "genius",
    aiCurationSummary: "98% Match for your interest in historical architecture. Best visited surrounding 10 AM to avoid crowds. Take the scenic side alley for local artisan tea houses.",
    imageUrl: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "vanti_genius_palace",
    displayName: "Gyeongbokgung Midnight Light Tour",
    formattedAddress: "161 Sajik-ro, Jongno-gu, Seoul",
    lat: 37.5796,
    lng: 126.9770,
    rating: 4.9,
    userRatingCount: 9150,
    types: ["scenic", "historic", "landmark"],
    mode: "genius",
    aiCurationSummary: "Special Seasonal Glow Event active! Curated 10/10 sunset walk. Free entry if wearing traditional Hanbok dress, with exclusive live commentary on the VANTi headset.",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "vanti_genius_namsan",
    displayName: "N Seoul Tower Scenic Overlooks",
    formattedAddress: "105 Namsangongwon-gil, Yongsan-gu, Seoul",
    lat: 37.5511,
    lng: 126.9882,
    rating: 4.8,
    userRatingCount: 12400,
    types: ["scenic", "landmark", "observation_deck"],
    mode: "genius",
    aiCurationSummary: "Perfect weather matched for clear 50km visibility. Cable car queuing is nominal (under 10 mins). Sunset coordinate optimal angle at 7:51 PM.",
    imageUrl: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "vanti_perks_seongsu",
    displayName: "Seongsu Experimental Concept Café",
    formattedAddress: "27 Dongil-ro, Seongdong-gu, Seoul",
    lat: 37.5446,
    lng: 127.0560,
    rating: 4.5,
    userRatingCount: 880,
    types: ["cafe", "store", "commerce"],
    mode: "perks",
    perkDescription: "Buy One Get One (BOGO) espresso beverage & 15% discount on signature fresh-baked pastries. Claim with single mobile shake via VANTi Pay.",
    imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=500&q=80",
    regularOpeningHours: {
      weekdayDescriptions: [
        "Monday: 8:00 AM – 9:00 PM",
        "Tuesday: 8:00 AM – 9:00 PM",
        "Wednesday: 8:00 AM – 9:00 PM",
        "Thursday: 8:00 AM – 9:00 PM",
        "Friday: 8:00 AM – 10:00 PM",
        "Saturday: 9:00 AM – 10:00 PM",
        "Sunday: 9:00 AM – 8:00 PM"
      ]
    }
  },
  {
    id: "vanti_perks_coex",
    displayName: "Starfield COEX Mall & Library",
    formattedAddress: "513 Yeongdong-daero, Gangnam-gu, Seoul",
    lat: 37.5113,
    lng: 127.0598,
    rating: 4.7,
    userRatingCount: 6510,
    types: ["store", "mall", "entertainment"],
    mode: "perks",
    perkDescription: "Free 1-Hour Premium Lounge Voucher & VANTi Book Club members receive 10% cash refund at the giant starfield bookshelves.",
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "vanti_perks_myeongdong",
    displayName: "Myeongdong Beauty & Cosmetic Avenue",
    formattedAddress: "Myeongdong-gil, Jung-gu, Seoul",
    lat: 37.5635,
    lng: 126.9845,
    rating: 4.4,
    userRatingCount: 3950,
    types: ["store", "shopping", "commerce"],
    mode: "perks",
    perkDescription: "Complimentary K-Beauty samples & 20% cashback bonus utilizing digital direct token wallets on checkouts.",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80"
  }
];

export const MOCK_FRIENDS: UserFriend[] = [
  {
    id: "friend_1",
    name: "Alex Mercer",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100&q=80",
    activeLocation: "Hongdae Art Street Hub",
    lat: 37.5518,
    lng: 126.9249,
    lastActive: "Just now"
  },
  {
    id: "friend_2",
    name: "Clara Kim",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
    activeLocation: "Yeouido Riverside",
    lat: 37.5250,
    lng: 126.9350,
    lastActive: "15m ago"
  },
  {
    id: "friend_3",
    name: "Jiho Park",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
    activeLocation: "Itaewon",
    lat: 37.5320,
    lng: 126.9920,
    lastActive: "1h ago"
  }
];

export const MOCK_COUPONS: ActiveCoupon[] = [
  {
    id: "coupon_1",
    shopName: "Seongsu Experimental Concept Café",
    benefit: "Buy 1 Get 1 Espresso Voucher",
    code: "VANTISG1",
    expires: "Expires in 3 days"
  },
  {
    id: "coupon_2",
    shopName: "Starfield COEX Lounge",
    benefit: "Free 1x Premium Lounge Entry",
    code: "VANTICOEX",
    expires: "Expires tonight"
  },
  {
    id: "coupon_3",
    shopName: "Myeongdong Beauty Central",
    benefit: "20% Cashback Bonus Token",
    code: "KBEAUTY20",
    expires: "Expires in 7 days"
  }
];
