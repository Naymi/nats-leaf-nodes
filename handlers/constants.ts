// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
import { StringCodec } from "nats";

export const leafNodeUrl = "nats://localhost:4223";
// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
export const mainNodeUrl = "nats://localhost:4222";
export const sc = StringCodec();
export const leafDomain: string = 'leaf';
export const mainDomain: string = 'hub';
export const mainArgsKvName = "space-0-args";
export const leafArgsKvName = "space-0-args";
export const mainResultKvName = "space-0-result";
export const leafResultKvName = "space-0-result";
