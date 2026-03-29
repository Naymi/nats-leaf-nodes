
import {connect} from 'nats'
const count = 5e3;
const connected = new Set();
const closed = new Map();
const agentDir = './agent-x§g';
const main = async () => {
  for (let index = 0; index < count; index++) {
    console.log('initialized ', index);
    const cn = connect({
      servers: ['nats://localhost:4342'],
      name: 'xxx-'+index
    }).then((cn)=>{
      console.log('connected ' + index);
      connected.add(index)
      ;(async ()=>{
        for await (const status of await cn.status()) {
          console.log('status', status);
        }
      })()
      return cn
    }).catch(err=>{
      console.log(index, err);
      closed.set(index, err)
    });
  }
  setInterval(() => {
    console.log('connected count:', connected.size, new Date().toLocaleTimeString());
    console.log('closed', closed.size);
  }, 10e3);
};

main();
