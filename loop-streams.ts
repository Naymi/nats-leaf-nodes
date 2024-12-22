import 'source-map-support';
import { KvStatus } from "nats";
import { sc } from "./handlers/constants";
import { useNats } from "./using-nats";
import 'colors';
import { setTimeout } from 'timers/promises';

const main = async () => {
  const { jsm, js } = await useNats();

  const sourceKv = await js.views.kv('src')
  sourceKv.put('a', sc.encode('a'))
  let srcKvStatus: KvStatus = await sourceKv.status();
  let srcKvStreamName: string = srcKvStatus.streamInfo.config.name;
  console.log('srcKvStreamName', srcKvStreamName)
  const dstKv = await js.views.kv('dst', {
    mirror: {
      name: 'src',
    }
  })
  for await (const void1 of require('timers/promises').setInterval(1e3)) {
    let status: KvStatus = await dstKv.status();
    console.log(status.mirror)
    const v = await dstKv.get('a')
    console.log("v", v?.string());
    const sv = await sourceKv.get('a')
    console.log("sv", sv?.string());
  }
  console.log('dstStatus', await dstKv.status())
  const logValue = async ()=>{
    const s = await sourceKv.get('x')
    console.log('s', s?.string())
    const d = await dstKv.get('x')
    console.log('d', d?.string())
  }
  await sourceKv.put('x', sc.encode('y'))
  console.log('x in src putted');
  await logValue()
  await dstKv.put('x', sc.encode('z'))
  console.log('x in dst putted');
  await logValue()
  let mainReadStreamName: string = 'main-read-stream';
  let spaceReadStreamName: string = 'space-read-stream';
  let spaceWriteStreamName: string = 'space-write-stream';
  let mainWriteStreamName: string = 'main-write-stream';
  // main-write-stream -> main-read-stream
  // main-write-stream -> space-read-stream
  // space-write-stream -> main-read-stream
  // space-write-stream -> space-read-stream
  const mainWriteBroadcast = await jsm.streams.add({
    name: mainWriteStreamName,
    subjects: ['space.*.>'],
    subject_transform: {
      dest: '',
      src: ''
    }
  })
  console.log('mainWriteBroadcast created');

  const mainFromSpacesStream = await jsm.streams.add({
    name: 'main-from-spaces',
    republish: {
      src: '*',
      dest: '*'
    }
  })

  const spaceWriteStream = await jsm.streams.add({
    name: spaceWriteStreamName
  })
  console.log('spaceWriteStream created');
  const mainReadStream = await jsm.streams.add({
    name: mainReadStreamName,
    sources: [
      {
        name: spaceWriteStreamName,
      }
    ]
  })
  console.log('mainReadStream created!');
  const spaceReadStream = await jsm.streams.add({
    name: spaceReadStreamName,
    sources: [
      {
        name: spaceWriteStreamName
      },
      {
        name: mainWriteStreamName
      },
      {
        name: mainReadStreamName
      }
    ]
  })
  console.log('spaceReadStream created!');

  process.exit();
};

main();
