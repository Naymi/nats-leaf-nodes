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
export const leafGwNodes = [
  "nats://localhost:4623",
//  "nats://localhost:4323",
//  "nats://localhost:4324"
];
export const leafGwDomain: string = 'leaf-gw';
//export const satelliteArgsKvName = "space-0-args";
//export const satelliteResultKvName = "space-0-result";

export const leafNodes = [
  "nats://localhost:4523",
//  "nats://localhost:4524",
//  "nats://localhost:4525"
];
export const leafDomain: string = 'leaf';
export let cmdStreamName: string = 'space-0-commands';
//export const argsKvName = "space-0-args";
//export const leafResultKvName = "space-0-result";
export let cmdResultStreamName: string = 'space-0-result';
export let cmdResultStreamSubjects: string[] = [
  'space.0.service.*.commands.*.result'
];
export let cmdStreamSubjects: string[] = [
  'space.0.service.*.commands.*.input'
];

export const createCmdSubject = (cmd: string)=>{
  return `space.0.service.my.commands.${cmd}.input`
}
export const createCmdResultSubject = (cmd: string)=>{
  return `space.0.service.my.commands.${cmd}.result`
}
