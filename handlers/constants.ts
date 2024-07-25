// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
import { StringCodec } from "nats";

export const satelliteNodes = [
  "nats://localhost:4322",
//  "nats://localhost:4323",
//  "nats://localhost:4324"
];
// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
export const mainNodes = [
  "nats://localhost:4222",
//  "nats://localhost:4223",
//  "nats://localhost:4224"
];
export const sc = StringCodec();
export const satelliteDomain: string = 'satellite';
export const mainDomain: string = 'main';
export const mainArgsKvName = "space-0-args";
export const satelliteArgsKvName = "space-0-args";
export const mainResultKvName = "space-0-result";
export const satelliteResultKvName = "space-0-result";
