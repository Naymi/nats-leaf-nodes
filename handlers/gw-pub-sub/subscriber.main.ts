import { createMainConnect } from "../main/create-main.connect";

const main = async () => {
  const {mainNc} =  await createMainConnect()
  let subj = 'to.main.*';
  const subs = mainNc.subscribe(subj)
  console.info(`Subscribed by '${subj}'`)
  for await (const sub of subs) {
    console.log(sub.subject, sub.string());
  }
}

main();
