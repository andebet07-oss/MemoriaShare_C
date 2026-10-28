import PhoneFrame from './PhoneFrame';
import { CameraScreen, MagnetScreen } from './HeroScreens';
import { Stage, Placed, MagnetImage } from './Stage';

// The visuals of "למה Memoria", one per point: pre-rendered magnets and real
// app screens on a Stage, each with soft indigo light behind it.

const Glow = () => <div className="absolute inset-[-12%] bg-glow-soft" />;
const Floor = ({ x, y, w }) => <div className="absolute h-12 bg-floor blur-md" style={{ left: x, top: y, width: w }} />;

/** A loose group of magnets, as if on a fridge. */
export function FridgeGroup() {
  return (
    <Stage w={560} h={500}>
      <Glow />
      <Placed x={228} y={0} w={320} rotate={3} z={1}><MagnetImage id="why-3" /></Placed>
      <Placed x={8} y={46} w={250} rotate={-7} z={2}><MagnetImage id="why-1" /></Placed>
      <Placed x={292} y={196} w={228} rotate={6} z={3}><MagnetImage id="why-2" /></Placed>
    </Stage>
  );
}

/** The guest's camera: the frame already in the viewfinder. */
export function CameraVisual() {
  return (
    <Stage w={420} h={560} className="mx-auto max-w-[380px]">
      <Glow />
      <Floor x={70} y={512} w={280} />
      <Placed x={82} y={8} w={256} rotate={3}>
        <PhoneFrame center label="המצלמה עם מסגרת המגנט"><CameraScreen magnet="why-camera" /></PhoneFrame>
      </Placed>
    </Stage>
  );
}

/** The magnet ready on the guest's phone, and the same magnet just printed. */
export function PrintedVisual() {
  return (
    <Stage w={600} h={500}>
      <Glow />
      <Placed x={360} y={20} w={208} rotate={-4} z={1}>
        <PhoneFrame label="המגנט המוכן"><MagnetScreen magnet="why-ready" /></PhoneFrame>
      </Placed>
      <Placed x={36} y={104} w={290} rotate={-6} z={2}><MagnetImage id="why-ready" /></Placed>
    </Stage>
  );
}
