import { KV } from "nats";
import { useNats } from "./using-nats";

const main = async () => {
  const {
    js,
    nc
  } = await useNats()

  let spaceFooKvName: string = 'space-foo-kv';
  const spaceFooKv = await js.views.kv(spaceFooKvName)
  console.log('created kv', spaceFooKvName)

  let spaceBarKvName: string = 'space-bar-kv';
  const spaceBarKv = await js.views.kv(spaceBarKvName)
  console.log('created kv', spaceBarKvName)

  let spaceAggregatedKvName: string = 'space-aggregated-kv';
  debugger
  const spaceAggregatedKv = await js.views.kv(spaceAggregatedKvName, {
    sources: [
      {
        name: spaceFooKvName,
        subject_transforms: []
      }, {
        name: spaceBarKvName,
        subject_transforms: []
      },
    ]
  })
  console.log('created kv', spaceAggregatedKvName)

  let spaceFooResultKvName: string = 'space-foo-result-kv';
  const spaceFooResultKv = await js.views.kv(spaceFooResultKvName, {
    sources: [
      {
        name: spaceAggregatedKvName
      }, {
        name: spaceFooKvName
      },
    ]
  })
  console.log('created kv', spaceFooResultKvName)

  let spaceBarResultKvName: string = 'space-bar-result-kv';
  const spaceBarResultKv = await js.views.kv(spaceBarResultKvName, {
    bindOnly: true,
    sources: [
      {
        name: spaceAggregatedKvName
      }, {
        name: spaceFooKvName
      },
    ]
  })
  console.log('created kv', spaceFooResultKvName)

  const w = async (kv: KV, name: string) => {
    for await (const watch of await kv.watch()) {
      console.log('Watch: ', name, watch.key, watch.operation)
    }
  }
  w(spaceFooKv, 'spaceFooKv')
  w(spaceBarKv, 'spaceBarKv')
  w(spaceAggregatedKv, 'spaceAggregatedKv')
  w(spaceFooResultKv, 'spaceFooResultKv')
  w(spaceBarResultKv, 'spaceBarResultKv')

  await spaceFooKv.put('x', 'y')
  setTimeout(async () => {
    const foo = await spaceFooResultKv.get('x')
    console.log('foo', foo?.string());
    const bar = await spaceBarResultKv.get('x')
    console.log('bar', bar?.string());

    await spaceBarKv.put('x', 'z')


    {
      const foo = await spaceFooResultKv.get('x')
      console.log('foo', foo?.string());
      const bar = await spaceBarResultKv.get('x')
      console.log('bar', bar?.string());
    }
    nc.close()
  }, 1e3)
}
main()
