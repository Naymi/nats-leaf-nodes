import { Client } from 'k6/net/grpc';

const client = new Client();
client.load(['definitions'], 'vector.proto');


export default () => {
  client.connect('localhost:30001', {});
  console.log('client connected');
  const data = {
    events: [
      {
        log: {
          metadata_full: {
            source_type: 'exercitation quis laboris ex',
            datadog_origin_metadata: {
              origin_category: 2256436931,
              origin_service: 4040743578,
              origin_product: 120004506,
            },
            upstream_id: {
              component: 'Duis',
              port: 'culpa',
            },
            source_id: 'consequat proident in labore aliquip',
            source_event_id: 'SlUot2TwfEJgi3sTKbk6wPMT3uM7viba',
          },
        },
      }
    ],
  };
  const response = client.invoke('vector.Vector/PushEvents', data);

  console.log(JSON.stringify(response.message));

  client.close();
};
