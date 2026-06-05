// Fallback publicly accessible Pexels images (no API key needed)
const FALLBACKS = [
  'https://images.pexels.com/photos/1056553/pexels-photo-1056553.jpeg',  // airport terminal
  'https://images.pexels.com/photos/2007401/pexels-photo-2007401.jpeg',  // luggage travel
  'https://images.pexels.com/photos/388415/pexels-photo-388415.jpeg',    // cardboard box parcel
  'https://images.pexels.com/photos/3887985/pexels-photo-3887985.jpeg',  // person travelling
  'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg',  // package delivery
  'https://images.pexels.com/photos/358312/pexels-photo-358312.jpeg',    // plane window
  'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg',  // map travel route
];

export function getFallbackImage(index: number): string {
  return FALLBACKS[index % FALLBACKS.length] + '?auto=compress&cs=tinysrgb&w=1080';
}

export async function searchPexelsPhoto(query: string, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=${orientation}&size=large`,
      { headers: { Authorization: apiKey } }
    );
    const data = await res.json() as any;
    const photos: any[] = data.photos ?? [];
    if (!photos.length) return null;

    const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
    return (photo.src?.large2x ?? photo.src?.large ?? null) as string | null;
  } catch {
    return null;
  }
}
