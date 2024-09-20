import { nanoid } from "nanoid";

let _fromMainSubj: string = 'from-main.';
export const fromMainSubj = _fromMainSubj + '*'
export let getFromMainStreamSubj = ()=>{
  return _fromMainSubj + nanoid()
}

let _toMainSubj: string = 'to.main.';

export let toMainStream = 'to-main';
export let fromMainStream = 'from-main';

export const toMainSubj = _toMainSubj + '*';

export let getToMainStreamSubj = ()=>{
  return toMainSubj + nanoid()
}

const _reqToMainSubj: string = 'req.to.main.';
export const reqToMainSubj: string = _reqToMainSubj + '*';
export let getReqToMainSubj = ()=>{
  return _reqToMainSubj + nanoid()
}
