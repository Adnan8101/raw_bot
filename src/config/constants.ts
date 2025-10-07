export const EMBED_COLORS = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  ERROR: 0xED4245,
  INFO: 0x00D9FF,
} as const;

export const PACKAGES = [
  {
    name: 'Euphoria VIP Package',
    price: '₹2399',
    hosts: 'Rashika & Sher',
    artists: '5',
    duration: 'Approx 3 Hours',
    features: [
      'Games',
      'Invite Links',
      'Event Management',
      'Poster & Description',
      'YouTube Live',
      'Giveaway',
      'Artist Payment Included'
    ]
  },
  {
    name: 'Groove Session Package',
    price: '₹1799',
    hosts: 'Rashika',
    artists: '4',
    duration: 'Approx 2.5 Hours',
    features: [
      'Games',
      'Invite Links',
      'Event Management',
      'Poster & Description',
      'Artist Payment Included'
    ]
  },
  {
    name: 'Jam Pass Package',
    price: '₹1499',
    hosts: 'Rashika',
    artists: '3',
    duration: '1.5–2 Hours',
    features: [
      'Games',
      'Invite Links',
      'Artist Payment Included'
    ]
  },
  {
    name: 'Pocket Friendly Package',
    price: '₹1199',
    hosts: 'Rashika',
    artists: '2',
    duration: 'Approx 1.5 Hours',
    features: [
      'Games',
      'Invite Links',
      'Artist Payment Included'
    ]
  },
  {
    name: 'Interactive Gaming Pass',
    price: '₹1000 (Excl. Rewards)',
    hosts: 'N/A',
    artists: 'N/A',
    duration: 'Varies',
    features: [
      'Mini Games',
      'Rapid Fire',
      'Guess Number',
      'Treasure Hunt',
      'Bingo',
      'Lottery',
      'Custom RAW STUDIO Bot'
    ]
  },
  {
    name: 'Custom Package',
    price: 'Custom Quote',
    hosts: 'As Requested',
    artists: 'As Requested',
    duration: 'As Requested',
    features: [
      'Fully Customizable',
      'Your Requirements',
      'Flexible Options'
    ]
  }
] as const;

export const EMOJIS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  TICKET: '🎫',
  PACKAGE: '📦',
  CALENDAR: '📅',
  LINK: '🔗',
  MAGIC: '🪄',
  PARTY: '🎉',
  WEB: '🌐',
  MEMO: '📝',
} as const;
