import { createLeafGwConnection } from "../../leaf-gw/create-leaf-gw-connection";
import { fromMainStream } from "../constants";

const main = async () => {
  const { leafGwJs } = await createLeafGwConnection()

  const leafGwJsm = await leafGwJs.jetstreamManager()

  console.log('create gw stream')
  await leafGwJsm.streams.add({
    name: fromMainStream,
    subjects: ['main.>']
  })
  leafGwJsm.streams.update(fromMainStream, {})
}

main().finally(() => process.exit(0))
