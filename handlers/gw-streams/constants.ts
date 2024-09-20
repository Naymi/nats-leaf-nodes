import { nanoid } from "nanoid";

export let fromMainStream: string = 'from-main';
export let getFromMainStreamSubj = ()=>{
  return 'main.' + nanoid()
}
export let getToMainStreamSubj = ()=>{
  return 'to.main.' + nanoid()
}
const _reqToMainSubj: string = 'req.to.main.';
export const reqToMainSubj: string = _reqToMainSubj + '*';
export let getReqToMainSubj = ()=>{
  return _reqToMainSubj + nanoid()
}
export let toMainStream = 'to-main';
