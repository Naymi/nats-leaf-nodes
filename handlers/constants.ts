// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
import { StringCodec } from "nats";

// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
export const sc = StringCodec();

export const mainNodes = [
  "nats://localhost:4222",
//  "nats://localhost:4223",
//  "nats://localhost:4224"
];
export const mainDomain: string = 'main';
export const argsKvName = "space-0-args";
export const resultKvName = "space-0-result";

export const satelliteNodes = [
  "nats://localhost:4322",
//  "nats://localhost:4323",
//  "nats://localhost:4324"
];
export const satelliteDomain: string = 'satellite';
//export const satelliteArgsKvName = "space-0-args";
//export const satelliteResultKvName = "space-0-result";

export const leafNodes = [
  "nats://localhost:4523",
//  "nats://localhost:4524",
//  "nats://localhost:4525"
];
export const leafDomain: string = 'leaf';
//export const argsKvName = "space-0-args";
//export const leafResultKvName = "space-0-result";
