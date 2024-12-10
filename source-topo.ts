import { once } from "lodash";
import { AckPolicy, RetentionPolicy } from "nats";
import { useNats } from "./using-nats";
import * as tm from 'timers/promises'

const publish = once(async (js)=>{
  await js.publish('src.x', undefined, {
    expect: {
      streamName: 'src'
    }
  })
})

const main = async () => {
  const handleStreams = async (stream: string) =>{
    console.log('consume', stream);
    let durableName: string = 'c_' + stream;
    await jsm.consumers.add(stream, {
      durable_name: durableName,
      ack_policy: AckPolicy.Explicit
    })
    console.log('consumer created', stream);
    const c = await js.consumers.get(stream, durableName)
    const msgs = await c.consume()
    for await (const msg of msgs) {
      console.log('------------------')
      console.log(stream)
      console.log(stream, msg.subject)
      console.log(stream)
      console.log('------------------')
      msg.ack()
    }
  }
  const {
    jsm,
    js,
    nc
  } = await useNats()
  const source = await jsm.streams.add({
    name: 'src',
    retention: RetentionPolicy.Workqueue,
    subjects: ['src.*']
  })
  const dest = await jsm.streams.add({
    name: 'dest',
    retention: RetentionPolicy.Workqueue,
    sources: [
      {
        name: 'src'
      }
    ],
    republish: {
      src: 'src.x',
      dest: 't.x'
    }
  })
  const m = await jsm.streams.add({
    name: 'm',
    retention: RetentionPolicy.Workqueue,
    mirror: {
      name: 'dest'
    }
  })
  const t = await jsm.streams.add({
    name: 't',
    retention: RetentionPolicy.Workqueue,
    subjects: [
      't.*'
    ]
  })

  const s1 = await jsm.streams.add({
    name: 's1',
    subjects: [
      's1.*'
    ]
  })

  const s2 = await jsm.streams.add({
    name: 's2',
    subjects: [
      's2.*'
    ]
  })

  const mir = await jsm.streams.add({
    name: 'mir',
    mirror: {
      name: 's1'
    }
  })

  await js.publish('s1.x', undefined, {
    expect: {
      streamName: 's1'
    }
  })

  console.log(await getCount('mir'));

  await tm.setTimeout(1e3)
  if (1) process.exit(0)

  publish(js)

  handleStreams('dest')
  await tm.setTimeout(1e3)
  handleStreams('m')
  await tm.setTimeout(1e3)
  handleStreams('t')
  for await (const void1 of tm.setInterval(5e3)) {
    console.log('------------------')
    console.log('src',await getCount('src'));
    console.log('dest',await getCount('dest'));
    console.log('m', await getCount('m'));
    console.log('t',await getCount('t'));
  }

  async function getCount(stream: string = 'src'): Promise<number> {
    return (await (await js.streams.get(stream)).info()).state.messages;
  }

  await jsm.consumers.add('dest', {
    name: 'cdest',
    ack_policy: AckPolicy.Explicit,
    durable_name: 'cdest'
  })
  console.log('b', await getCount());
  await publish(js)
  console.log('a', await getCount());
  console.log(await getCount());
  console.log(await getCount());

  const startSub = async ()=>{
    console.log('started sub');
      console.log('before sub', await getCount());
      const c = await js.consumers.get('dest', 'cdest')
      console.log('consumer gotted');
      console.log('before consume ', await getCount());
      const msgs = await c.consume({
        max_messages: 1,
        async callback(msg) {
          try {
            console.log('1', await getCount());
            console.log(msg.subject, 'red:', msg.info.redeliveryCount)
            console.log('2', await getCount());
            msg.nak(1e3)
          } finally {
            console.log('breaked');
            msgs.stop()
            console.log('closing...');
            const r = await msgs.close();
            console.log('closed', r);
          }
        }
      });
      await msgs.closed()
  }
  await startSub()
  await nc.close()
  setTimeout(()=>{
    main()
  }, 1e3)
}
main()
