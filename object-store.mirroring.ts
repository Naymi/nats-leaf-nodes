import 'source-map-support';
import { useNats } from "./using-nats";
import 'colors';
import { setTimeout } from 'timers/promises';

function strToStream(str: string) {
  const encoder = new TextEncoder();
  const encodedStr = encoder.encode(str);

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encodedStr);
      controller.close();
    }
  });
}

async function streamToString(stream: any) {
  if (!stream) return stream;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += decoder.decode(value, { stream: true });
  }

  // Декодирование оставшихся данных
  result += decoder.decode();

  return result;
}

function getSampleObj() {
  return strToStream('bar');
}

const main = async () => {
  const { jsm, js } = await useNats();
  const srcS3Bucket = await js.views.os('source');
  const sideS3Bucket = await js.views.os('side');

  console.log('Source S3 bucket initialized'.green);

  const streams = await jsm.streams.list();
  for await (const stream of streams) {
    console.log(`Stream name: ${stream.config.name}`.blue);
  }

  const dstStreamName = 'OBJ_dest';
  await jsm.streams.delete(dstStreamName).catch(() => {});

  const srcStreamName = 'OBJ_source';

  await jsm.streams.add({
    name: dstStreamName,
    allow_rollup_hdrs: true,
    mirror: {
      name: srcStreamName,
      subject_transforms: [
        {
          src: '$O.source.C.>',
          dest: '$O.dest.C.>',
        },
        {
          src: '$O.source.M.>',
          dest: '$O.dest.M.>',
        },
      ]
    }
  });

  console.log('Destination stream initialized'.green);

  const dstS3Bucket = await js.views.os('dest');

  const fooKey = 'foo';

  await srcS3Bucket.put({ name: fooKey }, getSampleObj());
  await srcS3Bucket.put({ name: 'foo1' }, getSampleObj());
  await sideS3Bucket.put({ name: fooKey }, getSampleObj());

  await setTimeout(5000);

  const srcFooValue = await srcS3Bucket.get(fooKey);
  const dstFooValue = await dstS3Bucket.get(fooKey);
  console.log('Destination Value:'.yellow, await streamToString(dstFooValue?.data));
  console.log('Source Value:'.yellow, await streamToString(srcFooValue?.data));

  const srcList = await srcS3Bucket.list();
  const dstList = await dstS3Bucket.list();
  console.log('Source List:'.yellow, srcList.map(x => x.name));
  console.log('Destination List:'.yellow, dstList.map(x => x.name));

  const srcInfo = await srcS3Bucket.info(fooKey);
  const dstInfo = await dstS3Bucket.info(fooKey);
  console.log('Source Info:'.yellow, srcInfo);
  console.log('Destination Info:'.yellow, dstInfo);

  const updatedStreams = await jsm.streams.list();
  for await (const stream of updatedStreams) {
    console.log(`Stream name: ${stream.config.name}`.blue);
  }

  const dstConsumer = await js.consumers.get(dstStreamName);
  for await (const message of await dstConsumer.fetch()) {
    console.log('Destination Item:'.magenta, message.string());
    console.log('Destination Item Subject:'.magenta, message.subject);
  }

  const srcConsumer = await js.consumers.get(srcStreamName);
  for await (const message of await srcConsumer.fetch()) {
    console.log('Source Item:'.magenta, message.string());
    console.log('Source Item Subject:'.magenta, message.subject);
  }

  process.exit();
};

main();
