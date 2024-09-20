import { createAgentConnect } from "../../agent/create-agent.connect";
import { leafGw2Domain } from "../../constants";
import { fromMainStream } from "../constants";

const main = async () => {
  const { agentJs } = await createAgentConnect()

  const agentJsm = await agentJs.jetstreamManager()

  console.log('create agent stream from gw domain')
  await agentJsm.streams.update(fromMainStream, {
    sources: [
      {
        name: fromMainStream,
        domain: leafGw2Domain
      }
    ]
  })
}

main().catch(console.error).finally(() => process.exit(0))
