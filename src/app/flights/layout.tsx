import TravelPayoutsScript from '@/components/bfi/TravelPayoutsScript';

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TravelPayoutsScript />
      {children}
    </>
  );
}
