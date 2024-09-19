import { createMainConnect } from "./main/create-main.connect";

const main = async () => {
  const {mainNc,mainJs} =  await createMainConnect()
  const subs = mainNc.subscribe('test')
  for await (const sub of subs) {
    console.log(sub.string());
  }
}

main();
