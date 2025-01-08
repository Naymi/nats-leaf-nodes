import { readFile, writeFile } from "node:fs/promises";

export const getInfo = async (agentConfPath: string): Promise<{ content: string, hasGw2: boolean }> => {
  const content = await readFile(agentConfPath, 'utf-8')
  const hasGw2 = content.includes('nats-gw2')
  return {
    content,
    hasGw2
  };
};

export const changeGw = async (agentConfPath: string)=>{
  let {
    content,
    hasGw2
  } = await getInfo(agentConfPath);

  const newContent = hasGw2 ? content.replace('nats-gw2', 'nats-gw1') : content.replace('nats-gw1', 'nats-gw2')

  await writeFile(agentConfPath, newContent)
}
