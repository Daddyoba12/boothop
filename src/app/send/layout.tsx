import FlightTicker from '@/components/bfi/FlightTicker';

export default function SendLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FlightTicker fixed />
    </>
  );
}
