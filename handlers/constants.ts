// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
import { StringCodec } from "nats";

export const leafNodeUrl = "nats://localhost:4223";
export const mainArgsKey = "args";
// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
export const mainNodeUrl = "nats://localhost:4222";
export const leafResultKey = "result";
export const sc = StringCodec();
export const leafDomain: string = 'leaf';
export const mainDomain: string = 'leaf';
export const kvName: string = "space-0";
