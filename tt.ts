import { readFile, writeFile } from "node:fs/promises";

let confPath: any = './nats-agents/agent.conf';
export const getInfo = async (): Promise<{ content: string, hasGw2: boolean }> => {
  const content = await readFile(confPath, 'utf-8')
  const hasGw2 = content.includes('nats-gw1')
  return {
    content,
    hasGw2
  };
};

export const changeGw = async ()=>{
  let {
    content,
    hasGw2
  } = await getInfo();

  const newContent = hasGw2 ? content.replace('nats-gw1', 'nats-gw2') : content.replace('nats-gw2', 'nats-gw1')

  await writeFile(confPath, newContent)
}
