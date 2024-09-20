import { nanoid } from "nanoid";

export let fromMainStream: string = 'from-main';
export let getFromMainStreamSubj = ()=>{
  return 'main.' + nanoid()
}
export let getToMainStreamSubj = ()=>{
  return 'to.main.' + nanoid()
}
export let toMainStream = 'to-main';
