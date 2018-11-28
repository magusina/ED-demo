import { StreamGraph } from "../lib/stream.es";
import { getJSON } from "../lib/get-json.es";

const stream1 = new StreamGraph("stream1", "s001");
const stream2 = new StreamGraph("stream2", "s002");

getJSON("data/slide20.json", data1 => {
  stream1
    .data(data1)
    .draw();
});

getJSON("data/slide21.json", data2 => {
  stream2
    .data(data2)
    .draw();
});